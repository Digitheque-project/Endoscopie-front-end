import React from "react";

interface StatBadgeProps {
  className?: string;
}

export default function StatBadge({ className = "" }: StatBadgeProps) {
  return (
    <span
      className={`bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse tracking-normal whitespace-nowrap hover:shadow-red-400/50 cursor-default flex items-center justify-center gap-1 transition-shadow duration-200 ${className}`}
    >
      <span className="material-symbols-outlined text-[12px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
        warning
      </span>
      TRES URGENT
    </span>
  );
}
