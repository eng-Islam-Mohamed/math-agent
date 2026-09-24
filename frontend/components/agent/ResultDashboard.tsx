import React from "react";
import { Download, FileSpreadsheet, Mail, ShieldCheck, AlertTriangle, GraduationCap, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { StructuredResult } from "../../lib/types";
import StatusBadge from "./StatusBadge";
import { getPdfDownloadUrl } from "../../lib/api";

interface ResultDashboardProps {
  jobId: string;
  result: StructuredResult;
}

export default function ResultDashboard({ jobId, result }: ResultDashboardProps) {
  const downloadUrl = getPdfDownloadUrl(jobId);

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 stroke-emerald-400";
    if (score >= 60) return "text-amber-400 stroke-amber-400";
    return "text-red-400 stroke-red-400";
  };

  // Risk level color helper
  const getRiskBadgeStyle = (risk: string) => {
    const r = risk?.toLowerCase() || "";
    if (r.includes("low")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (r.includes("high")) return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header Summary Card */}
      <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-900 shadow-xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
              {result.problem_type}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">
              {result.solution_mode}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">{result.title}</h2>
          <p className="text-sm text-slate-400">
            {result.mathematical_field} &bull; <span className="font-mono text-xs text-blue-400">{result.detailed_branch}</span>
          </p>
        </div>

        {/* Download PDF CTA */}
        {result.pdf_status === "Success" && (
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-500/10"
          >
            <Download size={16} />
            <span>Download Solution PDF</span>
          </motion.a>
        )}
      </div>

      {/* Bento Grid Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Proof Confidence Engine */}
        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proof Confidence</span>
            <ShieldCheck size={16} className="text-blue-400" />
          </div>

          <div className="flex items-center space-x-4">
            {/* Score Ring */}
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-900"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ${getScoreColor(result.confidence_score)}`}
                  strokeDasharray={`${result.confidence_score}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-200">{result.confidence_score}%</span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{result.confidence_label} Confidence</p>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full ${getRiskBadgeStyle(result.risk_level)}`}>
                  {result.risk_level} Risk
                </span>
                <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full truncate">
                  {result.verification_method}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-900 pt-3">
            {result.verification_explanation || "No logical issues identified."}
          </p>

          {/* Weak Reasoning Points */}
          {result.weak_points && result.weak_points.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={10} className="text-amber-400" />
                <span>Verification Notes</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.weak_points.map((wp, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-red-500/5 border border-red-500/10 rounded-lg text-slate-300 font-mono block truncate max-w-full">
                    &bull; {wp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mathematical Intelligence Card */}
        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mathematical Intelligence</span>
            <GraduationCap size={16} className="text-indigo-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Topic</span>
              <p className="text-sm font-semibold text-slate-200">{result.topic || "General Formulation"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Academic Level</span>
              <p className="text-sm font-semibold text-slate-300">{result.academic_level || "Undergraduate"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Typical Course</span>
              <p className="text-sm font-semibold text-slate-300">{result.typical_course || "Pure Mathematics"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prerequisite Knowledge</span>
              <p className="text-xs text-slate-400 font-medium leading-normal">
                {result.prerequisite_knowledge && result.prerequisite_knowledge.length > 0
                  ? result.prerequisite_knowledge.join(", ")
                  : "Basic algebra and functions"}
              </p>
            </div>
          </div>

          {/* Concepts and Theorems nested inside branch intelligence */}
          <div className="space-y-3 border-t border-slate-900 pt-3">
            <div className="flex flex-wrap gap-2">
              {result.required_concepts?.map((c, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded-lg text-blue-400">
                  {c}
                </span>
              ))}
              {result.theorems_used?.map((t, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-indigo-400">
                  {t}
                </span>
              ))}
            </div>
            
            {result.tags && result.tags.length > 0 && (
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 border-t border-slate-900/50 pt-2.5">
                <Tag size={10} className="text-slate-500" />
                {result.tags.map((tag, i) => (
                  <span key={i} className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrations & Logging */}
      <div className="bg-slate-950/60 backdrop-blur-xl border border-slate-900 rounded-xl p-5 space-y-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Integrations & Archive Logger</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-900/30 border border-slate-900/80 rounded-lg">
            <Download size={16} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PDF Theme Style</p>
              <StatusBadge status={result.pdf_style || result.pdf_status} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-900/30 border border-slate-900/80 rounded-lg">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Gmail Status</p>
              <StatusBadge status={result.email_status} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-900/30 border border-slate-900/80 rounded-lg">
            <FileSpreadsheet size={16} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sheets Logging</p>
              <StatusBadge status={result.google_sheet_status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
