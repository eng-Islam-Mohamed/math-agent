import os
import uuid
from datetime import datetime
import json
from models.state import AgentState
from services.google_sheets_service import log_to_google_sheet

def sheets_logger_node(state: AgentState) -> AgentState:
    """Logs the results to Google Sheets, or saves a local backup."""
    solution_data = state.get("solution_data", {})
    
    error_msg = state.get("error", "")
    
    # Clean problem text: strip newlines and limit to 80 chars
    raw_problem = state.get("cleaned_problem", "") or state.get("input_content", "")
    problem_clean = " ".join(raw_problem.split())
    if len(problem_clean) > 80:
        problem_clean = problem_clean[:77] + "..."

    # Format verification status
    verif = solution_data.get("verification_status", state.get("verification_status", ""))
    verif_lower = verif.lower()
    if "sympy verified" in verif_lower:
        verif_formatted = "🛡️ SymPy Verified"
    elif "llm verified" in verif_lower:
        verif_formatted = "🤖 LLM Verified"
    elif "partially verified" in verif_lower:
        verif_formatted = "⚠️ Partially Verified"
    else:
        verif_formatted = verif

    # Format email status
    email_status = state.get("email_status", "")
    email_status_lower = email_status.lower()
    if "sent" in email_status_lower:
        email_formatted = "📧 Sent"
    elif "fail" in email_status_lower:
        email_formatted = "⚠️ Failed"
    elif "cancelled" in email_status_lower:
        email_formatted = "❌ Cancelled"
    else:
        email_formatted = email_status

    # Format risk level
    risk = solution_data.get("risk_level", "Unknown")
    risk_lower = risk.lower()
    if "low" in risk_lower:
        risk_formatted = "🟢 Low"
    elif "medium" in risk_lower:
        risk_formatted = "🟡 Medium"
    elif "high" in risk_lower:
        risk_formatted = "🔴 High"
    else:
        risk_formatted = risk

    # Format verification method
    method = solution_data.get("verification_method", "AI review")
    method_lower = method.lower()
    if "symbolic check" in method_lower:
        method_formatted = "🛡️ Symbolic Check"
    elif "partial symbolic check" in method_lower:
        method_formatted = "🛡️ Partial Symbolic"
    elif "logical review" in method_lower:
        method_formatted = "🧠 Logical Review"
    else:
        method_formatted = "🤖 AI Review"

    # Human review status
    human_status = state.get("human_review_status", "Pending")
    human_formatted = "✅ Reviewed" if human_status == "Reviewed" else "⏳ Pending"

    # Format overall status
    status_formatted = "❌ Error" if error_msg else "✅ Success"

    # Map academic level to Difficulty (Easy, Medium, Hard) to trigger sheet coloring
    level = solution_data.get("academic_level", "").lower()
    if any(kw in level for kw in ["phd", "master", "graduate", "advanced"]):
        difficulty = "Hard"
    elif "undergraduate" in level:
        difficulty = "Medium"
    elif "high school" in level or "easy" in level:
        difficulty = "Easy"
    else:
        difficulty = "Medium"

    row_data = [
        str(uuid.uuid4().hex[:8]),  # 1. ID
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),  # 2. Date
        solution_data.get("title", "Error" if error_msg else ""),  # 3. Problem Title
        difficulty,  # 4. Difficulty (Easy/Medium/Hard)
        solution_data.get("mathematical_field", ""),  # 5. Field
        problem_clean,  # 6. Problem
        solution_data.get("final_answer", ""),  # 7. Final Answer
        verif_formatted,  # 8. Verification (LLM / SymPy Verified)
        os.path.basename(state.get("pdf_path", "")) if state.get("pdf_path") else "",  # 9. PDF File
        state.get("user_email") or "",  # 10. Email
        status_formatted,  # 11. Status
        error_msg or solution_data.get("verification_explanation", "") or solution_data.get("notes", "")  # 12. Notes
    ]
    
    sheet_name = os.getenv("GOOGLE_SHEET_NAME", "maths")
    
    try:
        log_to_google_sheet(sheet_name, row_data)
        return {**state, "google_sheet_status": "Success"}
    except Exception as e:
        # Save local JSON backup
        backup_file = os.path.join(os.getcwd(), "outputs", "backups", f"backup_{datetime.now().strftime('%Y%md_%H%M%S')}.json")
        with open(backup_file, "w", encoding="utf-8") as f:
            json.dump({"state": state, "error": str(e)}, f, indent=2)
        return {**state, "google_sheet_status": f"Failed: saved local backup to {backup_file}"}
