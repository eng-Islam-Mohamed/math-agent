import os
import sys
import threading
from typing import Dict, Any, Optional

# Force stdout/stderr to use UTF-8 encoding on Windows to prevent 'charmap' encode errors
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure python knows where to find maths_ai_agent files
current_dir = os.path.dirname(os.path.abspath(__file__))
maths_ai_agent_path = os.path.abspath(os.path.join(current_dir, "../../maths_ai_agent"))
if maths_ai_agent_path not in sys.path:
    sys.path.insert(0, maths_ai_agent_path)

# Change directory so relative file lookups like credentials.json, token.json, templates etc. work correctly
os.chdir(maths_ai_agent_path)

from dotenv import load_dotenv
load_dotenv(os.path.join(maths_ai_agent_path, ".env"))

from graph import build_graph
from services.job_store import job_store

# Map LangGraph nodes to progress steps
NODE_TO_STEP = {
    "router": "cleaning_problem",
    "extractor": "gemini_extracting",
    "difficulty_router": "solving_problem",
    "escalate_solver": "solving_problem",
    "solver": "solving_problem",
    "verifier": "verifying_solution",
    "classifier": "classifying_problem",
    "pdf": "generating_pdf"
}

def run_agent_workflow(
    job_id: str,
    input_type: str,
    input_content: str,
    user_email: str,
    solution_mode: str = "Full Explanation Mode",
    pdf_style: str = "Clean Academic",
    advanced_options: Optional[Dict[str, Any]] = None
):
    try:
        print(f"\n[DEBUG] Starting run_agent_workflow for job_id={job_id}", flush=True)
        advanced_options = advanced_options or {}
        # 1. Update job to running
        job_store.update_job(job_id, status="running", progress_step="input_received")
        
        # 2. Build and compile graph
        print(f"[DEBUG] Building graph...", flush=True)
        app = build_graph()
        
        initial_state = {
            "input_type": input_type,
            "input_content": input_content,
            "user_email": user_email,
            "solution_mode": solution_mode,
            "pdf_style": pdf_style,
            "curriculum": advanced_options.get("curriculum", "General"),
            "explanation_style": advanced_options.get("explanation_style", "University rigorous"),
            "student_attempt": advanced_options.get("student_attempt", ""),
            "whiteboard_notes": advanced_options.get("whiteboard_notes", ""),
            "tutor_depth": advanced_options.get("tutor_depth", "Guided"),
            "include_practice": advanced_options.get("include_practice", True),
            "include_teacher_dashboard": advanced_options.get("include_teacher_dashboard", True)
        }
        
        # 3. Stream graph execution
        final_state = {}
        print(f"[DEBUG] Invoking graph stream with state: {initial_state}", flush=True)
        for event in app.stream(initial_state):
            print(f"[DEBUG] Received graph stream event keys: {list(event.keys())}", flush=True)
            for node_name, state_update in event.items():
                step = NODE_TO_STEP.get(node_name, "input_received")
                print(f"[DEBUG] Processing event from node: {node_name} -> step: {step}", flush=True)
                
                # Check for errors in state update
                err = state_update.get("error")
                if err:
                    job_store.update_job(job_id, status="error", error=str(err), progress_step="failed")
                    return
                
                # Update current progress step
                routing_fields = {
                    key: state_update[key]
                    for key in ("problem_tier", "solver_tier", "solver_retry_count")
                    if key in state_update
                }
                if node_name == "extractor":
                    job_store.update_job(job_id, progress_step="gemini_done", **routing_fields)
                else:
                    job_store.update_job(job_id, progress_step=step, **routing_fields)
                
                # Accumulate the state
                final_state.update(state_update)

        # 4. Extract PDF name for downloadable URL
        pdf_path = final_state.get("pdf_path")
        pdf_url = None
        if pdf_path:
            pdf_url = f"/api/pdf/{job_id}"
            
        # 5. Format final structured result matching frontend expectations
        sol_data = final_state.get("solution_data", {})
        structured_result = {
            "title": sol_data.get("title", ""),
            "cleaned_problem": final_state.get("cleaned_problem", input_content),
            "mathematical_field": sol_data.get("mathematical_field", ""),
            "detailed_branch": sol_data.get("detailed_branch", ""),
            "topic": sol_data.get("topic", ""),
            "academic_level": sol_data.get("academic_level", ""),
            "problem_type": sol_data.get("problem_type", ""),
            "problem_tier": final_state.get("problem_tier", "medium"),
            "solver_tier": final_state.get("solver_tier", "medium"),
            "solver_retry_count": final_state.get("solver_retry_count", 0),
            "solution_mode": sol_data.get("solution_mode", solution_mode),
            "pdf_style": sol_data.get("pdf_style", pdf_style),
            "curriculum": sol_data.get("curriculum", advanced_options.get("curriculum", "General")),
            "explanation_style": sol_data.get("explanation_style", advanced_options.get("explanation_style", "University rigorous")),
            "required_concepts": sol_data.get("required_concepts", []),
            "theorems_used": sol_data.get("theorems_used", []),
            "prerequisite_knowledge": sol_data.get("prerequisite_knowledge", []),
            "typical_course": sol_data.get("typical_course", ""),
            "tags": sol_data.get("tags", []),
            "solution_summary": sol_data.get("solution_summary", ""),
            "primary_solution": sol_data.get("primary_solution", ""),
            "alternative_solutions": sol_data.get("alternative_solutions", []),
            "final_answer": sol_data.get("final_answer", ""),
            "verification_status": final_state.get("verification_status", "LLM Verified"),
            
            # Confidence engine fields
            "confidence_score": sol_data.get("confidence_score", 0),
            "confidence_label": sol_data.get("confidence_label", "Unknown"),
            "risk_level": sol_data.get("risk_level", "Unknown"),
            "weak_points": sol_data.get("weak_points", []),
            "verification_method": sol_data.get("verification_method", "AI review"),
            "verification_explanation": sol_data.get("verification_explanation", ""),
            "assumptions_detected": sol_data.get("assumptions_detected", []),
            "numerical_checks": sol_data.get("numerical_checks", []),
            "symbolic_checks": sol_data.get("symbolic_checks", []),
            "counterexample_search": sol_data.get("counterexample_search", ""),
            "mistake_diagnosis": sol_data.get("mistake_diagnosis", {}),
            "socratic_tutor": sol_data.get("socratic_tutor", []),
            "evidence_checks": sol_data.get("evidence_checks", []),
            "solver_debate": sol_data.get("solver_debate", []),
            "consensus_notes": sol_data.get("consensus_notes", ""),
            "learning_profile": sol_data.get("learning_profile", {}),
            "teacher_dashboard": sol_data.get("teacher_dashboard", {}),
            "generated_practice": sol_data.get("generated_practice", []),
            "solution_quality_rubric": sol_data.get("solution_quality_rubric", []),
            "curriculum_alignment": sol_data.get("curriculum_alignment", {}),
            "whiteboard_feedback": sol_data.get("whiteboard_feedback", ""),
            
            # Outputs
            "pdf_status": "Success" if pdf_path else "Failed/Not generated",
            "pdf_file_name": os.path.basename(pdf_path) if pdf_path else "",
            "email_status": "Review Pending",
            "google_sheet_status": "Review Pending",
            "notes": final_state.get("verification_notes", sol_data.get("notes", ""))
        }
        
        # 6. Save final state for phase 2
        job_store.update_job(
            job_id,
            status="review_pending",
            progress_step="review_pending",
            result=structured_result,
            pdf_url=pdf_url,
            final_state=final_state
        )
        
    except Exception as e:
        job_store.update_job(job_id, status="error", error=str(e))

