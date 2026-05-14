import Swal from "sweetalert2";

export const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const initialFeeSummary = {
  actual_fee: 0,
  discounted_fee: 0,
  fee_paid: 0,
  fee_balance: 0,
  installment_number: 1,
  institute_percentage: 100,
  trainers: [],
};

export const paymentsInvoicesToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  zIndex: 100060,
  customClass: {
    container: "swal-invoice-toast",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});
