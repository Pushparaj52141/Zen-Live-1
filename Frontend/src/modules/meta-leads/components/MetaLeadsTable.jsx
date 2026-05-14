import React from "react";
import { FiEye, FiSearch } from "react-icons/fi";

export default function MetaLeadsTable({ loading, filteredMetaLeads, openViewModal }) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full">
          <thead>
            <tr className="bg-indigo-50/50">
              {["Lead Name", "Email Address", "Phone Number", "Campaign & Source", "Status", "Date Received", "Action"].map(
                (head) => (
                  <th key={head} className="px-6 py-5 text-left text-[11px] font-black text-indigo-400 uppercase tracking-[0.15em]">
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-indigo-600 tracking-widest">DECRYPTING LEAD DATA...</p>
                  </div>
                </td>
              </tr>
            ) : filteredMetaLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <FiSearch size={32} />
                    </div>
                    <p className="text-sm font-bold text-gray-400">No leads found matching your criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMetaLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="group hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer"
                  onClick={() => openViewModal(lead.id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                      {lead.lead_name || "Anonymous"}
                    </div>
                    <div className="text-[10px] font-bold text-gray-300 tracking-wider">
                      #{lead.lead_id?.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">{lead.email || "N/A"}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-400/80">{lead.phone || "N/A"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                        {lead.campaign_source || "Unknown Ad"}
                      </span>
                      {lead.form_name && (
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 w-fit px-2 py-0.5 rounded-md border border-indigo-100">
                          {lead.form_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        lead.status === "new"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : lead.status === "converted"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : lead.status === "contacted"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">
                    {new Date(lead.created_date).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                      <FiEye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
