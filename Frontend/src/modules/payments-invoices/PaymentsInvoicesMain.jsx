import React from "react";
import { BsCashStack } from "react-icons/bs";
import "sweetalert2/dist/sweetalert2.min.css";
import PaymentFilterModal from "./PaymentFilterModal";
import { usePaymentsInvoicesController } from "./hooks/usePaymentsInvoicesController";
import PaymentsInvoicesHeader from "./components/PaymentsInvoicesHeader";
import PaymentsLogsTable from "./components/PaymentsLogsTable";
import RecordPaymentModal from "./components/RecordPaymentModal";
import EditPaymentModal from "./components/EditPaymentModal";
import {
  PAYMENT_MODES,
  initialFeeSummary,
} from "./constants/paymentsInvoicesConstants";
import "./PaymentsInvoicesMain.css";
import {
  discountedTotalWithGst,
  placementBaseAmount,
  feeBalanceFromBaseDiscounted,
  placementBalanceFromBase,
} from "@shared/utils/feeGst";

export default function PaymentInvoicesMain() {
  const {
    logsLoading,
    logsFilter,
    setLogsFilter,
    sort,
    filteredLogs,
    changeSort,
    filters,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    showFilters,
    setShowFilters,
    filterSections,
    handleToggleFilter,
    handleClearFilters,
    handleApplyFilters,
    exportLogs,
    modalOpen,
    openModal,
    closeModal,
    saving,
    leadSearch,
    setLeadSearch,
    leadOptionsOpen,
    setLeadOptionsOpen,
    leadsLoading,
    selectedLead,
    leadDetails,
    feeSummary,
    coursePayments,
    placementPayments,
    feeTab,
    setFeeTab,
    amount,
    setAmount,
    payDate,
    setPayDate,
    mode,
    setMode,
    remarks,
    setRemarks,
    shareRows,
    filteredLeadOptions,
    selectLead,
    recordPayment,
    setSelectedLead,
    setLeadDetails,
    setCoursePayments,
    setPlacementPayments,
    setFeeSummary,
    editingPayment,
    editForm,
    setEditForm,
    updating,
    handleEditClick,
    closeEditModal,
    handleUpdatePayment,
    handleDeletePayment,
  } = usePaymentsInvoicesController();

  const renderCourseFeeContent = () => {
    const leftFields = [
      {
        label: "Original Fee:",
        value: `₹${Number(feeSummary.actual_fee || 0).toLocaleString("en-IN")}`,
      },
      {
        label: "Discounted Fee (incl. 6% GST):",
        value: `₹${Number(
          discountedTotalWithGst(feeSummary.discounted_fee) ??
            feeSummary.discounted_fee ??
            0
        ).toLocaleString("en-IN")}`,
      },
      {
        label: "Paid So Far:",
        value: (
          <span className="text-success">
            ₹{Number(feeSummary.fee_paid || 0).toLocaleString("en-IN")}
          </span>
        ),
      },
    ];

    const rightFields = [
      {
        label: "Remaining Balance:",
        value: (
          <span className="text-danger">
            ₹{Number(
              feeBalanceFromBaseDiscounted(
                feeSummary.discounted_fee,
                feeSummary.fee_paid
              ) ?? feeSummary.fee_balance ?? 0
            ).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        label: "Next Installment No.:",
        value: (
          <span className="badge badge-installment">
            #{feeSummary.installment_number || 1}
          </span>
        ),
      },
    ];

    return (
      <div className="fee-summary-columns">
        <div className="fee-column fee-column-left">
          {leftFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
            </div>
          ))}
        </div>
        <div className="fee-column-divider" />
        <div className="fee-column fee-column-right">
          {rightFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlacementFeeContent = () => {
    const placementActualFee = Number(leadDetails?.placement_fee || 0);
    const placementDiscountedFee = Number(
      leadDetails?.placement_discounted_fee || 0
    );
    const placementPaid = Number(leadDetails?.placement_paid || 0);
    const placementBase = placementBaseAmount(
      leadDetails?.placement_discounted_fee,
      leadDetails?.placement_fee
    );
    const feeForBalance =
      placementBase != null ? discountedTotalWithGst(placementBase) ?? 0 : 0;
    const placementBalance =
      placementBalanceFromBase(
        leadDetails?.placement_discounted_fee,
        leadDetails?.placement_fee,
        placementPaid
      ) ?? Math.max(0, feeForBalance - placementPaid);

    if (!placementActualFee) {
      return (
        <p className="text-muted mb-0">
          No placement fee has been configured for this lead.
        </p>
      );
    }

    const leftFields = [
      {
        label: "Placement Actual Fee:",
        value: `₹${placementActualFee.toLocaleString("en-IN")}`,
      },
      {
        label: "Placement Discounted Fee (incl. 6% GST):",
        value: `₹${Number(
          discountedTotalWithGst(placementBase) ?? placementDiscountedFee
        ).toLocaleString("en-IN")}`,
      },
      {
        label: "Paid So Far:",
        value: (
          <span className="text-success">
            ₹{placementPaid.toLocaleString("en-IN")}
          </span>
        ),
      },
    ];

    const rightFields = [
      {
        label: "Remaining Balance:",
        value: (
          <span className="text-danger">
            ₹{Math.max(placementBalance, 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        label: "Status:",
        value: leadDetails?.placement_paid_status || "—",
      },
    ];

    return (
      <div className="fee-summary-columns">
        <div className="fee-column fee-column-left">
          {leftFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
            </div>
          ))}
        </div>
        <div className="fee-column-divider" />
        <div className="fee-column fee-column-right">
          {rightFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-slate-50 min-h-screen p-4 md:p-6"
      style={{ fontFamily: '"Poppins", sans-serif' }}
    >
      <div className="payment-page max-w-[1500px] mx-auto space-y-6">
        <PaymentsInvoicesHeader
          onRecordPayment={openModal}
          onOpenFilters={() => setShowFilters(true)}
          onExport={exportLogs}
        />

        <PaymentsLogsTable
          logsFilter={logsFilter}
          onLogsFilterChange={setLogsFilter}
          sort={sort}
          onChangeSort={changeSort}
          logsLoading={logsLoading}
          filteredLogs={filteredLogs}
        />

        <RecordPaymentModal
          isOpen={modalOpen}
          onClose={closeModal}
          initialFeeSummary={initialFeeSummary}
          leadSearch={leadSearch}
          setLeadSearch={setLeadSearch}
          leadOptionsOpen={leadOptionsOpen}
          setLeadOptionsOpen={setLeadOptionsOpen}
          selectedLead={selectedLead}
          setSelectedLead={setSelectedLead}
          setLeadDetails={setLeadDetails}
          setCoursePayments={setCoursePayments}
          setPlacementPayments={setPlacementPayments}
          setFeeSummary={setFeeSummary}
          leadsLoading={leadsLoading}
          filteredLeadOptions={filteredLeadOptions}
          selectLead={selectLead}
          leadDetails={leadDetails}
          feeTab={feeTab}
          setFeeTab={setFeeTab}
          renderCourseFeeContent={renderCourseFeeContent}
          renderPlacementFeeContent={renderPlacementFeeContent}
          coursePayments={coursePayments}
          placementPayments={placementPayments}
          handleEditClick={handleEditClick}
          handleDeletePayment={handleDeletePayment}
          amount={amount}
          setAmount={setAmount}
          payDate={payDate}
          setPayDate={setPayDate}
          mode={mode}
          setMode={setMode}
          remarks={remarks}
          setRemarks={setRemarks}
          PAYMENT_MODES={PAYMENT_MODES}
          saving={saving}
          recordPayment={recordPayment}
          shareRows={shareRows}
        />

        <EditPaymentModal
          editingPayment={editingPayment}
          onClose={closeEditModal}
          onSubmit={handleUpdatePayment}
          editForm={editForm}
          setEditForm={setEditForm}
          updating={updating}
          paymentModes={PAYMENT_MODES}
        />

        <PaymentFilterModal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          title="Payment Filters"
          sections={filterSections}
          selected={filters}
          onToggle={handleToggleFilter}
          onClear={handleClearFilters}
          onApply={handleApplyFilters}
          onCancel={() => setShowFilters(false)}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
      </div>
    </div>
  );
}
