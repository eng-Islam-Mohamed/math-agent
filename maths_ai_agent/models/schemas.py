from pydantic import BaseModel, Field
from typing import List, Optional

class AlternativeSolution(BaseModel):
    title: str = Field(default="", description="Short title for the alternative method")
    method: str = Field(default="", description="The alternative methodology or approach used")
    solution: str = Field(default="", description="The full step-by-step alternative solution using LaTeX")
    when_to_use: str = Field(default="", description="When this alternative method is preferred over the primary one")
    elegance_score: int = Field(default=3, description="Elegance rating from 1 to 5")

class MistakeDiagnosis(BaseModel):
    submitted_attempt_summary: str = Field(default="", description="Brief summary of the user's submitted attempt")
    first_error_location: str = Field(default="", description="The earliest incorrect or risky step, if found")
    misconception: str = Field(default="", description="The likely underlying misconception")
    corrected_step: str = Field(default="", description="A corrected version of the step")
    prevention_tip: str = Field(default="", description="How to avoid this mistake in future problems")

class TutorPrompt(BaseModel):
    prompt: str = Field(default="", description="A Socratic tutor question or hint")
    expected_student_move: str = Field(default="", description="What a good student response should do")
    rescue_hint: str = Field(default="", description="A stronger hint if the student is stuck")

class EvidenceCheck(BaseModel):
    label: str = Field(default="", description="Name of the check")
    status: str = Field(default="", description="Passed, Partial, Not applicable, or Needs review")
    evidence: str = Field(default="", description="Short evidence for the status")

class SolverDebateEntry(BaseModel):
    agent: str = Field(default="", description="Role name, such as Primary Solver or Skeptic")
    position: str = Field(default="", description="The agent's assessment")
    confidence: int = Field(default=70, description="Confidence from 0 to 100")
    concern: str = Field(default="", description="Main concern or caveat")

class LearningProfile(BaseModel):
    likely_strengths: List[str] = Field(default_factory=list)
    likely_weaknesses: List[str] = Field(default_factory=list)
    next_best_topic: str = Field(default="")
    review_priority: str = Field(default="")

class TeacherDashboard(BaseModel):
    grading_focus: List[str] = Field(default_factory=list)
    common_misconceptions: List[str] = Field(default_factory=list)
    intervention_plan: List[str] = Field(default_factory=list)
    class_discussion_prompt: str = Field(default="")

class PracticeProblem(BaseModel):
    level: str = Field(default="", description="Easier, Similar, Harder, Trick, or Applied")
    problem: str = Field(default="", description="Practice problem text")
    target_skill: str = Field(default="", description="Skill tested by the problem")
    answer_check: str = Field(default="", description="Brief answer or checking hint")

class RubricItem(BaseModel):
    criterion: str = Field(default="")
    score: int = Field(default=4, description="Score from 1 to 5")
    comment: str = Field(default="")

class CurriculumAlignment(BaseModel):
    selected_curriculum: str = Field(default="General")
    standard_like_goal: str = Field(default="")
    allowed_methods: List[str] = Field(default_factory=list)
    notation_expectations: str = Field(default="")

class MathSolution(BaseModel):
    title: str = Field(default="Mathematical Solution", description="A concise title for the problem")
    cleaned_problem: str = Field(default="", description="The cleaned and normalized mathematical problem text")
    mathematical_field: str = Field(default="General Mathematics", description="The broad mathematical field")
    detailed_branch: str = Field(default="", description="The detailed branch or subfield")
    topic: str = Field(default="", description="The specific topic or concept being tested")
    academic_level: str = Field(default="", description="Academic level")
    problem_type: str = Field(default="", description="The type of problem")
    difficulty_label: str = Field(default="", description="Human difficulty label")
    difficulty_score: int = Field(default=3, description="Difficulty score from 1 to 5")
    solution_mode: str = Field(default="Full Explanation Mode", description="The mode used to solve the problem")
    pdf_style: str = Field(default="Clean Academic", description="The PDF style")
    curriculum: str = Field(default="General", description="Selected curriculum alignment target")
    explanation_style: str = Field(default="University rigorous", description="Explain-like style selected by the user")
    required_concepts: List[str] = Field(default_factory=list, description="List of required mathematical concepts")
    theorems_used: List[str] = Field(default_factory=list, description="List of theorems or lemmas used")
    prerequisite_knowledge: List[str] = Field(default_factory=list, description="Prerequisites needed to understand the solution")
    typical_course: str = Field(default="", description="Typical course name")
    tags: List[str] = Field(default_factory=list, description="Tags associated with the problem")
    solution_summary: str = Field(default="", description="A brief summary of the solution strategy")
    primary_solution: str = Field(default="", description="The main step-by-step solution using proper LaTeX notation")
    full_solution: str = Field(default="", description="Backward-compatible full solution alias")
    alternative_solutions: List[AlternativeSolution] = Field(default_factory=list, description="Alternative solutions if applicable")
    final_answer: str = Field(default="", description="The final answer or conclusion")
    mistake_diagnosis: MistakeDiagnosis = Field(default_factory=MistakeDiagnosis)
    socratic_tutor: List[TutorPrompt] = Field(default_factory=list)
    evidence_checks: List[EvidenceCheck] = Field(default_factory=list)
    solver_debate: List[SolverDebateEntry] = Field(default_factory=list)
    consensus_notes: str = Field(default="")
    learning_profile: LearningProfile = Field(default_factory=LearningProfile)
    teacher_dashboard: TeacherDashboard = Field(default_factory=TeacherDashboard)
    generated_practice: List[PracticeProblem] = Field(default_factory=list)
    solution_quality_rubric: List[RubricItem] = Field(default_factory=list)
    curriculum_alignment: CurriculumAlignment = Field(default_factory=CurriculumAlignment)
    whiteboard_feedback: str = Field(default="", description="Feedback on whiteboard notes or scratch work")


class BasicMathSolution(BaseModel):
    """Compact response for routine problems; enrichment supplies optional sections."""
    title: str
    cleaned_problem: str
    mathematical_field: str = "General Mathematics"
    detailed_branch: str = ""
    problem_type: str = ""
    difficulty_label: str = "Easy"
    difficulty_score: int = 1
    required_concepts: List[str] = Field(default_factory=list)
    solution_summary: str = ""
    primary_solution: str
    final_answer: str

class ProofVerification(BaseModel):
    confidence_score: int = Field(default=75, description="Confidence score from 0 to 100")
    confidence_label: str = Field(default="Medium", description="Very Low / Low / Medium / High / Very High")
    risk_level: str = Field(default="Medium", description="Low / Medium / High")
    weak_points: List[str] = Field(default_factory=list, description="Possible weak reasoning points")
    verification_method: str = Field(default="AI review", description="AI review / symbolic check / partial symbolic check / logical review")
    verification_explanation: str = Field(default="", description="Short explanation of score and risk")
    assumptions_detected: List[str] = Field(default_factory=list)
    numerical_checks: List[str] = Field(default_factory=list)
    symbolic_checks: List[str] = Field(default_factory=list)
    counterexample_search: str = Field(default="")
