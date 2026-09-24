from typing import TypedDict, Optional, Dict, Any, List

class AgentState(TypedDict):
    # Input
    input_type: str  # text, image, audio
    input_content: str  # text or file path
    user_email: str
    solution_mode: Optional[str]  # Exam Mode, Full Explanation Mode, etc.
    pdf_style: Optional[str]      # Clean Academic, Luxury Dark, etc.
    curriculum: Optional[str]
    explanation_style: Optional[str]
    student_attempt: Optional[str]
    whiteboard_notes: Optional[str]
    tutor_depth: Optional[str]
    include_practice: Optional[bool]
    include_teacher_dashboard: Optional[bool]
    title_overwrite: Optional[str] # Overwrite the generated PDF/email title
    email_approved: Optional[bool] # Whether user approved sending the email
    
    # Processed data
    cleaned_problem: Optional[str]
    problem_tier: Optional[str]
    solver_tier: Optional[str]
    solver_retry_count: Optional[int]
    
    # Solution
    solution_data: Optional[Dict[str, Any]]
    
    # Verification
    verification_status: Optional[str]
    verification_notes: Optional[str]
    verification_data: Optional[Dict[str, Any]] # proof confidence model dict
    
    # Outputs
    pdf_path: Optional[str]
    email_status: Optional[str]
    google_sheet_status: Optional[str]
    
    # Error handling
    error: Optional[str]
