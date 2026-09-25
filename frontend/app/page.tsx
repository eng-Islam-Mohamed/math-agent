"use client";

import { useState } from "react";
import { AlertCircle, BrainCircuit, CheckCircle2, Compass, FileDown, RefreshCw, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import AgentInputCard from "../components/agent/AgentInputCard";
import DemoLearningPanel from "../components/agent/DemoLearningPanel";
import SolutionPreview, { renderMathAndText } from "../components/agent/SolutionPreview";
import { Boxes } from "../components/ui/background-boxes";
import { AdvancedSolveOptions, InputType } from "../lib/types";
import { textDirection } from "../lib/text-direction";
import type { DemoResult } from "../lib/demo-result";
import { downloadSolutionPdf } from "../lib/download-solution-pdf";

export default function Home() {
  const [result, setResult] = useState<DemoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showFastSteps, setShowFastSteps] = useState(false);
  const [error, setError] = useState("");

  async function solve(
    type: InputType,
    content: string,
    _email: string,
    file: File | null,
    solutionMode: string,
    _pdfStyle: string,
    options: AdvancedSolveOptions,
  ) {
    void _email;
    void _pdfStyle;
    setLoading(true);
    setError("");
    setResult(null);
    setShowSolution(false);
    setShowFastSteps(false);
    try {
      const form = new FormData();
      form.set("type", type);
      form.set("problem", type === "text" ? content : "");
      form.set("solutionMode", solutionMode);
      form.set("curriculum", options.curriculum);
      form.set("explanationStyle", options.explanationStyle);
      form.set("tutorDepth", options.tutorDepth);
      form.set("studentAttempt", options.studentAttempt);
      form.set("whiteboardNotes", options.whiteboardNotes);
      if (file) form.set("file", file);
      const response = await fetch("/api/demo/solve", { method: "POST", body: form });
      const data = await response.json();
      if (response.status === 403 || response.status === 429) {
        throw new Error("Public demo limit reached. Please try again in ten minutes.");
      }
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "The solver is unavailable.");
      setResult(data as DemoResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The solver is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function savePdf() {
    if (!result || downloadingPdf) return;
    setDownloadingPdf(true);
    setError("");
    try {
      await downloadSolutionPdf(result);
    } catch {
      setError("Could not create the PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-start overflow-hidden px-4 py-12 md:py-24">
      <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      <video autoPlay loop muted playsInline className="screen-backdrop pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-20">
        <source src="/Videobackground.mp4" type="video/mp4" />
      </video>
      <div className="screen-backdrop absolute inset-0 z-0 overflow-hidden mix-blend-overlay"><Boxes /></div>

      <div className="pointer-events-none z-10 flex w-full max-w-4xl flex-col items-center space-y-10">
        <header className="pointer-events-auto max-w-2xl space-y-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-400">
            <Compass size={12} className="animate-spin" /><span>AI Mathematical Laboratory</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl lg:text-6xl">
            Maths AI Agent
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm font-medium text-slate-400 md:text-base">
            Submit a written problem, a photo, or a voice memo. Get a step-by-step solution and a separate AI review.
          </motion.p>
          <p className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-xs text-slate-400">
            Public portfolio version · 3 solves per IP every 10 minutes · No account required · Email and Google Sheets delivery are available in the local project only
          </p>
        </header>

        {error && <div role="alert" className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={18} className="shrink-0" />{error}</div>}

        {!result && !loading && <div className="pointer-events-auto flex w-full justify-center"><AgentInputCard onSolve={solve} isLoading={loading} /></div>}
        {loading && <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-4 rounded-2xl border border-slate-900 bg-slate-950/80 p-8 shadow-xl"><BrainCircuit className="animate-pulse text-blue-400" size={28} /><div><p className="font-semibold text-slate-200">Reading and solving your problem</p><p className="mt-1 text-sm text-slate-400">Photo and voice inputs are extracted first. The answer then receives a separate AI review.</p></div></div>}

        {result && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-auto flex w-full flex-col items-center gap-7 print-result">
          <div className="flex w-full max-w-4xl items-center justify-between gap-3 print:hidden">
            <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">{result.inputType} input · {result.tier} tier · {result.selected.solutionMode}</span>
            <button onClick={() => setResult(null)} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"><RefreshCw size={13} />Solve another problem</button>
          </div>
          <div className="w-full max-w-4xl space-y-5 rounded-2xl border border-slate-900 bg-slate-950/80 p-6 shadow-xl md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1"><p dir={textDirection(result.solution.field)} className="multilingual-text text-xs font-bold uppercase tracking-wider text-blue-400">{result.solution.field}</p><div role="heading" aria-level={2} dir={textDirection(result.solution.title)} className="multilingual-text mt-2 text-xl font-bold text-slate-100">{renderMathAndText(result.solution.title)}</div></div>
              <button onClick={savePdf} disabled={downloadingPdf} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 print:hidden"><FileDown size={15} />{downloadingPdf ? "Creating PDF…" : "Save as PDF"}</button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Problem read from your input</p><div dir={textDirection(result.cleanedProblem)} className="multilingual-text mt-2 whitespace-pre-wrap text-sm text-slate-200">{renderMathAndText(result.cleanedProblem)}</div></div>
          </div>
          {result.selected.solutionMode === "Socratic Tutor Mode" && <DemoLearningPanel result={result} />}
          {result.selected.solutionMode === "Socratic Tutor Mode" && !showSolution ?
            <div className="w-full max-w-4xl rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center space-y-3"><p className="text-sm text-slate-300">Work through the tutor hints first. Your solution is ready when you choose to reveal it.</p><button type="button" onClick={() => setShowSolution(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Reveal full solution</button></div> :
            <SolutionPreview fullSolution={result.solution.steps.map((step, i) => `${i + 1}. ${step}`).join("\n\n")} finalAnswer={result.solution.answer} summary={result.solution.summary} showDerivation={result.selected.solutionMode !== "Fast Answer Mode" || showFastSteps} />}
          {result.selected.solutionMode === "Fast Answer Mode" && !showFastSteps && <button type="button" onClick={() => setShowFastSteps(true)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200">Show supporting steps</button>}
          {result.selected.solutionMode !== "Socratic Tutor Mode" && <DemoLearningPanel result={result} />}
          <div className={`flex w-full max-w-4xl items-start gap-3 rounded-xl border p-5 ${result.review.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
            {result.review.correct ? <CheckCircle2 className="shrink-0 text-emerald-400" size={19} /> : <ShieldAlert className="shrink-0 text-amber-400" size={19} />}
            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-200">Independent AI review</h3><div dir={textDirection(result.review.note)} className="multilingual-text mt-1 text-sm text-slate-400">{renderMathAndText(result.review.note)}</div><p className="mt-2 text-xs text-slate-500">AI review is not a formal proof. Check important work independently.</p></div>
          </div>
        </motion.div>}
      </div>
    </main>
  );
}
