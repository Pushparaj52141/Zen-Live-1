import React from 'react';
import './AttendanceCalendar.css';

const AttendanceCalendar = ({ isOpen, onClose, month, year, attendanceData, holidays = [], onDateSelect, onPrevMonth, onNextMonth }) => {
  if (!isOpen) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const days = [];
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ isEmpty: true, key: `empty-${i}` });
  }

  const normalizeDate = (dateStr) => {
      if (!dateStr) return null;
      return dateStr.split('T')[0];
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const attendance = attendanceData?.find(record => {
        return normalizeDate(record.attendance_date) === dateStr;
    });

    const holiday = holidays?.find(h => normalizeDate(h.holiday_date) === dateStr);

    let status = 'absent';
    let statusClass = 'status-absent';

    if (holiday) {
        status = 'holiday';
        statusClass = 'status-holiday';
    } else if (attendance) {
        if (attendance.status === 'on_time') {
            status = 'present';
            statusClass = 'status-present';
        } else if (attendance.status === 'late') {
            status = 'late';
            statusClass = 'status-late';
        } else if (attendance.status === 'partial' || (attendance.check_in_time && !attendance.check_out_time)) {
            status = 'partial';
            statusClass = 'status-partial';
        } else if (attendance.status === 'absent') {
            status = 'absent';
            statusClass = 'status-absent';
        }
    } else {
        const d = new Date(year, month, day);
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
           status = 'weekend';
           statusClass = 'status-weekend';
        } else if (day > today.getDate() && isCurrentMonth) {
           status = 'future';
           statusClass = 'status-future';
        } else if (!isCurrentMonth && new Date(year, month, day) > today) {
           status = 'future';
           statusClass = 'status-future';
        }
    }

    const isToday = isCurrentMonth && day === today.getDate();

    days.push({
      date: day,
      dateStr,
      status,
      statusClass,
      attendance,
      holiday,
      isToday,
      key: `day-${day}`
    });
  }

  const formatTime = (datetime) => {
    if (!datetime) return '';
    return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-modal-header">
           <div className="calendar-nav-group">
              <button className="calendar-nav-btn" onClick={onPrevMonth}>&lt;</button>
              <h2>{monthNames[month]} {year}</h2>
              <button className="calendar-nav-btn" onClick={onNextMonth}>&gt;</button>
          </div>
          <div className="calendar-legend-mini">
             <span className="legend-dot present"></span> Present
             <span className="legend-dot late"></span> Late
             <span className="legend-dot holiday"></span> Holiday
          </div>
          <button className="calendar-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="calendar-grid-wrapper">
          <div className="calendar-weekdays">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="calendar-weekday-label">{day}</div>
            ))}
          </div>

          <div className="calendar-days-grid animate-fadeIn">
            {days.map((day) => {
              if (day.isEmpty) {
                return <div key={day.key} className="calendar-day-cell empty"></div>;
              }

              return (
                <div
                  key={day.key}
                  className={`calendar-day-cell ${day.statusClass} ${day.isToday ? 'today' : ''} ${day.status === 'holiday' ? 'holiday-cell' : ''}`}
                  onClick={() => onDateSelect && onDateSelect(day)}
                  title={day.holiday ? day.holiday.name : `${day.dateStr} - ${day.status}`}
                >
                  <div className="day-header">
                    <span className="day-number">{day.date}</span>
                    {day.status === 'present' && <span className="check-icon">✓</span>}
                  </div>

                  {day.holiday && (
                     <div className="day-holiday-name">{day.holiday.name}</div>
                  )}

                  {!day.holiday && day.attendance && (
                    <div className="day-times">
                      {day.attendance.check_in_time && (
                          <div className="time-pill in">
                             {formatTime(day.attendance.check_in_time)}
                          </div>
                      )}
                      {day.attendance.check_out_time && (
                          <div className="time-pill out">
                             {formatTime(day.attendance.check_out_time)}
                          </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
