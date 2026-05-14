import React from "react";

export function LeadCardHotBadge() {
  return (
    <div className="absolute left-0 top-0 z-30" aria-label="Hot lead">
      <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm leading-none">
        <span aria-hidden>🔥</span>
      </div>
    </div>
  );
}
