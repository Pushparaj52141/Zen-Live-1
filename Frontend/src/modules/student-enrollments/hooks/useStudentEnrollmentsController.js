import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { studentEnrollmentsService } from "../services/studentEnrollmentsService";

export function useStudentEnrollmentsController() {
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
      const response = await studentEnrollmentsService.fetchAll();
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      console.error("Error fetching student enrollments:", err);
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
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await studentEnrollmentsService.accept(id);
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
      title: "Approve Enrollment?",
      text: "This will officially approve the student and create a new CRM lead.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await studentEnrollmentsService.approve(id);
      setShowModal(false);
      await Swal.fire({
        title: "Approved!",
        text: "Student enrollment approved and CRM lead created.",
        icon: "success",
        confirmButtonColor: "#16a34a",
        timer: 2500,
        timerProgressBar: true,
      });
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve enrollment");
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
      await studentEnrollmentsService.reject(id, rejectionReason);
      setShowModal(false);
      setShowRejectionInput(false);
      setRejectionReason("");
      toast.success("Application rejected and applicant notified.");
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject enrollment");
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
        (e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.mobile_number || "").includes(searchTerm) ||
        (e.course_name || "").toLowerCase().includes(searchTerm.toLowerCase())
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
