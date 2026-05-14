import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@shared/api/client';
import { toast } from 'react-hot-toast';
import { FiClock, FiCheck, FiChevronDown } from "react-icons/fi";

const ApplyLeaveForm = ({ onSuccess, initialType }) => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const isPermission = initialType === 'Permission' || (leaveTypes.find(t => t.id == leaveTypeId)?.name.toLowerCase().trim() === 'permission');

  const fetchLeaveTypes = async () => {
    try {
      const res = await apiClient.get('/api/leave/config/types');
      const types = res.data.data || [];
      setLeaveTypes(types);
      
      if (types.length > 0) {
        let selectedId = types[0].id;
        if (initialType) {
          const matched = types.find(t => 
            t.name.toLowerCase().includes('perm') ||
            t.code?.toUpperCase() === 'PERM' ||
            t.code?.toUpperCase() === 'PERMISSION'
          );
          if (matched) {
            selectedId = matched.id;
          } else if (initialType.toLowerCase() === 'permission') {
            selectedId = '';
          }
        }
        setLeaveTypeId(selectedId);
      }
    } catch (error) {
        toast.error("Could not load leave types");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPermission && new Date(fromDate) > new Date(toDate)) {
      toast.error('From Date should not be after To Date');
      return;
    }
    
    if (!leaveTypeId) {
        if (isPermission) {
           toast.error('Permission system is not configured in the database. Please contact admin to add a "Permission" leave type.');
        } else {
           toast.error('Please select a leave type');
        }
        return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(
        '/api/leave/apply',
        {
          from_date: fromDate,
          to_date: isPermission ? fromDate : toDate,
          reason,
          leave_type_id: leaveTypeId,
          start_time: isPermission ? startTime : null,
          end_time: isPermission ? endTime : null,
        }
      );

      toast.success('Leave request submitted successfully!');
      
      // Clear form
      setFromDate('');
      setToDate('');
      setReason('');
      if (leaveTypes.length > 0) setLeaveTypeId(leaveTypes[0].id);

      // Trigger success callback (switch tab)
      if (onSuccess) {
          setTimeout(onSuccess, 1000); // 1s delay to let user see success toast
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply for leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (isPermission) {
      if (startTime && endTime) {
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = endTime.split(':').map(Number);
        const diff = (h2 + m2 / 60) - (h1 + m1 / 60);
        return diff > 0 ? `${diff.toFixed(1)} Hours` : '0 Hours';
      }
      return '0 Hours';
    }
    if (fromDate && toDate) {
      const days = Math.ceil(
        (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)
      ) + 1;
      return days > 0 ? `${days} Day${days !== 1 ? 's' : ''}` : '0 Days';
    }
    return '0 Days';
  };

    return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Row 1: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isPermission ? 'Date' : 'From Date'}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
              />
            </div>
            {!isPermission && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  min={fromDate || new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                />
              </div>
            )}
            
            {isPermission && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Duration Badge */}
          {fromDate && (isPermission ? (startTime && endTime) : toDate) && (
             <div className="px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                    <FiClock className="text-indigo-600" size={16} />
                    <span className="text-sm font-semibold text-indigo-700">Total {isPermission ? 'Hours' : 'Days'} Requested</span>
                </div>
                <span className="text-lg font-bold text-indigo-900">{calculateDuration()}</span>
             </div>
          )}

          {/* Row 2: Type - Hidden for Permission */}
          {!isPermission && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Type</label>
              <div className="relative">
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  required
                  className="w-full appearance-none rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                >
                  {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Reason */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</label>
            <textarea
              placeholder="Please provide a formal reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-3">
             <button
                type="button"
                onClick={() => {
                   setFromDate('');
                   setToDate('');
                   setReason('');
                   if (leaveTypes.length > 0) setLeaveTypeId(leaveTypes[0].id);
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                {!isSubmitting && <FiCheck size={16} />}
              </button>
          </div>
      </form>
    </div>
  );
};

export default ApplyLeaveForm;
