"""
BlogCraft AI — LangGraph State Definitions
Central state schema for the paragraph-outline-first blog writing workflow.
Reuses sub-models from model.py to avoid duplication.
"""

from typing import Optional, Literal
from pydantic import Field
from langgraph.graph import MessagesState

from model import (
    Strategy,
    ParagraphOutlineItem,
    ParagraphContent,
    ParagraphBlame,
    ScoreCriterion,
    RewriteTarget,
    ResearchSource,
)


class BlogCraftState(MessagesState):
    """
    Central state for the BlogCraft LangGraph workflow.
    Flows through: Input → Strategy → Outline → Write → Score → Rewrite
    """

    # ── Step 0: Project Inputs ──
    project_id: str = ""
    topic: str = ""
    audience: str = ""
    word_count: int = 0
    user_insights: Optional[str] = None
    enable_research: bool = False

    # ── Step 1: Strategy Selection ──
    proposed_strategies: list[Strategy] = Field(default_factory=list)
    selected_strategy: Optional[Strategy] = None

    # ── Step 2: Paragraph Outline ──
    outline: list[ParagraphOutlineItem] = Field(default_factory=list)
    outline_approved: bool = False

    # ── Step 3: Writing ──
    draft: list[ParagraphContent] = Field(default_factory=list)
    current_paragraph: int = 0
    draft_complete: bool = False

    # ── Step 4: Scoring ──
    scores: list[ScoreCriterion] = Field(default_factory=list)
    overall_pass: bool = False
    score_threshold: float = 70.0

    # ── Step 5: Targeted Rewrite ──
    rewrite_targets: list[RewriteTarget] = Field(default_factory=list)
    rewrite_iteration: int = 0
    max_rewrite_iterations: int = 3

    # ── Research (optional) ──
    research_sources: list[ResearchSource] = Field(default_factory=list)
    research_cache: str = ""

    # ── Workflow Control ──
    current_step: Literal[
        "init",
        "strategy_generation",
        "strategy_selected",
        "outline_generation",
        "outline_approved",
        "researching",
        "writing",
        "scoring",
        "rewrite_planning",
        "rewriting",
        "complete",
    ] = "init"
    error: Optional[str] = None
