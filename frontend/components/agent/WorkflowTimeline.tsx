import React from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StepStatus } from "../../lib/types";

interface Step {
  id: string;
  name: string;
  desc: string;
}

interface WorkflowTimelineProps {
  currentStep: string;
  jobStatus: "waiting" | "running" | "success" | "error";
  inputType: "text" | "image" | "audio";
}

const STEPS: Step[] = [
  { id: "input_received", name: "Input Received", desc: "Routing problem and validating payload" },
  { id: "gemini_extracting", name: "Gemini OCR & Audio Extraction", desc: "Translating image/audio into mathematical text" },
  { id: "gemini_done", name: "Gemini Done", desc: "Mathematical text successfully extracted" },
  { id: "cleaning_problem", name: "Cleaning Problem", desc: "Standardizing text and equations for solver" },
  { id: "solving_problem", name: "Model Solver", desc: "Solving with a model selected for this problem's complexity" },
  { id: "verifying_solution", name: "Proof Confidence & Verification", desc: "Verifying logic and algebraic equations with SymPy" },
  { id: "classifying_problem", name: "Mathematical Intelligence Classifier", desc: "Categorizing fields, branch details, and prerequisites" },
  { id: "generating_pdf", name: "KaTeX PDF Engine", desc: "Compiling LaTeX math and rendering PDF" },
  { id: "review_pending", name: "Human Review Pending", desc: "Reviewing title, email, and PDF style settings" },
  { id: "sending_email", name: "Gmail Dispatcher", desc: "Sending mathematical PDF report to recipient" },
  { id: "logging_to_google_sheets", name: "Google Sheets Logger", desc: "Logging metadata to centralized spreadsheet" }
];

const STEP_ORDER = [
  "input_received",
  "gemini_extracting",
  "gemini_done",
  "cleaning_problem",
  "solving_problem",
  "verifying_solution",
  "classifying_problem",
  "generating_pdf",
  "review_pending",
  "sending_email",
  "logging_to_google_sheets",
  "completed"
];

export default function WorkflowTimeline({
  currentStep,
  jobStatus,
  inputType,
}: WorkflowTimelineProps) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  const getStepStatus = (stepId: string): StepStatus | "skipped" => {
    // If input is text, gemini_extracting and gemini_done are skipped
    if ((stepId === "gemini_extracting" || stepId === "gemini_done") && inputType === "text") {
      return "skipped";
    }

    const stepIdx = STEP_ORDER.indexOf(stepId);

    if (jobStatus === "success") {
      return "success";
    }

    if (jobStatus === "error" && stepId === currentStep) {
      return "error";
    }

    if (stepIdx < currentIdx) {
      // Handled exception: if gemini was skipped, it remains skipped
      if ((stepId === "gemini_extracting" || stepId === "gemini_done") && inputType === "text") return "skipped";
      return "success";
    }

    if (stepIdx === currentIdx) {
      if (jobStatus === "running") return "running";
      if (jobStatus === "waiting") return "waiting";
    }

    return "waiting";
  };

  return (
    <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-900 shadow-xl rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-200">Execution Pipeline</h3>
          <p className="text-xs text-slate-400">Track agent operations in real-time</p>
        </div>
        <div className="text-xs font-mono font-medium px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-blue-400 capitalize">
          {jobStatus}
        </div>
      </div>

      <div className="relative pl-8 space-y-6 border-l border-slate-900 ml-4 py-2">
        <AnimatePresence>
          {STEPS.map((step, idx) => {
            const status = getStepStatus(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative flex flex-col md:flex-row md:items-start justify-between gap-2 transition-all duration-300 ${
                  status === "waiting"
                    ? "opacity-40"
                    : status === "skipped"
                    ? "opacity-30 line-through"
                    : "opacity-100"
                }`}
              >
                {/* Node Status Indicator Bullet */}
                <div className="absolute -left-[45px] top-1 z-10 flex items-center justify-center bg-slate-950 p-1 rounded-full">
                  {status === "success" && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  )}
                  {status === "running" && (
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  )}
                  {status === "error" && (
                    <XCircle className="w-6 h-6 text-red-400 animate-bounce" />
                  )}
                  {status === "waiting" && (
                    <Circle className="w-6 h-6 text-slate-700" />
                  )}
                  {status === "skipped" && (
                    <div className="w-6 h-6 border-2 border-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                      -
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h4
                    className={`text-sm font-semibold transition-all ${
                      status === "running"
                        ? "text-blue-400"
                        : status === "error"
                        ? "text-red-400"
                        : status === "success"
                        ? "text-emerald-400"
                        : "text-slate-300"
                    }`}
                  >
                    {step.name}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">{step.desc}</p>
                </div>

                {/* Additional Step Info for visual feedback */}
                {status === "running" && (
                  <span className="text-[10px] text-blue-400/80 animate-pulse font-mono md:self-center">
                    Processing...
                  </span>
                )}
                {status === "skipped" && (
                  <span className="text-[10px] text-slate-600 font-mono md:self-center">
                    Skipped
                  </span>
                )}
                {status === "success" && (
                  <span className="text-[10px] text-emerald-500 font-mono md:self-center">
                    Done
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
