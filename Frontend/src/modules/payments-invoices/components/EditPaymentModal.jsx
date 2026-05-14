import React from "react";
import { createPortal } from "react-dom";
import { BsCalendarEvent, BsChatLeftText, BsCurrencyRupee, BsPencilSquare, BsWallet2 } from "react-icons/bs";
import { FiChevronDown, FiX } from "react-icons/fi";

export default function EditPaymentModal({
  editingPayment,
  onClose,
  onSubmit,
  editForm,
  setEditForm,
  updating,
  paymentModes,
}) {
  if (!editingPayment || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 flex flex-col shadow-slate-900/20" onClick={(e) => e.stopPropagation()} style={{ fontFamily: '"Inter", sans-serif' }}>
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h5 className="text-2xl font-bold text-slate-800 flex items-center gap-2">Edit Payment Details</h5>
            <p className="text-sm text-slate-500 mt-1">Update record and provide a mandatory audit reason.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all duration-300">
            <FiX size={26} />
          </button>
        </header>
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="p-8 space-y-6">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
              <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm border border-blue-50 shrink-0">
                <BsPencilSquare size={18} />
              </div>
              <div>
                <h6 className="font-bold text-sm text-blue-900 mb-0.5">Audit Log Required</h6>
                <p className="text-sm text-slate-600 leading-relaxed">Changes are permanently logged. Please ensure accuracy.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <BsCurrencyRupee size={18} />
                  </div>
                  <input type="number" className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 py-3 text-base" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required min="0" placeholder="0.00" />
                </div>
              </div>
              <div className="form-group space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Date</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <BsCalendarEvent size={18} />
                  </div>
                  <input type="date" className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 py-3 text-base" value={editForm.payment_date} onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-group space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Mode</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <BsWallet2 size={18} />
                  </div>
                  <select className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 py-3 text-base appearance-none" value={editForm.payment_mode} onChange={(e) => setEditForm({ ...editForm, payment_mode: e.target.value })} required>
                    <option value="">Select Mode</option>
                    {paymentModes.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <FiChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks (Optional)</label>
              <div className="relative group">
                <div className="absolute top-3.5 left-4 flex items-start pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <BsChatLeftText size={18} />
                </div>
                <input className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 py-3 text-base" value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Add any additional notes here..." />
              </div>
            </div>

            <div className="form-group pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Reason for Change <span className="text-red-500">*</span></span>
              </label>
              <textarea className="block w-full rounded-xl border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 py-4 px-5 min-h-[120px] text-base leading-relaxed placeholder:text-slate-400 resize-none shadow-sm" value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} placeholder="e.g., Incorrect amount entered, Date adjustment required..." required />
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-[24px]">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-600 font-semibold hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 hover:shadow-sm rounded-xl transition-all duration-200">Cancel</button>
            <button type="submit" disabled={updating} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none text-sm tracking-wide uppercase">
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <BsPencilSquare size={16} /> Update Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
