import React from "react";

export function LeadCardTimePill({ timeSpanClass, isMetaLead, timeText }) {
  return (
    <div className="absolute right-[10px] top-2 z-10">
      <span
        className={`time inline-flex items-center rounded-sm px-2 py-[3px] text-[8px] leading-none text-white ${timeSpanClass}`}
      >
        {isMetaLead ? "META" : timeText}
      </span>
    </div>
  );
}
