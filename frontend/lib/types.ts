export type InputType = "text" | "image" | "audio";

export type StepStatus = "waiting" | "running" | "success" | "error";

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  iconName: string;
}

export interface AlternativeSolution {
  title: string;
  method: string;
  solution: string;
  when_to_use: string;
  elegance_score: number;
}

export interface AdvancedSolveOptions {
  curriculum: string;
  explanationStyle: string;
  studentAttempt: string;
  whiteboardNotes: string;
  tutorDepth: string;
  includePractice: boolean;
  includeTeacherDashboard: boolean;
}

export interface MistakeDiagnosis {
  submitted_attempt_summary: string;
  first_error_location: string;
  misconception: string;
  corrected_step: string;
  prevention_tip: string;
}

export interface TutorPrompt {
  prompt: string;
  expected_student_move: string;
  rescue_hint: string;
}

export interface EvidenceCheck {
  label: string;
  status: string;
  evidence: string;
}

export interface SolverDebateEntry {
  agent: string;
  position: string;
  confidence: number;
  concern: string;
}

export interface LearningProfile {
  likely_strengths: string[];
  likely_weaknesses: string[];
  next_best_topic: string;
  review_priority: string;
}

export interface TeacherDashboard {
  grading_focus: string[];
  common_misconceptions: string[];
  intervention_plan: string[];
  class_discussion_prompt: string;
}

export interface PracticeProblem {
  level: string;
  problem: string;
  target_skill: string;
  answer_check: string;
}

export interface RubricItem {
  criterion: string;
  score: number;
  comment: string;
}

export interface CurriculumAlignment {
  selected_curriculum: string;
  standard_like_goal: string;
  allowed_methods: string[];
  notation_expectations: string;
}

export interface StructuredResult {
  title: string;
  cleaned_problem: string;
  mathematical_field: string;
  detailed_branch: string;
  topic: string;
  academic_level: string;
  problem_type: string;
  solution_mode: string;
  pdf_style: string;
  curriculum: string;
  explanation_style: string;
  required_concepts: string[];
  theorems_used: string[];
  prerequisite_knowledge: string[];
  typical_course: string;
  tags: string[];
  solution_summary: string;
  primary_solution: string;
  full_solution?: string;
  alternative_solutions: AlternativeSolution[];
  final_answer: string;
  verification_status: string;
  
  // Proof Confidence Engine
  confidence_score: number;
  confidence_label: string;
  risk_level: string;
  weak_points: string[];
  verification_method: string;
  verification_explanation: string;
  assumptions_detected: string[];
  numerical_checks: string[];
  symbolic_checks: string[];
  counterexample_search: string;
  mistake_diagnosis: MistakeDiagnosis;
  socratic_tutor: TutorPrompt[];
  evidence_checks: EvidenceCheck[];
  solver_debate: SolverDebateEntry[];
  consensus_notes: string;
  learning_profile: LearningProfile;
  teacher_dashboard: TeacherDashboard;
  generated_practice: PracticeProblem[];
  solution_quality_rubric: RubricItem[];
  curriculum_alignment: CurriculumAlignment;
  whiteboard_feedback: string;
  
  pdf_status: string;
  email_status: string;
  google_sheet_status: string;
  notes: string;
}

export interface Job {
  job_id: string;
  status: "waiting" | "running" | "success" | "error" | "review_pending" | "delivery_failed";
  progress_step: string;
  input_type: InputType;
  input_content: string;
  user_email: string;
  solution_mode?: string;
  pdf_style?: string;
  advanced_options?: AdvancedSolveOptions;
  error: string | null;
  result: StructuredResult | null;
  pdf_url: string | null;
}
