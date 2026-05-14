import React from "react";
import {
  MdCalendarToday,
  MdDownload,
  MdFilterList,
  MdPeople,
  MdRefresh,
  MdSearch,
  MdWorkspaces,
} from "react-icons/md";
import "./EmployeeTracking.css";
import { statusLabels, statusMeta } from "./constants/employeeTrackingConstants";
import { useEmployeeTrackingController } from "./hooks/useEmployeeTrackingController";

export default function EmployeeTrackingMain({ setNavbarProps }) {
  const {
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
    pick,
    normalizeStatus,
    formatTime,
    getHours,
    getAvatarSrc,
    getAttendancePhotoUrl,
  } = useEmployeeTrackingController({ setNavbarProps });

  return (
    <div className="employment-tracking-page">
      <div className="et-hero">
        <div className="et-title-block">
          <p className="et-eyebrow">Team attendance</p>
          <h1>Employee Tracking</h1>
         
          <div className="et-meta">
            <span className="et-pill">
              <MdPeople />
              {users.length || 0} employees
            </span>
            <span className="et-pill subtle">
              <MdCalendarToday />
              {selectedDateLabel}
            </span>
          </div>
        </div>
        <div className="et-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="et-date"
          />

          <button className="et-btn primary">
            <MdDownload />
            Download
          </button>
        </div>
      </div>

      <div className="et-cards">
        {Object.keys(statusLabels).map((key) => (
          <div key={key} className={`et-card ${key}`}>
            <div className="et-card-title">{statusLabels[key]}</div>
            <div className="et-card-value">
              {loading ? "–" : summary[key] ?? 0}
            </div>
            <div className="et-card-hint">
              {statusMeta[key]?.hint || "\u00a0"}
            </div>
          </div>
        ))}
      </div>

      <div className="et-toolbar">
        <div className="et-search">
          <MdSearch className="et-search-icon" />
          <input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="et-filters">
          <button className="et-filter-chip">
            <MdFilterList />
            Filter
          </button>
          <div className="et-status-chips">
            {Object.keys(statusLabels).map((key) => (
              <button
                key={key}
                className={`et-chip ${key} ${
                  activeStatuses.includes(key) ? "active" : ""
                }`}
                onClick={() => toggleStatus(key)}
              >
                {statusLabels[key]}
              </button>
            ))}
          </div>
        </div>
        <div className="et-count">
          <MdWorkspaces />
          <span>
            {filteredRecords.length} of {records.length || 0} employees
          </span>
        </div>
      </div>

      <div className="et-table">
        <div className="et-table-head">
          <span>Employee</span>
          <span>Check In</span>
          <span>Photo</span>
          <span>Check Out</span>
          <span>Photo</span>
          <span>Hours</span>
          <span>Status</span>
          <span>Notes</span>
        </div>

        {error && <div className="et-error">{error}</div>}
        {!error && loading && (
          <div className="et-rows skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="et-row">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <span key={k} className="et-skel" />
                ))}
              </div>
            ))}
          </div>
        )}

        {!error && !loading && filteredRecords.length === 0 && (
          <div className="et-empty">No attendance records for this view.</div>
        )}

        {!error && !loading && filteredRecords.length > 0 && (
          <div className="et-rows">
            {filteredRecords.map((rec, idx) => {
              const status = normalizeStatus(rec);
              const name = pick(rec, ["full_name", "name", "username", "user.name"], "Employee");
              const role = pick(
                rec,
                ["role", "position", "designation", "user.role"],
                "Team member"
              );
              const avatarRaw =
                pick(rec, ["profile_image", "avatar", "user.avatar"], null) || null;
              const avatar = getAvatarSrc(avatarRaw);
              const checkIn = pick(
                rec,
                ["check_in_time", "checkIn", "attendance.check_in_time"],
                null
              );
              const checkOut = pick(
                rec,
                ["check_out_time", "checkOut", "attendance.check_out_time"],
                null
              );
              const hours = getHours(rec);

              return (
                <div key={`${name}-${idx}`} className="et-row">
                  <span className="et-user">
                    <span className="et-avatar">
                      {avatar ? (
                        <img src={avatar} alt={name} />
                      ) : (
                        (name?.[0] || "U").toUpperCase()
                      )}
                    </span>
                    <span>
                      <strong>{name}</strong>
                      <small>{role}</small>
                    </span>
                  </span>
                  <span>{formatTime(checkIn)}</span>
                  <span>
                    {getAttendancePhotoUrl(pick(rec, ["check_in_photo", "checkInPhoto", "attendance.check_in_photo"])) ? (
                       <img 
                         src={getAttendancePhotoUrl(pick(rec, ["check_in_photo", "checkInPhoto", "attendance.check_in_photo"]))} 
                         alt="In" 
                         className="et-table-photo" 
                         onClick={() => window.open(getAttendancePhotoUrl(pick(rec, ["check_in_photo", "checkInPhoto", "attendance.check_in_photo"])), '_blank')}
                       />
                    ) : <span className="et-no-photo">–</span>}
                  </span>
                  <span>{formatTime(checkOut)}</span>
                  <span>
                    {getAttendancePhotoUrl(pick(rec, ["check_out_photo", "checkOutPhoto", "attendance.check_out_photo"])) ? (
                       <img 
                         src={getAttendancePhotoUrl(pick(rec, ["check_out_photo", "checkOutPhoto", "attendance.check_out_photo"]))} 
                         alt="Out" 
                         className="et-table-photo" 
                         onClick={() => window.open(getAttendancePhotoUrl(pick(rec, ["check_out_photo", "checkOutPhoto", "attendance.check_out_photo"])), '_blank')}
                       />
                    ) : <span className="et-no-photo">–</span>}
                  </span>
                  <span>{hours ? `${hours} h` : "--"}</span>
                  <span>
                    <span className={`et-badge ${status}`}>
                      <span className="et-dot" />
                      {statusLabels[status]}
                    </span>
                  </span>
                  <span className="et-note">
                    {rec?.office_location || rec?.note || rec?.comment || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

