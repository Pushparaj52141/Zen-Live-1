// File: src/components/Navbar.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaBell,
  FaCog,
  FaFilter,
  FaSearch,
  FaTimes,
  FaSignOutAlt,
  FaTh,
  FaWhatsapp,
} from "react-icons/fa";
import { MdRedo, MdUndo } from "react-icons/md";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import FullPageFilterModal from "@modules/leads/modals/FullPageFilterModal";
import logoImage from "@assets/logo.png";
import userAvatar from "@assets/user1.jpg";
import apiClient, { API_BASE_URL } from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

// Helper function to get user initials
const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
};

const buildEmptyFilters = () => ({
  courseTypes: [],
  courses: [],
  statuses: [],
  timePeriods: [],
  trainers: [],
  paidStatuses: [],
  batches: [],
  sources: [],
  assignees: [],
  businessUnits: [],
  cardTypes: [],
});

export default function Navbar({
  toggleSidebar,
  isSidebarOpen,
  trainers = [],
  courseTypes = [],
  batches = [],
  courses = [],
  sources = [],
  assignees = [],
  units = [],
  cardTypes = [],
  filtersLoading = false,
  filtersError = null,
  onFilterApply = (filters) => {
  },
  onLogout = () => {
  },
  handleUndo,
  handleRedo,
  undoDisabled = false,
  redoDisabled = false,
}) {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(buildEmptyFilters);
  const [pendingFilters, setPendingFilters] = useState(buildEmptyFilters);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [username, setUsername] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadUserData = useCallback(async () => {
    const userId = authUser?.id || authUser?.user_id;
    setUsername(authUser?.username || null);

    let imageToSet = authUser?.profile_image || null;
    if (!imageToSet && userId) {
      try {
        const response = await apiClient.get(`/api/users/image/${userId}`, {
          responseType: 'arraybuffer'
        });
        
        if (response.data) {
          const base64 = btoa(
            new Uint8Array(response.data)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          imageToSet = base64;
        }
      } catch (err) {
        // Failed to fetch image from API
      }
    }

    if (imageToSet) {
      setUserProfileImage(imageToSet);
    } else {
      setUserProfileImage(null);
    }
  }, [authUser]);

  // Initial load and event listener
  useEffect(() => {
    loadUserData();

    // Listen for auth updates (login/logout)
    const handleAuthUpdate = () => {
      loadUserData();
    };

    window.addEventListener('zen:authUpdated', handleAuthUpdate);
    return () => window.removeEventListener('zen:authUpdated', handleAuthUpdate);
  }, [loadUserData]);

  useEffect(() => {
    if (filterOpen) {
      setPendingFilters(selectedFilters);
    }
  }, [filterOpen, selectedFilters]);

  const dispatchFiltersApplied = useCallback((filters) => {
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("zen:filtersApplied", { detail: filters })
        );
      }
    } catch (error) {
      // Unable to dispatch filter event
    }
  }, []);

  const dispatchSearchEvent = useCallback((term) => {
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("zen:leadSearch", {
            detail: typeof term === "string" ? term : "",
          })
        );
      }
    } catch (error) {
      // Unable to dispatch search event
    }
  }, []);

  const handleSearchChange = useCallback(
    (event) => {
      const value = event?.target?.value ?? "";
      setSearchTerm(value);
      dispatchSearchEvent(value);
    },
    [dispatchSearchEvent]
  );

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    dispatchSearchEvent("");
  }, [dispatchSearchEvent]);

  const handleSearchKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        handleSearchClear();
      }
    },
    [handleSearchClear]
  );

  const filterSections = useMemo(() => {
    const toOptions = (items = [], labelKey = "name", valueKey = "id") => {
      const options = Array.isArray(items)
        ? items.map((item) => {
            if (typeof item === "string") {
              return { value: item, label: item };
            }
            const value = item[valueKey] ?? item.id ?? item._id ?? item;
            const label =
              item[labelKey] ??
              item.name ??
              item.title ??
              item.course_type ??
              value;
            return { value, label };
          })
        : [];

      return options.sort((a, b) =>
        String(a.label).localeCompare(String(b.label), undefined, {
          sensitivity: "base",
        })
      );
    };

    const statusOptions = [
      { value: "enquiry", label: "Enquiry" },
      { value: "prospect", label: "Prospect" },
      { value: "enrollment", label: "Enrollment" },
      { value: "trainingprogress", label: "Training Progress" },
      { value: "handsonproject", label: "Hands on Project" },
      { value: "certification", label: "Certification" },
      { value: "cvbuild", label: "CV Build" },
      { value: "mockinterviews", label: "Mock Interviews" },
      { value: "liveinterviews", label: "Live Interviews" },
      { value: "placement", label: "Placement" },
      { value: "placementdue", label: "Placement Due" },
      { value: "placementpaid", label: "Placement Paid" },
      { value: "finishers", label: "Finishers" },
      { value: "onhold", label: "On Hold" },
      { value: "archived", label: "Archived" },
    ];

    const timePeriodOptions = [
      "All Time",
      "Today",
      "This Week",
      "This Month",
      "This Year",
    ].map((period) => ({
      value: period,
      label: period,
    }));

    const feeStatusOptions = ["Paid", "Not Paid", "Partially Paid"].map(
      (item) => ({ value: item, label: item })
    );

    return [
      {
        key: "courseTypes",
        title: "Course Type",
        options: toOptions(courseTypes, "course_type", "course_type"),
      },
      {
        key: "courses",
        title: "Course",
        options: toOptions(courses, "name", "id"),
      },
      { key: "statuses", title: "Status", options: statusOptions },
      { key: "timePeriods", title: "Time Period", options: timePeriodOptions },
      {
        key: "trainers",
        title: "Trainer",
        options: toOptions(trainers, "name", "name"),
      },
      { key: "paidStatuses", title: "Fee Status", options: feeStatusOptions },
      {
        key: "batches",
        title: "Batch",
        options: toOptions(batches, "batch_name", "batch_name"),
      },
      {
        key: "sources",
        title: "Source",
        options: toOptions(sources, "name", "id"),
      },
      {
        key: "assignees",
        title: "Assignee",
        options: toOptions(assignees, "name", "id"),
      },
      {
        key: "businessUnits",
        title: "Business Unit",
        options: toOptions(units, "name", "name"),
      },
      {
        key: "cardTypes",
        title: "Card Type",
        options: toOptions(cardTypes, "name", "name"),
      },
    ];
  }, [
    courseTypes,
    courses,
    trainers,
    batches,
    sources,
    assignees,
    units,
    cardTypes,
  ]);

  const handleUndoClick = () => {
    if (typeof handleUndo === "function") {
      const result = handleUndo();
      if (result === false) {
        Swal.fire({
          icon: "info",
          title: "Oops",
          text: "No actions to undo.",
          confirmButtonText: "OK",
          confirmButtonColor: "#6366f1", // Indigo-500 to match the image style
        });
      }
    }
  };

  const handleRedoClick = () => {
    if (typeof handleRedo === "function") {
      const result = handleRedo();
      if (result === false) {
        Swal.fire({
          icon: "info",
          title: "Oops",
          text: "No actions to redo.",
          confirmButtonText: "OK",
          confirmButtonColor: "#6366f1",
        });
      }
    }
  };

  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-full items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm">
            <img src={logoImage} alt="Zen Logo" className="mr-2.5 h-5 w-5" />
            <span className="ml-0.5 font-semibold">Zen</span>
          </div>

          {/* Hamburger icon hidden as per request
          <button
            onClick={() => toggleSidebar()}
            className="ml-3 block"
            aria-label="Toggle sidebar"
          >
            <div className="flex flex-col items-center justify-center space-y-0.5">
              <span className="h-0.5 w-4 bg-gray-400" />
              <span className="h-0.5 w-4 bg-gray-400" />
              <span className="h-0.5 w-4 bg-gray-400" />
            </div>
          </button>
          */}

          <div className="relative ml-2 flex flex-1 max-w-[140px] xs:max-w-[180px] sm:ml-6 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-full border border-gray-200 py-1 pl-4 pr-8 text-sm shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
            />
            <FaSearch className="absolute right-3 top-2.5 text-xs text-gray-400" />
            {searchTerm ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={handleSearchClear}
                className="absolute right-7 top-1.5 text-gray-400 transition hover:text-gray-600"
              >
                <FaTimes size={12} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 text-sm text-gray-400 pr-1 sm:pr-0">
          {isDashboard && (
            <>
              <button
                onClick={handleUndoClick}
                title="Undo"
                className="flex h-6 w-6 items-center justify-center rounded shadow-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 active:scale-90"
                style={{ boxShadow: "0 2px 8px 0 rgba(60,60,60,0.07)" }}
                disabled={undoDisabled}
              >
                <MdUndo className="h-3 w-4" />
              </button>
              <button
                onClick={handleRedoClick}
                title="Redo"
                className="flex h-6 w-6 items-center justify-center rounded shadow-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 active:scale-90"
                style={{ boxShadow: "0 2px 8px 0 rgba(60,60,60,0.07)" }}
                disabled={redoDisabled}
              >
                <MdRedo className="h-3 w-4" />
              </button>

              <button
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center justify-center"
                aria-label="Open filters"
                title="Filters"
              >
                <FaFilter className="text-gray-500" size={16} />
              </button>
            </>
          )}

          <FullPageFilterModal
            isOpen={filterOpen}
            onClose={() => {
              setPendingFilters(selectedFilters);
              setFilterOpen(false);
            }}
            sections={filterSections}
            selected={pendingFilters}
            isLoading={filtersLoading}
            error={filtersError}
            onToggle={(sectionKey, value) => {
              setPendingFilters((prev) => {
                const nextValues = new Set(prev[sectionKey] || []);
                if (nextValues.has(value)) {
                  nextValues.delete(value);
                } else {
                  nextValues.add(value);
                }
                return { ...prev, [sectionKey]: Array.from(nextValues) };
              });
            }}
            onClear={() => {
              const empty = buildEmptyFilters();
              setPendingFilters(empty);
            }}
            onApply={() => {
              const applied = { ...pendingFilters };
              setSelectedFilters(applied);
              onFilterApply(applied);
              dispatchFiltersApplied(applied);
              setFilterOpen(false);
            }}
            onCancel={() => {
              setPendingFilters(selectedFilters);
              setFilterOpen(false);
            }}
          />

          <FaCog className="hidden cursor-pointer sm:block" />
          <FaWhatsapp className="cursor-pointer text-green-500" />
          <FaTh className="hidden cursor-pointer sm:block" />

          <div className="relative">
            <FaBell className="cursor-pointer text-pink-600" />
            <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              5
            </span>
          </div>

          <button
            type="button"
            className="relative"
            onClick={() => navigate("/profile-details")}
            title="Open profile details"
          >
            {userProfileImage ? (
              <img
                src={
                  userProfileImage?.startsWith('data:') || userProfileImage?.startsWith('http') 
                    ? userProfileImage 
                    : (userProfileImage?.startsWith('uploads/') || userProfileImage?.startsWith('/uploads/'))
                      ? `${API_BASE_URL}/${userProfileImage.startsWith('/') ? userProfileImage.slice(1) : userProfileImage}`
                      : `data:image/png;base64,${userProfileImage}`
                }
                alt={username || "User"}
                className="h-8 w-8 rounded-full border object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`h-8 w-8 rounded-full border-2 border-gray-300 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold ${
                userProfileImage ? 'hidden' : ''
              }`}
              title={username || "User"}
            >
              {getInitials(username)}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 rounded px-2 py-1 text-red-500 transition-colors hover:bg-red-50"
            title="Logout"
          >
            <FaSignOutAlt className="h-4 w-4" />
            <span className="hidden text-xs sm:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
