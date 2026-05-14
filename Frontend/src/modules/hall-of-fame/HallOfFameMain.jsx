import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./HallOfFame.css";
import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";
import { 
  MdEmojiEvents, 
  MdWork, 
  MdStar, 
  MdMilitaryTech,
  MdRefresh
} from "react-icons/md";
import FameConfetti from "./components/FameConfetti";
import FameCard from "./components/FameCard";

export default function HallOfFameMain({ setNavbarProps }) {
  const [activeTab, setActiveTab] = useState("placements");
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(0);
  const [data, setData] = useState({
    placements: [],
    toppers: [],
    employees: []
  });

  useEffect(() => {
    setNavbarProps?.({
      title: "Hall of Fame",
      breadcrumb: ["Success Stories", "Hall of Fame"]
    });
  }, [setNavbarProps]);

  useEffect(() => {
    if (!loading) {
      setCelebrate(prev => prev + 1);
    }
  }, [activeTab, loading]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Leads for Placements and Toppers
      const leadsRes = await apiClient.get(endpoints.leads.root);
      const allLeads = Array.isArray(leadsRes.data) ? leadsRes.data : [];

      // Filter for Placements
      const placements = allLeads.filter(l => 
        ["placement", "placementpaid", "placementdue"].includes((l.status || "").toLowerCase().replace(/\s+/g, ""))
      ).map(l => ({
        id: l.lead_id,
        name: l.name,
        title: l.course_name || "Success Story",
        detail: `Placed via ${l.unit_name || "ZEN"}`,
        image: l.profile_image, // Student's own profile image if uploaded
        userId: null // Set to null to avoid fetching assignee/owner image
      }));

      // Filter for Toppers (Finishers or certified)
      const toppers = allLeads.filter(l => 
        ["finishers", "certification"].includes((l.status || "").toLowerCase().replace(/\s+/g, ""))
      ).map(l => ({
        id: l.lead_id,
        name: l.name,
        title: l.course_name || "Zen Achiever",
        detail: (l.status || "").toLowerCase().includes("cert") ? "Certified Graduate" : "Course Finisher",
        image: l.profile_image,
        userId: null
      }));

      // Fetch Users for Employees
      const usersRes = await apiClient.get(endpoints.users.root);
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : 
                      (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
      
      const employees = allUsers.map(u => ({
        id: u.id,
        name: u.username || u.name,
        title: u.role_name || u.role || "Team Member",
        detail: "Outstanding Performer",
        image: u.profile_image,
        userId: u.id
      }));

      setData({ placements, toppers, employees });
    } catch (error) {
      console.error("Error fetching Hall of Fame data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentItems = useMemo(() => {
    return data[activeTab] || [];
  }, [data, activeTab]);

  return (
    <div className="hall-of-fame-container">
      <FameConfetti active={celebrate} />
      
      <div className="hall-of-fame-header">
        <h1 className="hall-of-fame-title">Zen Hall of Fame</h1>
        <p className="hall-of-fame-subtitle">Celebrating our brightest stars and their incredible journeys</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <span className="text-emerald-700 bg-emerald-100/80 backdrop-blur-sm border border-emerald-200 px-4 py-1.5 rounded-full shadow-sm">🎓 {data.placements.length} Total Placements</span>
          <span className="text-amber-700 bg-amber-100/80 backdrop-blur-sm border border-amber-200 px-4 py-1.5 rounded-full shadow-sm">🏆 {data.toppers.length} Toppers</span>
          <span className="text-indigo-700 bg-indigo-100/80 backdrop-blur-sm border border-indigo-200 px-4 py-1.5 rounded-full shadow-sm">✨ {data.employees.length} Star Performers</span>
        </div>
      </div>

      <div className="fame-tabs">
        <button 
          className={`fame-tab-btn ${activeTab === "placements" ? "active" : ""}`}
          onClick={() => setActiveTab("placements")}
        >
          <MdWork className="inline mr-2" /> Placements
        </button>
        <button 
          className={`fame-tab-btn ${activeTab === "toppers" ? "active" : ""}`}
          onClick={() => setActiveTab("toppers")}
        >
          <MdEmojiEvents className="inline mr-2" /> Toppers
        </button>
        <button 
          className={`fame-tab-btn ${activeTab === "employees" ? "active" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          <MdStar className="inline mr-2" /> Our Team
        </button>
        <button 
          className="fame-tab-btn ghost"
          onClick={fetchData}
          title="Refresh"
        >
          <MdRefresh />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="fame-grid">
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <FameCard 
                key={item.id}
                index={index}
                type={activeTab.slice(0, -1)} // remove 's'
                {...item}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl backdrop-blur-sm">
              <MdMilitaryTech className="text-6xl text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-lg">No records found in this category yet.</p>
              <p className="text-slate-400 text-sm">Success is on its way!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
