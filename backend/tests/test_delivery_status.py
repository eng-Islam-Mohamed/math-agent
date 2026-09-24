import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.agent_runner import run_agent_phase_2
from services.job_store import job_store
from agents import email_sender, sheets_logger


def test_failed_delivery_keeps_solution_available(monkeypatch):
    job_id = "test-delivery-failure"
    job_store.create_job(job_id, "text", "Solve x + 1 = 2", "student@example.test")
    job_store.update_job(
        job_id,
        status="review_pending",
        result={"title": "Test", "pdf_file_name": "test.pdf"},
        final_state={
            "input_type": "text",
            "input_content": "Solve x + 1 = 2",
            "user_email": "student@example.test",
            "pdf_style": "Clean Academic",
            "pdf_path": "test.pdf",
            "solution_data": {"title": "Test", "final_answer": "x = 1"},
        },
    )
    monkeypatch.setattr(email_sender, "email_sender_node", lambda state: {**state, "email_status": "Failed: test error"})
    monkeypatch.setattr(sheets_logger, "sheets_logger_node", lambda state: {**state, "google_sheet_status": "Failed: test error"})

    run_agent_phase_2(job_id, email_approved=True)
    job = job_store.get_job(job_id)
    assert job["status"] == "delivery_failed"
    assert job["result"]["pdf_file_name"] == "test.pdf"
    assert "Email delivery" in job["error"]
    assert "Google Sheets logging" in job["error"]
