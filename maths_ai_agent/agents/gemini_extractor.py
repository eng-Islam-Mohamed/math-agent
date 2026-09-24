from models.state import AgentState
from services.gemini_client import extract_problem_from_image, extract_problem_from_audio

def gemini_extractor_node(state: AgentState) -> AgentState:
    """Extracts text from image or audio using Gemini via OpenRouter."""
    if state.get("error"):
        return state
        
    input_type = state.get("input_type")
    content = state.get("input_content")
    
    try:
        if input_type == "image":
            text = extract_problem_from_image(content)
            return {**state, "cleaned_problem": text}
        elif input_type == "audio":
            text = extract_problem_from_audio(content)
            return {**state, "cleaned_problem": text}
    except Exception as e:
        return {**state, "error": f"Extraction failed: {str(e)}"}
        
    return state
