"""
BlogCraft AI — FastAPI Application
Wires all endpoints to the LangGraph workflow with human-in-the-loop pauses.
"""

import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model import (
    # Step 0: Project
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectStatusResponse,
    # Step 1: Strategy
    StrategiesResponse,
    StrategySelectRequest,
    StrategySelectResponse,
    Strategy,
    # Step 2: Outline
    OutlineResponse,
    OutlineRegenerateRequest,
    OutlineApproveResponse,
    # Step 3: Writing
    WriteSingleParagraphResponse,
    FullDraftResponse,
    ParagraphContent,
    # Step 4: Scoring
    ScoreResponse,
    # Step 5: Rewrite
    RewritePlanResponse,
    RewriteExecuteRequest,
    RewriteExecuteResponse,
    RewriteResultParagraph,
    # Export
    ExportResponse,
)
from agent.graph import workflow
from agent.nodes import (
    select_strategy,
    regenerate_outline_partial,
    approve_outline,
    write_paragraph,
    execute_rewrite,
)


app = FastAPI(
    title="BlogCraft AI",
    description="Paragraph-outline-first blog writer with quality gates",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helpers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _get_config(project_id: str) -> dict:
    """Build LangGraph config with thread ID for checkpointing."""
    return {"configurable": {"thread_id": project_id}}


def _get_state(project_id: str):
    """Get the current graph state for a project."""
    try:
        snapshot = workflow.get_state(_get_config(project_id))
        if not snapshot.values:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found (state is empty — server may have restarted)")
        return snapshot.values
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found: {str(e)}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 0 — Project Management
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/projects", response_model=ProjectCreateResponse)
async def create_project(req: ProjectCreateRequest):
    """
    Create a new blog project and kick off strategy generation.
    The graph runs until it pauses after generate_strategies.
    """
    project_id = str(uuid.uuid4())

    initial_state = {
        "project_id": project_id,
        "topic": req.topic,
        "audience": req.audience,
        "word_count": req.word_count,
        "user_insights": req.user_insights,
        "enable_research": req.enable_research,
    }

    # Start the graph — it will run generate_strategies then pause
    await workflow.ainvoke(initial_state, config=_get_config(project_id))

    # Fetch the generated strategies from state
    state = _get_state(project_id)
    strategies = state.get("proposed_strategies", [])

    return ProjectCreateResponse(
        project_id=project_id,
        strategies=strategies,
        message="Project created. 3 strategies generated — select one to continue.",
    )


@app.get("/api/projects/{project_id}", response_model=ProjectStatusResponse)
async def get_project_status(project_id: str):
    """Get the current status of a project."""
    state = _get_state(project_id)

    return ProjectStatusResponse(
        project_id=state.get("project_id", project_id),
        current_step=state.get("current_step", "init"),
        topic=state.get("topic", ""),
        audience=state.get("audience", ""),
        word_count=state.get("word_count", 0),
        selected_strategy=state.get("selected_strategy"),
        outline_approved=state.get("outline_approved", False),
        draft_complete=state.get("draft_complete", False),
        scores=state.get("scores"),
        rewrite_iterations=state.get("rewrite_iteration", 0),
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1 — Strategy Selection
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/projects/{project_id}/strategies", response_model=StrategiesResponse)
async def get_strategies(project_id: str):
    """Retrieve the 3 generated strategies."""
    state = _get_state(project_id)
    strategies = state.get("proposed_strategies", [])
    if not strategies:
        raise HTTPException(status_code=400, detail="Strategies not yet generated")
    return StrategiesResponse(project_id=project_id, strategies=strategies)


@app.post("/api/projects/{project_id}/strategies/regenerate", response_model=StrategiesResponse)
async def regenerate_strategies(project_id: str):
    """Regenerate strategies by re-running from the start."""
    state = _get_state(project_id)

    initial_state = {
        "project_id": project_id,
        "topic": state["topic"],
        "audience": state["audience"],
        "word_count": state["word_count"],
        "user_insights": state.get("user_insights"),
        "enable_research": state.get("enable_research", False),
    }

    await workflow.ainvoke(initial_state, config=_get_config(project_id))
    updated = _get_state(project_id)

    return StrategiesResponse(
        project_id=project_id,
        strategies=updated.get("proposed_strategies", []),
    )


@app.post("/api/projects/{project_id}/strategies/select", response_model=StrategySelectResponse)
async def select_strategy_endpoint(project_id: str, req: StrategySelectRequest):
    """
    User selects a strategy. This updates state and resumes the graph,
    which then runs generate_outline and pauses again.
    """
    state = _get_state(project_id)
    strategies = state.get("proposed_strategies", [])
    selected = next((s for s in strategies if s.id == req.strategy_id), None)

    if not selected:
        raise HTTPException(status_code=400, detail=f"Strategy {req.strategy_id} not found")

    # Update the state with the selected strategy, then resume the graph
    workflow.update_state(
        _get_config(project_id),
        {"selected_strategy": selected, "current_step": "strategy_selected"},
    )

    # Resume — graph will run generate_outline then pause
    await workflow.ainvoke(None, config=_get_config(project_id))

    return StrategySelectResponse(
        project_id=project_id,
        selected_strategy=selected,
        message="Strategy locked. Paragraph outline generated — review and approve.",
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2 — Paragraph Outline
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/projects/{project_id}/outline", response_model=OutlineResponse)
async def get_outline(project_id: str):
    """Retrieve the current paragraph outline."""
    state = _get_state(project_id)
    outline = state.get("outline", [])
    if not outline:
        raise HTTPException(status_code=400, detail="Outline not yet generated")
    return OutlineResponse(project_id=project_id, outline=outline)


@app.post("/api/projects/{project_id}/outline/regenerate", response_model=OutlineResponse)
async def regenerate_outline_endpoint(project_id: str, req: OutlineRegenerateRequest):
    """Regenerate entire outline or specific paragraphs."""
    state = _get_state(project_id)

    # Build a temporary state object for the node function
    from agent.states import BlogCraftState
    temp_state = BlogCraftState(**state)

    if req.paragraph_numbers:
        result = await regenerate_outline_partial(
            temp_state, req.paragraph_numbers, req.feedback or ""
        )
    else:
        # Full regeneration — resume graph from outline node
        workflow.update_state(
            _get_config(project_id),
            {"outline": [], "current_step": "strategy_selected"},
        )
        await workflow.ainvoke(None, config=_get_config(project_id))
        updated = _get_state(project_id)
        return OutlineResponse(project_id=project_id, outline=updated.get("outline", []))

    # Update state with regenerated outline
    workflow.update_state(_get_config(project_id), result)
    updated = _get_state(project_id)

    return OutlineResponse(project_id=project_id, outline=updated.get("outline", []))


@app.post("/api/projects/{project_id}/outline/approve", response_model=OutlineApproveResponse)
async def approve_outline_endpoint(project_id: str):
    """
    Approve the outline and resume the graph.
    Graph will run: [research?] → write_all → score_draft → pause.
    """
    state = _get_state(project_id)
    outline = state.get("outline", [])
    if not outline:
        raise HTTPException(status_code=400, detail="No outline to approve")

    # Update state and resume
    workflow.update_state(
        _get_config(project_id),
        {"outline_approved": True, "current_step": "outline_approved"},
    )

    # Resume — graph runs research (if enabled) → write_all → score_draft → pause
    await workflow.ainvoke(None, config=_get_config(project_id))

    return OutlineApproveResponse(
        project_id=project_id,
        message="Outline approved. Draft written and scored. Review your scores.",
        total_paragraphs=len(outline),
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3 — Draft Retrieval
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/projects/{project_id}/draft", response_model=FullDraftResponse)
async def get_draft(project_id: str):
    """Retrieve the full draft."""
    state = _get_state(project_id)
    draft = state.get("draft", [])
    if not draft:
        raise HTTPException(status_code=400, detail="Draft not yet written")

    total_words = sum(len(p.content.split()) for p in draft)

    return FullDraftResponse(
        project_id=project_id,
        paragraphs=draft,
        total_word_count=total_words,
    )


@app.get(
    "/api/projects/{project_id}/draft/paragraph/{paragraph_number}",
    response_model=WriteSingleParagraphResponse,
)
async def get_single_paragraph(project_id: str, paragraph_number: int):
    """Retrieve a specific paragraph from the draft."""
    state = _get_state(project_id)
    draft = state.get("draft", [])
    paragraph = next((p for p in draft if p.paragraph_number == paragraph_number), None)

    if not paragraph:
        raise HTTPException(status_code=404, detail=f"Paragraph {paragraph_number} not found")

    return WriteSingleParagraphResponse(project_id=project_id, paragraph=paragraph)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 4 — Scoring
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/projects/{project_id}/score", response_model=ScoreResponse)
async def get_scores(project_id: str):
    """Retrieve the latest scores."""
    state = _get_state(project_id)
    scores = state.get("scores", [])
    if not scores:
        raise HTTPException(status_code=400, detail="Draft not yet scored")

    return ScoreResponse(
        project_id=project_id,
        scores=scores,
        overall_pass=state.get("overall_pass", False),
        message="Pass! All scores above threshold." if state.get("overall_pass") else "Some scores below threshold. Consider a rewrite.",
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 5 — Targeted Rewrite
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/projects/{project_id}/rewrite/plan", response_model=RewritePlanResponse)
async def generate_rewrite_plan_endpoint(project_id: str):
    """
    Generate a rewrite plan. Resumes the graph from the score_draft pause,
    which runs plan_rewrite and pauses again.
    """
    # Resume — graph runs plan_rewrite then pauses
    await workflow.ainvoke(None, config=_get_config(project_id))
    state = _get_state(project_id)

    return RewritePlanResponse(
        project_id=project_id,
        rewrite_targets=state.get("rewrite_targets", []),
        message="Rewrite plan generated. Review and approve to execute.",
    )


@app.get("/api/projects/{project_id}/rewrite/plan", response_model=RewritePlanResponse)
async def get_rewrite_plan(project_id: str):
    """Retrieve the current rewrite plan."""
    state = _get_state(project_id)
    targets = state.get("rewrite_targets", [])
    if not targets:
        raise HTTPException(status_code=400, detail="No rewrite plan generated yet")

    return RewritePlanResponse(
        project_id=project_id,
        rewrite_targets=targets,
        message="Current rewrite plan.",
    )


@app.post("/api/projects/{project_id}/rewrite/execute", response_model=RewriteExecuteResponse)
async def execute_rewrite_endpoint(project_id: str, req: RewriteExecuteRequest):
    """
    Execute the rewrite plan. Resumes the graph from the plan_rewrite pause,
    which runs execute_rewrite → score_draft → pause again.
    """
    if not req.approved:
        raise HTTPException(status_code=400, detail="Rewrite plan not approved")

    state_before = _get_state(project_id)
    old_draft = {p.paragraph_number: p.content for p in state_before.get("draft", [])}

    # If custom instructions, update state before resuming
    if req.custom_instructions:
        workflow.update_state(
            _get_config(project_id),
            {"custom_instructions": req.custom_instructions},
        )

    # Resume — graph runs execute_rewrite → score_draft → pause
    await workflow.ainvoke(None, config=_get_config(project_id))
    state_after = _get_state(project_id)

    # Build diff of changes
    rewritten = []
    for p in state_after.get("draft", []):
        original = old_draft.get(p.paragraph_number, "")
        if original != p.content:
            rewritten.append(RewriteResultParagraph(
                paragraph_number=p.paragraph_number,
                original=original,
                rewritten=p.content,
                changes_made=["Content was rewritten based on rewrite plan"],
            ))

    return RewriteExecuteResponse(
        project_id=project_id,
        rewritten_paragraphs=rewritten,
        iteration=state_after.get("rewrite_iteration", 0),
        message=f"Rewrite iteration {state_after.get('rewrite_iteration', 0)} complete. Draft re-scored.",
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Export
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/projects/{project_id}/export", response_model=ExportResponse)
async def export_blog(project_id: str):
    """Export the final blog as Markdown."""
    state = _get_state(project_id)
    draft = state.get("draft", [])
    if not draft:
        raise HTTPException(status_code=400, detail="No draft to export")

    # Assemble markdown
    lines = [f"# {state.get('topic', 'Untitled Blog')}\n"]
    for p in sorted(draft, key=lambda x: x.paragraph_number):
        lines.append(p.content)
        lines.append("")  # blank line between paragraphs

    content = "\n".join(lines)
    word_count = len(content.split())

    return ExportResponse(
        project_id=project_id,
        format="markdown",
        content=content,
        word_count=word_count,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "BlogCraft AI"}
