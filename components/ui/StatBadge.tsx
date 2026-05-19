import React from "react";

interface StatBadgeProps {
  className?: string;
}

export default function StatBadge({ className = "" }: StatBadgeProps) {
  return (
    <span 
      className={`bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse tracking-wide hover:shadow-red-400/50 cursor-default flex items-center justify-center gap-1 transition-shadow duration-200 ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        warning
      </span>
      STAT
    </span>
  );
}
