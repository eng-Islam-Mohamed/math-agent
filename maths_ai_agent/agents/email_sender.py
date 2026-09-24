from models.state import AgentState
from services.gmail_service import send_email_with_pdf

def email_sender_node(state: AgentState) -> AgentState:
    """Sends the PDF via email."""
    if state.get("error"):
        return state
        
    user_email = state.get("user_email")
    pdf_path = state.get("pdf_path")
    solution_data = state.get("solution_data")
    
    if not user_email:
        return {**state, "email_status": "Failed: recipient email is missing"}
    if not pdf_path or not solution_data:
        return {**state, "email_status": "Failed: solution PDF is unavailable"}
        
    title = solution_data.get("title", "Math Solution")
    subject = f"Your Math Solution: {title}"
    body = "Hello,\n\nPlease find attached the detailed mathematical solution you requested.\n\nBest regards,\nMaths AI Agent"
    
    try:
        send_email_with_pdf(user_email, subject, body, pdf_path)
        return {**state, "email_status": "Sent successfully"}
    except Exception as e:
        print(f"Warning: Email sending failed: {e}")
        return {**state, "email_status": f"Failed: {str(e)}"}
