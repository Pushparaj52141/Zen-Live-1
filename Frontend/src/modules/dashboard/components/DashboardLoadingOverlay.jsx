import React from "react";

export function DashboardLoadingOverlay({ loading }) {
  if (!loading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/60 backdrop-blur-sm transition-all duration-500">
      <div className="flex min-w-[200px] flex-col items-center justify-center rounded-3xl bg-white px-10 py-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-slate-100 transition-all duration-300 animate-fadeIn">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-[5px] border-slate-100 border-t-blue-600 border-r-blue-600 ease-in-out"></div>
          <div
            className="absolute inset-2 rounded-full border-[4px] border-slate-100 border-b-purple-500 border-l-purple-500"
            style={{ animation: "spin 2s linear infinite reverse" }}
          ></div>
          <div className="h-2.5 w-2.5 rounded-full bg-slate-800 shadow-lg"></div>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-lg font-bold text-slate-800 tracking-tight">Just a moment</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 animate-pulse">
            Loading Data...
          </span>
        </div>
      </div>
    </div>
  );
}
