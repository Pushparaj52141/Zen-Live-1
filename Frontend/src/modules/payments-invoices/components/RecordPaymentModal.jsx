import React from "react";
import { createPortal } from "react-dom";
import {
  BsCalendarEvent,
  BsCashStack,
  BsChatLeftText,
  BsClockHistory,
  BsCreditCard,
  BsCurrencyRupee,
  BsPersonBadge,
  BsWallet2,
  BsPencilSquare,
  BsTrash,
} from "react-icons/bs";
import { FiX } from "react-icons/fi";
import { BiSearch } from "react-icons/bi";

export default function RecordPaymentModal({
  isOpen,
  onClose,
  initialFeeSummary,
  leadSearch,
  setLeadSearch,
  leadOptionsOpen,
  setLeadOptionsOpen,
  selectedLead,
  setSelectedLead,
  setLeadDetails,
  setCoursePayments,
  setPlacementPayments,
  setFeeSummary,
  leadsLoading,
  filteredLeadOptions,
  selectLead,
  leadDetails,
  feeTab,
  setFeeTab,
  renderCourseFeeContent,
  renderPlacementFeeContent,
  coursePayments,
  placementPayments,
  handleEditClick,
  handleDeletePayment,
  amount,
  setAmount,
  payDate,
  setPayDate,
  mode,
  setMode,
  remarks,
  setRemarks,
  PAYMENT_MODES,
  saving,
  recordPayment,
  shareRows,
}) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <header style={{ background: "#1c9557" }}>
          <h5>
            <BsCurrencyRupee /> Record Payment
          </h5>
          <button type="button" onClick={onClose}>
            <FiX />
          </button>
        </header>
        <form onSubmit={(e) => e.preventDefault()} autoComplete="off">
          <div className="form-row">
            <div className="form-group col-md-12">
              <label htmlFor="studentSearch">
                <BiSearch className="mr-2" />Student/Lead Search
              </label>
              <div className="search-container">
                <input
                  className="form-control"
                  id="studentSearch"
                  placeholder="Search by ID, Mobile Number, or Name..."
                  autoComplete="off"
                  value={selectedLead ? `${selectedLead.name} (${selectedLead.mobile})` : leadSearch}
                  onChange={(e) => {
                    if (selectedLead) {
                      setSelectedLead(null);
                      setLeadDetails(null);
                      setCoursePayments([]);
                      setPlacementPayments([]);
                      setFeeSummary(initialFeeSummary);
                      setFeeTab(null);
                    }
                    setLeadSearch(e.target.value);
                    setLeadOptionsOpen(true);
                  }}
                  onFocus={() => {
                    if (!selectedLead) setLeadOptionsOpen(true);
                  }}
                />
                {leadOptionsOpen && !selectedLead && leadSearch.trim() && (
                  <div id="studentSearchList" className="dropdown-menu w-100 search-dropdown-menu">
                    {leadsLoading ? (
                      <div className="px-3 py-2 text-muted">Searching leads...</div>
                    ) : filteredLeadOptions.length === 0 ? (
                      <div className="px-3 py-2 text-muted">No matches found</div>
                    ) : (
                      <table className="table table-sm mb-0 lead-results-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Course</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeadOptions.map((lead) => (
                            <tr key={lead.id} onClick={() => selectLead(lead)} className="lead-result-row">
                              <td>{lead.id}</td>
                              <td className="lead-result-name">{lead.name}</td>
                              <td>{lead.mobile}</td>
                              <td>{lead.email || "—"}</td>
                              <td>{lead.course || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <input type="hidden" id="selectedLeadId" name="lead_id" value={selectedLead?.id || ""} />

          {leadDetails && (
            <div id="leadDetailsBox" className="info-card lead-details">
              <h5 className="payment-section-header">
                <BsPersonBadge className="mr-2" />Student Details
              </h5>
              <div className="student-details-grid">
                {[
                  [{ label: "Name:", value: leadDetails.name || "—" }, { label: "College/Company:", value: leadDetails.college_company || "N/A" }],
                  [{ label: "Mobile:", value: leadDetails.mobile_number || "—" }, { label: "Location:", value: leadDetails.location || "N/A" }],
                  [{ label: "Email:", value: leadDetails.email || "N/A" }, { label: "Status:", value: leadDetails.status || "—" }],
                  [{ label: "Course:", value: leadDetails.course_name || "—" }, { label: "Assignee:", value: leadDetails.assignee_name || "—" }],
                  [{ label: "Batch:", value: leadDetails.batch_name || "N/A" }, { label: "Meta Campaign:", value: leadDetails.meta_campaign_name || "N/A" }],
                  [{ label: "Trainer:", value: leadDetails.trainer_name || "—" }, { label: "Paid Status:", value: leadDetails.paid_status || "—" }],
                ].map((pair, idx) => (
                  <div className="student-detail-row" key={`detail-pair-${idx}`}>
                    {pair.map((field) => (
                      <div className="info-row" key={field.label}>
                        <span className="info-label">{field.label}</span>
                        <span className="info-value">{field.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedLead && (
            <div className="empty-state-panel">Please search and select a student above to view fee details.</div>
          )}

          {selectedLead && (
            <div className="info-card tab-switcher tab-switcher-card">
              <div className="tab-group">
                <button type="button" className={`tab-btn ${feeTab === "course" ? "active" : ""}`} onClick={() => setFeeTab("course")}>
                  Course Fees
                </button>
                <button type="button" className={`tab-btn ${feeTab === "placement" ? "active" : ""}`} onClick={() => setFeeTab("placement")}>
                  Placement Fees
                </button>
              </div>
            </div>
          )}

          {selectedLead && feeTab === "course" && (
            <div id="feeInfoBox" className="info-card fee-summary">
              <h5 className="payment-section-header mb-3">
                <BsCashStack className="mr-2" />Fee Summary
              </h5>
              {renderCourseFeeContent()}
            </div>
          )}

          {selectedLead && feeTab === "placement" && (
            <div id="placementFeeInfoBox" className="info-card fee-summary">
              <h5 className="payment-section-header mb-3">
                <BsCashStack className="mr-2" />Placement Fee Summary
              </h5>
              {renderPlacementFeeContent()}
            </div>
          )}

          {selectedLead && feeTab && (
            <div id="prevPaymentsBox" className="info-card payment-history">
              <h5 className="payment-section-header">
                <BsClockHistory className="mr-2" />
                {feeTab === "course" ? "Course Payment History" : "Placement Payment History"}
              </h5>
              {!selectedLead ? (
                <div className="empty-state-panel">Select a student to view payment history.</div>
              ) : (feeTab === "course" ? coursePayments : placementPayments).length > 0 ? (
                <div className="payment-history-table-wrapper">
                  <table className="payment-history-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Date</th><th>Amount (₹)</th><th>Payment Mode</th><th>Installment</th><th>Remarks</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(feeTab === "course" ? coursePayments : placementPayments).slice().map((payment, idx, arr) => (
                        <tr key={payment.installment_id || payment.placement_installment_id || idx}>
                          <td>{arr.length - idx}</td>
                          <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</td>
                          <td>₹{Number(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td>{payment.payment_mode || "—"}</td>
                          <td><span className="installment-badge">#{payment.installment_count || "—"}</span></td>
                          <td className="remarks-cell">{payment.remarks || "—"}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => handleEditClick(payment)} className="text-amber-500 hover:text-amber-700 p-1.5 rounded-full hover:bg-amber-50 transition-colors" title="Edit Payment">
                                <BsPencilSquare size={16} />
                              </button>
                              <button type="button" onClick={() => handleDeletePayment(payment)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Delete Payment">
                                <BsTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-panel">No {feeTab === "course" ? "course" : "placement"} payments recorded yet.</div>
              )}
            </div>
          )}

          {selectedLead && feeTab && (
            <div className="info-card payment-details-card">
              <div className="payment-details-header">
                <button type="button" className="payment-link">
                  <BsCreditCard /> {feeTab === "course" ? "Add Course Payment" : "Add Placement Payment"}
                </button>
              </div>
              <div className="payment-details-grid">
                <div className="form-group">
                  <label htmlFor="amount"><BsCurrencyRupee /> Amount Paid (₹)</label>
                  <input type="number" className="form-control" id="amount" name="amount" min="1" placeholder="Enter Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="paymentDate"><BsCalendarEvent /> Payment Date</label>
                  <div className="input-icon-wrapper">
                    <input type="date" className="form-control input-has-icon" id="paymentDate" name="payment_date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                    <BsCalendarEvent className="input-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="paymentMode"><BsWallet2 /> Payment Mode</label>
                  <select className="form-control" id="paymentMode" name="payment_mode" value={mode} onChange={(e) => setMode(e.target.value)} required>
                    <option value="">Select Mode</option>
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group mb-0">
                <label htmlFor="remarks"><BsChatLeftText /> Remarks</label>
                <textarea className="form-control" id="remarks" name="remarks" rows={2} placeholder="Enter Any Additional Notes (Optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <div className="payment-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                <button type="button" className="btn-placement" disabled={saving || !selectedLead?.id} onClick={recordPayment}>
                  {saving ? "Recording..." : feeTab === "placement" ? "Record Placement Payment" : "Record Course Payment"}
                </button>
              </div>
            </div>
          )}

          {selectedLead && feeTab === "course" && shareRows.length > 0 && (
            <div id="shareBreakdown" className="info-card mt-4">
              <h5 className="payment-section-header">
                <BsCashStack className="mr-2" />Share Breakdown
              </h5>
              <div className="share-grid">
                {shareRows.map((row) => (
                  <div key={row.label} className="share-card">
                    <div>
                      <div className="label">{row.label}</div>
                      <div className="student-label">{row.pct}% share</div>
                    </div>
                    <div className="value">₹{row.amount.toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
