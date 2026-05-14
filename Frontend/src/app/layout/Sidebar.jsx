// File: src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  MdArchive,
  MdAssessment,
  MdBarChart,
  MdCalendarToday,
  MdCampaign,
  MdCheckCircle,
  MdCollectionsBookmark,
  MdDashboard,
  MdGroup,
  MdGroups,
  MdInsights,
  MdWork,
  MdNotificationsActive,
  MdPeople,
  MdRateReview,
  MdReceipt,
  MdSettings,
  MdShare,
  MdStar,
  MdTextFields,
  MdTrendingUp,
  MdUpload,
  MdPersonAdd,
  MdAssignment,
} from "react-icons/md";

const menuItems = [
  {
    icon: <MdDashboard style={{ color: "#0d6efd" }} />,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <MdPersonAdd style={{ color: '#28a745' }} />,
    label: 'Enrollment Records',
    path: '/enrollment-records',
  },
  {
    icon: <MdInsights style={{ color: "#6610f2" }} />,
    label: "Lead Overview",
    path: "/lead-overview",
  },
  {
    icon: <MdUpload style={{ color: "#dc3545" }} />,
    label: "Lead Bulk Upload",
    path: "/lead-bulk-upload",
  },
  {
    icon: <MdCalendarToday style={{ color: "#6f42c1" }} />,
    label: "Batch Management",
    path: "/batches",
  },
  {
    icon: <MdCollectionsBookmark style={{ color: "#e83e8c" }} />,
    label: "Course Management",
    path: "/courses",
  },
  {
    icon: <MdGroups style={{ color: "#fd7e14" }} />,
    label: "Trainer Management",
    path: "/trainers",
  },
  {
    icon: <MdPeople style={{ color: "#000000" }} />,
    label: "Users Management",
    path: "/users",
  },
  {
    icon: <MdCampaign style={{ color: "#1976d2" }} />,
    label: "Meta Campaigns",
    path: "/meta-campaigns",
  },
  {
    icon: <MdRateReview style={{ color: "#3b5998" }} />,
    label: "Reviews",
    path: "/reviews",
  },
  {
    icon: <MdTrendingUp style={{ color: "#14b8a6" }} />,
    label: "Meta Leads",
    path: "/meta-leads",
  },
  {
    icon: <MdCheckCircle style={{ color: "#28a745" }} />,
    label: "Daily Checkin",
    path: "/attendance",
  },
  {
    icon: <MdWork style={{ color: "#0f766e" }} />,
    label: "Employee Tracking",
    path: "/employee-tracking",
  },
//   {
//     icon: <MdAssignment style={{ color: "#10b981" }} />,
//     label: "IT Updates",
//     path: "/it-updates",
//   },
  {
    icon: <MdAssessment style={{ color: "#17a2b8" }} />,
    label: "Payment Insights",
    path: "/payments",
  },
  {
    icon: <MdReceipt style={{ color: "#17a2b8" }} />,
    label: "Payments & Invoices",
    path: "/invoices",
  },
  {
    icon: <MdGroup style={{ color: "#fd7e14" }} />,
    label: "Trainer Share",
    path: "/share",
  },
  {
    icon: <MdTextFields style={{ color: "#ff69b4" }} />,
    label: "Certification Portal",
    path: "/certifications",
  },
  {
    icon: <MdNotificationsActive style={{ color: "#8a2be2" }} />,
    label: "Announcements",
    path: "/announcements",
  },
  {
    icon: <MdBarChart style={{ color: "#0d6efd" }} />,
    label: "Reports & Analytics",
    path: "/reports",
  },
  {
    icon: <MdArchive style={{ color: "#343a40" }} />,
    label: "Archived Leads",
    path: "/archived",
  },
  {
    icon: <MdStar style={{ color: "#ffc107" }} />,
    label: "Hall Of Fame",
    path: "/hall-of-fame",
  },
  {
    icon: <MdSettings style={{ color: "#6c757d" }} />,
    label: "System & Settings",
    path: "/settings",
  },
];

