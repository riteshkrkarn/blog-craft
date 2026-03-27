"""
BlogCraft AI — LangGraph Node Functions
Each function takes a state dict, calls the LLM, and returns a partial state update.
"""

import json
from langchain_core.messages import SystemMessage, HumanMessage

from agent.prompt import (
    STRATEGIST_SYSTEM, STRATEGIST_HUMAN,
    OUTLINER_SYSTEM, OUTLINER_HUMAN, OUTLINER_PARTIAL_HUMAN,
    WRITER_SYSTEM, WRITER_HUMAN,
    JUDGE_SYSTEM, JUDGE_HUMAN,
    REWRITE_PLANNER_SYSTEM, REWRITE_PLANNER_HUMAN,
    REWRITER_SYSTEM, REWRITER_HUMAN,
    RESEARCH_SYNTHESIZER_SYSTEM, RESEARCH_SYNTHESIZER_HUMAN,
)
from model import (
    Strategy,
    ParagraphOutlineItem,
    ParagraphContent,
    ScoreCriterion,
    ParagraphBlame,
    RewriteTarget,
)
from llm import llm_fast, llm_strong


def _parse_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code fences."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    return json.loads(text)


def _normalize_outline_item(item: dict) -> dict:
    """Normalize LLM outline payload fields before Pydantic validation."""
    normalized = dict(item)
    insight = normalized.get("user_insight_used")

    if isinstance(insight, bool):
        normalized["user_insight_used"] = "Provided" if insight else None
    elif insight is not None and not isinstance(insight, str):
        normalized["user_insight_used"] = str(insight)

    return normalized


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Strategist
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def generate_strategies(state: dict) -> dict:
    """Generate 3 high-level blog strategies from user inputs."""
    human_msg = STRATEGIST_HUMAN.format(
        topic=state["topic"],
        audience=state["audience"],
        word_count=state["word_count"],
        user_insights=state.get("user_insights") or "None provided",
        enable_research=state.get("enable_research", False),
    )

    response = await llm_fast.ainvoke([
        SystemMessage(content=STRATEGIST_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    data = _parse_json(response.content)
    strategies = [Strategy(**s) for s in data["strategies"]]

    return {
        "proposed_strategies": strategies,
        "current_step": "strategy_generation",
    }


async def select_strategy(state: dict, strategy_id: int) -> dict:
    """Lock the user's chosen strategy."""
    strategies = state.get("proposed_strategies", [])
    selected = next(
        (s for s in strategies if s.id == strategy_id),
        None,
    )
    if not selected:
        return {"error": f"Strategy {strategy_id} not found"}

    return {
        "selected_strategy": selected,
        "current_step": "strategy_selected",
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: Outliner
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def generate_outline(state: dict) -> dict:
    """Generate a full paragraph-by-paragraph outline."""
    strategy = state["selected_strategy"]

    # Handle both dict and Pydantic model
    strat_title = strategy.title if hasattr(strategy, "title") else strategy["title"]
    strat_desc = strategy.description if hasattr(strategy, "description") else strategy["description"]

    human_msg = OUTLINER_HUMAN.format(
        topic=state["topic"],
        audience=state["audience"],
        word_count=state["word_count"],
        strategy_title=strat_title,
        strategy_description=strat_desc,
        user_insights=state.get("user_insights") or "None provided",
        research_cache=state.get("research_cache") or "No research conducted",
    )

    response = await llm_fast.ainvoke([
        SystemMessage(content=OUTLINER_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    data = _parse_json(response.content)
    outline = [ParagraphOutlineItem(**_normalize_outline_item(p)) for p in data["outline"]]

    return {
        "outline": outline,
        "current_step": "outline_generation",
    }


async def regenerate_outline_partial(
    state: dict,
    paragraph_numbers: list[int],
    feedback: str = "",
) -> dict:
    """Regenerate specific paragraphs in the outline while keeping the rest."""
    outline = state.get("outline", [])
    outline_dicts = []
    for p in outline:
        if hasattr(p, "model_dump"):
            outline_dicts.append(p.model_dump())
        else:
            outline_dicts.append(p)

    current_outline_str = json.dumps(outline_dicts, indent=2)

    human_msg = OUTLINER_PARTIAL_HUMAN.format(
        paragraph_numbers=paragraph_numbers,
        feedback=feedback or "No specific feedback",
        current_outline=current_outline_str,
    )

    response = await llm_fast.ainvoke([
        SystemMessage(content=OUTLINER_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    data = _parse_json(response.content)
    new_outline = [ParagraphOutlineItem(**_normalize_outline_item(p)) for p in data["outline"]]

    return {
        "outline": new_outline,
        "current_step": "outline_generation",
    }


async def approve_outline(state: dict) -> dict:
    """Lock the outline so writing can begin."""
    return {
        "outline_approved": True,
        "current_step": "outline_approved",
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3: Writer
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _get_attr(obj, key):
    """Safely get attribute from dict or Pydantic model."""
    if hasattr(obj, key):
        return getattr(obj, key)
    return obj.get(key) if isinstance(obj, dict) else None


async def write_paragraph(state: dict, paragraph_number: int) -> dict:
    """Write a single paragraph with full context awareness."""
    outline = state["outline"]
    draft = state.get("draft", [])
    total = len(outline)
    idx = paragraph_number - 1

    current_plan = outline[idx]

    # Get previous paragraph content
    previous_paragraph = "This is the opening paragraph."
    if idx > 0:
        prev_draft = next(
            (p for p in draft if _get_attr(p, "paragraph_number") == paragraph_number - 1),
            None,
        )
        if prev_draft:
            previous_paragraph = _get_attr(prev_draft, "content") or "Not yet written."

    # Get next paragraph plan
    next_plan = "This is the closing paragraph."
    if idx < total - 1:
        next_p = outline[idx + 1]
        np_goal = _get_attr(next_p, "goal")
        np_points = _get_attr(next_p, "key_points") or []
        next_plan = f"Goal: {np_goal}\nKey points: {', '.join(np_points)}"

    strategy = state["selected_strategy"]
    strat_title = _get_attr(strategy, "title") or ""

    human_msg = WRITER_HUMAN.format(
        topic=state["topic"],
        audience=state["audience"],
        strategy_title=strat_title,
        word_count=state["word_count"],
        total_paragraphs=total,
        paragraph_number=paragraph_number,
        goal=_get_attr(current_plan, "goal"),
        key_points=", ".join(_get_attr(current_plan, "key_points") or []),
        transition_intent=_get_attr(current_plan, "transition_intent"),
        user_insight=_get_attr(current_plan, "user_insight_used") or "None",
        previous_paragraph=previous_paragraph,
        next_paragraph_plan=next_plan,
        research_cache=state.get("research_cache") or "No research context",
    )

    response = await llm_fast.ainvoke([
        SystemMessage(content=WRITER_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    new_paragraph = ParagraphContent(
        paragraph_number=paragraph_number,
        content=response.content.strip(),
    )

    # Update draft: replace if exists, append if new
    updated_draft = [
        p for p in draft if _get_attr(p, "paragraph_number") != paragraph_number
    ]
    updated_draft.append(new_paragraph)
    updated_draft.sort(key=lambda p: _get_attr(p, "paragraph_number"))

    draft_complete = len(updated_draft) == total

    return {
        "draft": updated_draft,
        "current_paragraph": paragraph_number,
        "draft_complete": draft_complete,
        "current_step": "complete" if draft_complete else "writing",
    }


async def write_all_paragraphs(state: dict) -> dict:
    """Write all paragraphs sequentially, each with neighbor context."""
    result_state = dict(state)

    for i in range(len(state["outline"])):
        paragraph_result = await write_paragraph(result_state, i + 1)
        result_state["draft"] = paragraph_result["draft"]
        result_state["current_paragraph"] = paragraph_result["current_paragraph"]

    return {
        "draft": result_state["draft"],
        "current_paragraph": result_state["current_paragraph"],
        "draft_complete": True,
        "current_step": "writing",
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 4: Judge (Scorer)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _format_draft(draft: list) -> str:
    """Format the draft into a numbered readable string."""
    return "\n\n".join(
        f"[Paragraph {_get_attr(p, 'paragraph_number')}]\n{_get_attr(p, 'content')}"
        for p in draft
    )


def _format_outline_summary(outline: list) -> str:
    """Create a compact outline summary for the judge."""
    return "\n".join(
        f"Para {_get_attr(p, 'paragraph_number')}: {_get_attr(p, 'goal')}"
        for p in outline
    )


async def score_draft(state: dict) -> dict:
    """Score the completed draft on clarity, logical progression, and audience fit."""
    strategy = state["selected_strategy"]
    strat_title = _get_attr(strategy, "title") or ""

    human_msg = JUDGE_HUMAN.format(
        topic=state["topic"],
        audience=state["audience"],
        strategy_title=strat_title,
        full_draft=_format_draft(state["draft"]),
        outline_summary=_format_outline_summary(state["outline"]),
    )

    response = await llm_strong.ainvoke([
        SystemMessage(content=JUDGE_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    data = _parse_json(response.content)
    scores = []
    for s in data["scores"]:
        blamed = [ParagraphBlame(**b) for b in s.get("blamed_paragraphs", [])]
        scores.append(ScoreCriterion(
            criterion=s["criterion"],
            score=s["score"],
            feedback=s["feedback"],
            blamed_paragraphs=blamed,
        ))

    threshold = state.get("score_threshold", 70.0)
    overall_pass = all(s.score >= threshold for s in scores)

    return {
        "scores": scores,
        "overall_pass": overall_pass,
        "current_step": "scoring",
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 5: Rewrite Planner & Executor
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def plan_rewrite(state: dict) -> dict:
    """Generate a targeted rewrite plan based on scoring feedback."""
    scores = state.get("scores", [])
    scores_data = []
    for s in scores:
        if hasattr(s, "model_dump"):
            scores_data.append(s.model_dump())
        else:
            scores_data.append(s)

    scores_json = json.dumps(scores_data, indent=2)

    human_msg = REWRITE_PLANNER_HUMAN.format(
        scores_json=scores_json,
        full_draft=_format_draft(state["draft"]),
    )

    response = await llm_strong.ainvoke([
        SystemMessage(content=REWRITE_PLANNER_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    data = _parse_json(response.content)
    targets = [RewriteTarget(**t) for t in data["rewrite_targets"]]

    return {
        "rewrite_targets": targets,
        "current_step": "rewrite_planning",
    }


async def execute_rewrite(state: dict, custom_instructions: str = "") -> dict:
    """Execute the rewrite plan — rewrite each targeted paragraph."""
    updated_draft = list(state.get("draft", []))
    rewrite_targets = state.get("rewrite_targets", [])

    for target in rewrite_targets:
        pn = _get_attr(target, "paragraph_number")
        original = next(
            (p for p in updated_draft if _get_attr(p, "paragraph_number") == pn),
            None,
        )
        if not original:
            continue

        # Get neighbors
        prev_content = "This is the opening paragraph."
        prev_p = next(
            (p for p in updated_draft if _get_attr(p, "paragraph_number") == pn - 1),
            None,
        )
        if prev_p:
            prev_content = _get_attr(prev_p, "content")

        next_content = "This is the closing paragraph."
        next_p = next(
            (p for p in updated_draft if _get_attr(p, "paragraph_number") == pn + 1),
            None,
        )
        if next_p:
            next_content = _get_attr(next_p, "content")

        strengths = _get_attr(target, "strengths") or []
        weaknesses = _get_attr(target, "weaknesses") or []
        constraints = _get_attr(target, "constraints") or []

        human_msg = REWRITER_HUMAN.format(
            paragraph_number=pn,
            original_content=_get_attr(original, "content"),
            previous_paragraph=prev_content,
            next_paragraph=next_content,
            strengths=", ".join(strengths),
            weaknesses=", ".join(weaknesses),
            constraints=", ".join(constraints),
            custom_instructions=custom_instructions or "",
        )

        response = await llm_fast.ainvoke([
            SystemMessage(content=REWRITER_SYSTEM),
            HumanMessage(content=human_msg),
        ])

        # Replace paragraph in draft
        updated_draft = [
            ParagraphContent(paragraph_number=pn, content=response.content.strip())
            if _get_attr(p, "paragraph_number") == pn else p
            for p in updated_draft
        ]

    return {
        "draft": updated_draft,
        "rewrite_iteration": state.get("rewrite_iteration", 0) + 1,
        "current_step": "rewriting",
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Research (optional)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def run_research(state: dict) -> dict:
    """Run web search and synthesize results into a research cache.
    TODO: Integrate Tavily search API for real web results.
    """
    raw_results = f"[Placeholder] Web search results for: {state['topic']}"

    human_msg = RESEARCH_SYNTHESIZER_HUMAN.format(
        topic=state["topic"],
        audience=state["audience"],
        raw_results=raw_results,
    )

    response = await llm_fast.ainvoke([
        SystemMessage(content=RESEARCH_SYNTHESIZER_SYSTEM),
        HumanMessage(content=human_msg),
    ])

    return {
        "research_cache": response.content.strip(),
        "current_step": "researching",
    }
