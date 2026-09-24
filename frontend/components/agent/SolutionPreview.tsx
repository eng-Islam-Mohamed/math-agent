import React, { useState } from "react";
import katex from "katex";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import "katex/dist/katex.min.css";
import { AlternativeSolution } from "../../lib/types";
import { textDirection } from "../../lib/text-direction";

interface SolutionPreviewProps {
  fullSolution: string;
  finalAnswer: string;
  summary: string;
  alternativeSolutions?: AlternativeSolution[];
}

// Shared renderer for model output and the extracted problem.
export function renderMathAndText(text: string) {
    if (!text) return null;

    let processed = text;
    processed = processed.replace(/\\\[/g, () => "$$").replace(/\\\]/g, () => "$$");
    processed = processed.replace(/\\\(/g, "$").replace(/\\\)/g, "$");
    processed = processed.replace(/(\$\$[\s\S]*?\$\$)[ \t]*[.!?،؛؟](?=\s|$)/g, "$1");

    const tokens = processed.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return tokens.map((token, index) => {
      if (token.startsWith("$$") && token.endsWith("$$")) {
        const formula = token.slice(2, -2).trim();
        try {
          const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
          return (
            <div
              key={index}
              dir="ltr"
              className="math-formula my-4 overflow-x-auto overflow-y-hidden max-w-full text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <pre key={index} className="text-red-400 text-xs my-2">{formula}</pre>;
        }
      } 
      
      if (token.startsWith("$") && token.endsWith("$")) {
        const formula = token.slice(1, -1).trim();
        try {
          const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
          return (
            <span
              key={index}
              dir="ltr"
              className="math-formula inline-block px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={index} className="text-red-400 text-xs">{formula}</code>;
        }
      }

      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed text-slate-300">
          {token}
        </span>
      );
    });
}

export default function SolutionPreview({
  fullSolution,
  finalAnswer,
  summary,
  alternativeSolutions,
}: SolutionPreviewProps) {
  const [openAltIndex, setOpenAltIndex] = useState<number | null>(null);
  const plainArabicEquation = /^\s*[\u0621-\u064A]\s*=\s*[-+\d\u0660-\u0669.,]+\s*$/u.test(finalAnswer);

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Summary Card */}
      <div className="bg-slate-950/60 backdrop-blur-xl border border-slate-900 rounded-xl p-5 md:p-6 space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Solution Summary</h3>
        <div dir={textDirection(summary)} className="multilingual-text text-sm text-slate-300 leading-relaxed">{renderMathAndText(summary)}</div>
      </div>

      {/* Full Detailed Solution */}
      <div className="bg-slate-950/60 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detailed Derivation</h3>
        <div dir={textDirection(fullSolution)} className="multilingual-text prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-2">
          {renderMathAndText(fullSolution)}
        </div>
      </div>

      {/* Final Answer Highlight Box */}
      <div className="relative bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border border-blue-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
        
        <h3 className="relative text-xs font-semibold text-blue-400 uppercase tracking-wider">Final Answer</h3>
        <div dir={plainArabicEquation ? "ltr" : textDirection(finalAnswer)} className="multilingual-text relative text-lg md:text-xl font-bold text-slate-100">
          {renderMathAndText(finalAnswer)}
        </div>
      </div>

      {/* Alternative Solutions Accordion */}
      {alternativeSolutions && alternativeSolutions.length > 0 && (
        <div className="bg-slate-950/60 backdrop-blur-xl border border-slate-900 rounded-xl p-5 md:p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alternative Solution Paths</h3>
          <div className="space-y-3">
            {alternativeSolutions.map((alt, idx) => {
              const isOpen = openAltIndex === idx;
              return (
                <div key={idx} className="border border-slate-900/80 rounded-lg overflow-hidden bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => setOpenAltIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 bg-slate-900/20 hover:bg-slate-900/40 transition text-left"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm font-bold text-slate-200">{alt.title}</span>
                        <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-semibold">
                          <Star size={10} className="fill-indigo-400" />
                          <span>Elegance: {alt.elegance_score}/10</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Method: {alt.method}</p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-slate-950/80 border-t border-slate-900 space-y-4">
                      <div className="p-3 bg-slate-900/30 border border-slate-900/50 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">When to Use</span>
                        <p className="text-xs text-slate-300">{alt.when_to_use}</p>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-2">
                        {renderMathAndText(alt.solution)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