export default function Sidebar({ isOpen, onMouseEnter, onMouseLeave }) {
  const location = useLocation();

  // Use server-verified auth state (Redux) for authorization/UX filtering.
  const authUser = useSelector((state) => state.auth.user);
  const roleIds = Array.isArray(authUser?.role_ids) && authUser.role_ids.length
    ? authUser.role_ids.map((r) => Number(r)).filter((r) => Number.isInteger(r))
    : authUser?.role_id != null
      ? [Number(authUser.role_id)]
      : [];


  // Define Role Constants
  const ROLES = {
    ADMIN: 1,
    TRAINER: 2,
    CONSULTANT: 3,
    STUDENT: 4,
    SUPPORT: 5, // Digital Marketing treated as Support
  };

  // Define Allowed Paths per Role
  const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: ["*"], // Wildcard for all access
    [ROLES.TRAINER]: [
      "/dashboard",
      "/batches",
      "/courses",
      "/attendance",
      "/certifications",
      "/announcements",
      "/hall-of-fame",
      "/settings", // Often needed for basic profile
    ],
    [ROLES.CONSULTANT]: [
      "/dashboard",
      "/enrollment-records",
      "/lead-overview",
      "/lead-bulk-upload",
      "/batches",
      "/courses",
      "/trainers",
      "/meta-campaigns",
      "/reviews",
      "/meta-leads",
      "/attendance",
      "/announcements",
      "/reports",
      "/archived",
      "/hall-of-fame",
      "/invoices",
    ],
    [ROLES.SUPPORT]: [ // Digital Marketing
      "/dashboard",
      "/lead-overview",
      "/meta-campaigns",
      "/reviews",
      "/meta-leads",
      "/reports",
      "/archived", 
      "/lead-bulk-upload",
      "/attendance",
    ],
    // Fallback/Guest
    DEFAULT: ["/dashboard"],
  };

  // Filter Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    // 1. If Admin, allow everything
    if (roleIds.includes(ROLES.ADMIN)) return true;

    // 2. Merge permissions from all assigned roles
    const allowedPaths = [...new Set(
      roleIds.flatMap((id) => ROLE_PERMISSIONS[id] || []).concat(ROLE_PERMISSIONS.DEFAULT)
    )];

    // 3. Check if current path is allowed
    return allowedPaths.includes(item.path);
  });

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`sidebar-scroll sidebar-inter fixed top-0 left-0 z-40 flex h-screen flex-col overflow-y-auto overflow-x-hidden border-r bg-white pb-0.5 pt-14 text-xs shadow-xs transition-all duration-300 ${
        isOpen ? "w-[232px]" : "w-16"
      }`}
      style={{ minHeight: "100vh", height: "100vh", fontFamily: 'Inter, sans-serif' }}
    >
      {isOpen && (
        <div className="mb-3 px-3">
          <h2 className="text-[9px] font-semibold uppercase tracking-wider text-red-500">
            Main
          </h2>
        </div>
      )}

      {/* Sidebar menu list - stacked, scrollable, consistent spacing */}
      <ul className="flex flex-1 flex-col gap-0.5 pb-4 text-xs font-semibold text-gray-700">
        {filteredMenuItems.map(({ icon, label, path }) => {
          const isActive =
            location.pathname === path ||
            (path === "/dashboard" && location.pathname === "/");
          return (
            <li key={path} className="px-1">
              <Link
                to={path}
                title={!isOpen ? label : ""}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 transition-colors duration-150 ${
                  isActive
                    ? "bg-gray-100 font-semibold text-primary shadow-[inset_2px_0_0_0_rgba(59,130,246,1)]"
                    : "hover:bg-gray-50"
                } ${!isOpen ? "justify-center" : ""}`}
                style={{ minHeight: 36 }}
              >
                <span className="flex-shrink-0 text-[17px]">{icon}</span>
                {isOpen && (
                  <span className="truncate text-xs leading-5 font-medium">
                    {label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
