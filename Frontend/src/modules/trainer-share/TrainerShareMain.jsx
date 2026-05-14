import React from 'react'
import { useLocation } from 'react-router-dom'
import Select from 'react-select'
import { BiFilterAlt, BiEnvelope, BiPencil, BiCheck, BiX } from 'react-icons/bi'
import { getPageColors } from '@shared/utils/pageColors'
import {
  paymentPeriodOptions,
  statusOptions,
} from './constants/trainerShareConstants'
import { discountedTotalWithGst } from '@shared/utils/feeGst'
import {
  formatCurrency,
  formatDisplayDate,
  useTrainerShareController,
} from './hooks/useTrainerShareController'

const selectMenuPortalTarget = typeof document !== 'undefined' ? document.body : null

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#fff',
    borderColor: state.isFocused ? '#2563eb' : '#d1d5da',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(37,99,235,0.2)' : 'none',
    minHeight: '24px',
    borderRadius: '6px',
    fontSize: '11px',
    minWidth: 0,
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#003e9c',
    borderRadius: '999px',
    paddingInline: '6px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#fff',
    fontWeight: 500,
    fontSize: '10px',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#fff',
    ':hover': {
      backgroundColor: 'transparent',
      color: '#d1d5db',
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999, fontSize: '11px' }),
  option: (base) => ({ ...base, fontSize: '11px', padding: '4px 8px' }),
  placeholder: (base) => ({ ...base, fontSize: '11px', color: '#94a3b8' }),
  singleValue: (base) => ({ ...base, fontSize: '11px' }),
  input: (base) => ({ ...base, fontSize: '11px' }),
}

