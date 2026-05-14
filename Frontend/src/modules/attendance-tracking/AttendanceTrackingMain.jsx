import React from 'react';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useAttendanceTrackingController } from './hooks/useAttendanceTrackingController';
import {
  FaCheck,
  FaClock,
  FaCalendarAlt,
  FaBell,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaHourglassHalf,
  FaCalendarCheck,
  FaCog
} from 'react-icons/fa';
import CameraModal from './CameraModal';
import AttendanceCalendar from './AttendanceCalendar';
import LeaveBalances from '@modules/leave/LeaveBalances';
import LeaveRequests from './LeaveRequests';
import ApplyLeaveForm from '@modules/leave/ApplyLeaveForm';
import SystemSettingsMain from '@modules/system-settings/SystemSettingsMain';
import './AttendanceTracking.css';

export default function AttendanceTrackingMain() {
  const authUser = useSelector((state) => state.auth.user);
  const {
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
  } = useAttendanceTrackingController(authUser);

  return (
    <div className="attendance-page font-sans bg-slate-50 min-h-screen">
      <Toaster position="top-right" containerStyle={{ top: 80 }} />
      <div className="attendance-layout max-w-7xl mx-auto p-4 md:p-6 gap-6 grid grid-cols-1 md:grid-cols-4">
        <aside className="profile-sidebar bg-slate-900 text-white rounded-2xl p-6 flex flex-col gap-6 shadow-xl h-full md:col-span-1">
          <div className="profile-card flex flex-col items-center text-center pb-6 border-b border-slate-700">
            <div className="profile-avatar relative mb-3">
              {user?.profile_image ? (
                <img src={user.profile_image.startsWith('data:') ? user.profile_image : `data:image/png;base64,${user.profile_image}`} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-lg" />
              ) : (
                <span className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
              )}
              <div className={`status-dot absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${isCheckedIn && !selectedDate ? 'bg-green-500' : 'bg-slate-400'}`}></div>
            </div>
            <h2 className="profile-name text-lg font-bold">{user?.username || 'Employee'}</h2>
            <p className="profile-role text-xs text-slate-400 uppercase tracking-wider mt-1">{user?.role || 'Team Member'}</p>
          </div>

          <div className="sidebar-stats grid grid-cols-2 gap-2">
            <div className="mini-stat bg-slate-800 p-3 rounded-lg flex flex-col items-center">
              <span className="stat-num text-xl font-bold text-green-400">{stats.present_days || 0}</span>
              <span className="stat-label text-[10px] text-slate-400 uppercase">Present</span>
            </div>
            <div className="mini-stat bg-slate-800 p-3 rounded-lg flex flex-col items-center">
              <span className="stat-num text-xl font-bold text-amber-400">{stats.partial_days || 0}</span>
              <span className="stat-label text-[10px] text-slate-400 uppercase">Partial</span>
            </div>
            <div className="mini-stat bg-slate-800 p-3 rounded-lg flex flex-col items-center">
               <span className="stat-num text-xl font-bold text-red-400">{stats.absent_days || 0}</span>
               <span className="stat-label text-[10px] text-slate-400 uppercase">Absent</span>
            </div>
            <div className="mini-stat bg-slate-800 p-3 rounded-lg flex flex-col items-center">
               <span className="stat-num text-xl font-bold text-indigo-400">{stats.total_days || 0}</span>
               <span className="stat-label text-[10px] text-slate-400 uppercase">Total</span>
            </div>
          </div>

          <nav className="sidebar-menu flex flex-col gap-2 mt-2">
            <button
              className={`menu-item flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              onClick={() => setActiveTab('attendance')}
            >
              <FaClock /> Daily Checkin
            </button>

            {!(user?.role === 'Admin' || user?.role === 'admin' || user?.r_id === 1 || user?.role_id === 1) && (
              <>
                <button
                  className={`menu-item flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'apply_leave' ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  onClick={() => setActiveTab('apply_leave')}
                >
                  <FaCalendarAlt /> Apply Leave
                </button>
                <button
                  className={`menu-item flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'permission' ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  onClick={() => setActiveTab('permission')}
                >
                  <FaHourglassHalf /> Permission
                </button>
              </>
            )}

            {(user?.role === 'Admin' || user?.role === 'admin' || user?.r_id === 1 || user?.role_id === 1) && (
               <button
                 className={`menu-item flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                 onClick={() => setActiveTab('approvals')}
               >
                 <FaCheckCircle /> Approvals
               </button>
            )}

            <button className="menu-item flex items-center gap-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all" onClick={() => setShowCalendarModal(true)}>
              <FaCalendarCheck /> Calendar View
            </button>

            {(user?.role === 'Admin' || user?.role === 'admin' || user?.r_id === 1 || user?.role_id === 1) && (
              <button
                className={`menu-item flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                onClick={() => setActiveTab('settings')}
              >
                <FaCog /> Settings
              </button>
            )}
          </nav>
        </aside>

        <main className="main-content flex-1 flex flex-col gap-6 md:col-span-3">
          <div className="content-header flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="greeting">
              <h1 className="text-2xl font-bold text-slate-800">{getGreeting()}, <span className="text-indigo-600">{user?.username?.split(' ')[0] || 'there'}!</span></h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {selectedDate && !isSelectedDateToday && (
                  <button onClick={handleResetToToday} className="text-indigo-500 text-xs font-bold px-2 py-0.5 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">(Back to Today)</button>
                )}
              </p>
            </div>
            <div className="live-time flex items-center gap-4">
              <span className="time-display text-3xl font-mono font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>

          <div className="tab-switcher-container bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 inline-flex gap-1">
            <button
              className={`tab-btn px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('attendance')}
            >
              <FaClock className="inline mr-2" />
              Attendance
            </button>

            {!(user?.role === 'Admin' || user?.role === 'admin' || user?.r_id === 1 || user?.role_id === 1) && (
              <button
                className={`tab-btn px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'my_leaves'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('my_leaves')}
              >
                <FaBell className="inline mr-2" />
                My Requests
              </button>
            )}

            {(['admin', 'Admin'].includes(user?.role) || user?.r_id == 1 || user?.role_id == 1) && (
              <button
                className={`tab-btn px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'approvals'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('approvals')}
              >
                <FaCheckCircle className="inline mr-2" />
                Approvals
              </button>
            )}
          </div>

          {activeTab === 'attendance' && (
          <>
          <div className={`hero-section relative overflow-hidden rounded-2xl p-8 flex items-center justify-between text-white shadow-lg transition-all ${
             selectedDate ? 'bg-slate-700' : isCheckedOut ? 'bg-indigo-600' : isCheckedIn ? 'bg-emerald-500' : 'bg-slate-800'
          }`}>
            <div className="hero-content z-10 w-2/3">
              <h2 className="text-3xl font-bold mb-2">
                {selectedDate
                  ? (isCheckedOut ? "Work Completed" : isCheckedIn ? "Partial Attendance" : "Absent / No Record")
                  : (isCheckedIn ? "You are Clocked In" : isCheckedOut ? "Great Job Today!" : "Ready to Start?")
                }
              </h2>
              <p className="text-white/80 font-medium text-lg mb-4">
                {displayAttendance && isCheckedIn
                  ? `Checked in at ${formatTime(displayAttendance.check_in_time)}`
                  : displayAttendance && isCheckedOut
                    ? `Total working hours: ${Number(displayAttendance.total_hours || 0).toFixed(1)} hrs`
                    : selectedDate
                      ? "No active session for this date"
                      : "Mark your attendance to begin your day"}
              </p>
              {(displayAttendance?.office_location || displayAttendance?.check_out_office_location) && (
                <div className="location-info-container flex flex-col gap-1">
                  {displayAttendance?.office_location && (
                    <div className="location-badge inline-flex items-center gap-2 text-[10px] font-bold bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm w-fit">
                      <FaMapMarkerAlt className="text-emerald-400" />
                      <span>
                        IN: {displayAttendance.office_location}
                        {displayAttendance.is_in_office ? ' (Office)' : ' (Remote)'}
                      </span>
                    </div>
                  )}
                  {displayAttendance?.check_out_office_location && (
                    <div className="location-badge inline-flex items-center gap-2 text-[10px] font-bold bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm w-fit">
                      <FaMapMarkerAlt className="text-indigo-400" />
                      <span>
                        OUT: {displayAttendance.check_out_office_location}
                        {displayAttendance.check_out_is_in_office ? ' (Office)' : ' (Remote)'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

             <div className="z-10 flex flex-col items-end gap-2">
            {!selectedDate && !isCheckedOut && (
               <button
                  className={`px-8 py-3 rounded-xl font-bold text-lg shadow-xl transition-transform active:scale-95 flex items-center gap-2 hero-btn-pulse ${
                    isCheckedIn
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                    : 'bg-emerald-500 text-white hover:bg-emerald-400 border-2 border-emerald-400/50'
                  }`}
                  onClick={() => openCamera(isCheckedIn ? 'check-out' : 'check-in')}
                >
                  <FaClock /> {isCheckedIn ? 'Check Out Now' : 'Check In Now'}
               </button>
            )}
            {!selectedDate && isCheckedOut && (
                 <button className="px-8 py-3 rounded-xl font-bold text-lg bg-white/20 text-white cursor-default flex items-center gap-2" disabled>
                  <FaCheck /> Done for Today
                </button>
            )}
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
          </div>

          <h3 className="section-title text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedDate ? 'Past Attendance Summary' : "Today's Overview"}</h3>
          <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="stat-card-label text-xs font-bold text-slate-400 uppercase">Check In</div>
              <div className="stat-card-value text-2xl font-bold text-slate-800">{formatTime(displayAttendance?.check_in_time)}</div>
              <div className={`stat-card-status text-xs font-bold px-2 py-1 rounded-md w-fit ${
                 displayAttendance?.status === 'on_time' ? 'bg-green-100 text-green-700' :
                 displayAttendance?.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {displayAttendance?.status === 'on_time' ? 'On Time' :
                 displayAttendance?.status === 'late' ? 'Late' :
                 (displayAttendance?.check_in_time) ? 'Checked In' : '--'}
              </div>
              <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
            </div>

            <div className="stat-card bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="stat-card-label text-xs font-bold text-slate-400 uppercase">Check Out</div>
              <div className="stat-card-value text-2xl font-bold text-slate-800">{formatTime(displayAttendance?.check_out_time)}</div>
              <div className={`stat-card-status text-xs font-bold px-2 py-1 rounded-md w-fit ${
                displayAttendance?.check_out_time ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {displayAttendance?.check_out_time ? 'Completed' : 'Pending'}
              </div>
            </div>

            <div className="stat-card bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="stat-card-label text-xs font-bold text-slate-400 uppercase">Break Time</div>
              <div className="stat-card-value text-2xl font-bold text-slate-800">{displayAttendance?.break_duration || 0} <span className="text-sm font-medium text-slate-400">min</span></div>
              <div className="text-xs text-slate-400">Avg 30 min allowed</div>
            </div>

             <div className="stat-card bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="stat-card-label text-xs font-bold text-slate-400 uppercase">Total Hours</div>
              <div className="stat-card-value text-2xl font-bold text-indigo-600">{Number(displayAttendance?.total_hours || 0).toFixed(1)} <span className="text-sm font-medium text-slate-400">hrs</span></div>
              <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(((displayAttendance?.total_hours || 0) / 9) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <LeaveBalances />

          <div className="bottom-row grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="activity-card bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
              <h3 className="section-title text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>Recent Activity</span>
                <span className="text-xs text-indigo-500 cursor-pointer">View All</span>
              </h3>
              <div className="flex flex-col gap-4">
              {getActivityList().map((activity, idx) => (
                <div className="activity-row flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 relative group" key={idx}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.checkIn ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-700">{activity.date}</span>
                         <span className={`text-[10px] uppercase font-bold ${activity.checkIn && activity.checkOut ? 'text-green-600' : 'text-amber-500'}`}>
                            {activity.checkIn && activity.checkOut ? 'Present' : 'Partial'}
                         </span>
                    </div>
                  </div>
                   <div className="text-right">
                       <div className="text-xs font-mono font-medium text-slate-800">{activity.checkIn ? formatTime(activity.checkIn) : '--:--'}</div>
                       <div className="text-[10px] text-slate-400">In Time</div>
                   </div>
                </div>
              ))}
              {getActivityList().length === 0 && <p className="text-sm text-slate-400 text-center py-4">No recent activity found.</p>}
              </div>
            </div>

            <div className="calendar-card bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="section-title text-sm font-bold text-slate-800 mb-4">This Week</h3>
              <div className="week-days flex justify-between gap-2">
                {getWeekDays().map((day, idx) => {
                  const isSelected = selectedDate === day.dateStr || (!selectedDate && day.isToday);
                  return (
                    <div
                      key={idx}
                      className={`week-day flex-1 flex flex-col items-center justify-center py-4 rounded-xl cursor-pointer transition-all ${
                        isSelected
                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
                        : day.isToday
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => handleDateClick(day.dateStr, day)}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{day.name}</span>
                      <span className="text-xl font-bold my-1">{String(day.date).padStart(2, '0')}</span>
                      {day.status !== 'absent' && (
                         <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : day.status === 'present' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          </>
          )}

          {activeTab === 'my_leaves' && (
            <LeaveRequests viewMode="my" />
          )}

          {activeTab === 'approvals' && (
            <LeaveRequests viewMode="all" />
          )}

          {activeTab === 'apply_leave' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-indigo-600" /> Apply for Leave
                </h2>
                <ApplyLeaveForm onSuccess={() => {
                    setActiveTab('my_leaves');
                    fetchStats();
                }} />
             </div>
          )}

          {activeTab === 'permission' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FaClock className="text-indigo-600" /> Request Permission
                </h2>
                <ApplyLeaveForm onSuccess={() => {
                    setActiveTab('my_leaves');
                    fetchStats();
                }} initialType="Permission" />
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <SystemSettingsMain />
             </div>
          )}

        </main>
      </div>

      {showCamera && (
        <CameraModal
          videoRef={videoRef}
          image={capturedImage}
          capturedTime={capturedTime}
          location={userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : null}
          onCancel={closeCamera}
          onRetake={() => { setCapturedImage(null); startCamera(); }}
          onSubmit={submitAttendance}
          onCapture={capturePhoto}
          type={cameraMode}
          isSubmitting={isSubmitting}
        />
      )}

      <AttendanceCalendar
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          month={calendarMonth.getMonth()}
          year={calendarMonth.getFullYear()}
          attendanceData={monthlyAttendance}
          holidays={holidays}
          onDateSelect={handleCalendarDayClick}
          onPrevMonth={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
      />
    </div>
  );
}
