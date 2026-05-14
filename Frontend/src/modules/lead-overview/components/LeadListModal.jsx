
import React from 'react';
import { FaTimes, FaUser, FaPhone, FaCalendarAlt, FaEnvelope } from 'react-icons/fa';

const LeadListModal = ({ isOpen, onClose, leads, status, color }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 ${color ? color.replace('bg-', 'bg-opacity-10 bg-') : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              {status} Leads
            </h2>
            <span className="px-2 py-0.5 bg-gray-900 text-white text-xs font-bold rounded-full">
              {leads.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-0">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p>No leads found for this status.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Contact</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Source</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead, index) => (
                  <tr key={lead.id || index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${color || 'bg-blue-500'}`}>
                          {lead.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-0.5">{lead.name}</p>
                          <p className="text-xs text-gray-500">{lead.role || 'Lead'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <FaPhone className="text-gray-400 text-[10px]" />
                          <span>{lead.mobile_number || lead.phone || '-'}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FaEnvelope className="text-gray-400 text-[10px]" />
                            <span className="truncate max-w-[150px]" title={lead.email}>{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                       <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${color ? `${color.replace('bg-', 'text-')} bg-opacity-10 border-opacity-20` : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded-md">
                        {lead.source_name || lead.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-gray-300" />
                        {formatDate(lead.created_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadListModal;
