import React from "react";

export function LeadCardMainInfo({ lead, formattedName, isMetaLead }) {
  return (
    <div className="w-full pt-1 flex flex-col min-w-0">
      <div className="mb-0.5 flex w-[90%] items-center gap-1" title={formattedName}>
        <span className="truncate font-sans text-[15px] font-medium leading-tight text-slate-800 [font-feature-settings:normal]">
          {formattedName}
        </span>
      </div>
      <div className="space-y-[1px]">
        <p className="truncate text-[10px] font-medium text-slate-500">
          Mobile: {lead.country_code} {lead.mobile_number}
        </p>
        {isMetaLead ? (
          <p className="truncate text-[9px] font-bold text-indigo-500 uppercase mt-1">
            Campaign: {lead.course_name}
          </p>
        ) : (
          <>
            <p className="truncate text-[10px] font-medium text-slate-500">
              Course: {lead.course_name || "Course not found"}
            </p>
            <p className="truncate text-[10px] font-medium text-slate-500">
              Fee Paid: {lead.fee_paid ?? "0"} <span className="text-slate-400">|</span> Fee Bal:{" "}
              {lead.fee_balance ?? "null"}
            </p>
            <p className="truncate text-[10px] font-medium text-slate-500">
              Batch: {lead.all_batch_names || lead.batch_name || "Not Assigned"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
