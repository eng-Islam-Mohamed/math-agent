import React from "react";

interface DifficultyBadgeProps {
  label: string;
  score?: number;
}

export default function DifficultyBadge({ label, score }: DifficultyBadgeProps) {
  const getColors = (difficulty: string) => {
    const clean = difficulty.toLowerCase().trim();
    if (clean.includes("very easy") || clean === "easy") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (clean.includes("medium")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    if (clean.includes("very hard") || clean.includes("hard")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold border rounded-full ${getColors(
        label
      )}`}
    >
      <span>{label}</span>
      {score !== undefined && (
        <span className="opacity-60 text-[10px] font-mono">({score}/5)</span>
      )}
    </span>
  );
}
