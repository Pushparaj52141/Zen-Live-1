import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
  FaCog,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaShieldAlt,
  FaChevronRight
} from 'react-icons/fa';
import { systemSettingsService } from "./services/systemSettingsService";

const SystemSettingsMain = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [generalForm, setGeneralForm] = useState({
      check_in: '09:30',
      check_out: '18:30',
      grace_period_mins: 15,
      half_day_hours: 4.5,
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });

  const [holidayForm, setHolidayForm] = useState({
      name: '',
      holiday_date: '',
      type: 'National',
      description: ''
  });
  const [editingHolidayId, setEditingHolidayId] = useState(null);

  const [leaveTypeForm, setLeaveTypeForm] = useState({
      name: '',
      code: '',
      annual_allocation: 0,
      gender_rule: 'All'
  });
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    try {
        const [settingsRes, holidayRes, leaveRes] = await Promise.all([
            systemSettingsService.fetchSettings(),
            systemSettingsService.fetchHolidays(),
            systemSettingsService.fetchLeaveTypes()
        ]);

        const settingsData = settingsRes.data.data || {};
        setSettings(settingsData);
        if (settingsData.office_timings) {
            setGeneralForm(prev => ({ ...prev, ...settingsData.office_timings }));
        }
        if (settingsData.half_day_hours) {
            setGeneralForm(prev => ({ ...prev, half_day_hours: settingsData.half_day_hours }));
        }
        if (settingsData.working_days) {
            setGeneralForm(prev => ({ ...prev, working_days: settingsData.working_days }));
        }

        setHolidays(holidayRes.data.data || []);
        setLeaveTypes(leaveRes.data.data || []);

    } catch (err) {
        console.error("Failed to load settings data", err);
        toast.error("Error loading system settings");
    } finally {
        setLoading(false);
    }
  };

  const handleGeneralSave = async () => {
      setIsSaving(true);
      try {
          const payload = {
              settings: {
                  office_timings: {
                      check_in: generalForm.check_in,
                      check_out: generalForm.check_out,
                      grace_period_mins: generalForm.grace_period_mins
                  },
                  half_day_hours: generalForm.half_day_hours,
                  working_days: generalForm.working_days
              }
          };

          await systemSettingsService.saveSettings(payload);
          toast.success("Settings saved successfully");
      } catch (err) {
          toast.error("Failed to save settings");
      } finally {
          setIsSaving(false);
      }
  };

  const handleAddHoliday = async (e) => {
      e.preventDefault();
      try {
          if (editingHolidayId) {
              await systemSettingsService.updateHoliday(editingHolidayId, holidayForm);
              toast.success("Holiday updated");
          } else {
              await systemSettingsService.addHoliday(holidayForm);
              toast.success("Holiday added");
          }
          setHolidayForm({ name: '', holiday_date: '', type: 'National', description: '' });
          setEditingHolidayId(null);
          fetchAllData();
      } catch (err) {
          toast.error("Failed to save holiday");
      }
  };

  const handleEditHoliday = (h) => {
      setEditingHolidayId(h.id);
      setHolidayForm({
          name: h.name,
          holiday_date: h.holiday_date.split('T')[0],
          type: h.type,
          description: h.description || ''
      });
  };

  const cancelHolidayEdit = () => {
    setEditingHolidayId(null);
    setHolidayForm({ name: '', holiday_date: '', type: 'National', description: '' });
  };

  const handleDeleteHoliday = async (id) => {
      if (!window.confirm("Are you sure you want to delete this holiday?")) return;
      try {
          await systemSettingsService.deleteHoliday(id);
          setHolidays(prev => prev.filter(h => h.id !== id));
          toast.success("Holiday removed");
      } catch (err) {
          toast.error("Failed to delete holiday");
      }
  };

  const handleEditLeaveType = (lt) => {
      setEditingLeaveTypeId(lt.id);
      setLeaveTypeForm({
          name: lt.name,
          code: lt.code,
          annual_allocation: lt.annual_allocation,
          gender_rule: lt.gender_rule
      });
      setShowLeaveModal(true);
  };

  const handleSaveLeaveType = async (e) => {
      e.preventDefault();
      try {
          await systemSettingsService.updateLeaveType(editingLeaveTypeId, leaveTypeForm);
          toast.success("Leave policy updated");
          setShowLeaveModal(false);
          fetchAllData();
      } catch (err) {
          toast.error("Failed to update leave type");
      }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 font-sans text-slate-700">
      <Toaster position="bottom-right" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px]">
          <nav className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-4 shrink-0">
            <div className="mb-6 px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuration</h3>
            </div>
            <div className="space-y-1">
                {[
                { id: 'general', label: 'General & Timings', icon: <FaClock /> },
                { id: 'holidays', label: 'Holiday List', icon: <FaCalendarAlt /> },
                { id: 'leaves', label: 'Leave Configuration', icon: <FaShieldAlt /> }
                ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}>{tab.icon}</span>
                        {tab.label}
                    </div>
                    {activeTab === tab.id && <FaChevronRight className="text-[10px] text-blue-300" />}
                </button>
                ))}
            </div>
          </nav>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-10">
              {activeTab === 'general' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Office Hours
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Check-in Time</label>
                          <input
                            type="time"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm font-semibold text-slate-700"
                            value={generalForm.check_in}
                            onChange={e => setGeneralForm({...generalForm, check_in: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Check-out Time</label>
                          <input
                            type="time"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm font-semibold text-slate-700"
                            value={generalForm.check_out}
                            onChange={e => setGeneralForm({...generalForm, check_out: e.target.value})}
                          />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Attendance Policies
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Grace Period (Min)</label>
                          <div className="relative">
                            <input
                                type="number"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm font-bold text-slate-700"
                                value={generalForm.grace_period_mins}
                                onChange={e => setGeneralForm({...generalForm, grace_period_mins: parseInt(e.target.value)})}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">MINS</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Half Day Threshold</label>
                          <div className="relative">
                            <input
                                type="number"
                                step="0.5"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm font-bold text-slate-700"
                                value={generalForm.half_day_hours}
                                onChange={e => setGeneralForm({...generalForm, half_day_hours: parseFloat(e.target.value)})}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">HOURS</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Working Days
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                          const isSelected = generalForm.working_days.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                const updated = isSelected
                                  ? generalForm.working_days.filter(d => d !== day)
                                  : [...generalForm.working_days, day];
                                setGeneralForm({...generalForm, working_days: updated});
                              }}
                              className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                                isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-500'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <div className="pt-8 border-t border-slate-100">
                      <button
                        onClick={handleGeneralSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 active:scale-95"
                      >
                        <FaSave className="text-xs" />
                        {isSaving ? 'Updating...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'holidays' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-10 p-8 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                        {editingHolidayId ? 'Modify Event' : 'Add Calendar Event'}
                    </h4>
                    <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Event Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Diwali"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white font-semibold"
                          value={holidayForm.name}
                          onChange={e => setHolidayForm({...holidayForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Schedule</label>
                        <input
                          type="date"
                          required
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white font-semibold"
                          value={holidayForm.holiday_date}
                          onChange={e => setHolidayForm({...holidayForm, holiday_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                        <select
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white font-semibold appearance-none"
                          value={holidayForm.type}
                          onChange={e => setHolidayForm({...holidayForm, type: e.target.value})}
                        >
                          <option>National</option>
                          <option>Regional</option>
                          <option>Company</option>
                          <option>Optional</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm">
                          {editingHolidayId ? 'Update' : 'Register'}
                        </button>
                        {editingHolidayId && (
                          <button
                            type="button"
                            onClick={cancelHolidayEdit}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-white shadow-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                          <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                          <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {holidays.length === 0 ? (
                          <tr><td colSpan="4" className="py-16 text-center text-slate-400 text-sm italic font-medium">No events registered in system.</td></tr>
                        ) : (
                          holidays.map(h => (
                            <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-5 px-6 text-sm font-bold text-slate-700">{new Date(h.holiday_date).toLocaleDateString()}</td>
                              <td className="py-5 px-6 text-sm font-medium text-slate-600">{h.name}</td>
                              <td className="py-5 px-6 text-sm">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                  h.type === 'National' ? 'bg-purple-50 text-purple-700' :
                                  h.type === 'Company' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {h.type}
                                </span>
                              </td>
                              <td className="py-5 px-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditHoliday(h)}
                                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-100 shadow-sm"
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHoliday(h.id)}
                                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-slate-100 shadow-sm"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'leaves' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {leaveTypes.map(lt => (
                      <div key={lt.id} className="p-8 border border-slate-100 rounded-[2rem] bg-slate-50/30 hover:border-blue-100 transition-all relative">
                        <div className="absolute top-6 right-6 flex gap-2">
                          <button
                            onClick={() => handleEditLeaveType(lt)}
                            className="p-2.5 bg-white text-blue-600 border border-slate-100 rounded-xl shadow-sm hover:bg-blue-50 transition-all"
                            title="Edit Policy"
                          >
                            <FaEdit className="text-base" />
                          </button>
                        </div>
                        <div className="text-4xl font-black text-slate-900 mb-2">{lt.annual_allocation}</div>
                        <div className="text-base font-bold text-slate-800 mb-6">{lt.name}</div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                           <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Policy Code</span>
                                <span className="text-xs font-mono font-bold text-blue-600">{lt.code}</span>
                           </div>
                           <div className="text-right flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restriction</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${lt.gender_rule === 'All' ? 'text-emerald-500' : 'text-amber-500'}`}>{lt.gender_rule}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 bg-slate-50/80 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Policy Configuration</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium italic">Adjust system rules for {leaveTypeForm.name}</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-300 hover:text-slate-600 text-3xl transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSaveLeaveType} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Official Name</label>
                  <input
                    type="text"
                    className="w-full border-2 border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                    value={leaveTypeForm.name}
                    onChange={e => setLeaveTypeForm({...leaveTypeForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">System Identifier</label>
                  <input
                    type="text"
                    className="w-full border-2 border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-blue-600 focus:border-blue-500 outline-none font-mono transition-all shadow-sm"
                    value={leaveTypeForm.code}
                    onChange={e => setLeaveTypeForm({...leaveTypeForm, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Annual Cap</label>
                  <div className="relative">
                    <input
                        type="number"
                        className="w-full border-2 border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm"
                        value={leaveTypeForm.annual_allocation}
                        onChange={e => setLeaveTypeForm({...leaveTypeForm, annual_allocation: parseInt(e.target.value)})}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">DAYS</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Access Restriction</label>
                  <div className="flex gap-4">
                    {['All', 'Male', 'Female'].map(rule => (
                        <button
                            key={rule}
                            type="button"
                            onClick={() => setLeaveTypeForm({...leaveTypeForm, gender_rule: rule})}
                            className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all ${
                                leaveTypeForm.gender_rule === rule
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                            }`}
                        >
                            {rule}
                        </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">Discard Changes</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">Commit Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsMain;
