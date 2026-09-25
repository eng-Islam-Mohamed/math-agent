"use client";

import { useState } from "react";
import { BookOpen, Brain, ClipboardCheck, GraduationCap, PenTool } from "lucide-react";
import type { DemoResult } from "../../lib/demo-result";
import { textDirection } from "../../lib/text-direction";
import { renderMathAndText } from "./SolutionPreview";

function MathLine({ text, className = "" }: { text: string; className?: string }) {
  return <div dir={textDirection(text)} className={`multilingual-text ${className}`}>{renderMathAndText(text)}</div>;
}

export default function DemoLearningPanel({ result }: { result: DemoResult }) {
  const [visibleHints, setVisibleHints] = useState(1);
  const [openRescue, setOpenRescue] = useState<number[]>([]);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const { learning, selected } = result;

  return (
    <div className="w-full max-w-4xl space-y-5">
      <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-300"><BookOpen size={16} />Curriculum and explanation</h3>
        <p className="text-xs text-slate-400">{selected.curriculum} · {selected.explanationStyle}</p>
        <MathLine text={learning.curriculumGoal} className="text-sm text-slate-200" />
        <MathLine text={learning.methodGuidance} className="text-sm text-slate-400" />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-300"><Brain size={16} />Tutor path · {selected.tutorDepth}</h3>
        <div className="space-y-3">
          {learning.tutorHints.slice(0, visibleHints).map((hint, index) => (
            <div key={index} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-2">
              <MathLine text={`${index + 1}. ${hint.prompt}`} className="text-sm text-slate-200" />
              {openRescue.includes(index) ? <MathLine text={hint.rescueHint} className="text-xs text-blue-300" /> :
                <button type="button" className="text-xs text-blue-400 hover:text-blue-300" onClick={() => setOpenRescue([...openRescue, index])}>Show help for this hint</button>}
            </div>
          ))}
        </div>
        {visibleHints < learning.tutorHints.length && <button type="button" className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300" onClick={() => setVisibleHints(visibleHints + 1)}>Next hint</button>}
      </section>

      {selected.hasStudentAttempt && <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300"><ClipboardCheck size={16} />Student attempt diagnosis</h3>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div><p className="text-xs font-semibold text-slate-400">First wrong step</p><MathLine text={learning.firstWrongStep} className="text-slate-200" /></div>
          <div><p className="text-xs font-semibold text-slate-400">Why it happened</p><MathLine text={learning.misconception} className="text-slate-200" /></div>
          <div><p className="text-xs font-semibold text-slate-400">Corrected step</p><MathLine text={learning.correctedStep} className="text-slate-200" /></div>
          <div><p className="text-xs font-semibold text-slate-400">How to avoid it</p><MathLine text={learning.preventionTip} className="text-slate-200" /></div>
        </div>
      </section>}

      {selected.hasWhiteboardNotes && <section className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-teal-300"><PenTool size={16} />Whiteboard feedback</h3>
        <MathLine text={learning.whiteboardFeedback} className="text-sm text-slate-200" />
      </section>}

      {selected.solutionMode === "Teacher Mode" && <section className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-300"><GraduationCap size={16} />Teacher guide</h3>
        <p className="text-xs font-semibold text-slate-400">What to grade</p>
        {learning.teacherGradingFocus.map((item, index) => <MathLine key={index} text={`• ${item}`} className="text-sm text-slate-200" />)}
        <p className="text-xs font-semibold text-slate-400">Common misconceptions</p>
        {learning.teacherCommonMistakes.map((item, index) => <MathLine key={index} text={`• ${item}`} className="text-sm text-slate-200" />)}
        <p className="text-xs font-semibold text-slate-400">Discussion prompt</p>
        <MathLine text={learning.teacherDiscussionQuestion} className="text-sm text-slate-200" />
      </section>}

      <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Practice problem</h3>
        <MathLine text={learning.practiceProblem} className="text-sm text-slate-200" />
        {showPracticeAnswer ? <MathLine text={learning.practiceAnswer} className="text-sm text-emerald-300" /> :
          <button type="button" className="text-xs text-blue-400 hover:text-blue-300" onClick={() => setShowPracticeAnswer(true)}>Show practice answer</button>}
      </section>
    </div>
  );
}
