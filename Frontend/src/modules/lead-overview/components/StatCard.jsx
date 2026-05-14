import React from "react";

export default function StatCard({ title, count, total, bgColor, icon: Icon, onClick }) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

  return (
    <div
      onClick={onClick}
      className={`group relative min-h-[140px] cursor-pointer overflow-hidden rounded-xl ${bgColor} p-3 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute -bottom-4 -right-4 rotate-12 text-7xl text-white opacity-10 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
        <Icon />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
        <div className="mb-1 w-full border-b border-white/20 pb-1">
          <h3 className="text-sm font-black uppercase tracking-wide text-white drop-shadow-md">
            {title}
          </h3>
        </div>

        <div className="mb-1 flex flex-1 flex-col items-center justify-center">
          <span className="text-3xl font-black tracking-tighter text-white drop-shadow-xl filter">
            {count}
            <span className="mt-1 text-[7px] font-bold uppercase tracking-wider text-white/80">
              {" "}
              Leads
            </span>
          </span>
        </div>

        <div className="mb-1 w-full">
          <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-white/90">
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
              {percentage}% Share
            </span>
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
              {count} / {total}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/20 backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

