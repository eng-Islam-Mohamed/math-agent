from models.state import AgentState
from models.schemas import BasicMathSolution, MathSolution
from services.openrouter_client import call_deepseek_solver
from services.problem_routing import next_tier

def deepseek_solver_node(state: AgentState) -> AgentState:
    """Solve with the selected tier, escalating once on an incomplete response."""
    if state.get("error"):
        return state
        
    cleaned_problem = state.get("cleaned_problem")
    if not cleaned_problem:
        return {**state, "error": "No cleaned problem found."}
        
    solution_mode = state.get("solution_mode") or "Full Explanation Mode"
    pdf_style = state.get("pdf_style") or "Clean Academic"
    advanced_options = {
        "curriculum": state.get("curriculum") or "General",
        "explanation_style": state.get("explanation_style") or "University rigorous",
        "student_attempt": state.get("student_attempt") or "",
        "whiteboard_notes": state.get("whiteboard_notes") or "",
        "tutor_depth": state.get("tutor_depth") or "Guided",
    }
        
    tier = state.get("solver_tier") or "medium"
    retry_count = state.get("solver_retry_count") or 0
    while True:
        try:
            print(f"[DEBUG] [Solver Node] Calling {tier} solver with mode={solution_mode}, style={pdf_style}...", flush=True)
            response_schema = BasicMathSolution if tier == "small" else MathSolution
            solution = call_deepseek_solver(
                cleaned_problem,
                response_schema,
                solution_mode=solution_mode,
                pdf_style=pdf_style,
                advanced_options=advanced_options,
                tier=tier,
            )
            solution = MathSolution.model_validate(solution.model_dump())
            if not solution.primary_solution.strip() or not solution.final_answer.strip():
                raise ValueError("The model returned an incomplete solution.")
            safe_title = solution.title.encode("ascii", "replace").decode("ascii")
            print(f"[DEBUG] [Solver Node] {tier} solver returned: {safe_title}", flush=True)
            return {**state, "solver_tier": tier, "solver_retry_count": retry_count, "solution_data": solution.model_dump()}
        except Exception as e:
            safe_error = str(e).encode("ascii", "replace").decode("ascii")
            print(f"[DEBUG] [Solver Node] {tier} solver failed: {safe_error}", flush=True)
            stronger = next_tier(tier) if retry_count == 0 else None
            if not stronger:
                return {**state, "error": f"{tier.title()} solver failed: {str(e)}"}
            tier = stronger
            retry_count = 1
