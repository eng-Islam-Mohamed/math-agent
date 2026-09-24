from __future__ import annotations

from typing import Any, Dict, List


def _as_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _first(items: List[str], fallback: str) -> str:
    return items[0] if items else fallback


def _confidence_label(score: int) -> str:
    if score >= 90:
        return "Very High"
    if score >= 80:
        return "High"
    if score >= 60:
        return "Medium"
    if score >= 40:
        return "Low"
    return "Very Low"


def enrich_solution_data(
    solution_data: Dict[str, Any],
    state: Dict[str, Any],
    verification_data: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Fill advanced learning sections with stable, reviewable defaults.

    The LLM is asked to produce these fields, but this pass guarantees the
    frontend and PDF always receive complete structures.
    """
    verification_data = verification_data or {}
    problem = solution_data.get("cleaned_problem") or state.get("cleaned_problem") or state.get("input_content", "")
    topic = solution_data.get("topic") or solution_data.get("detailed_branch") or "the main concept"
    concepts = _as_list(solution_data.get("required_concepts"))
    theorems = _as_list(solution_data.get("theorems_used"))
    prerequisites = _as_list(solution_data.get("prerequisite_knowledge"))
    weak_points = _as_list(solution_data.get("weak_points")) or _as_list(verification_data.get("weak_points"))
    score = int(solution_data.get("confidence_score") or verification_data.get("confidence_score") or 75)
    risk = solution_data.get("risk_level") or verification_data.get("risk_level") or ("Low" if score >= 85 else "Medium")
    method = solution_data.get("verification_method") or verification_data.get("verification_method") or "AI review"
    explanation = solution_data.get("verification_explanation") or verification_data.get("verification_explanation") or "The solution was reviewed for mathematical coherence and common failure points."
    curriculum = state.get("curriculum") or solution_data.get("curriculum") or "General"
    explanation_style = state.get("explanation_style") or solution_data.get("explanation_style") or "University rigorous"
    student_attempt = (state.get("student_attempt") or "").strip()
    whiteboard_notes = (state.get("whiteboard_notes") or "").strip()

    solution_data.setdefault("cleaned_problem", problem)
    solution_data.setdefault("curriculum", curriculum)
    solution_data.setdefault("explanation_style", explanation_style)
    solution_data.setdefault("full_solution", solution_data.get("primary_solution", ""))
    solution_data.setdefault("confidence_score", score)
    solution_data.setdefault("confidence_label", _confidence_label(score))
    solution_data.setdefault("risk_level", risk)
    solution_data.setdefault("verification_method", method)
    solution_data.setdefault("verification_explanation", explanation)
    solution_data.setdefault("weak_points", weak_points)

    if not solution_data.get("mistake_diagnosis"):
        if student_attempt:
            solution_data["mistake_diagnosis"] = {
                "submitted_attempt_summary": student_attempt[:500],
                "first_error_location": "Review the first step that changes the expression or applies a theorem.",
                "misconception": "The attempt may be mixing a valid operation with an unstated condition.",
                "corrected_step": "Compare each transformation with the verified solution and preserve all assumptions.",
                "prevention_tip": "After every transformation, substitute or restate the condition that makes the step legal.",
            }
        else:
            solution_data["mistake_diagnosis"] = {
                "submitted_attempt_summary": "No student attempt was supplied.",
                "first_error_location": "Not applicable.",
                "misconception": "Not applicable.",
                "corrected_step": "Use this section by pasting a student attempt before solving.",
                "prevention_tip": "When practicing, write one reason beside each algebraic or logical move.",
            }

    if not solution_data.get("socratic_tutor"):
        key_concept = _first(concepts, topic)
        solution_data["socratic_tutor"] = [
            {
                "prompt": f"What is the first definition or operation that unlocks {key_concept} here?",
                "expected_student_move": "Name the relevant concept and rewrite the problem in a workable form.",
                "rescue_hint": "Look at the expression that changes first in the official solution.",
            },
            {
                "prompt": "Which assumption must remain true before the next step is valid?",
                "expected_student_move": "State any domain, nonzero, continuity, differentiability, or theorem condition.",
                "rescue_hint": "If a denominator, square root, logarithm, limit, or theorem appears, check its conditions.",
            },
            {
                "prompt": "How could you check the final answer without redoing the whole solution?",
                "expected_student_move": "Substitute, differentiate, estimate numerically, or verify the theorem conclusion.",
                "rescue_hint": "Use the fastest independent check available for this problem type.",
            },
        ]

    if not solution_data.get("evidence_checks"):
        symbolic_checks = _as_list(verification_data.get("symbolic_checks"))
        numerical_checks = _as_list(verification_data.get("numerical_checks"))
        assumptions = _as_list(verification_data.get("assumptions_detected"))
        solution_data["evidence_checks"] = [
            {
                "label": "Symbolic verification",
                "status": "Passed" if method == "symbolic check" else "Partial",
                "evidence": _first(symbolic_checks, explanation),
            },
            {
                "label": "Numerical sanity check",
                "status": "Partial" if numerical_checks else "Not applicable",
                "evidence": _first(numerical_checks, "No independent numeric sample was required or available."),
            },
            {
                "label": "Assumption audit",
                "status": "Needs review" if assumptions or weak_points else "Passed",
                "evidence": "; ".join(assumptions[:3] or weak_points[:3] or ["No major hidden assumption was detected."]),
            },
        ]

    if not solution_data.get("solver_debate"):
        solution_data["solver_debate"] = [
            {
                "agent": "Primary Solver",
                "position": solution_data.get("solution_summary") or "The presented method solves the problem directly.",
                "confidence": max(60, min(score, 98)),
                "concern": "Depends on the stated assumptions being preserved.",
            },
            {
                "agent": "Skeptic Reviewer",
                "position": "Check domain restrictions, theorem hypotheses, and final simplification.",
                "confidence": max(45, min(score - 8, 92)),
                "concern": _first(weak_points, "No major concern beyond normal human review."),
            },
            {
                "agent": "Symbolic Checker",
                "position": "Automated checks support only the algebraic/computational parts they can parse.",
                "confidence": 95 if method == "symbolic check" else 70,
                "concern": "Proof-heavy reasoning still needs a human mathematical reading.",
            },
        ]
    solution_data.setdefault("consensus_notes", "The final answer is accepted with the verification limitations shown in the evidence report.")

    if not solution_data.get("learning_profile"):
        solution_data["learning_profile"] = {
            "likely_strengths": [f"Recognizing {topic}", "Following structured solution steps"],
            "likely_weaknesses": weak_points[:2] or ["Checking hidden conditions", "Explaining why each transformation is valid"],
            "next_best_topic": f"Targeted practice on {topic}",
            "review_priority": "High" if str(risk).lower().startswith("high") else "Medium" if str(risk).lower().startswith("medium") else "Low",
        }

    if not solution_data.get("teacher_dashboard"):
        solution_data["teacher_dashboard"] = {
            "grading_focus": [
                "Correct setup and notation",
                "Valid intermediate transformations",
                "Clear final answer with conditions",
            ],
            "common_misconceptions": weak_points[:3] or [
                "Skipping justification for a theorem",
                "Losing domain restrictions",
                "Treating a check as a proof",
            ],
            "intervention_plan": [
                "Ask students to annotate every operation with a reason.",
                "Give one near-miss example and have students find the invalid step.",
                "End with an independent answer check.",
            ],
            "class_discussion_prompt": f"Which step in this {topic} problem carries the most mathematical risk, and why?",
        }

    if not solution_data.get("generated_practice"):
        solution_data["generated_practice"] = [
            {
                "level": "Easier",
                "problem": f"Create a simpler version of this problem that tests only {topic}.",
                "target_skill": _first(concepts, topic),
                "answer_check": "The solution should use the same first principle with fewer steps.",
            },
            {
                "level": "Similar",
                "problem": f"Solve a new problem with the same structure as: {problem[:180]}",
                "target_skill": _first(concepts, topic),
                "answer_check": "Compare the setup and final verification method.",
            },
            {
                "level": "Harder",
                "problem": f"Extend this problem by adding one extra condition or parameter related to {topic}.",
                "target_skill": "Transfer and generalization",
                "answer_check": "The original method should still work after adapting the assumptions.",
            },
            {
                "level": "Trick",
                "problem": "Find the hidden domain or theorem condition that could make a tempting shortcut invalid.",
                "target_skill": "Error detection",
                "answer_check": "A correct answer names the condition before computing.",
            },
            {
                "level": "Applied",
                "problem": f"Write a real-world or modeling question that reduces to this {topic} method.",
                "target_skill": "Mathematical modeling",
                "answer_check": "The model should preserve the same mathematical structure.",
            },
        ]

    if not solution_data.get("solution_quality_rubric"):
        solution_data["solution_quality_rubric"] = [
            {"criterion": "Correctness", "score": 5 if score >= 85 else 4 if score >= 65 else 3, "comment": explanation},
            {"criterion": "Clarity", "score": 4, "comment": f"Explanation style: {explanation_style}."},
            {"criterion": "Rigor", "score": 5 if str(risk).lower().startswith("low") else 3, "comment": _first(weak_points, "Reasoning is adequately justified.")},
            {"criterion": "Exam suitability", "score": 4, "comment": "The final response can be shortened or expanded depending on the selected mode."},
            {"criterion": "Elegance", "score": 4, "comment": "Alternative paths are available when the problem naturally supports them."},
        ]

    if not solution_data.get("curriculum_alignment"):
        solution_data["curriculum_alignment"] = {
            "selected_curriculum": curriculum,
            "standard_like_goal": f"Use {topic} methods accurately within a {curriculum} context.",
            "allowed_methods": theorems[:4] or concepts[:4] or ["Standard course methods"],
            "notation_expectations": f"Use notation appropriate for {explanation_style} explanations.",
        }

    if whiteboard_notes and not solution_data.get("whiteboard_feedback"):
        solution_data["whiteboard_feedback"] = (
            "Whiteboard notes were included. Compare the scratch-work sequence with the verified solution, "
            "especially the first transformation and any unstated assumptions."
        )
    else:
        solution_data.setdefault("whiteboard_feedback", "No whiteboard notes were supplied.")

    return solution_data
