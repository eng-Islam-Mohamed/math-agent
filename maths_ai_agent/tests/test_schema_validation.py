import pytest
from models.schemas import MathSolution

def test_schema_validation():
    data = {
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
        "full_solution": "2x + 5 = 17\n2x = 12\nx = 6",
        "final_answer": "x = 6",
        "verification_status": "Unverified",
        "notes": ""
    }
    
    solution = MathSolution(**data)
    assert solution.title == "Solve 2x + 5 = 17"
    assert solution.difficulty_score == 1
    assert solution.final_answer == "x = 6"
