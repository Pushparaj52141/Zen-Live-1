export function formatLocalDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTime(dateStr) {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getGreetingForDate(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function mapAttendanceByDate(records = []) {
  const attendanceMap = {};
  records.forEach((record) => {
    const date = record.attendance_date.split("T")[0];
    attendanceMap[date] = record;
  });
  return attendanceMap;
}

export function buildWeekDays(todayAttendance, weekAttendance) {
  const days = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const attendance = dateStr === todayStr ? todayAttendance : weekAttendance[dateStr];
    let status = "absent";
    if (attendance) {
      if (attendance.check_in_time && attendance.check_out_time) status = "present";
      else if (attendance.check_in_time) status = "partial";
    }
    days.push({
      date: d.getDate(),
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      isToday: i === 0,
      dateStr,
      status,
      attendance,
    });
  }
  return days;
}

export function buildRecentActivities(history, todayAttendance) {
  const activitiesByDate = {};
  history.forEach((record) => {
    const dateKey = record.attendance_date.split("T")[0];
    const dateDisplay = new Date(record.attendance_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!activitiesByDate[dateKey]) {
      activitiesByDate[dateKey] = {
        date: dateDisplay,
        dateKey,
        checkIn: record.check_in_time,
        checkOut: record.check_out_time,
      };
    }
  });
  if (todayAttendance) {
    const todayKey = formatLocalDate(new Date());
    activitiesByDate[todayKey] = {
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateKey: todayKey,
      checkIn: todayAttendance.check_in_time,
      checkOut: todayAttendance.check_out_time,
    };
  }
  return Object.values(activitiesByDate)
    .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey))
    .slice(0, 5);
}
