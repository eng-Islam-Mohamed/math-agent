from langgraph.graph import StateGraph, START, END
from models.state import AgentState
from agents.input_router import input_router_node
from agents.difficulty_router import difficulty_router_node
from agents.gemini_extractor import gemini_extractor_node
from agents.deepseek_solver import deepseek_solver_node
from agents.verifier import verifier_node
from agents.classifier import classifier_node
from agents.pdf_generator import pdf_generator_node
from agents.email_sender import email_sender_node
from agents.sheets_logger import sheets_logger_node
from services.problem_routing import next_tier

def should_extract(state: AgentState) -> str:
    if state.get("error"):
        return "end"
    if state.get("input_type") in ["image", "audio"]:
        return "extract"
    return "solve"

def check_error(state: AgentState) -> str:
    if state.get("error"):
        return "log"
    return "continue"


def after_verification(state: AgentState) -> str:
    if state.get("error"):
        return "log"
    verification = state.get("verification_data") or {}
    weak = verification.get("risk_level", "").lower() == "high"
    weak = weak or verification.get("confidence_score", 0) < 70
    if weak and not state.get("solver_retry_count") and next_tier(state.get("solver_tier") or ""):
        return "retry"
    return "continue"


def escalate_solver_node(state: AgentState) -> AgentState:
    return {
        **state,
        "solver_tier": next_tier(state.get("solver_tier") or "") or state.get("solver_tier"),
        "solver_retry_count": 1,
        "verification_data": None,
    }

def build_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("router", input_router_node)
    workflow.add_node("extractor", gemini_extractor_node)
    workflow.add_node("difficulty_router", difficulty_router_node)
    workflow.add_node("escalate_solver", escalate_solver_node)
    workflow.add_node("solver", deepseek_solver_node)
    workflow.add_node("verifier", verifier_node)
    workflow.add_node("classifier", classifier_node)
    workflow.add_node("pdf", pdf_generator_node)
    workflow.add_node("email", email_sender_node)
    workflow.add_node("logger", sheets_logger_node)
    
    # Add edges
    workflow.add_edge(START, "router")
    
    workflow.add_conditional_edges(
        "router",
        should_extract,
        {
            "extract": "extractor",
            "solve": "difficulty_router",
            "end": "logger"
        }
    )
    
    workflow.add_conditional_edges(
        "extractor",
        check_error,
        {
            "continue": "difficulty_router",
            "log": "logger"
        }
    )

    workflow.add_conditional_edges(
        "difficulty_router",
        check_error,
        {"continue": "solver", "log": "logger"}
    )
    
    workflow.add_conditional_edges(
        "solver",
        check_error,
        {
            "continue": "verifier",
            "log": "logger"
        }
    )
    
    workflow.add_conditional_edges(
        "verifier",
        after_verification,
        {"retry": "escalate_solver", "continue": "classifier", "log": "logger"}
    )
    workflow.add_edge("escalate_solver", "solver")
    workflow.add_edge("classifier", "pdf")
    workflow.add_edge("pdf", END)
    workflow.add_edge("logger", END)
    
    return workflow.compile()
