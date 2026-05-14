import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiSearch, FiAward, FiCheckCircle, FiDownload, FiUser, FiBook } from "react-icons/fi";
import { CERTIFIED_STATUSES } from "./constants/certificationPortalConstants";
import { certificationPortalService } from "./services/certificationPortalService";

export default function CertificationPortalMain() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    processedToday: 0,
    totalCertificates: 0,
  });
  const [generatingCert, setGeneratingCert] = useState({});

  useEffect(() => {
    // Add custom styles for animations
    if (typeof document !== "undefined" && !document.getElementById("cert-portal-styles")) {
      const style = document.createElement("style");
      style.id = "cert-portal-styles";
      style.innerHTML = `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }
        .gradient-text {
          background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `;
      document.head.appendChild(style);
    }
    fetchCertifiedLeads();
    fetchCertificateStats();
  }, []);

  const fetchCertifiedLeads = async () => {
    try {
      setLoading(true);
      const statusQuery = CERTIFIED_STATUSES.join(",");
      const res = await certificationPortalService.fetchCertifiedLeads(statusQuery);

      let data = [];
      if (res.data && Array.isArray(res.data.leads)) {
        data = res.data.leads;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch certified leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateStats = async () => {
    try {
      const res = await certificationPortalService.fetchCertificateStats();
      if (res.data && res.data.success) {
        setStats({
          processedToday: res.data.data.processedToday || 0,
          totalCertificates: res.data.data.totalCertificates || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch certificate stats:", error);
    }
  };

  const handleDownloadCertificate = async (leadId, studentName) => {
    try {
      const response = await certificationPortalService.downloadCertificate(leadId);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${studentName.replace(/\s+/g, "_")}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download certificate:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  const handleGenerateCertificate = async (leadId, studentName) => {
    try {
      setGeneratingCert((prev) => ({ ...prev, [leadId]: true }));

      const response = await certificationPortalService.generateCertificate(leadId);

      if (response.data && response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Certificate Sent",
          text: `Successfully sent to ${studentName}`,
          showConfirmButton: false,
          timer: 2000,
          position: "center",
          backdrop: true,
          customClass: {
            popup: "rounded-xl shadow-xl",
          },
        });
        // Refresh stats to show updated "Processed Today" count
        await fetchCertificateStats();
      }
    } catch (error) {
      console.error("Failed to generate certificate:", error);
      Swal.fire({
        icon: "error",
        title: "Generation Failed",
        text: `Could not send to ${studentName}`,
        showConfirmButton: false,
        timer: 2000,
        position: "center",
        backdrop: true,
        customClass: {
          popup: "rounded-xl shadow-xl",
        },
      });
    } finally {
      setGeneratingCert((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.enrollment_id || "").toLowerCase().includes(q) ||
      (lead.course_name || "").toLowerCase().includes(q)
    );
  });

  const handleDownloadReport = () => {
    if (!leads || leads.length === 0) {
      alert("No data available to download.");
      return;
    }

    // CSV Headers
    const headers = [
      "Student Name",
      "Enrollment ID",
      "Course",
      "Batch",
      "Email",
      "Mobile",
      "Status",
      "Certificate Status",
    ];

    // CSV Rows
    const rows = leads.map((lead) => [
      `"${lead.name || ""}"`,
      `"${lead.enrollment_id || ""}"`,
      `"${lead.course_name || ""}"`,
      `"${lead.batch_name || ""}"`,
      `"${lead.email || ""}"`,
      `"${lead.country_code || ""} ${lead.mobile_number || ""}"`,
      `"${(lead.status || "").toUpperCase()}"`,
      "GENERATED",
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Create blobs and link to download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `certification_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans p-6">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 -left-24 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Unified Header Card */}
        {/* Header Section */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-fadeIn"
          style={{ animationDelay: "0ms" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
              <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Student Success</h2>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Certification <span className="text-blue-600">Portal</span>
            </h1>
            <p className="mt-2 text-slate-500 text-sm max-w-lg">
              Manage and track students eligible for certification.
            </p>
          </div>

          <div className="w-full md:w-96">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch
                  className="text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full h-12 pl-11 pr-4 rounded-xl border-0 bg-white shadow-sm ring-1 ring-slate-200 text-slate-600 text-sm transition-all placeholder:text-slate-400 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Highlight Stats Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn"
          style={{ animationDelay: "100ms" }}
        >
          {/* Card 1: Total Pending */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiAward size={64} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FiAward size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Ready for Certification</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{loading ? "-" : leads.length}</h3>
              </div>
            </div>
          </div>

          {/* Card 2: Processed Today */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiCheckCircle size={64} className="text-green-600" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <FiCheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Processed Today</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? "-" : stats.processedToday}
                </h3>
              </div>
            </div>
          </div>

          {/* Card 3: Download Report (Action) */}
          <div
            onClick={handleDownloadReport}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow active:scale-95 transition-transform"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiDownload size={64} />
            </div>
            <div className="flex items-center gap-4 h-full">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <FiDownload size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100">Export Data</p>
                <h3 className="text-lg font-bold mt-1">Download Report</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Table/List */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-lg animate-fadeIn" style={{ animationDelay: "300ms" }}>
          {loading ? (
            <div className="p-20 text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-slate-500 font-medium">Loading certification data...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <FiAward className="text-slate-300" size={48} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No students found</h3>
              <p className="text-slate-500 mt-1">
                Try adjusting your search criteria or wait for new certifications.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-8 py-5">Student</th>
                    <th className="px-6 py-5">Course Details</th>
                    <th className="px-6 py-5">Contact Info</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map((lead, idx) => (
                    <tr
                      key={lead.lead_id}
                      className="group transition-colors hover:bg-blue-50/30"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : <FiUser />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                              {lead.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              ID: {lead.enrollment_id || "PENDING"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FiBook className="text-blue-400" size={14} />
                            {lead.course_name}
                          </div>
                          <span className="inline-flex w-fit items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Batch: {lead.batch_name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-slate-600 mb-0.5">{lead.email}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          {lead.country_code} {lead.mobile_number}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </span>
                          Certification
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Generate & Send Button */}
                          <button
                            onClick={() => handleGenerateCertificate(lead.lead_id, lead.name)}
                            disabled={generatingCert[lead.lead_id]}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all hover:from-green-600 hover:to-green-700 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate & Send Certificate via Email"
                          >
                            {generatingCert[lead.lead_id] ? (
                              <>
                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <FiCheckCircle size={14} />
                                <span>Generate & Send</span>
                              </>
                            )}
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownloadCertificate(lead.lead_id, lead.name)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                            title="Download Certificate"
                          >
                            <FiDownload size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