export default function TrainerShareMain() {
  const location = useLocation()
  const colors = getPageColors(location.pathname)
  const {
    filteredPayouts,
    filters,
    setFilters,
    loading,
    updatingPayoutId,
    sendingEmails,
    editingPayoutId,
    editingStatus,
    setEditingStatus,
    batchOptions,
    trainerOptions,
    summary,
    handleMultiSelectChange,
    applyFilters,
    handleResetFilters,
    handleEditClick,
    handleOkClick,
    handleCloseClick,
    handleSendEmails,
  } = useTrainerShareController()

  const isApplyDisabled =
    filters.paymentPeriod === 'custom' && (!filters.customDateFrom || !filters.customDateTo)

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
      <div className="max-w-[1500px] mx-auto space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <header className="px-3 py-2 border-b border-slate-200 flex items-center gap-2 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.2em]">
          <BiFilterAlt className="text-slate-500" size={16} />
          Filters
        </header>
        <div className="p-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Batch</label>
              <Select
                isMulti
                isClearable
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                options={batchOptions}
                placeholder="Select batches..."
                value={batchOptions.filter((option) => filters.batches.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('batches', selected)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                noOptionsMessage={() => 'No batches found'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Trainer</label>
              <Select
                isMulti
                isClearable
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                options={trainerOptions}
                placeholder="Select trainers..."
                value={trainerOptions.filter((option) => filters.trainers.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('trainers', selected)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                noOptionsMessage={() => 'No trainers found'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Status</label>
              <Select
                isMulti
                isClearable
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                options={statusOptions}
                placeholder="Select statuses..."
                value={statusOptions.filter((option) => filters.statuses.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('statuses', selected)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                noOptionsMessage={() => 'No statuses found'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Payment Period
              </label>
              <Select
                styles={selectStyles}
                classNamePrefix="react-select"
                options={paymentPeriodOptions}
                placeholder="Select period..."
                value={paymentPeriodOptions.find((opt) => opt.value === filters.paymentPeriod)}
                onChange={(selected) => {
                   const value = selected ? selected.value : '';
                   setFilters((prev) => ({
                     ...prev,
                     paymentPeriod: value,
                     customDateFrom: value === 'custom' ? prev.customDateFrom : '',
                     customDateTo: value === 'custom' ? prev.customDateTo : '',
                   }))
                }}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                isSearchable={false}
              />
            </div>
          </div>

          {filters.paymentPeriod === 'custom' && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Date From
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none transition"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                  value={filters.customDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customDateFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Date To
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none transition"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                  value={filters.customDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customDateTo: e.target.value,
                    }))
                  }
                  min={filters.customDateFrom || undefined}
                />
              </div>
              <p className="text-[10px] text-slate-500 md:self-end">
                Pick a date range to show payouts recorded between these dates.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={isApplyDisabled}
              className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.primary;
              }}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSendEmails}
              disabled={sendingEmails}
              className="inline-flex items-center gap-1 rounded bg-pink-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
            >
              <BiEnvelope />
              {sendingEmails ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
        <div className="table-responsive max-h-[70vh] overflow-y-auto overflow-x-hidden">
          <table
            className="w-full text-xs text-slate-800"
            style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}
          >
            <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                {[
                  '#',
                  'Installment ID',
                  'Installments',
                  'Student Name',
                  'Batch',
                  'Trainer Name',
                  'OG Fee (₹)',
                  'Paid Fee (₹)',
                  'Share %',
                  'Trainer Share (₹)',
                  'Status',
                  'Paid On',
                  'Action',
                ].map((heading) => (
                  <th key={heading} className="px-1 py-2 text-left font-medium border-r border-slate-200 last:border-r-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-3 py-5 text-center text-slate-500 border-b border-slate-200">
                    Loading trainer payouts…
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-5 text-center text-slate-500 border-b border-slate-200">
                    No trainer payouts match your filters.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout, index) => {
                  const currentStatus = payout.status || 'Pending'
                  return (
                    <tr
                      key={`${payout.payout_id}-${index}`}
                      className="bg-white shadow-sm border border-slate-200 rounded-xl hover:shadow transition-shadow"
                    >
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">{index + 1}</td>
                      <td className="px-2 py-2 text-slate-800 border-r border-slate-100">{payout.installment_id}</td>
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">{payout.installment_count}</td>
                      <td className="px-2 py-2 text-slate-900 border-r border-slate-100">{payout.student_name}</td>
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">{payout.batch_name || '-'}</td>
                      <td className="px-2 py-2 text-slate-700 border-r border-slate-100">
                        <div>{payout.trainer_name || '-'}</div>
                        {Boolean(
                          payout.sub_course_name &&
                            payout.sub_course_name.trim() &&
                            (!payout.course_name ||
                              payout.sub_course_name.trim().toLowerCase() !== payout.course_name.trim().toLowerCase())
                        ) && (
                          <div className="text-[11px] text-slate-500">{payout.sub_course_name}</div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">
                        {formatCurrency(
                          discountedTotalWithGst(payout.discounted_fee) ??
                            payout.discounted_fee
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">{formatCurrency(payout.paid_amount)}</td>
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">
                        {payout.sub_course_share != null ? `${Number(payout.sub_course_share).toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-2 py-2 text-slate-900 border-r border-slate-100">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-2 py-2 border-r border-slate-100">
                        <select
                          value={editingPayoutId === payout.payout_id ? editingStatus : currentStatus}
                          onChange={(e) => setEditingStatus(e.target.value)}
                          disabled={editingPayoutId !== payout.payout_id || updatingPayoutId === payout.payout_id}
                          className={`rounded-md border px-1 py-1 text-[10px] font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 ${
                            (editingPayoutId === payout.payout_id ? editingStatus : currentStatus) === 'Paid'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
                              : (editingPayoutId === payout.payout_id ? editingStatus : currentStatus) === 'On Hold'
                              ? 'border-amber-100 bg-amber-50 text-amber-700 focus:ring-amber-200'
                              : 'border-rose-100 bg-rose-50 text-rose-700 focus:ring-rose-200'
                          }`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2 text-slate-600 border-r border-slate-100">
                        {currentStatus === 'Paid'
                          ? formatDisplayDate(payout.paid_on || payout.payment_date)
                          : '-'
                        }
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          {editingPayoutId === payout.payout_id ? (
                            <>
                              <button
                                type="button"
                                title="Save changes"
                                onClick={() => handleOkClick(payout)}
                                disabled={updatingPayoutId === payout.payout_id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                              >
                                <BiCheck size={16} />
                              </button>
                              <button
                                type="button"
                                title="Cancel editing"
                                onClick={handleCloseClick}
                                disabled={updatingPayoutId === payout.payout_id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-500 text-white hover:bg-slate-600 disabled:opacity-40 transition-colors"
                              >
                                <BiX size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              title="Edit status"
                              onClick={() => handleEditClick(payout)}
                              disabled={updatingPayoutId === payout.payout_id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                            >
                              <BiPencil size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.15em]">
          Trainer Payment Summary
        </h2>
        <div className="space-y-2">
          {[
            { label: 'Total Paid (₹)', value: summary?.paid || 0, accent: 'text-blue-600' },
            { label: 'Pending (₹)', value: summary?.pending || 0, accent: 'text-rose-600' },
            { label: 'On Hold (₹)', value: summary?.onHold || 0, accent: 'text-amber-600' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
            >
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className={`font-semibold ${item.accent}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
