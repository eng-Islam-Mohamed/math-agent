import os
import pytest
from services.pdf_service import generate_pdf

def test_generate_pdf():
    solution_data = {
        "title": "Solve 2x + 5 = 17",
        "cleaned_problem": "Solve 2x + 5 = 17",
        "mathematical_field": "Algebra",
        "detailed_branch": "Linear Equations",
        "problem_type": "equation solving",
        "difficulty_label": "Very Easy",
        "difficulty_score": 1,
        "required_concepts": ["Algebraic manipulation"],
        "theorems_used": [],
        "solution_summary": "Subtract 5, then divide by 2.",
        "full_solution": "We start with the given equation:\n$$2x + 5 = 17$$\nSubtract 5 from both sides:\n$$2x = 12$$\nDivide by 2:\n$$x = 6$$",
        "final_answer": "x = 6",
        "verification_status": "Verified",
        "notes": ""
    }
    
    output_path = "test_output.pdf"
    
    # We will only run this if playwright is installed and functional
    try:
        generate_pdf(solution_data, output_path)
        assert os.path.exists(output_path)
        assert os.path.getsize(output_path) > 0
    finally:
        if os.path.exists(output_path):
            os.remove(output_path)
