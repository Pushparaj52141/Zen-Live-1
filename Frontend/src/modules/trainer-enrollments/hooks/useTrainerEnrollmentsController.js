import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { trainerEnrollmentsService } from "../services/trainerEnrollmentsService";

export function useTrainerEnrollmentsController() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trainerEnrollmentsService.fetchAll();
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      console.error("Error fetching trainer enrollments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleAccept = async (id) => {
    const result = await Swal.fire({
      title: "Accept Application?",
      text: 'This will move the application to "Approval Pending" and notify the applicant by email.',
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0891b2",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Accept",
    });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      await trainerEnrollmentsService.accept(id);
      setShowModal(false);
      toast.success("Application accepted — applicant notified by email.");
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to accept application");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Approve Trainer?",
      text: "This will officially approve the trainer and add them to the Trainer Management list.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Approve",
    });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      await trainerEnrollmentsService.approve(id);
      setShowModal(false);
      await Swal.fire({
        title: "Trainer Approved!",
        text: "Trainer approved and added to the system.",
        icon: "success",
        confirmButtonColor: "#ea580c",
        timer: 2500,
        timerProgressBar: true,
      });
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve trainer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (showRejectionInput && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    if (!showRejectionInput) {
      setShowRejectionInput(true);
      return;
    }
    setActionLoading(true);
    try {
      await trainerEnrollmentsService.reject(id, rejectionReason);
      setShowModal(false);
      setShowRejectionInput(false);
      setRejectionReason("");
      toast.success("Application rejected and applicant notified.");
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowRejectionInput(false);
    setRejectionReason("");
  };

  const byStatus = (list, s) => (s === "all" ? list : list.filter((e) => e.status === s));
  const bySearch = (list) =>
    list.filter(
      (e) =>
        (e.trainer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.trainer_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.trainer_mobile || "").includes(searchTerm) ||
        (e.specialization || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const displayList = bySearch(byStatus(enrollments, filterStatus));
  const countFor = (s) => bySearch(byStatus(enrollments, s)).length;

  return {
    loading,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    selectedEnrollment,
    setSelectedEnrollment,
    showModal,
    setShowModal,
    rejectionReason,
    setRejectionReason,
    showRejectionInput,
    setShowRejectionInput,
    actionLoading,
    fetchEnrollments,
    handleAccept,
    handleApprove,
    handleReject,
    closeModal,
    displayList,
    countFor,
  };
}
