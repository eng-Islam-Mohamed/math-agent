import React from "react";
import { AlertTriangle, Brain, ClipboardCheck, Gauge, GraduationCap, PenTool, Scale, Sparkles, Users } from "lucide-react";
import { StructuredResult } from "../../lib/types";

interface AdvancedLearningPanelProps {
  result: StructuredResult;
}

function Section({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-950/60 backdrop-blur-xl border border-slate-900 rounded-xl p-5 space-y-4">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function PillList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-500">No items reported.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="text-[10px] px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function AdvancedLearningPanel({ result }: AdvancedLearningPanelProps) {
  const diagnosis = result.mistake_diagnosis;
  const learning = result.learning_profile;
  const teacher = result.teacher_dashboard;
  const alignment = result.curriculum_alignment;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Mistake Diagnosis" icon={<ClipboardCheck size={14} className="text-amber-400" />}>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p><span className="font-bold text-slate-200">First error:</span> {diagnosis?.first_error_location || "No attempt supplied."}</p>
            <p><span className="font-bold text-slate-200">Misconception:</span> {diagnosis?.misconception || "No misconception detected."}</p>
            <p><span className="font-bold text-slate-200">Corrected step:</span> {diagnosis?.corrected_step || "Use the verified derivation."}</p>
            <p className="text-emerald-300"><span className="font-bold">Prevention:</span> {diagnosis?.prevention_tip || "Check every transformation independently."}</p>
          </div>
        </Section>

        <Section title="Socratic Tutor Path" icon={<Brain size={14} className="text-blue-400" />}>
          <div className="space-y-3">
            {result.socratic_tutor?.map((item, index) => (
              <div key={`${item.prompt}-${index}`} className="border border-slate-900 bg-slate-950/40 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-200">{index + 1}. {item.prompt}</p>
                <p className="text-[11px] text-slate-400">Expected: {item.expected_student_move}</p>
                <p className="text-[11px] text-blue-300">Hint: {item.rescue_hint}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Evidence Report" icon={<Gauge size={14} className="text-emerald-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.evidence_checks?.map((check, index) => (
            <div key={`${check.label}-${index}`} className="border border-slate-900 bg-slate-950/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-200">{check.label}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900 text-slate-300">
                  {check.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{check.evidence}</p>
            </div>
          ))}
        </div>
        {result.counterexample_search && (
          <p className="flex items-start space-x-2 text-xs text-slate-400 border-t border-slate-900 pt-3">
            <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
            <span>{result.counterexample_search}</span>
          </p>
        )}
      </Section>

      <Section title="Multi-Agent Review Debate" icon={<Users size={14} className="text-indigo-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.solver_debate?.map((entry, index) => (
            <div key={`${entry.agent}-${index}`} className="border border-slate-900 bg-slate-950/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-200">{entry.agent}</p>
                <span className="text-[10px] font-mono text-blue-300">{entry.confidence}%</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{entry.position}</p>
              <p className="text-[11px] text-amber-300 leading-relaxed">{entry.concern}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">{result.consensus_notes}</p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Personal Learning Profile" icon={<GraduationCap size={14} className="text-cyan-400" />}>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Likely Strengths</p>
              <PillList items={learning?.likely_strengths} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Likely Weaknesses</p>
              <PillList items={learning?.likely_weaknesses} />
            </div>
            <p className="text-xs text-slate-300">Next: {learning?.next_best_topic || "Targeted review"}</p>
          </div>
        </Section>

        <Section title="Teacher Dashboard" icon={<Scale size={14} className="text-violet-400" />}>
          <div className="space-y-3">
            <PillList items={teacher?.grading_focus} />
            <p className="text-xs text-slate-400 leading-relaxed">{teacher?.class_discussion_prompt}</p>
            <PillList items={teacher?.common_misconceptions} />
          </div>
        </Section>
      </div>

      <Section title="Generated Practice Set" icon={<Sparkles size={14} className="text-emerald-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.generated_practice?.map((item, index) => (
            <div key={`${item.level}-${index}`} className="border border-slate-900 bg-slate-950/40 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-200">{item.level}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{item.problem}</p>
              <p className="text-[11px] text-blue-300">{item.target_skill}</p>
              <p className="text-[11px] text-slate-500">{item.answer_check}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Solution Quality Rubric" icon={<Scale size={14} className="text-amber-400" />}>
          <div className="space-y-2">
            {result.solution_quality_rubric?.map((item, index) => (
              <div key={`${item.criterion}-${index}`} className="flex items-start justify-between gap-3 border-b border-slate-900 pb-2 last:border-b-0">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{item.criterion}</p>
                  <p className="text-[11px] text-slate-500">{item.comment}</p>
                </div>
                <span className="text-xs font-mono text-blue-300">{item.score}/5</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Curriculum & Whiteboard" icon={<PenTool size={14} className="text-teal-400" />}>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p><span className="font-bold text-slate-200">Curriculum:</span> {alignment?.selected_curriculum || result.curriculum}</p>
            <p><span className="font-bold text-slate-200">Goal:</span> {alignment?.standard_like_goal}</p>
            <PillList items={alignment?.allowed_methods} />
            <p className="text-slate-400">{alignment?.notation_expectations}</p>
            <p className="text-teal-300">{result.whiteboard_feedback}</p>
          </div>
        </Section>
      </div>
    </div>
  );
}
