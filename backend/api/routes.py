import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any

from services.job_store import job_store
from services.agent_runner import start_agent_job

router = APIRouter()

# Directory configuration
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../maths_ai_agent/outputs/uploads"))
PDF_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../maths_ai_agent/outputs/pdfs"))

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

class TextSolveRequest(BaseModel):
    problem_text: str
    recipient_email: Optional[str] = ""
    solution_mode: Optional[str] = "Full Explanation Mode"
    pdf_style: Optional[str] = "Clean Academic"
    curriculum: Optional[str] = "General"
    explanation_style: Optional[str] = "University rigorous"
    student_attempt: Optional[str] = ""
    whiteboard_notes: Optional[str] = ""
    tutor_depth: Optional[str] = "Guided"
    include_practice: Optional[bool] = True
    include_teacher_dashboard: Optional[bool] = True

class ApproveEmailRequest(BaseModel):
    recipient_email: Optional[str] = None
    title_overwrite: Optional[str] = None
    pdf_style: Optional[str] = None

def build_advanced_options(
    curriculum: str = "General",
    explanation_style: str = "University rigorous",
    student_attempt: str = "",
    whiteboard_notes: str = "",
    tutor_depth: str = "Guided",
    include_practice: bool = True,
    include_teacher_dashboard: bool = True
) -> Dict[str, Any]:
    return {
        "curriculum": curriculum or "General",
        "explanation_style": explanation_style or "University rigorous",
        "student_attempt": student_attempt or "",
        "whiteboard_notes": whiteboard_notes or "",
        "tutor_depth": tutor_depth or "Guided",
        "include_practice": bool(include_practice),
        "include_teacher_dashboard": bool(include_teacher_dashboard)
    }

@router.post("/solve/text")
async def solve_text(request: TextSolveRequest):
    if not request.problem_text.strip():
        raise HTTPException(status_code=400, detail="Problem text cannot be empty.")
        
    job_id = str(uuid.uuid4())
    advanced_options = build_advanced_options(
        curriculum=request.curriculum,
        explanation_style=request.explanation_style,
        student_attempt=request.student_attempt,
        whiteboard_notes=request.whiteboard_notes,
        tutor_depth=request.tutor_depth,
        include_practice=request.include_practice,
        include_teacher_dashboard=request.include_teacher_dashboard
    )
    # Create job in database
    job_store.create_job(
        job_id=job_id,
        input_type="text",
        input_content=request.problem_text,
        user_email=request.recipient_email,
        solution_mode=request.solution_mode,
        pdf_style=request.pdf_style,
        advanced_options=advanced_options
    )
    # Start agent in background thread
    start_agent_job(
        job_id,
        "text",
        request.problem_text,
        request.recipient_email,
        solution_mode=request.solution_mode,
        pdf_style=request.pdf_style,
        advanced_options=advanced_options
    )
    
    return {"job_id": job_id, "status": "waiting"}

async def save_uploaded_file(file: UploadFile) -> str:
    # Generate unique filename to prevent collisions
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return filepath

@router.post("/solve/image")
async def solve_image(
    file: UploadFile = File(...),
    recipient_email: str = Form(""),
    solution_mode: str = Form("Full Explanation Mode"),
    pdf_style: str = Form("Clean Academic"),
    curriculum: str = Form("General"),
    explanation_style: str = Form("University rigorous"),
    student_attempt: str = Form(""),
    whiteboard_notes: str = Form(""),
    tutor_depth: str = Form("Guided"),
    include_practice: bool = Form(True),
    include_teacher_dashboard: bool = Form(True)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail="Invalid image format. Supported: png, jpg, jpeg, webp.")
        
    filepath = await save_uploaded_file(file)
    job_id = str(uuid.uuid4())
    advanced_options = build_advanced_options(
        curriculum=curriculum,
        explanation_style=explanation_style,
        student_attempt=student_attempt,
        whiteboard_notes=whiteboard_notes,
        tutor_depth=tutor_depth,
        include_practice=include_practice,
        include_teacher_dashboard=include_teacher_dashboard
    )
    
    job_store.create_job(
        job_id=job_id,
        input_type="image",
        input_content=filepath,
        user_email=recipient_email,
        solution_mode=solution_mode,
        pdf_style=pdf_style,
        advanced_options=advanced_options
    )
    start_agent_job(
        job_id,
        "image",
        filepath,
        recipient_email,
        solution_mode=solution_mode,
        pdf_style=pdf_style,
        advanced_options=advanced_options
    )
    
    return {"job_id": job_id, "status": "waiting"}

