import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import apiClient, { API_BASE_URL } from '@shared/api/client'
import Swal from 'sweetalert2';
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaCalendarAlt,
  FaUmbrellaBeach
} from 'react-icons/fa';
import './LeaveRequests.css';

export default function LeaveRequests({ viewMode = 'my' }) {
  const authUser = useSelector((state) => state.auth.user);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const roleIds = Array.isArray(authUser?.role_ids)
      ? authUser.role_ids.map((r) => Number(r))
      : authUser?.role_id
        ? [Number(authUser.role_id)]
        : [];
    setUserRole(roleIds.includes(1) ? 'admin' : (authUser?.role || '').toLowerCase());
    fetchLeaveRequests();
  }, [viewMode, authUser]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const endpoint = viewMode === 'all'
        ? '/api/leave/all'
        : '/api/leave/my-leaves';

      const response = await apiClient.get(endpoint);

      if (response.data.success) {
        setLeaveRequests(response.data.data || []);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch leave requests'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    let reason = null;

    if (status === 'Rejected') {
      const { value: rejectionReason, isConfirmed } = await Swal.fire({
        title: 'Rejection Reason',
        input: 'textarea',
        inputLabel: 'Please provide a reason for rejection',
        inputPlaceholder: 'Enter reason here...',
        inputAttributes: {
          'aria-label': 'Rejection reason'
        },
        showCancelButton: true,
        confirmButtonText: 'Reject',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6c757d',
        inputValidator: (value) => {
          if (!value || value.trim().length < 5) {
            return 'Please provide a reason (min 5 characters)';
          }
        },
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-xl font-bold text-slate-800'
        }
      });

      if (!isConfirmed) return;
      reason = rejectionReason;
    } else {
      const { isConfirmed } = await Swal.fire({
        title: 'Approve Leave Request?',
        text: 'This will deduct the leave balance for the employee.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6c757d',
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-xl font-bold text-slate-800'
        }
      });

      if (!isConfirmed) return;
    }

    try {
      const response = await apiClient.put(
        `/api/leave/${leaveId}/status`,
        {
          status,
          rejection_reason: reason
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: `Leave ${status}`,
          timer: 2000,
          showConfirmButton: false
        });
        fetchLeaveRequests();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to update leave status'
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-badge-approved';
      case 'Rejected':
        return 'status-badge-rejected';
      default:
        return 'status-badge-pending';
    }
  };

  const getTypeColor = (leaveType) => {
    const colors = {
      'Sick Leave': '#ef4444',
      'Casual Leave': '#3b82f6',
      'Earned Leave': '#10b981',
      'Maternity Leave': '#f59e0b',
      'Paternity Leave': '#6366f1',
      'Unpaid Leave': '#6b7280',
      'Permission': '#8b5cf6'
    };
    return colors[leaveType] || '#8b5cf6';
  };

  if (loading) {
    return (
      <div className="leave-requests-loading">
        <div className="spinner"></div>
        <p>Loading leave requests...</p>
      </div>
    );
  }

  return (
    <div className="leave-requests-container">
      <div className="leave-requests-header">
        <div className="header-content">
          <FaUmbrellaBeach className="header-icon" />
          <div>
            <h3>Leave Requests</h3>
            <p>{userRole === 'admin' ? 'Manage all team leave requests' : 'View your leave request status'}</p>
          </div>
        </div>
      </div>

      {leaveRequests.length === 0 ? (
        <div className="empty-state">
          <FaUmbrellaBeach className="empty-icon" />
          <h4>No leave requests</h4>
          <p>{userRole === 'Admin' ? 'No pending requests at the moment' : 'You haven\'t submitted any leave requests yet'}</p>
        </div>
      ) : (
        <div className="leave-requests-table-wrapper">
          <table className="leave-requests-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                {viewMode === 'all' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((leave) => {
                const startDate = new Date(leave.from_date);
                const endDate = new Date(leave.to_date);
                const hasTimes = !!(leave.start_time && leave.end_time);
                const isActuallyPermission = hasTimes || (leave.leave_type_name?.toLowerCase().trim() === 'permission');
                const displayLeaveTypeName = isActuallyPermission ? 'Permission' : leave.leave_type_name;

                let durationText = '';
                if (isActuallyPermission) {
                  if (hasTimes) {
                    const [h1, m1] = leave.start_time.split(':').map(Number);
                    const [h2, m2] = leave.end_time.split(':').map(Number);
                    let diffHours = (h2 + m2 / 60) - (h1 + m1 / 60);
                    if (diffHours < 0) diffHours += 24;
                    durationText = `${diffHours.toFixed(1)} hrs`;
                  } else {
                    durationText = '—';
                  }
                } else {
                  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                  durationText = `${durationDays} ${durationDays === 1 ? 'day' : 'days'}`;
                }

                return (
                  <tr key={leave.id} className={`leave-row ${leave.status.toLowerCase()}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                          {leave.profile_image && typeof leave.profile_image === 'string' ? (
                             <img
                               src={
                                 leave.profile_image.startsWith('data:') || leave.profile_image.startsWith('http')
                                   ? leave.profile_image
                                   : `${API_BASE_URL}/${leave.profile_image.startsWith('/') ? leave.profile_image.slice(1) : leave.profile_image}`
                               }
                               alt={leave.username}
                               className="w-full h-full object-cover"
                             />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                {leave.username?.charAt(0).toUpperCase() || 'U'}
                             </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                           <strong className="text-sm text-slate-800">{leave.username}</strong>
                           {leave.email && <small className="text-xs text-slate-500">{leave.email}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="leave-type-badge"
                        style={{
                          backgroundColor: `${getTypeColor(displayLeaveTypeName)}20`,
                          color: getTypeColor(displayLeaveTypeName),
                          border: `1px solid ${getTypeColor(displayLeaveTypeName)}40`
                        }}
                      >
                        {displayLeaveTypeName}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <FaCalendarAlt className="date-icon" />
                        <div>
                          <div>{startDate.toLocaleDateString('en-GB')}</div>
                          {!isActuallyPermission && <small>to {endDate.toLocaleDateString('en-GB')}</small>}
                          {isActuallyPermission && hasTimes && <small className="text-indigo-600 font-bold">{leave.start_time?.slice(0, 5)} - {leave.end_time?.slice(0, 5)}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="duration-badge">
                        {durationText}
                      </span>
                    </td>
                    <td>
                      <div className="reason-cell" title={leave.reason}>
                        {leave.reason}
                      </div>
                      {leave.rejection_reason && (
                        <div className="rejection-reason">
                          <small><strong>Rejection:</strong> {leave.rejection_reason}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(leave.status)}`}>
                        {leave.status === 'Pending' && <FaClock />}
                        {leave.status === 'Approved' && <FaCheck />}
                        {leave.status === 'Rejected' && <FaTimes />}
                        {leave.status}
                      </span>
                    </td>
                    {viewMode === 'all' && (
                      <td>
                        {leave.status === 'Pending' ? (
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                              title="Approve"
                            >
                              <FaCheck /> Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                              title="Reject"
                            >
                              <FaTimes /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
