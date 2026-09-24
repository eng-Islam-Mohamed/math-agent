from models.state import AgentState

def classifier_node(state: AgentState) -> AgentState:
    """Pass-through node since classification is already done by DeepSeek in structured output."""
    # In a more granular graph, this would be a separate LLM call.
    return state
