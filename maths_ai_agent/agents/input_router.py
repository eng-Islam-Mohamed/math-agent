from models.state import AgentState

def input_router_node(state: AgentState) -> AgentState:
    """Validates the input and routes to the appropriate extraction node."""
    input_type = state.get("input_type")
    content = state.get("input_content")
    
    if not content:
        return {**state, "error": "No input content provided"}
        
    if input_type == "text":
        return {**state, "cleaned_problem": content}
    elif input_type in ["image", "audio"]:
        # The routing to gemini_multimodal_extractor will be handled by edges in graph.py
        pass
    else:
        return {**state, "error": f"Invalid input type: {input_type}"}
        
    return state