def run_agent_phase_2(
    job_id: str,
    email_approved: bool,
    title_overwrite: Optional[str] = None,
    recipient_email: Optional[str] = None,
    pdf_style: Optional[str] = None
):
    try:
        # Get job
        job = job_store.get_job(job_id)
        if not job:
            return
            
        final_state = job.get("final_state") or {}
        if not final_state:
            job_store.update_job(job_id, status="error", error="Final state from Phase 1 not found.")
            return
            
        # Update state with overrides
        if recipient_email:
            final_state["user_email"] = recipient_email
            job_store.update_job(job_id, user_email=recipient_email)
            
        if pdf_style and pdf_style != final_state.get("pdf_style"):
            # If the user changed the PDF style during review, we should re-generate the PDF!
            final_state["pdf_style"] = pdf_style
            job_store.update_job(job_id, pdf_style=pdf_style, progress_step="generating_pdf")
            from agents.pdf_generator import pdf_generator_node
            final_state = pdf_generator_node(final_state)
            pdf_path = final_state.get("pdf_path")
            if pdf_path:
                job_store.update_job(job_id, pdf_url=f"/api/pdf/{job_id}")
                
        # Update result dict
        result = job.get("result") or {}
        if title_overwrite:
            result["title"] = title_overwrite
            if "solution_data" in final_state:
                final_state["solution_data"]["title"] = title_overwrite
                
        # Step: sending_email
        if email_approved:
            job_store.update_job(job_id, progress_step="sending_email")
            from agents.email_sender import email_sender_node
            final_state = email_sender_node(final_state)
            result["email_status"] = final_state.get("email_status", "Sent")
        else:
            final_state["email_status"] = "Cancelled"
            result["email_status"] = "Cancelled"
            
        # Step: logging_to_google_sheets
        job_store.update_job(job_id, progress_step="logging_to_google_sheets")
        # Store human review status for sheets logger to read
        final_state["human_review_status"] = "Reviewed"
        final_state["email_approved"] = email_approved
        final_state["email_status"] = result["email_status"]
        final_state["pdf_style"] = pdf_style or final_state.get("pdf_style", "Clean Academic")
        final_state["solution_mode"] = job.get("solution_mode", "Full Explanation Mode")
        
        from agents.sheets_logger import sheets_logger_node
        final_state = sheets_logger_node(final_state)
        result["google_sheet_status"] = final_state.get("google_sheet_status", "Success")
        
        # Step: completed
        result["pdf_file_name"] = os.path.basename(final_state.get("pdf_path", "")) if final_state.get("pdf_path") else result.get("pdf_file_name", "")
        
        email_failed = email_approved and result["email_status"].lower().startswith("failed")
        sheet_failed = result["google_sheet_status"].lower().startswith("failed")
        failed_services = [name for name, failed in (("Email delivery", email_failed), ("Google Sheets logging", sheet_failed)) if failed]
        job_store.update_job(
            job_id,
            status="delivery_failed" if failed_services else "success",
            progress_step="completed",
            result=result,
            error=(", ".join(failed_services) + " failed. Check the delivery status below.") if failed_services else None,
        )
    except Exception as e:
        job_store.update_job(job_id, status="error", error=f"Phase 2 failed: {str(e)}")

def start_agent_job(
    job_id: str,
    input_type: str,
    input_content: str,
    user_email: str,
    solution_mode: str = "Full Explanation Mode",
    pdf_style: str = "Clean Academic",
    advanced_options: Optional[Dict[str, Any]] = None
):
    thread = threading.Thread(
        target=run_agent_workflow,
        args=(job_id, input_type, input_content, user_email, solution_mode, pdf_style, advanced_options),
        daemon=True
    )
    thread.start()

def start_agent_phase_2(
    job_id: str,
    email_approved: bool,
    title_overwrite: Optional[str] = None,
    recipient_email: Optional[str] = None,
    pdf_style: Optional[str] = None
):
    thread = threading.Thread(
        target=run_agent_phase_2,
        args=(job_id, email_approved, title_overwrite, recipient_email, pdf_style),
        daemon=True
    )
    thread.start()
