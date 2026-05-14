
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@app/layout/Navbar";
import Sidebar from "@app/layout/Sidebar";
import lookupService from "@shared/services/lookups/lookupService";
import Breadcrumbs from "@shared/components/Breadcrumbs";

function Layout({ children, onLogout }) {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";
  const isEnrollment = location.pathname.startsWith("/enroll/");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [navbarProps, setNavbarPropsState] = useState({});

  // Pass props from child → navbar
  const setNavbarProps = useCallback((props) => {
    setNavbarPropsState(props);
  }, []);

  const [filterData, setFilterData] = useState({
    trainers: [],
    courseTypes: [],
    courses: [],
    batches: [],
    sources: [],
    assignees: [],
    units: [],
    cardTypes: [],
  });

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

  useEffect(() => {
  }, [navbarProps]);

  // Load lookups
  useEffect(() => {
    let cancelled = false;

    async function fetchFilters() {
      setFiltersLoading(true);
      setFiltersError(null);

      try {
        const [
          coursesRes,
          courseTypesRes,
          batchesRes,
          trainersRes,
          assigneesRes,
          unitsRes,
          cardTypesRes,
          sourcesRes,
        ] = await Promise.all([
          lookupService.getCourses(),
          lookupService.getCourseTypes(),
          lookupService.getBatches(),
          lookupService.getTrainers(),
          lookupService.getAssignees(),
          lookupService.getUnits(),
          lookupService.getCardTypes(),
          lookupService.getSources(),
        ]);

        if (cancelled) return;

        setFilterData({
          trainers: trainersRes.success ? trainersRes.data : [],
          courseTypes: courseTypesRes.success ? courseTypesRes.data : [],
          courses: coursesRes.success ? coursesRes.data : [],
          batches: batchesRes.success ? batchesRes.data : [],
          sources: sourcesRes.success ? sourcesRes.data : [],
          assignees: assigneesRes.success ? assigneesRes.data : [],
          units: unitsRes.success ? unitsRes.data : [],
          cardTypes: cardTypesRes.success ? cardTypesRes.data : [],
        });

        const failedCalls = [
          { label: "courses", res: coursesRes },
          { label: "course types", res: courseTypesRes },
          { label: "batches", res: batchesRes },
          { label: "trainers", res: trainersRes },
          { label: "assignees", res: assigneesRes },
          { label: "business units", res: unitsRes },
          { label: "card types", res: cardTypesRes },
          { label: "sources", res: sourcesRes },
        ]
          .filter((i) => i.res && !i.res.success)
          .map((i) => i.label);

        if (failedCalls.length > 0) {
          setFiltersError(
            `Some filter data failed to load: ${failedCalls.join(", ")}`
          );
        }
      } catch (error) {
        if (!cancelled) {
          setFiltersError(
            error?.message || "Unable to load filter data from the server."
          );
        }
      } finally {
        if (!cancelled) {
          setFiltersLoading(false);
        }
      }
    }

    fetchFilters();
    return () => (cancelled = true);
  }, []);

  const handleFilterApply = (filters) => {
  };

  // Inject setNavbarProps into children
  const childrenWithProps = Children.map(children, (child) =>
    isValidElement(child) ? cloneElement(child, { setNavbarProps }) : child
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        isOpen={sidebarOpen || isSidebarHovered}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen || isSidebarHovered ? "md:ml-[232px]" : "md:ml-16"
        }`}
      >
        <Navbar
          toggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          trainers={filterData.trainers}
          courseTypes={filterData.courseTypes}
          courses={filterData.courses}
          batches={filterData.batches}
          sources={filterData.sources}
          assignees={filterData.assignees}
          units={filterData.units}
          cardTypes={filterData.cardTypes}
          filtersLoading={filtersLoading}
          filtersError={filtersError}
          onFilterApply={handleFilterApply}
          onLogout={onLogout}
          {...navbarProps}
        />

        {/* FIXED MAIN AREA – NO MORE CUTTING CONTENT */}
        <main className="px-4 pt-14 flex flex-col h-screen overflow-hidden">
          <div className="pb-2 flex-shrink-0">
            <Breadcrumbs />
          </div>

          {/* Scrolls normally when content is long */}
          <div className={`flex-1 overflow-x-hidden min-h-0 ${(isDashboard || isEnrollment) ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
            {childrenWithProps}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
