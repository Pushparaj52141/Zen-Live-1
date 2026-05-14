import React, { useEffect, useState } from 'react';
import apiClient from '@shared/api/client';
import { FiPieChart, FiActivity } from "react-icons/fi";

const LeaveBalances = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const res = await apiClient.get('/api/leave/my-balances');
      setBalances(res.data.data || []);
    } catch (err) {
      console.error("Error fetching leave balances:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-slate-400 text-sm">Loading balances...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <FiPieChart className="text-blue-600" /> Leave Balances
        </h3>
        <span className="text-xs text-slate-400 font-medium">Year {new Date().getFullYear()}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {balances.map((bal, index) => (
          <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-100 relative group hover:border-blue-200 transition-colors">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {bal.leave_type}
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {bal.remaining}
              </span>
              <span className="text-xs text-slate-400 mb-1">
                / {bal.allocated}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${bal.allocated > 0 ? (bal.remaining / bal.allocated) * 100 : 0}%` }} 
                />
            </div>
          </div>
        ))}
      </div>
      
      {balances.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">
            <FiActivity className="mx-auto mb-2 opacity-50" size={20} />
            No leave balances found.
        </div>
      )}
    </div>
  );
};

export default LeaveBalances;
