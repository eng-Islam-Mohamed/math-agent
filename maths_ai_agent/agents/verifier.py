import re
from models.state import AgentState
from models.schemas import ProofVerification
from services.openrouter_client import call_deepseek_verifier
from services.learning_enrichment import enrich_solution_data

def verifier_node(state: AgentState) -> AgentState:
    """Verifies the solution using a second DeepSeek pass and SymPy where possible."""
    if state.get("error"):
        return state
        
    solution_data = state.get("solution_data")
    if not solution_data:
        return state
        
    final_answer = solution_data.get("final_answer", "")
    problem_type = solution_data.get("problem_type", "").lower()
    # Use the original extracted text for independent checks. Model rewrites may
    # add prose around an equation and make an otherwise parseable expression fail.
    cleaned_problem = state.get("cleaned_problem") or solution_data.get("cleaned_problem", "")
    cleaned_problem = re.sub(r"\\\(|\\\)|\\\[|\\\]|\$", "", cleaned_problem)
    solution_summary = solution_data.get("solution_summary", "")
    primary_solution = solution_data.get("primary_solution", "")
    review_failed = False
    
    # 1. Run the DeepSeek Verification Pass
    try:
        verification: ProofVerification = call_deepseek_verifier(
            cleaned_problem=cleaned_problem,
            solution_summary=solution_summary,
            primary_solution=primary_solution,
            response_format=ProofVerification,
            tier=state.get("solver_tier") or "medium",
        )
        v_data = verification.model_dump()
    except Exception as e:
        review_failed = True
        v_data = {
            "confidence_score": 0,
            "confidence_label": "Very Low",
            "risk_level": "High",
            "weak_points": [f"Review pass failed: {str(e)}"],
            "verification_method": "AI review",
            "verification_explanation": "The secondary review did not complete."
        }
        
    verification_status = "Verification unavailable" if review_failed else "LLM Reviewed"
    notes = ""
    
    # 2. Attempt SymPy verification for algebraic/computational problems
    is_symbolic_checked = False
    if "equation" in problem_type or "solving" in problem_type or "calculus" in problem_type or any(kw in cleaned_problem.lower() for kw in ["solve", "integrate", "derivative", "limit", "simplify"]):
        try:
            import sympy
            from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
            
            transformations = standard_transformations + (implicit_multiplication_application, convert_xor)
            
            # Try to extract "x = value" patterns from the final answer
            var_value_matches = re.findall(r'([a-zA-Z])\s*=\s*([\d.\-/]+)', final_answer)
            
            if var_value_matches:
                eq_text = re.sub(
                    r'^(solve|find|compute|calculate|evaluate|determine|simplify|what\s+is)\s+',
                    '', cleaned_problem, flags=re.IGNORECASE
                ).strip().rstrip('.?')
                
                eq_match = re.search(r'([^.]+=[^.]+)', eq_text)
                if eq_match:
                    eq_str = eq_match.group(1).strip()
                    parts = eq_str.split('=')
                    if len(parts) == 2:
                        try:
                            lhs = parse_expr(parts[0].strip(), transformations=transformations)
                            rhs = parse_expr(parts[1].strip(), transformations=transformations)
                            equation = sympy.Eq(lhs, rhs)
                            
                            verified_count = 0
                            total_count = len(var_value_matches)
                            
                            for var_name, var_value in var_value_matches:
                                var = sympy.Symbol(var_name)
                                try:
                                    value = sympy.Rational(var_value)
                                    result = equation.subs(var, value)
                                    if result == True or sympy.simplify(lhs.subs(var, value) - rhs.subs(var, value)) == 0:
                                        verified_count += 1
                                except Exception:
                                    pass
                            
                            if verified_count == total_count and total_count > 0:
                                verification_status = "SymPy Verified"
                                notes = "SymPy confirmed: substituting solution back into the equation yields equality."
                                is_symbolic_checked = True
                            elif verified_count > 0:
                                verification_status = "Partially Verified"
                                notes = f"SymPy verified {verified_count}/{total_count} variables."
                                is_symbolic_checked = True
                                v_data["confidence_score"] = min(v_data["confidence_score"], 50)
                                v_data["confidence_label"] = "Low"
                                v_data["risk_level"] = "High"
                                v_data["weak_points"] = v_data.get("weak_points", []) + [notes]
                            elif total_count > 0:
                                verification_status = "Verification failed"
                                notes = "SymPy found that the proposed answer does not satisfy the equation."
                                v_data["confidence_score"] = 0
                                v_data["confidence_label"] = "Very Low"
                                v_data["risk_level"] = "High"
                                v_data["weak_points"] = v_data.get("weak_points", []) + [notes]
                        except Exception:
                            pass
        except Exception:
            pass
            
    # Adjust verification method/score based on SymPy and problem type
    if is_symbolic_checked:
        if verification_status == "SymPy Verified":
            v_data["confidence_score"] = max(v_data["confidence_score"], 98)
            v_data["confidence_label"] = "Very High"
            v_data["risk_level"] = "Low"
            v_data["verification_method"] = "symbolic check"
            v_data["verification_explanation"] = f"SymPy mathematically verified the equation solution. {notes}"
        else:
            v_data["verification_method"] = "partial symbolic check"
            v_data["verification_explanation"] = f"SymPy verified some variables. {notes}"
    else:
        if v_data["verification_method"] in ("symbolic check", "partial symbolic check"):
            v_data["verification_method"] = "AI review"
            v_data["verification_explanation"] += " No independent symbolic check completed."
        # If it's a proof-heavy problem, mark symbolic check as partial if the LLM thought it was symbolic
        is_proof = "proof" in problem_type or "prove" in cleaned_problem.lower()
        if is_proof and not review_failed:
            verification_status = "LLM Reviewed (proofs require manual review)"
            if v_data["verification_method"] == "symbolic check":
                v_data["verification_method"] = "partial symbolic check"
            notes = "Formal proof verification completed via Logical AI review. Symbolic check is marked as partial/logical."
            v_data["verification_explanation"] = f"{v_data['verification_explanation']} (Note: Proof-heavy problem, marked as logical review / partial check)."

    # Merge verification data back into solution_data
    solution_data.update({
        "verification_status": verification_status,
        "notes": (solution_data.get("notes") or "") + f" {notes}".strip(),
        "confidence_score": v_data["confidence_score"],
        "confidence_label": v_data["confidence_label"],
        "risk_level": v_data["risk_level"],
        "weak_points": v_data["weak_points"],
        "verification_method": v_data["verification_method"],
        "verification_explanation": v_data["verification_explanation"],
        "assumptions_detected": v_data.get("assumptions_detected", []),
        "numerical_checks": v_data.get("numerical_checks", []),
        "symbolic_checks": v_data.get("symbolic_checks", []),
        "counterexample_search": v_data.get("counterexample_search", "")
    })
    solution_data = enrich_solution_data(solution_data, state, v_data)
    
    return {
        **state,
        "solution_data": solution_data,
        "verification_status": verification_status,
        "verification_notes": notes,
        "verification_data": v_data
    }
