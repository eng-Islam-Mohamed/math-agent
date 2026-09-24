"use client";

import { useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, CodeXml, LoaderCircle, Printer, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";

type Result = {
  problem: string;
  tier: "small" | "medium" | "hard";
  solution: { title: string; field: string; summary: string; steps: string[]; answer: string };
  review: { correct: boolean; note: string };
};

const examples = [
  { label: "Algebra", problem: "Solve 4x + 3 = 23 for x." },
  { label: "Calculus", problem: "Find the derivative of f(x) = x^3 - 4x^2 + 2x." },
  { label: "Proof", problem: "Prove by induction that 1 + 2 + ... + n = n(n + 1)/2 for every positive integer n." },
];

export default function Home() {
  const [problem, setProblem] = useState(examples[0].problem);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function solve() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/demo/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The solver is unavailable.");
      setResult(data as Result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The solver is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-[#070b18] text-slate-100 selection:bg-indigo-500/40">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] overflow-hidden"><div className="absolute -top-64 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" /><div className="absolute right-[8%] top-36 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]" /></div>
    <div className="relative mx-auto max-w-6xl px-5 pb-20">
      <header className="flex items-center justify-between border-b border-white/10 py-6">
        <div className="flex items-center gap-3 font-semibold tracking-tight"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-300"><BrainCircuit size={21} /></div><span>Math Agent</span><span className="hidden rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-indigo-300 sm:inline">Portfolio demo</span></div>
        <a href="https://github.com/eng-Islam-Mohamed/math-agent" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><CodeXml size={17} /> <span className="hidden sm:inline">Source code</span></a>
      </header>
      <section className="grid gap-12 py-16 md:grid-cols-[1fr_0.86fr] md:items-center md:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200"><Sparkles size={13} /> A live mathematical reasoning demo</div>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">From a problem to a <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">clear solution.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">Enter a math question and inspect its steps, final answer, and independent AI review. The solver chooses a model tier based on the problem.</p>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">{[["01", "Route"], ["02", "Solve"], ["03", "Review"]].map(([number, label]) => <div key={number} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="text-xs font-semibold text-indigo-300">{number}</div><div className="mt-3 text-sm font-medium text-slate-200">{label}</div></div>)}</div>
        </div>
        <div className="rounded-[28px] border border-indigo-400/20 bg-[#11182b]/90 p-5 shadow-[0_35px_120px_rgba(0,0,0,.38)] sm:p-7">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Live workspace</div><span className="text-xs text-slate-500">Text demo</span></div>
          <label htmlFor="problem" className="mt-8 block text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Your problem</label>
          <textarea id="problem" value={problem} onChange={(event) => setProblem(event.target.value)} maxLength={800} className="mt-3 h-40 w-full resize-none rounded-2xl border border-white/10 bg-[#0a1020] p-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60" placeholder="Type a mathematical problem..." />
          <div className="mt-4 flex flex-wrap gap-2">{examples.map((example) => <button key={example.label} onClick={() => { setProblem(example.problem); setResult(null); setError(""); }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-indigo-400/50 hover:text-white">{example.label}</button>)}</div>
          <button onClick={solve} disabled={loading || problem.trim().length < 5} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={17} className="animate-spin" /> Solving and reviewing...</> : <>Solve problem <ArrowRight size={17} /></>}</button>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">Public demo · Limited requests · No email or Google account needed</p>
        </div>
      </section>
      {error && <div role="alert" className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200"><TriangleAlert size={18} className="mt-0.5 shrink-0" />{error}</div>}
      {result && <section id="result" className="mb-14 rounded-[28px] border border-white/10 bg-[#101729] p-5 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6"><div><div className="text-xs font-semibold uppercase tracking-[.15em] text-indigo-300">Generated solution · {result.tier} tier</div><h2 className="mt-2 text-2xl font-bold text-white">{result.solution.title}</h2><p className="mt-2 text-sm text-slate-400">{result.solution.field}</p></div><button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"><Printer size={15} /> Print / save PDF</button></div>
        <div className="mt-7 grid gap-8 md:grid-cols-[1fr_0.7fr]"><div><h3 className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Reasoning</h3><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{result.solution.summary}</p><ol className="mt-6 space-y-4">{result.solution.steps.map((step, index) => <li key={index} className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-semibold text-indigo-300">{index + 1}</span><span className="whitespace-pre-wrap pt-0.5 text-sm leading-6 text-slate-200">{step}</span></li>)}</ol></div>
          <div className="space-y-4"><div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-5"><h3 className="text-xs font-bold uppercase tracking-[.14em] text-indigo-300">Final answer</h3><p className="mt-3 whitespace-pre-wrap text-lg font-semibold leading-8 text-white">{result.solution.answer}</p></div><div className={`rounded-2xl border p-5 ${result.review.correct ? "border-emerald-400/20 bg-emerald-400/5" : "border-amber-400/20 bg-amber-400/5"}`}><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-slate-200">{result.review.correct ? <CheckCircle2 size={16} className="text-emerald-300" /> : <TriangleAlert size={16} className="text-amber-300" />} AI review</h3><p className="mt-3 text-sm leading-6 text-slate-300">{result.review.note}</p></div><p className="flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="shrink-0" /> AI review is not a formal mathematical proof. Check important work independently.</p></div></div>
      </section>}
      <section className="grid gap-5 border-t border-white/10 pt-10 md:grid-cols-3">{[["Tiered models", "Routine, intermediate, and proof-heavy problems are routed to different model tiers."], ["Second-pass review", "A separate review pass looks for errors and marks uncertainty instead of claiming certainty."], ["Full project", "The repository also includes the original Python workflow for image and audio input, PDFs, and optional delivery."]].map(([title, body]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}</section>
      <footer className="mt-14 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-7 text-xs text-slate-500"><span>Math Agent · Portfolio demonstration</span><span>Built by Mohamed Islam Benaboud</span></footer>
    </div>
  </main>;
}
