import json
import re
from pydantic import BaseModel
from openai import OpenAI
import os
from services.problem_routing import MODEL_ENV_BY_TIER


def model_for_tier(tier: str) -> str:
    env_name, default = MODEL_ENV_BY_TIER.get(tier, MODEL_ENV_BY_TIER["medium"])
    if tier == "hard":
        return os.getenv(env_name) or os.getenv("DEEPSEEK_MODEL") or default
    return os.getenv(env_name) or default

def get_openrouter_client():
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is missing")
    return OpenAI(base_url=base_url, api_key=api_key, timeout=60.0)

def extract_json_block(text: str) -> str:
    """Extracts a valid JSON object string from text containing code fences or markdown wrapper text."""
    # 1. Strip <think>...</think> blocks first
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = text.strip()
    
    # 2. Try to find JSON inside markdown code blocks
    # Greedy match to capture the whole JSON even if it has nested code blocks or structures
    code_block_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', text, flags=re.DOTALL)
    if code_block_match:
        json_candidate = code_block_match.group(1).strip()
        if json_candidate.startswith('{') and json_candidate.endswith('}'):
            return json_candidate
            
    # 3. Fallback: Search for the opening brace of a JSON object (a '{' followed by whitespace and a double quote)
    match = re.search(r'\{\s*"', text)
    if match:
        first_brace = match.start()
        last_brace = text.rfind('}')
        if last_brace != -1 and last_brace > first_brace:
            return text[first_brace:last_brace + 1]
            
    # 4. Extreme fallback: standard first and last brace
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace:last_brace + 1]
        
    return text

def call_deepseek_solver(
    cleaned_problem: str,
    response_format: BaseModel,
    solution_mode: str = "Full Explanation Mode",
    pdf_style: str = "Clean Academic",
    advanced_options: dict | None = None,
    tier: str = "medium"
) -> BaseModel:
    """Calls the model selected for the pre-solve complexity tier."""
    client = get_openrouter_client()
    model = model_for_tier(tier)
    
    schema = response_format.model_json_schema()
    advanced_options = advanced_options or {}
    student_attempt = advanced_options.get("student_attempt") or ""
    whiteboard_notes = advanced_options.get("whiteboard_notes") or ""
    curriculum = advanced_options.get("curriculum") or "General"
    explanation_style = advanced_options.get("explanation_style") or "University rigorous"
    tutor_depth = advanced_options.get("tutor_depth") or "Guided"
    
    learning_requirements = """[ADVANCED LEARNING REQUIREMENTS]
- Populate `mistake_diagnosis` if a student attempt exists; otherwise state that no attempt was supplied.
- Populate `socratic_tutor` with 3 to 5 ordered prompts.
- Populate `evidence_checks`, `solver_debate`, `learning_profile`, `teacher_dashboard`, `generated_practice`, `solution_quality_rubric`, and `curriculum_alignment`.
- Keep all advanced sections grounded in the actual problem. Do not invent external facts.
- `generated_practice` should include Easier, Similar, Harder, Trick, and Applied variants.
- `solution_quality_rubric` should grade Correctness, Clarity, Rigor, Exam suitability, and Elegance from 1 to 5.
""" if tier != "small" else """[ROUTINE PROBLEM]
Keep the answer concise but show each needed mathematical step. Return only the core schema fields.
"""

    prompt = f"""You are a world-class professional mathematician. Solve the following mathematical problem.
You MUST respond with valid JSON matching the exact schema below. Do not include markdown code blocks like ```json, just output the raw JSON.

[SOLVER METADATA]
- Solution Mode: {solution_mode}
- PDF Style: {pdf_style}
- Curriculum Alignment: {curriculum}
- Explanation Style: {explanation_style}
- Tutor Depth: {tutor_depth}

[SOLVER MODE INSTRUCTIONS]
- Exam Mode: Concise, elegant, exam-ready solution. Focus on direct steps.
- Full Explanation Mode: Detailed explanation with every important step and reasoning.
- Proof Mode: Formal proof with assumptions, definitions, theorem references, and high mathematical rigor.
- Research Style Mode: Formal mathematical writing, compact but advanced and dense.
- Teacher Mode: Pedagogical, intuitive explanations, analogies, and examples where useful.
- Fast Answer Mode: Short solution and final answer only.
- Mistake Diagnosis Mode: Compare the student's attempt against the correct solution, identify the first invalid step, diagnose the misconception, then continue correctly.
- Socratic Tutor Mode: Do not only lecture. Include guided prompts in `socratic_tutor`.

{learning_requirements}

[ALTERNATIVE SOLUTIONS INSTRUCTIONS]
- If the problem naturally has multiple methods of solving (e.g. algebraic vs geometric, substitution vs integration by parts), generate 1 to 3 alternatives in `alternative_solutions`.
- If no meaningful alternative exists, return an empty list []. Do not invent fake alternative methods.

[STUDENT ATTEMPT]
{student_attempt or "No student attempt supplied."}

[WHITEBOARD NOTES]
{whiteboard_notes or "No whiteboard notes supplied."}

Schema:
{json.dumps(schema, indent=2)}

Problem:
{cleaned_problem}
"""
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a world-class mathematician. You output strictly valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
    )
    
    message = response.choices[0].message
    content = getattr(message, "content", None)
    
    if content is None:
        # Check for refusal
        refusal = getattr(message, "refusal", None)
        if refusal:
            raise ValueError(f"Model refused to generate response: {refusal}")
        # Check if reasoning contains the text (sometimes happens with R1 models on OpenRouter)
        reasoning = getattr(message, "reasoning", None)
        if reasoning:
            content = reasoning
        else:
            raise ValueError("OpenRouter returned an empty response (null content). This is usually a transient provider error or safety block. Please try again.")

    content = extract_json_block(content)
    return response_format.model_validate_json(content)

def call_deepseek_verifier(
    cleaned_problem: str,
    solution_summary: str,
    primary_solution: str,
    response_format: BaseModel,
    tier: str = "medium"
) -> BaseModel:
    """Calls a second model pass to review the solution."""
    client = get_openrouter_client()
    model = model_for_tier(tier)
    
    schema = response_format.model_json_schema()
    
    prompt = f"""You are a world-class senior mathematician peer reviewer.
Review the following mathematical problem and the proposed solution.
Your job is to critically evaluate the reasoning, check for leaps in logic, correctness of intermediate steps, and verify the final answer.
Identify any weak points or missing definitions/theorems.
You MUST respond with valid JSON matching the exact schema below. Do not include markdown code blocks like ```json, just output the raw JSON.

Problem:
{cleaned_problem}

Solution Summary:
{solution_summary}

Primary Solution:
{primary_solution}

[VERIFICATION METHOD OPTIONS]
- AI review: general LLM review of proofs / complex structures.
- symbolic check: formal mathematical symbols verified via automated check (e.g. SymPy).
- partial symbolic check: some equations were verified symbolically but not all (e.g. proof-heavy).
- logical review: step-by-step logic checked against standard theorems.

Schema:
{json.dumps(schema, indent=2)}
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a world-class mathematical reviewer. You output strictly valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
    )
    
    message = response.choices[0].message
    content = getattr(message, "content", None)
    
    if content is None:
        refusal = getattr(message, "refusal", None)
        if refusal:
            raise ValueError(f"Model refused to generate verification response: {refusal}")
        reasoning = getattr(message, "reasoning", None)
        if reasoning:
            content = reasoning
        else:
            raise ValueError("OpenRouter returned empty verification response.")

    content = extract_json_block(content)
    return response_format.model_validate_json(content)
