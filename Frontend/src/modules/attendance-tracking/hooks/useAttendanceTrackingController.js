import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { attendanceTrackingService } from "../services/attendanceTrackingService";
import {
  buildRecentActivities,
  buildWeekDays,
  formatLocalDate,
  formatTime,
  getGreetingForDate,
  mapAttendanceByDate,
} from "../utils/attendanceTrackingUtils";

export function useAttendanceTrackingController(authUser) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [user, setUser] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({
    present_days: 0,
    partial_days: 0,
    absent_days: 0,
    total_days: 0,
  });
  const [history, setHistory] = useState([]);
  const [weekAttendance, setWeekAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateAttendance, setSelectedDateAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedTime, setCapturedTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const fetchHolidays = async () => {
    try {
      const res = await attendanceTrackingService.getHolidays();
      setHolidays(res.data.data || []);
    } catch {}
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await attendanceTrackingService.getTodayAttendance();
      setTodayAttendance(res.data.data || null);
    } catch {
      setTodayAttendance(null);
    }
  };

  const fetchDateAttendance = async (dateStr) => {
    try {
      const res = await attendanceTrackingService.getAttendanceHistory({
        startDate: dateStr,
        endDate: dateStr,
        limit: 1,
      });
      let foundRecord = null;
      if (res.data.data && res.data.data.length > 0) {
        foundRecord = res.data.data.find((r) => r.attendance_date.startsWith(dateStr));
        if (!foundRecord && res.data.data.length === 1) {
          foundRecord = res.data.data[0];
        }
      }
      if (!foundRecord && weekAttendance[dateStr]) foundRecord = weekAttendance[dateStr];
      setSelectedDateAttendance(foundRecord || null);
      return foundRecord;
    } catch {
      if (weekAttendance[dateStr]) {
        setSelectedDateAttendance(weekAttendance[dateStr]);
        return weekAttendance[dateStr];
      }
      setSelectedDateAttendance(null);
      return null;
    }
  };

  const fetchMonthlyAttendance = async (month, year) => {
    try {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const firstDay = formatLocalDate(start);
      const lastDay = formatLocalDate(end);
      const res = await attendanceTrackingService.getAttendanceHistory({
        startDate: firstDay,
        endDate: lastDay,
      });
      setMonthlyAttendance(res.data.data || []);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const firstDay = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const lastDay = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const res = await attendanceTrackingService.getAttendanceStats({
        startDate: firstDay,
        endDate: lastDay,
      });
      if (res.data.data) setStats(res.data.data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await attendanceTrackingService.getAttendanceHistory({ limit: 90 });
      setHistory(res.data.data || []);
    } catch {}
  };

  const fetchWeekAttendance = async () => {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 4);
      const weekEnd = new Date(today);
      const res = await attendanceTrackingService.getAttendanceHistory({
        startDate: formatLocalDate(weekStart),
        endDate: formatLocalDate(weekEnd),
        limit: 10,
      });
      const attendanceMap = mapAttendanceByDate(res.data.data || []);
      setWeekAttendance(attendanceMap);
    } catch {}
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authUser) setUser(authUser);
    setSelectedDate(null);
    setSelectedDateAttendance(null);
    fetchTodayAttendance();
    fetchStats();
    fetchHistory();
    fetchWeekAttendance();
    fetchHolidays();

    const handleTriggerCheckIn = () => openCamera("check-in");
    window.addEventListener("zen:openCheckIn", handleTriggerCheckIn);
    return () => window.removeEventListener("zen:openCheckIn", handleTriggerCheckIn);
  }, [authUser]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!showCamera) stopCamera();
  }, [showCamera]);

  useEffect(() => {
    if (showCalendarModal) {
      fetchMonthlyAttendance(calendarMonth.getMonth(), calendarMonth.getFullYear());
    }
  }, [calendarMonth, showCalendarModal]);

  const startCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error("Camera not available. Please allow camera access.");
    }
  };

  const openCamera = async (mode) => {
    setCameraMode(mode);
    setShowCamera(true);
    setCapturedImage(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        () => {
          toast.error("Location access denied. Location will not be recorded.");
        }
      );
    }
    await startCamera();
  };

  const closeCamera = () => {
    setShowCamera(false);
    setCapturedImage(null);
    setCameraMode(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 600 / videoRef.current.videoWidth);
      canvas.width = videoRef.current.videoWidth * scale;
      canvas.height = videoRef.current.videoHeight * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL("image/jpeg", 0.7));
      setCapturedTime(new Date());
    }
  };

  const submitAttendance = async () => {
    if (!capturedImage) {
      toast.error("Please capture a photo first!");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        photo: capturedImage,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        attendance_date: formatLocalDate(new Date()),
      };
      if (cameraMode === "check-in") {
        await attendanceTrackingService.checkIn(payload);
      } else {
        await attendanceTrackingService.checkOut(payload);
      }
      await Promise.all([
        fetchTodayAttendance(),
        fetchStats(),
        fetchHistory(),
        fetchWeekAttendance(),
        fetchHolidays(),
      ]);
      toast.success(
        cameraMode === "check-in"
          ? "Checked In Successfully!"
          : "Checked Out Successfully!"
      );
      if (cameraMode === "check-in") {
        window.dispatchEvent(new CustomEvent("zen:checkedIn"));
      }
      closeCamera();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to submit attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGreeting = () => getGreetingForDate(currentTime);
  const getWeekDays = () => buildWeekDays(todayAttendance, weekAttendance);
  const getActivityList = () => buildRecentActivities(history, todayAttendance);

  const displayAttendance =
    selectedDate !== null ? selectedDateAttendance : todayAttendance;
  const isCheckedIn =
    displayAttendance?.check_in_time && !displayAttendance?.check_out_time;
  const isCheckedOut = !!displayAttendance?.check_out_time;
  const todayStr = formatLocalDate(new Date());
  const isSelectedDateToday = selectedDate === todayStr;
  const displayDate = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : currentTime;

  const handleDateClick = (dateStr) => {
    if (dateStr === todayStr) {
      handleResetToToday();
    } else {
      setSelectedDate(dateStr);
      fetchDateAttendance(dateStr);
    }
  };

  const handleResetToToday = () => {
    setSelectedDate(null);
    setSelectedDateAttendance(null);
    fetchTodayAttendance();
  };

  const handleCalendarDayClick = (day) => {
    setShowCalendarModal(false);
    handleDateClick(day.dateStr);
  };

  return {
    activeTab,
    setActiveTab,
    user,
    stats,
    selectedDate,
    currentTime,
    showCalendarModal,
    setShowCalendarModal,
    calendarMonth,
    setCalendarMonth,
    monthlyAttendance,
    holidays,
    showCamera,
    cameraMode,
    capturedImage,
    capturedTime,
    isSubmitting,
    userLocation,
    videoRef,
    isCheckedIn,
    isCheckedOut,
    isSelectedDateToday,
    displayDate,
    displayAttendance,
    formatTime,
    getGreeting,
    getWeekDays,
    getActivityList,
    handleDateClick,
    handleResetToToday,
    handleCalendarDayClick,
    openCamera,
    closeCamera,
    startCamera,
    capturePhoto,
    submitAttendance,
    fetchStats,
  };
}
