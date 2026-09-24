"""Conservative, pre-solve model routing based on the extracted problem text."""

import re


MODEL_ENV_BY_TIER = {
    "small": ("SMALL_PROBLEM_MODEL", "google/gemini-3.1-flash-lite"),
    "medium": ("MEDIUM_PROBLEM_MODEL", "openai/gpt-5.4-mini"),
    "hard": ("HARD_PROBLEM_MODEL", "deepseek/deepseek-v4-pro-0813"),
}


def classify_problem(problem: str, solution_mode: str = "", student_attempt: str = "") -> str:
    """Route obvious easy/hard cases; use medium when difficulty is uncertain."""
    text = " ".join(problem.lower().split())
    mode = solution_mode.lower()

    if any(term in mode for term in ("proof", "research")):
        return "hard"
    if re.search(r"\b(prove|proof|lemma|theorem|olympiad|conjecture|rigorous proof)\b", text):
        return "hard"
    if len(text) > 500 or re.search(r"\b(pde|partial differential|topology|measure theory|functional analysis)\b", text):
        return "hard"
    if student_attempt.strip() or "mistake diagnosis" in mode:
        return "medium"

    # Only unmistakably routine questions use the cheapest tier.
    arithmetic = r"(?:what is|calculate|compute|evaluate)?\s*[-+]?\d+(?:\.\d+)?\s*[+*/-]\s*[-+]?\d+(?:\.\d+)?\s*[?.]?"
    linear = r"(?:solve\s+)?(?:[-+]?\d*\s*\*?\s*[a-z]\s*(?:[+-]\s*\d+)?)\s*=\s*[-+]?\d+\s*[?.]?"
    if re.fullmatch(arithmetic, text) or re.fullmatch(linear, text):
        return "small"
    return "medium"


def next_tier(tier: str) -> str | None:
    return {"small": "medium", "medium": "hard"}.get(tier)
