import React from "react";
import { Check, X, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusType = (str: string) => {
    const clean = str.toLowerCase().trim();
    if (
      clean.includes("success") ||
      clean.includes("sent successfully") ||
      clean.includes("verified")
    ) {
      return "success";
    }
    if (clean.includes("failed") || clean.includes("error")) {
      return "failed";
    }
    return "warning";
  };

  const type = getStatusType(status);

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-semibold border rounded-md uppercase tracking-wider ${
        type === "success"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : type === "failed"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
      }`}
    >
      {type === "success" && <Check size={10} />}
      {type === "failed" && <X size={10} />}
      {type === "warning" && <AlertTriangle size={10} />}
      <span className="truncate max-w-[150px]">{status || "Unknown"}</span>
    </span>
  );
}
