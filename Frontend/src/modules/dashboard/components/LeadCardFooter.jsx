import React from "react";
import { FiFacebook } from "react-icons/fi";
import { getInitials } from "../utils/dashboardLeadCardUtils";

export function LeadCardFooter({
  isMetaLead,
  unitLogo,
  assigneeName,
  assigneeProfileImage,
  /** When true, show initials only (no photo) — e.g. follow-up mascot uses the corner */
  hideAssigneePhoto = false,
}) {
  return (
    <div className="flex items-end justify-between mt-auto">
      <div className="mb-[-2px]">
        {isMetaLead ? (
          <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            <FiFacebook className="text-indigo-600" size={12} />
            <span className="text-[9px] font-black text-indigo-600 tracking-tighter uppercase">
              Ad Lead
            </span>
          </div>
        ) : (
          unitLogo
        )}
      </div>
      {!isMetaLead && (
        <div
          className="h-7 w-7 flex shrink-0 items-center justify-center rounded-full bg-[#444] text-white text-[10px] font-semibold uppercase shadow-sm relative overflow-hidden"
          title={assigneeName}
        >
          {!hideAssigneePhoto && assigneeProfileImage ? (
            <img
              src={assigneeProfileImage}
              alt={assigneeName}
              crossOrigin="use-credentials"
              loading="lazy"
              decoding="async"
              className="h-full w-full rounded-full object-cover absolute inset-0 z-10"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : null}
          <span className="relative z-0">{getInitials(assigneeName).slice(0, 2)}</span>
        </div>
      )}
    </div>
  );
}
