import { useEffect, useMemo, useState } from "react";
import { trainerManagementService } from "../services/trainerManagementService";

export function useTrainerManagementController({ showSuccess, showError }) {
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [tName, setTName] = useState("");
  const [tMobile, setTMobile] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tCourses, setTCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editForm, setEditForm] = useState({
    trainer_name: "",
    trainer_mobile: "",
    trainer_email: "",
    course_ids: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewStatus, setViewStatus] = useState("active");

  useEffect(() => {
    fetchTrainers();
    fetchCourses();
  }, [viewStatus]);

  async function fetchTrainers() {
    setLoading(true);
    try {
      const res = await trainerManagementService.fetchTrainers(viewStatus);
      const data = res.data;
      setTrainers(Array.isArray(data.trainers) ? data.trainers : []);
    } catch (e) {
      console.error("Failed to load trainers:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      const res = await trainerManagementService.fetchCourses();
      const data = res.data;
      setCourses(Array.isArray(data) ? data : data.courses || []);
    } catch (e) {
      console.error("Failed to load courses:", e);
    }
  }

  function startEdit(r) {
    setEditingTrainer(r);
    setEditForm({
      trainer_name: r.trainer_name || "",
      trainer_mobile: r.trainer_mobile || "",
      trainer_email: r.trainer_email || "",
      course_ids: Array.isArray(r.courses) ? r.courses.map((c) => c.course_id) : [],
    });
    setShowEditModal(true);
  }

  function cancelEdit() {
    setShowEditModal(false);
    setEditingTrainer(null);
    setEditForm({ trainer_name: "", trainer_mobile: "", trainer_email: "", course_ids: [] });
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCourseSelection = (courseId, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => {
        const current = prev.course_ids || [];
        return current.includes(courseId)
          ? { ...prev, course_ids: current.filter((id) => id !== courseId) }
          : { ...prev, course_ids: [...current, courseId] };
      });
      return;
    }
    setTCourses((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
  };

  async function saveEdit() {
    if (!editingTrainer) return;
    try {
      await trainerManagementService.updateTrainer(editingTrainer.trainer_id, {
        trainer_name: editForm.trainer_name.trim(),
        trainer_mobile: editForm.trainer_mobile.trim(),
        trainer_email: editForm.trainer_email.trim(),
        course_ids: editForm.course_ids,
      });
      await fetchTrainers();
      showSuccess("Trainer updated successfully!");
      cancelEdit();
    } catch (e) {
      showError(e.response?.data?.message || e.message || "Failed to update trainer");
    }
  }

  async function deleteTrainer(id) {
    if (!window.confirm("Delete this trainer?")) return;
    try {
      await trainerManagementService.deleteTrainer(id);
      await fetchTrainers();
      showSuccess("Trainer deleted successfully!");
    } catch (e) {
      showError(e.response?.data?.message || e.message || "Failed to delete trainer");
    }
  }

  function resetAddForm() {
    setTName("");
    setTMobile("");
    setTEmail("");
    setTCourses([]);
  }

  async function submitAddTrainer(e) {
    e.preventDefault();
    if (!tName.trim() || !tMobile.trim() || !tEmail.trim()) return;
    setSaving(true);
    try {
      await trainerManagementService.createTrainer({
        trainer_name: tName.trim(),
        trainer_mobile: tMobile.trim(),
        trainer_email: tEmail.trim(),
        course_ids: tCourses,
      });
      await fetchTrainers();
      showSuccess("Trainer created successfully!");
      setShowAdd(false);
      resetAddForm();
    } catch (err) {
      showError(err.response?.data?.message || err.message || "Failed to create trainer");
    } finally {
      setSaving(false);
    }
  }

  const filteredTrainers = useMemo(() => {
    if (!searchQuery.trim()) return trainers;
    const query = searchQuery.toLowerCase();
    return trainers.filter((trainer) => {
      const name = (trainer.trainer_name || "").toLowerCase();
      const email = (trainer.trainer_email || "").toLowerCase();
      const mobile = (trainer.trainer_mobile || "").toLowerCase();
      const id = String(trainer.trainer_id || "").toLowerCase();
      const coursesStr = (trainer.courses || []).map((c) => c.course_name).join(" ").toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        id.includes(query) ||
        coursesStr.includes(query)
      );
    });
  }, [trainers, searchQuery]);

  async function handleToggleTrainerStatus(trainer) {
    const newStatus = !trainer.is_active;
    try {
      await trainerManagementService.toggleStatus(trainer.trainer_id, newStatus);
      showSuccess(`Trainer ${newStatus ? "activated" : "deactivated"} successfully!`);
      await fetchTrainers();
    } catch (e) {
      showError(e.response?.data?.message || e.message || "Failed to update status");
    }
  }

  return {
    trainers,
    courses,
    loading,
    showAdd,
    setShowAdd,
    tName,
    setTName,
    tMobile,
    setTMobile,
    tEmail,
    setTEmail,
    tCourses,
    saving,
    showEditModal,
    editingTrainer,
    editForm,
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    viewStatus,
    setViewStatus,
    fetchTrainers,
    startEdit,
    cancelEdit,
    handleEditChange,
    toggleCourseSelection,
    saveEdit,
    deleteTrainer,
    submitAddTrainer,
    filteredTrainers,
    handleToggleTrainerStatus,
  };
}
