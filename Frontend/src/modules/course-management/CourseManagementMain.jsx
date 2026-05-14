import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FiPlus, FiEdit, FiX, FiSearch, FiFilter } from "react-icons/fi";
import { Toaster } from "react-hot-toast";
import { useCourses } from "@shared/hooks/useCourses";
import { getPageColors } from "@shared/utils/pageColors";
import AddCourseModal from "./components/AddCourseModal";
import CourseTable from "./components/CourseTable";
import SubCourseListModal from "./components/SubCourseListModal";
import SubCourseFormModal from "./components/SubCourseFormModal";
import { courseService } from "@shared/services/courses/courseService";
import { useNotification } from "@shared/hooks/useNotification";

export default function CourseManagementPage() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const {
    courses,
    loading,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseTypes,
  } = useCourses();
  const { showSuccess, showError } = useNotification();

  const [showAddModal, setShowAddModal] = useState(false);
  const [courseTypes, setCourseTypes] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subCourses, setSubCourses] = useState([]);
  const [subCoursesLoading, setSubCoursesLoading] = useState(false);
  const [showSubCourseModal, setShowSubCourseModal] = useState(false);
  const [subCourseFormOpen, setSubCourseFormOpen] = useState(false);
  const [editingSubCourse, setEditingSubCourse] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseType, setEditCourseType] = useState("");
  const [editCustomType, setEditCustomType] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourseType, setFilterCourseType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadCourseTypes = async () => {
      try {
        const types = await getCourseTypes(false);
        setCourseTypes(types);
      } catch (error) {
        console.error("Error loading course types:", error);
        if (courses.length > 0) {
          const fallbackTypes = [
            ...new Set(
              courses.map((course) => course.course_type).filter(Boolean)
            ),
          ];
          setCourseTypes(fallbackTypes);
        }
      }
    };
    loadCourseTypes();
  }, [courses]);

  const handleAddCourse = async (courseData) => {
    const result = await addCourse(courseData);
    return result;
  };

  const openEditModal = (course) => {
    if (!course) return;
    setEditingCourse(course);
    const existingType = course.course_type || "";
    if (existingType && courseTypes.includes(existingType)) {
      setEditCourseType(existingType);
      setEditCustomType("");
    } else if (existingType) {
      setEditCourseType("__custom__");
      setEditCustomType(existingType);
    } else {
      setEditCourseType("");
      setEditCustomType("");
    }
    setEditCourseName(course.course_name || "");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCourse(null);
    setEditCourseName("");
    setEditCourseType("");
    setEditCustomType("");
    setSavingEdit(false);
  };

  const handleUpdateCourse = async (courseId, payload) => {
    const result = await updateCourse(courseId, payload);
    if (result.success) {
      closeEditModal();
    }
    return result;
  };

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    const type =
      editCourseType === "__custom__"
        ? editCustomType.trim()
        : editCourseType.trim();
    if (!editCourseName.trim() || !type) return;
    setSavingEdit(true);
    await handleUpdateCourse(editingCourse.course_id, {
      course_name: editCourseName.trim(),
      course_type: type,
    });
    setSavingEdit(false);
  };

  const handleDelete = async (courseId) => {
    const result = await deleteCourse(courseId);
    if (!result.success && result.error) {
      if (
        result.error.includes("assigned to") ||
        result.error.includes("referenced by")
      ) {
        window.alert(
          `Cannot delete this course.\n\n${result.error}\n\nPlease reassign or remove all related leads before deleting.`
        );
      } else {
        window.alert(`Error: ${result.error}`);
      }
    }
  };

  const loadSubCourses = async (courseId) => {
    setSubCoursesLoading(true);
    const result = await courseService.getSubCourses(courseId);
    if (result.success) {
      setSubCourses(result.data);
    } else {
      setSubCourses([]);
      showError(result.error || "Failed to load sub-courses.");
    }
    setSubCoursesLoading(false);
  };

  const handleManageSubCourses = async (course) => {
    setSelectedCourse(course);
    setShowSubCourseModal(true);
    await loadSubCourses(course.course_id);
  };

  const handleAddSubCourseClick = () => {
    setEditingSubCourse(null);
    setSubCourseFormOpen(true);
  };

  const handleEditSubCourseClick = (subCourse) => {
    setEditingSubCourse(subCourse);
    setSubCourseFormOpen(true);
  };

  const handleDeleteSubCourse = async (subCourse) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subCourse.sub_course_name}"?`
      )
    ) {
      return;
    }
    const result = await courseService.deleteSubCourse(
      subCourse.sub_course_id
    );
    if (result.success) {
      showSuccess("Sub-course deleted successfully!");
      await loadSubCourses(selectedCourse.course_id);
    } else {
      showError(result.error || "Failed to delete sub-course.");
    }
  };

  const handleSubmitSubCourse = async (payload) => {
    const courseId = selectedCourse?.course_id;
    if (!courseId) {
      showError("Course ID is missing.");
      return;
    }

    let result;
    if (editingSubCourse) {
      result = await courseService.updateSubCourse(
        editingSubCourse.sub_course_id,
        payload
      );
      if (result.success) {
        showSuccess("Sub-course updated successfully!");
      }
    } else {
      result = await courseService.addSubCourse({
        ...payload,
        course_id: courseId,
      });
      if (result.success) {
        showSuccess("Sub-course added successfully!");
      }
    }

    if (result?.success) {
      setSubCourseFormOpen(false);
      setEditingSubCourse(null);
      await loadSubCourses(courseId);
    } else if (result?.error) {
      showError(result.error);
    }
  };

  const closeSubCourseModal = () => {
    setShowSubCourseModal(false);
    setSubCourseFormOpen(false);
    setEditingSubCourse(null);
    setSelectedCourse(null);
    setSubCourses([]);
  };

  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((course) => {
        const courseName = (course.course_name || "").toLowerCase();
        const courseId = (course.course_id || "").toLowerCase();
        const courseType = (course.course_type || "").toLowerCase();
        return (
          courseName.includes(query) ||
          courseId.includes(query) ||
          courseType.includes(query)
        );
      });
    }

    if (filterCourseType) {
      filtered = filtered.filter((course) => {
        return course.course_type === filterCourseType;
      });
    }

    return filtered;
  }, [courses, searchQuery, filterCourseType]);

  return (
    <div className="p-4 md:p-6">
      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "0.95rem",
            borderRadius: "12px",
            background: "#333",
            color: "#fff",
            padding: "12px 20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          success: {
            style: {
              background: "#10B981",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#EF4444",
            },
          },
        }}
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-3 rounded-xl border bg-white shadow-sm hover:shadow-md px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 min-w-[220px]"
          style={{ borderColor: `${colors.primary}40` }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors group-hover:scale-110"
                style={{ backgroundColor: `${colors.primary}15` }}>
            <FiPlus className="text-lg" style={{ color: colors.primary }} />
          </div>
          <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>
            Add New Course
          </span>
        </button>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm"
              style={{ 
                borderColor: `${colors.primary}50`,
                focusRingColor: colors.primary 
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${colors.primary}50`;
                e.target.style.boxShadow = '';
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || filterCourseType
                ? 'text-white'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={showFilters || filterCourseType ? { 
              backgroundColor: colors.primary,
              borderColor: colors.primary 
            } : {}}
          >
            <FiFilter size={18} />
            Filters
            {filterCourseType && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 rounded-lg border bg-white shadow-sm" style={{ borderColor: `${colors.primary}30` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: colors.primaryDark }}>
              Filter Options
            </h3>
            <button
              onClick={() => {
                setFilterCourseType("");
                setShowFilters(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Course Type
              </label>
              <select
                value={filterCourseType}
                onChange={(e) => setFilterCourseType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: `${colors.primary}50` }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${colors.primary}50`;
                  e.target.style.boxShadow = '';
                }}
              >
                <option value="">All Course Types</option>
                {courseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {(searchQuery || filterCourseType) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      )}

      <CourseTable
        courses={filteredCourses}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onManageSubCourses={handleManageSubCourses}
        colors={colors}
      />

      <AddCourseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCourse}
        courseTypes={courseTypes}
      />

      <SubCourseListModal
        isOpen={showSubCourseModal}
        course={selectedCourse}
        subCourses={subCourses}
        loading={subCoursesLoading}
        onClose={closeSubCourseModal}
        onAddClick={handleAddSubCourseClick}
        onEditClick={handleEditSubCourseClick}
        onDelete={handleDeleteSubCourse}
      />

      <SubCourseFormModal
        isOpen={subCourseFormOpen}
        mode={editingSubCourse ? "edit" : "create"}
        course={selectedCourse}
        initialData={editingSubCourse}
        onClose={() => {
          setSubCourseFormOpen(false);
          setEditingSubCourse(null);
        }}
        onSubmit={handleSubmitSubCourse}
      />
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/20">
                  <FiEdit className="text-white text-xl" />
                </span>
                <h5 className="text-lg font-semibold">Edit Course</h5>
              </div>
              <button
                onClick={closeEditModal}
                aria-label="Close"
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleEditCourseSubmit} className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editCourseType}
                    onChange={(e) => setEditCourseType(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "";
                      e.target.style.boxShadow = "";
                    }}
                  >
                    <option value="" disabled>
                      Select type…
                    </option>
                    {courseTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__custom__">+ Add new type…</option>
                  </select>
                </div>

                {editCourseType === "__custom__" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter New Course Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={editCustomType}
                      onChange={(e) => setEditCustomType(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary;
                        e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "";
                        e.target.style.boxShadow = "";
                      }}
                    />
                  </div>
                )}

                <div className={editCourseType === "__custom__" ? "" : "md:col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={editCourseName}
                    onChange={(e) => setEditCourseName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "";
                      e.target.style.boxShadow = "";
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    savingEdit ||
                    !editCourseName.trim() ||
                    !editCourseType ||
                    (editCourseType === "__custom__" && !editCustomType.trim())
                  }
                  className="px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                  }}
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
