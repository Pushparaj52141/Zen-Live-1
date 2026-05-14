import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@shared/api/client";
import { employeeTrackingService } from "../services/employeeTrackingService";

const pick = (record, paths, fallback = "") => {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc?.[key], record);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const normalizeStatus = (record) => {
  const status = (record?.status || record?.attendance_status || "").toLowerCase();
  if (record?.on_leave || status === "leave" || status === "on_leave") return "leave";
  if (status === "late" || record?.is_late) return "late";
  if (status === "present" || status === "on_time") return "present";
  if (record?.check_in_time || record?.checkIn) return record?.is_late ? "late" : "present";
  return "absent";
};

const formatTime = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getHours = (record) => {
  const hours =
    record?.total_hours ??
    record?.hours_worked ??
    record?.hours ??
    record?.duration ??
    record?.worked_hours;
  if (hours === null || hours === undefined) return null;
  const num = Number(hours);
  if (Number.isNaN(num)) return hours;
  return num.toFixed(1);
};

const getAvatarSrc = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.startsWith("data:")) return trimmed;
  return `data:image/png;base64,${trimmed}`;
};

const getAttendancePhotoUrl = (path) => {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim().replace(/\\/g, "/");
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.startsWith("data:")) return trimmed;
  const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (cleanPath.startsWith("uploads/")) return `${API_BASE_URL}/${cleanPath}`;
  return `${API_BASE_URL}/uploads/attendance/${cleanPath}`;
};

export function useEmployeeTrackingController({ setNavbarProps }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeStatuses, setActiveStatuses] = useState(["present", "late", "leave", "absent"]);

  useEffect(() => {
    setNavbarProps?.({ title: "Employee Tracking", breadcrumb: ["Employee Tracking"] });
  }, [setNavbarProps]);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const loadData = async (dateStr) => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, attendanceRes] = await Promise.all([
        employeeTrackingService.fetchUsers(),
        employeeTrackingService.fetchAttendance(dateStr),
      ]);
      const userList = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes?.data?.data)
        ? usersRes.data.data
        : [];
      setUsers(userList);

      const attendanceList = Array.isArray(attendanceRes?.data)
        ? attendanceRes.data
        : Array.isArray(attendanceRes?.records)
        ? attendanceRes.records
        : Array.isArray(attendanceRes)
        ? attendanceRes
        : [];

      const attendanceMap = {};
      attendanceList.forEach((rec) => {
        const key = rec?.user_id || rec?.userId || rec?.user?.id || rec?.id;
        if (key != null) attendanceMap[key] = rec;
      });

      const combined = userList.map((u) => {
        const att = attendanceMap[u.id] || attendanceMap[u.user_id] || attendanceMap[u.userId];
        return {
          ...att,
          user_id: u.id,
          full_name: u.username || u.name,
          role: u.role_name || u.role || u.position,
          profile_image: u.profile_image,
          attendance_status: att?.status || att?.attendance_status,
        };
      });

      attendanceList.forEach((rec) => {
        const key = rec?.user_id || rec?.userId || rec?.user?.id || rec?.id;
        if (key != null && !combined.find((c) => c.user_id === key)) {
          combined.push({
            ...rec,
            user_id: key,
            full_name: rec?.user?.username || rec?.user?.name || rec?.username || "Employee",
            role: rec?.user?.role || rec?.role,
            profile_image: rec?.user?.profile_image,
            attendance_status: rec?.status || rec?.attendance_status,
          });
        }
      });

      setRecords(combined);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load attendance data.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const base = { present: 0, late: 0, leave: 0, absent: 0, total: records.length };
    records.forEach((rec) => {
      const status = normalizeStatus(rec);
      if (status === "late") {
        base.late += 1;
        base.present += 1;
      } else {
        base[status] = (base[status] || 0) + 1;
      }
    });
    return base;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((rec) => {
      const status = normalizeStatus(rec);
      if (status === "late") {
        if (!activeStatuses.includes("late") && !activeStatuses.includes("present")) return false;
      } else if (!activeStatuses.includes(status)) return false;

      if (!query) return true;
      const name = pick(rec, ["full_name", "name", "username", "user.name"], "");
      const role = pick(rec, ["role", "position", "designation", "user.role"], "");
      return name.toLowerCase().includes(query) || role.toLowerCase().includes(query);
    });
  }, [records, activeStatuses, search]);

  const toggleStatus = (key) => {
    setActiveStatuses((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const selectedDateLabel = useMemo(
    () =>
      new Date(selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [selectedDate]
  );

  return {
    selectedDate,
    setSelectedDate,
    records,
    users,
    loading,
    error,
    search,
    setSearch,
    activeStatuses,
    summary,
    filteredRecords,
    toggleStatus,
    selectedDateLabel,
    loadData,
    pick,
    normalizeStatus,
    formatTime,
    getHours,
    getAvatarSrc,
    getAttendancePhotoUrl,
  };
}

