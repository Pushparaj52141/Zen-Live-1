import React from "react";

const LeadColumnHeader = React.memo(function LeadColumnHeader({
  title,
  color,
  count,
  isScrolled,
}) {
  return (
    <div
      className={`w-[220px] max-w-[220px] min-w-[220px] truncate rounded-[5px] px-2.5 py-2 text-center text-[15px] font-medium tracking-[0.02em] text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition-all duration-200 ${color} ${
        isScrolled ? "mb-0" : "mb-4"
      }`}
      title={title}
    >
      {title}({count ?? 0})
    </div>
  );
});

export default LeadColumnHeader;
