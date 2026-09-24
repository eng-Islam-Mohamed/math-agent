"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { AdvancedSolveOptions, InputType, Job } from "../lib/types";
import { submitSolveJob, pollJobStatus, approveEmail, cancelEmail } from "../lib/api";

import AgentInputCard from "../components/agent/AgentInputCard";
import WorkflowTimeline from "../components/agent/WorkflowTimeline";
import ResultDashboard from "../components/agent/ResultDashboard";
import SolutionPreview from "../components/agent/SolutionPreview";
import HumanReviewPanel from "../components/agent/HumanReviewPanel";
import AdvancedLearningPanel from "../components/agent/AdvancedLearningPanel";
import { Boxes } from "../components/ui/background-boxes";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for job updates
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const updatedJob = await pollJobStatus(jobId);
        setJob(updatedJob);

        if (updatedJob.status === "success" || updatedJob.status === "error" || updatedJob.status === "delivery_failed") {
          setIsLoading(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to retrieve solver status."));
        setIsLoading(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    // Run first check immediately
    poll();

    // Setup interval for subsequent checks (every 1.5 seconds)
    pollIntervalRef.current = setInterval(poll, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [jobId]);

  const handleSolve = async (
    type: InputType,
    content: string,
    email: string,
    file: File | null,
    solutionMode: string,
    pdfStyle: string,
    advancedOptions: AdvancedSolveOptions
  ) => {
    setIsLoading(true);
    setError(null);
    setJob(null);
    setJobId(null);

    try {
      const response = await submitSolveJob(type, content, email, file, solutionMode, pdfStyle, advancedOptions);
      setJobId(response.job_id);
      
      // Initialize a temporary local state for visual feedback
      setJob({
        job_id: response.job_id,
        status: "waiting",
        progress_step: "input_received",
        input_type: type,
        input_content: content,
        user_email: email,
        solution_mode: solutionMode,
        pdf_style: pdfStyle,
        advanced_options: advancedOptions,
        error: null,
        result: null,
        pdf_url: null
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit mathematical problem to agent."));
      setIsLoading(false);
    }
  };

  const handleApproveEmail = async (emailAddress: string, titleOverwrite: string, pdfStyle: string) => {
    if (!jobId) return;
    setIsReviewSubmitting(true);
    setError(null);
    try {
      await approveEmail(jobId, emailAddress, titleOverwrite, pdfStyle);
      setJob((current) => current ? { ...current, status: "running", progress_step: "sending_email" } : current);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to approve and send email."));
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleCancelEmail = async (emailAddress: string, titleOverwrite: string, pdfStyle: string) => {
    if (!jobId) return;
    setIsReviewSubmitting(true);
    setError(null);
    try {
      await cancelEmail(jobId, emailAddress, titleOverwrite, pdfStyle);
      setJob((current) => current ? { ...current, status: "running", progress_step: "logging_to_google_sheets" } : current);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to finalize download-only flow."));
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleReset = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setJobId(null);
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-start px-4 py-12 md:py-24 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-20 pointer-events-none"
      >
        <source src="/Videobackground.mp4" type="video/mp4" />
      </video>

      {/* Background Boxes Overlay */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden mix-blend-overlay">
        <Boxes />
      </div>

      {/* Container */}
      <div className="w-full max-w-4xl flex flex-col items-center space-y-12 z-10 pointer-events-none">
        {/* Header Hero Section */}
        <div className="text-center space-y-4 max-w-2xl pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-blue-400 font-medium tracking-wide uppercase"
          >
            <Compass size={12} className="animate-spin" />
            <span>AI Mathematical Laboratory</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent"
          >
            Maths AI Agent
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-slate-400 font-medium"
          >
            Submit your math problem. Get a formal step-by-step LaTeX solution, verified with SymPy, logged to Google Sheets, and delivered as a professional PDF.
          </motion.p>
        </div>

        {/* Global Error Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 pointer-events-auto"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Workflow Error</p>
              <p className="text-slate-400 leading-relaxed text-xs">{error}</p>
              <button
                onClick={handleReset}
                className="mt-2 text-xs font-semibold text-red-400 underline hover:text-red-300"
              >
                Clear and try again
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Interface Logic */}
        <div className="w-full flex flex-col items-center space-y-8 pointer-events-auto">
          <AnimatePresence mode="wait">
            {/* Input phase */}
            {!jobId && (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex justify-center"
              >
                <AgentInputCard onSolve={handleSolve} isLoading={isLoading} />
              </motion.div>
            )}

            {/* Processing phase (Waiting or Running) */}
            {jobId && job && (job.status === "waiting" || job.status === "running") && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                <WorkflowTimeline
                  currentStep={job.progress_step}
                  jobStatus={job.status}
                  inputType={job.input_type}
                />
              </motion.div>
            )}

            {/* Error state at node execution */}
            {jobId && job && job.status === "error" && (
              <motion.div
                key="node-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                <div className="w-full max-w-2xl bg-slate-950/80 border border-slate-900 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
                  <div className="p-3 bg-red-500/10 rounded-full text-red-400 border border-red-500/20">
                    <AlertCircle size={28} className="animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-200">Execution Blocked</h3>
                    <p className="text-sm text-slate-400 max-w-md">
                      The workflow halted at step: <span className="font-mono text-blue-400">{job.progress_step}</span>
                    </p>
                  </div>
                  <pre className="w-full bg-slate-900 border border-slate-800 text-red-400 text-xs p-4 rounded-xl max-h-40 overflow-y-auto whitespace-pre-wrap font-mono text-left">
                    {job.error}
                  </pre>
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition"
                  >
                    <RefreshCw size={14} />
                    <span>Reset & Try Again</span>
                  </button>
                </div>

                <WorkflowTimeline
                  currentStep={job.progress_step}
                  jobStatus="error"
                  inputType={job.input_type}
                />
              </motion.div>
            )}

            {/* Review Pending State */}
            {jobId && job && job.status === "review_pending" && job.result && (
              <motion.div
                key="review-panel-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center space-y-8"
              >
                <WorkflowTimeline
                  currentStep={job.progress_step}
                  jobStatus="running"
                  inputType={job.input_type}
                />
                
                <HumanReviewPanel
                  job={job}
                  onApprove={handleApproveEmail}
                  onCancel={handleCancelEmail}
                  isSubmitting={isReviewSubmitting}
                />
              </motion.div>
            )}

            {/* Success state */}
            {jobId && job && (job.status === "success" || job.status === "delivery_failed") && job.result && (
              <motion.div
                key="success-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center space-y-8"
              >
                {/* Reset header button */}
                <div className="w-full max-w-4xl flex justify-end">
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    <RefreshCw size={12} />
                    <span>Solve Another Problem</span>
                  </button>
                </div>

                {/* Dashboard Results (Bento box) */}
                {job.status === "delivery_failed" && (
                  <div role="alert" className="w-full max-w-4xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
                    <p className="font-semibold">Solution ready; delivery needs attention.</p>
                    <p>{job.error}</p>
                    <p className="mt-1">Email: {job.result.email_status}. Sheets: {job.result.google_sheet_status}.</p>
                  </div>
                )}
                <ResultDashboard jobId={job.job_id} result={job.result} />

                {/* Solution Preview */}
                <SolutionPreview
                  fullSolution={job.result.primary_solution || job.result.full_solution || ""}
                  finalAnswer={job.result.final_answer}
                  summary={job.result.solution_summary}
                  alternativeSolutions={job.result.alternative_solutions}
                />

                <AdvancedLearningPanel result={job.result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
