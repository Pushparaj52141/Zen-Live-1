import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Layout from "@app/layout/Layout";
import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";
import { checkAuthStatus, logout as logoutThunk } from "@modules/auth/store/authSlice";

const LoginPage = lazy(() => import("@modules/auth/components/LoginPage"));

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  
  const isPublicRoute = location.pathname === "/login" || location.pathname.startsWith("/enroll/");
  const isEnrollmentPage = location.pathname.startsWith("/enroll/");

  const checkAttendance = async () => {
    if (!isAuthenticated || !user) {
      setIsAttendanceLoading(false);
      setIsCheckedInToday(false);
      return;
    }

    const roleIds =
      Array.isArray(user.role_ids) && user.role_ids.length
        ? user.role_ids.map((r) => Number(r)).filter((r) => Number.isInteger(r))
        : user.role_id != null
          ? [Number(user.role_id)]
          : [];

    const isAdmin = roleIds.includes(1) || String(user.role || "").toLowerCase() === "admin";
    if (isAdmin) {
      setIsCheckedInToday(true);
      setIsAttendanceLoading(false);
      return;
    }

    setIsAttendanceLoading(true);
    try {
      const { data } = await apiClient.get(endpoints.attendance.today);
      if (data && data.success && data.data && data.data.check_in_time) {
        setIsCheckedInToday(true);
      } else {
        setIsCheckedInToday(false);
      }
    } catch (error) {
      console.error("Error checking attendance status:", error);
      setIsCheckedInToday(false);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  useEffect(() => {
    // One-time cleanup of legacy sensitive localStorage keys.
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key === "token" ||
          key === "user" ||
          key === "user_id" ||
          key === "username" ||
          key === "profile_image" ||
          key.startsWith("profile_")
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore storage errors
    }

    dispatch(checkAuthStatus());
  }, [dispatch]);

  // Combined effect to handle initial state and redirection logic
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      checkAttendance();
    } else if (!isLoading && !isAuthenticated) {
      setIsAttendanceLoading(false);
      setIsCheckedInToday(false);
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const handleCheckInEvent = () => setIsCheckedInToday(true);
    window.addEventListener('zen:checkedIn', handleCheckInEvent);
    return () => window.removeEventListener('zen:checkedIn', handleCheckInEvent);
  }, []);

  const handleLoginSuccess = async () => {
    // After login, re-check server session (HttpOnly cookies).
    try {
      await dispatch(checkAuthStatus());
    } finally {
      navigate("/attendance");
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk());
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      setIsCheckedInToday(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        navigate("/login", { replace: true });
      } else if (isAuthenticated && location.pathname === "/login") {
        navigate("/attendance", { replace: true });
      } else if (isAuthenticated && !isCheckedInToday && !isAttendanceLoading && !isPublicRoute && location.pathname !== "/attendance") {
        // Redirection logic for mandatory check-in
        import("sweetalert2").then(({ default: Swal }) => {
          Swal.fire({
            icon: 'warning',
            title: 'Action Required',
            text: 'You must check in for the day before you can access other pages.',
            confirmButtonText: 'Go to Check-in',
            confirmButtonColor: '#4f46e5',
            allowOutsideClick: false
          }).then((result) => {
            if (result.isConfirmed) {
              window.dispatchEvent(new CustomEvent('zen:openCheckIn'));
            }
          });
        });
        navigate("/attendance", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, isCheckedInToday, isAttendanceLoading, location.pathname, navigate, isPublicRoute]);

  const isAppInitializing = isLoading || (isAuthenticated && isAttendanceLoading);

  if (isAppInitializing) {
    return null;
  }

  // Handle Public Enrollment Pages (No Layout/Sidebar)
  if (isEnrollmentPage) {
    return (
      <Suspense fallback={null}>
        {children}
      </Suspense>
    );
  }

  // Handle Login Page
  if (!isAuthenticated && location.pathname === "/login") {
    return (
      <Suspense fallback={null}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  // If not authenticated and not a public route, we'll be redirected by the useEffect
  // but we return null here to avoid rendering anything in between
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <Layout onLogout={handleLogout}>{children}</Layout>;
};

export default AuthProvider;
