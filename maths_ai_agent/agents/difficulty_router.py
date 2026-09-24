from models.state import AgentState
from services.problem_routing import classify_problem


def difficulty_router_node(state: AgentState) -> AgentState:
    if state.get("error"):
        return state
    problem = state.get("cleaned_problem") or ""
    if not problem.strip():
        return {**state, "error": "No extracted problem to classify."}
    tier = classify_problem(problem, state.get("solution_mode") or "", state.get("student_attempt") or "")
    return {**state, "problem_tier": tier, "solver_tier": tier, "solver_retry_count": 0}
