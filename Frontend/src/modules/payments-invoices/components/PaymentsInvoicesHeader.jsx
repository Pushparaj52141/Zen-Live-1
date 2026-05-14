import React from "react";
import { BsCashCoin, BsDownload } from "react-icons/bs";
import { BiFilterAlt } from "react-icons/bi";

export default function PaymentsInvoicesHeader({ onRecordPayment, onOpenFilters, onExport }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6 flex flex-col items-start gap-3">
        <h4 className="text-xl font-semibold text-slate-900">Payment Records &amp; Invoices</h4>
        <button className="record-btn" onClick={onRecordPayment}>
          <BsCashCoin /> Record Student Payment
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6 flex items-center justify-center gap-3">
        <button
          className="btn-filter px-5 py-2 rounded text-xs font-semibold flex items-center gap-1"
          onClick={onOpenFilters}
          type="button"
          title="Open Filters"
        >
          <BiFilterAlt /> Filters
        </button>
        <button className="btn-export px-5 py-2 rounded text-xs font-semibold flex items-center gap-1" onClick={onExport} type="button">
          <BsDownload /> Export to Excel
        </button>
      </div>
    </div>
  );
}
