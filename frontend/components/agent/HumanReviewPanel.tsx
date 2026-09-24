import React, { useState } from "react";
import { Mail, FileText, CheckCircle2, FileDown, Eye, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { Job } from "../../lib/types";
import { getPdfDownloadUrl } from "../../lib/api";

interface HumanReviewPanelProps {
  job: Job;
  onApprove: (email: string, title: string, style: string) => void;
  onCancel: (email: string, title: string, style: string) => void;
  isSubmitting: boolean;
}

const PDF_STYLES = [
  { id: "Clean Academic", name: "Clean Academic" },
  { id: "Luxury Dark", name: "Luxury Dark" },
  { id: "Exam Sheet", name: "Exam Sheet" },
  { id: "Professor Notes", name: "Professor Notes" },
  { id: "Minimal LaTeX", name: "Minimal LaTeX" }
];

export default function HumanReviewPanel({
  job,
  onApprove,
  onCancel,
  isSubmitting
}: HumanReviewPanelProps) {
  const result = job.result!;
  const [title, setTitle] = useState(result.title || "Mathematical Solution");
  const [email, setEmail] = useState(job.user_email || "");
  const [pdfStyle, setPdfStyle] = useState(result.pdf_style || "Clean Academic");

  const pdfUrl = getPdfDownloadUrl(job.job_id, pdfStyle);

  return (
    <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-900 shadow-2xl rounded-2xl p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-900 pb-4">
        <h3 className="text-lg font-bold text-slate-200">Human Verification Step</h3>
        <p className="text-xs text-slate-400">Review solution outputs and metadata before finalizing delivery</p>
      </div>

      <div className="space-y-4">
        {/* Title Editor */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <FileText size={12} />
            <span>Problem Title / Subject</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 focus:border-blue-500/50 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 font-medium"
          />
        </div>

        {/* Email Editor */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Mail size={12} />
            <span>Recipient Email Address</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="islambenaboud007@gmail.com"
            className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 focus:border-blue-500/50 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300"
          />
        </div>

        {/* PDF Style Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Palette size={12} />
            <span>PDF Export Theme Style</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PDF_STYLES.map((style) => {
              const isSelected = pdfStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setPdfStyle(style.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-slate-900 bg-slate-900/10 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {style.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview File section */}
        <div className="p-4 bg-slate-900/30 border border-slate-900/80 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300">PDF Report Document</h4>
            <p className="text-[10px] text-slate-500">View generated mathematical proof and KaTeX formulas</p>
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition"
          >
            <Eye size={12} />
            <span>Preview PDF</span>
          </a>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-slate-900">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onApprove(email, title, pdfStyle)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>{isSubmitting ? "Processing..." : "Approve & Send Email"}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onCancel(email, title, pdfStyle)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center space-x-2 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold rounded-xl transition"
        >
          <FileDown size={16} />
          <span>Download PDF & Log (Skip Email)</span>
        </motion.button>
      </div>
    </div>
  );
}
