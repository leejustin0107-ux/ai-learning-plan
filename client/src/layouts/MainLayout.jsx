import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CalendarDays,
  BarChart3,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import '../styles/mainLayout.css';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <nav id="app-sidebar" className="sidebar" aria-label="Main navigation">
        <div className="sidebar-header">
          {sidebarOpen && <h2>AI Learning Plan</h2>}

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="sidebar-links">
          <div className="sidebar-main-links">
            <NavLink
              to="/"
              end
              aria-label="Go to dashboard page"
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <LayoutDashboard className="sidebar-icon" size={20} aria-hidden="true" />
              {sidebarOpen && <span>Dashboard</span>}
            </NavLink>

            <NavLink
              to="/goals"
              aria-label="Go to goals page"
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <Target className="sidebar-icon" size={20} aria-hidden="true" />
              {sidebarOpen && <span>Goals</span>}
            </NavLink>

            <NavLink
              to="/calendar"
              aria-label="Go to calendar page"
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <CalendarDays className="sidebar-icon" size={20} aria-hidden="true" />
              {sidebarOpen && <span>Calendar</span>}
            </NavLink>

            <NavLink
              to="/progress"
              aria-label="Go to progress page"
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <BarChart3 className="sidebar-icon" size={20} aria-hidden="true" />
              {sidebarOpen && <span>Progress</span>}
            </NavLink>
          </div>

          <div className="sidebar-footer">
            <NavLink
              to="/profile"
              aria-label="Go to profile page"
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <User className="sidebar-icon" size={20} aria-hidden="true" />
              {sidebarOpen && <span>Profile</span>}
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}