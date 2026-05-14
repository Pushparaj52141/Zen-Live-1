import React from "react";
import { FaLayerGroup } from "react-icons/fa";

export default function LeadOverviewSummary({ totalLeads }) {
  return (
    <div className="relative min-w-[260px] cursor-default overflow-hidden rounded-xl border border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-3 text-white shadow-lg shadow-gray-900/20 transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="absolute right-0 top-0 -mr-2 -mt-2 h-20 w-20 rounded-full bg-white/5 blur-xl" />
      <div className="absolute bottom-0 left-0 -mb-2 -ml-2 h-20 w-20 rounded-full bg-black/20 blur-xl" />

      <div className="relative flex items-center justify-between gap-6">
        <div>
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Total Leads
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white">{totalLeads}</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-inner backdrop-blur-md">
          <FaLayerGroup className="text-lg text-white drop-shadow-md" />
        </div>
      </div>
    </div>
  );
}

