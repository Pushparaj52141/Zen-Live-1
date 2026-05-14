import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const routeNameMap = {
  'dashboard': 'Dashboard',
  'leads': 'Leads',
  'courses': 'Course Management',
  'trainers': 'Trainer Management',
  'batches': 'Batch Management',
  'users': 'Users Management',
  'meta-campaigns': 'Meta Campaigns',
  'payments': 'Payment Insights',
  'invoices': 'Payments & Invoices',
  'share': 'Trainer Share',
  'lead-overview': 'Lead Overview',
  'attendance': 'Daily Checkin',
  'certifications': 'Certification Portal',
  'hall-of-fame': 'Hall of Fame',
  'reports': 'Reports & Analytics',
  'settings': 'System Settings',
  'lead-bulk-upload': 'Lead Bulk Upload',
  'archived': 'Archived Leads',
  'announcements': 'Announcements',
};

const Breadcrumbs = () => {
  const location = useLocation();
  
  // Split path and remove empty strings
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are on dashboard (root or /dashboard), we might not need breadcrumbs or just show Home
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null; 
  }

  return (
    <nav className="flex items-center text-sm font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center hover:text-slate-700 transition-colors"
          >
            <FiHome className="mr-1.5 h-4 w-4" />
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = routeNameMap[value] || value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          return (
            <li key={to}>
              <div className="flex items-center">
                <FiChevronRight className="h-4 w-4 text-slate-400 mx-1" />
                {isLast ? (
                  <span 
                    className="ml-1 font-semibold text-blue-600"
                  >
                    {name}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="ml-1 hover:text-slate-700 transition-colors"
                  >
                    {name}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
