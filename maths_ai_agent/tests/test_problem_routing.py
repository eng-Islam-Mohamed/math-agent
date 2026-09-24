from unittest.mock import patch
from types import SimpleNamespace

import pytest

from agents.deepseek_solver import deepseek_solver_node
from agents.difficulty_router import difficulty_router_node
from agents.verifier import verifier_node
from graph import after_verification, escalate_solver_node
from models.schemas import BasicMathSolution, MathSolution, ProofVerification
from services.openrouter_client import model_for_tier
from services.gemini_client import extract_problem_from_audio
from services.problem_routing import classify_problem


def test_conservative_pre_solve_routing():
    assert classify_problem("What is 12 + 7?") == "small"
    assert classify_problem("Solve 2x + 5 = 17.") == "small"
    assert classify_problem("Solve x^2 - 5x + 6 = 0.") == "medium"
    assert classify_problem("Prove every finite subgroup of a field is cyclic.") == "hard"
    assert classify_problem("Solve 2x + 5 = 17.", student_attempt="2x = 22") == "medium"
    assert difficulty_router_node({"cleaned_problem": "2 + 2"})["solver_tier"] == "small"


def test_model_configuration_and_retry_route(monkeypatch):
    monkeypatch.setenv("SMALL_PROBLEM_MODEL", "test/small")
    monkeypatch.setenv("MEDIUM_PROBLEM_MODEL", "test/medium")
    monkeypatch.setenv("HARD_PROBLEM_MODEL", "test/hard")
    assert [model_for_tier(t) for t in ("small", "medium", "hard")] == [
        "test/small", "test/medium", "test/hard"
    ]
    weak = {"solver_tier": "small", "solver_retry_count": 0,
            "verification_data": {"confidence_score": 55, "risk_level": "High"}}
    assert after_verification(weak) == "retry"
    escalated = escalate_solver_node(weak)
    assert escalated["solver_tier"] == "medium"
    assert after_verification(escalated) == "continue"


def test_small_solution_uses_compact_schema_and_escalates_incomplete_output():
    state = {"cleaned_problem": "Solve 2x + 5 = 17.", "solver_tier": "small",
             "solver_retry_count": 0}
    complete = BasicMathSolution(
        title="Linear equation", cleaned_problem=state["cleaned_problem"],
        primary_solution="Subtract 5, then divide by 2.", final_answer="x = 6"
    )
    with patch("agents.deepseek_solver.call_deepseek_solver", return_value=complete) as call:
        result = deepseek_solver_node(state)
    assert result["solution_data"]["final_answer"] == "x = 6"
    assert call.call_args.kwargs["tier"] == "small"
    assert call.call_args.args[1] is BasicMathSolution

    incomplete = MathSolution(primary_solution="", final_answer="")
    stronger = MathSolution(primary_solution="2x = 12, so x = 6", final_answer="x = 6")
    with patch("agents.deepseek_solver.call_deepseek_solver", side_effect=[incomplete, stronger]) as call:
        result = deepseek_solver_node(state)
    assert call.call_count == 2
    assert result["solver_tier"] == "medium"
    assert result["solver_retry_count"] == 1


def test_symbolic_check_uses_original_problem_and_detects_wrong_answer():
    def check(answer):
        state = {
            "cleaned_problem": "Solve 2x + 5 = 17.",
            "solver_tier": "small",
            "solution_data": MathSolution(
                cleaned_problem="Solve the linear equation 2x + 5 = 17 for x.",
                problem_type="Linear Equation", primary_solution="Subtract 5 and divide by 2.",
                final_answer=answer,
            ).model_dump(),
        }
        review = ProofVerification(confidence_score=85, risk_level="Low", verification_method="symbolic check")
        with patch("agents.verifier.call_deepseek_verifier", return_value=review):
            return verifier_node(state)

    correct = check("x = 6")
    assert correct["verification_status"] == "SymPy Verified"
    assert correct["verification_data"]["risk_level"] == "Low"

    wrong = check("x = 7")
    assert wrong["verification_status"] == "Verification failed"
    assert wrong["verification_data"]["risk_level"] == "High"


def test_symbolic_check_handles_latex_delimiters():
    state = {
        "cleaned_problem": "Solve $4x + 3 = 23$.",
        "solver_tier": "medium",
        "solution_data": MathSolution(
            cleaned_problem="Solve $4x + 3 = 23$.", problem_type="Linear Equation",
            primary_solution="4x = 20, x = 5", final_answer="$x = 5$"
        ).model_dump(),
    }
    with patch("agents.verifier.call_deepseek_verifier", return_value=ProofVerification(confidence_score=80)):
        result = verifier_node(state)
    assert result["verification_status"] == "SymPy Verified"


def test_audio_transcription_preserves_math_and_rejects_uncertainty(tmp_path, monkeypatch):
    audio = tmp_path / "problem.wav"
    audio.write_bytes(b"RIFF-test-audio")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    reply = SimpleNamespace(status_code=200, json=lambda: {"choices": [{"message": {"content": "4x + 3 = 23"}}]})
    with patch("requests.post", return_value=reply) as post:
        assert extract_problem_from_audio(str(audio)) == "4x + 3 = 23"
    payload = post.call_args.kwargs["json"]
    assert payload["messages"][0]["content"][1]["type"] == "input_audio"
    assert payload["messages"][0]["content"][1]["input_audio"]["format"] == "wav"

    uncertain = SimpleNamespace(status_code=200, json=lambda: {"choices": [{"message": {"content": "UNCLEAR: coefficient"}}]})
    with patch("requests.post", return_value=uncertain), pytest.raises(ValueError, match="Audio is ambiguous"):
        extract_problem_from_audio(str(audio))
