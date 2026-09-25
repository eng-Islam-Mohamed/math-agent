import type { InputType } from "./types";

export type DemoMode =
  | "Exam Mode"
  | "Full Explanation Mode"
  | "Proof Mode"
  | "Research Style Mode"
  | "Teacher Mode"
  | "Fast Answer Mode"
  | "Mistake Diagnosis Mode"
  | "Socratic Tutor Mode";

export type TutorHint = { prompt: string; rescueHint: string };

export type DemoLearning = {
  curriculumGoal: string;
  methodGuidance: string;
  tutorHints: TutorHint[];
  firstWrongStep: string;
  misconception: string;
  correctedStep: string;
  preventionTip: string;
  whiteboardFeedback: string;
  teacherGradingFocus: string[];
  teacherCommonMistakes: string[];
  teacherDiscussionQuestion: string;
  practiceProblem: string;
  practiceAnswer: string;
};

export type DemoResult = {
  inputType: InputType;
  cleanedProblem: string;
  tier: "small" | "medium" | "hard";
  selected: {
    solutionMode: DemoMode;
    curriculum: string;
    explanationStyle: string;
    tutorDepth: string;
    hasStudentAttempt: boolean;
    hasWhiteboardNotes: boolean;
  };
  solution: { title: string; field: string; summary: string; steps: string[]; answer: string };
  learning: DemoLearning;
  review: { correct: boolean; note: string };
};
