"""
Pydantic models for BlogCraft AI API — request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─────────────────────────────────────────────
# Step 0: Project / Session Input
# ─────────────────────────────────────────────

class ProjectCreateRequest(BaseModel):
    """Initial user inputs to start a new blog project."""
    topic: str = Field(..., description="Blog topic")
    audience: str = Field(..., description="Target audience, e.g. 'students starting coding'")
    word_count: int = Field(..., gt=0, description="Desired word count")
    user_insights: Optional[str] = Field(None, description="Real problems + solutions the user has seen")
    enable_research: bool = Field(False, description="Toggle web search + source synthesis")


# ─────────────────────────────────────────────
# Step 1: Strategy Selection
# ─────────────────────────────────────────────

class Strategy(BaseModel):
    id: int
    title: str
    description: str


class ProjectCreateResponse(BaseModel):
    project_id: str
    strategies: list[Strategy]
    message: str


class StrategiesResponse(BaseModel):
    project_id: str
    strategies: list[Strategy]


class StrategySelectRequest(BaseModel):
    strategy_id: int = Field(..., description="The ID of the selected strategy (1, 2, or 3)")


class StrategySelectResponse(BaseModel):
    project_id: str
    selected_strategy: Strategy
    message: str


# ─────────────────────────────────────────────
# Step 2: Paragraph Outline
# ─────────────────────────────────────────────

class ParagraphOutlineItem(BaseModel):
    paragraph_number: int
    goal: str
    key_points: list[str]
    transition_intent: str
    user_insight_used: Optional[str] = None


class OutlineResponse(BaseModel):
    project_id: str
    outline: list[ParagraphOutlineItem]


class OutlineRegenerateRequest(BaseModel):
    """Regenerate the entire outline or specific paragraphs."""
    paragraph_numbers: Optional[list[int]] = Field(
        None,
        description="If provided, only regenerate these paragraph numbers. If None, regenerate entire outline."
    )
    feedback: Optional[str] = Field(None, description="User feedback, e.g. 'para 4 is boring'")


class OutlineApproveResponse(BaseModel):
    project_id: str
    message: str
    total_paragraphs: int


# ─────────────────────────────────────────────
# Step 3: Writing (paragraph-wise)
# ─────────────────────────────────────────────

class ParagraphContent(BaseModel):
    paragraph_number: int
    content: str


class WriteSingleParagraphResponse(BaseModel):
    project_id: str
    paragraph: ParagraphContent


class FullDraftResponse(BaseModel):
    project_id: str
    paragraphs: list[ParagraphContent]
    total_word_count: int


# ─────────────────────────────────────────────
# Step 4: Scoring
# ─────────────────────────────────────────────

class ParagraphBlame(BaseModel):
    paragraph_number: int
    issues: list[str]


class ScoreCriterion(BaseModel):
    criterion: str  # "clarity" | "logical_progression" | "audience_fit"
    score: float = Field(..., ge=0, le=100)
    feedback: str
    blamed_paragraphs: list[ParagraphBlame]


class ScoreResponse(BaseModel):
    project_id: str
    scores: list[ScoreCriterion]
    overall_pass: bool = Field(..., description="True if all scores meet threshold")
    message: str


# ─────────────────────────────────────────────
# Step 5: Targeted Rewrite
# ─────────────────────────────────────────────

class RewriteTarget(BaseModel):
    paragraph_number: int
    strengths: list[str]
    weaknesses: list[str]
    constraints: list[str]


class RewritePlanResponse(BaseModel):
    project_id: str
    rewrite_targets: list[RewriteTarget]
    message: str


class RewriteExecuteRequest(BaseModel):
    """Let the user confirm or modify the rewrite plan before execution."""
    approved: bool = Field(True, description="Whether the user approves the rewrite plan")
    custom_instructions: Optional[str] = Field(None, description="Extra instructions for the rewrite")


class RewriteResultParagraph(BaseModel):
    paragraph_number: int
    original: str
    rewritten: str
    changes_made: list[str]


class RewriteExecuteResponse(BaseModel):
    project_id: str
    rewritten_paragraphs: list[RewriteResultParagraph]
    iteration: int
    message: str


# ─────────────────────────────────────────────
# Research (optional)
# ─────────────────────────────────────────────

class ResearchSource(BaseModel):
    title: str
    url: str
    snippet: str


class ResearchResponse(BaseModel):
    project_id: str
    sources: list[ResearchSource]
    synthesized_cache: str
    message: str


# ─────────────────────────────────────────────
# Export
# ─────────────────────────────────────────────

class ExportResponse(BaseModel):
    project_id: str
    format: str  # "markdown"
    content: str
    word_count: int


# ─────────────────────────────────────────────
# Generic
# ─────────────────────────────────────────────

class ProjectStatusResponse(BaseModel):
    project_id: str
    current_step: str
    topic: str
    audience: str
    word_count: int
    selected_strategy: Optional[Strategy] = None
    outline_approved: bool
    draft_complete: bool
    scores: Optional[list[ScoreCriterion]] = None
    rewrite_iterations: int