@router.post("/solve/audio")
async def solve_audio(
    file: UploadFile = File(...),
    recipient_email: str = Form(""),
    solution_mode: str = Form("Full Explanation Mode"),
    pdf_style: str = Form("Clean Academic"),
    curriculum: str = Form("General"),
    explanation_style: str = Form("University rigorous"),
    student_attempt: str = Form(""),
    whiteboard_notes: str = Form(""),
    tutor_depth: str = Form("Guided"),
    include_practice: bool = Form(True),
    include_teacher_dashboard: bool = Form(True)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp3", ".wav", ".m4a", ".ogg"]:
        raise HTTPException(status_code=400, detail="Invalid audio format. Supported: mp3, wav, m4a, ogg.")
        
    filepath = await save_uploaded_file(file)
    job_id = str(uuid.uuid4())
    advanced_options = build_advanced_options(
        curriculum=curriculum,
        explanation_style=explanation_style,
        student_attempt=student_attempt,
        whiteboard_notes=whiteboard_notes,
        tutor_depth=tutor_depth,
        include_practice=include_practice,
        include_teacher_dashboard=include_teacher_dashboard
    )
    
    job_store.create_job(
        job_id=job_id,
        input_type="audio",
        input_content=filepath,
        user_email=recipient_email,
        solution_mode=solution_mode,
        pdf_style=pdf_style,
        advanced_options=advanced_options
    )
    start_agent_job(
        job_id,
        "audio",
        filepath,
        recipient_email,
        solution_mode=solution_mode,
        pdf_style=pdf_style,
        advanced_options=advanced_options
    )
    
    return {"job_id": job_id, "status": "waiting"}

@router.post("/job/{job_id}/approve-email")
async def approve_email(job_id: str, request: ApproveEmailRequest):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.get("status") != "review_pending":
        raise HTTPException(status_code=400, detail=f"Job is not in review_pending state (current: {job.get('status')})")
        
    from services.agent_runner import start_agent_phase_2
    start_agent_phase_2(
        job_id=job_id,
        email_approved=True,
        title_overwrite=request.title_overwrite,
        recipient_email=request.recipient_email,
        pdf_style=request.pdf_style
    )
    return {"status": "success", "message": "Email approval registered. Phase 2 started in background."}

@router.post("/job/{job_id}/cancel-email")
async def cancel_email(job_id: str, request: ApproveEmailRequest):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.get("status") != "review_pending":
        raise HTTPException(status_code=400, detail=f"Job is not in review_pending state (current: {job.get('status')})")
        
    from services.agent_runner import start_agent_phase_2
    start_agent_phase_2(
        job_id=job_id,
        email_approved=False,
        title_overwrite=request.title_overwrite,
        recipient_email=request.recipient_email,
        pdf_style=request.pdf_style
    )
    return {"status": "success", "message": "Email cancellation registered. Phase 2 started in background (email skipped)."}

@router.get("/job/{job_id}")
async def get_job(job_id: str):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job

@router.get("/pdf/{job_id}")
async def get_pdf(job_id: str, pdf_style: Optional[str] = None):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    # PDF preview should be available even in review_pending state!
    if job.get("status") not in ["success", "review_pending", "delivery_failed"]:
        raise HTTPException(status_code=400, detail="Job has not generated a PDF yet.")
        
    final_state = job.get("final_state") or {}
    result = job.get("result") or {}
    
    # If a specific style is requested and it's different, regenerate the PDF!
    if pdf_style and pdf_style != final_state.get("pdf_style"):
        final_state["pdf_style"] = pdf_style
        job_store.update_job(job_id, pdf_style=pdf_style)
        
        # Load env variables and chdir (same as agent_runner does to be safe)
        from services.agent_runner import maths_ai_agent_path
        orig_cwd = os.getcwd()
        try:
            os.chdir(maths_ai_agent_path)
            from agents.pdf_generator import pdf_generator_node
            final_state = pdf_generator_node(final_state)
            pdf_path = final_state.get("pdf_path")
            if pdf_path:
                pdf_filename = os.path.basename(pdf_path)
                result["pdf_file_name"] = pdf_filename
                job_store.update_job(job_id, result=result, final_state=final_state)
        finally:
            os.chdir(orig_cwd)
        
    pdf_filename = result.get("pdf_file_name")
    
    if not pdf_filename:
         raise HTTPException(status_code=404, detail="PDF was not generated for this job.")
          
    pdf_filepath = os.path.join(PDF_DIR, pdf_filename)
    if not os.path.exists(pdf_filepath):
         raise HTTPException(status_code=404, detail="PDF file not found on disk.")
          
    return FileResponse(
        pdf_filepath,
        media_type="application/pdf",
        filename=pdf_filename
    )
