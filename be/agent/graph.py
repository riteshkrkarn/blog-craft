"""
BlogCraft AI — LangGraph Workflow
Connects all nodes into a stateful graph with human-in-the-loop pauses.

Flow:
  START → generate_strategies → ⏸ PAUSE (user selects strategy)
        → generate_outline    → ⏸ PAUSE (user approves/regenerates outline)
        → [research?]         → write_all_paragraphs
        → score_draft         → ⏸ PAUSE (user reviews scores)
        → [pass?] → END
        → [fail?] → plan_rewrite → ⏸ PAUSE (user approves plan)
                  → execute_rewrite → score_draft (loop)
"""

import warnings
warnings.filterwarnings("ignore", message="Deserializing unregistered type")

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from agent.states import BlogCraftState
from agent.nodes import (
    generate_strategies,
    generate_outline,
    write_all_paragraphs,
    score_draft,
    plan_rewrite,
    execute_rewrite,
    run_research,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Conditional edge functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def should_research(state: dict) -> str:
    """Route to research node if enabled, otherwise skip to writing."""
    if state.get("enable_research") and not state.get("research_cache"):
        return "run_research"
    return "write_all"


def should_rewrite_or_finish(state: dict) -> str:
    """After scoring: finish if passing, or plan rewrite if failing."""
    if state.get("overall_pass"):
        return "complete"
    if state.get("rewrite_iteration", 0) >= state.get("max_rewrite_iterations", 3):
        return "complete"  # hit max iterations, stop anyway
    return "plan_rewrite"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Build the graph
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def build_graph():
    """
    Construct the BlogCraft LangGraph workflow.

    Pause points (interrupt_after):
    1. After generate_strategies → user selects a strategy
    2. After generate_outline   → user approves or regenerates
    3. After score_draft        → user reviews scores
    4. After plan_rewrite       → user approves the rewrite plan
    """

    graph = StateGraph(BlogCraftState)

    # ── Register all nodes ──
    graph.add_node("generate_strategies", generate_strategies)
    graph.add_node("generate_outline", generate_outline)
    graph.add_node("run_research", run_research)
    graph.add_node("write_all", write_all_paragraphs)
    graph.add_node("score_draft", score_draft)
    graph.add_node("plan_rewrite", plan_rewrite)
    graph.add_node("execute_rewrite", execute_rewrite)

    # ── Define edges ──

    # START → generate strategies
    graph.add_edge(START, "generate_strategies")

    # After strategies generated → outline
    # (pause happens here — user selects strategy via API, then resumes)
    graph.add_edge("generate_strategies", "generate_outline")

    # After outline generated → conditional: research or write
    # (pause happens here — user approves outline via API, then resumes)
    graph.add_conditional_edges(
        "generate_outline",
        should_research,
        {
            "run_research": "run_research",
            "write_all": "write_all",
        },
    )

    # Research → write
    graph.add_edge("run_research", "write_all")

    # Write → score
    graph.add_edge("write_all", "score_draft")

    # Score → conditional: finish or rewrite
    # (pause happens here — user reviews scores via API, then resumes)
    graph.add_conditional_edges(
        "score_draft",
        should_rewrite_or_finish,
        {
            "complete": END,
            "plan_rewrite": "plan_rewrite",
        },
    )

    # Rewrite plan → execute rewrite
    # (pause happens here — user approves rewrite plan via API, then resumes)
    graph.add_edge("plan_rewrite", "execute_rewrite")

    # Execute rewrite → re-score (loop back)
    graph.add_edge("execute_rewrite", "score_draft")

    # ── Compile with checkpointer + interrupt points ──
    checkpointer = MemorySaver()

    compiled = graph.compile(
        checkpointer=checkpointer,
        interrupt_after=[
            "generate_strategies",  # ⏸ wait for user to select strategy
            "generate_outline",     # ⏸ wait for user to approve/regenerate outline
            "score_draft",          # ⏸ wait for user to review scores
            "plan_rewrite",         # ⏸ wait for user to approve rewrite plan
        ],
    )

    return compiled


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Singleton graph instance
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

workflow = build_graph()
