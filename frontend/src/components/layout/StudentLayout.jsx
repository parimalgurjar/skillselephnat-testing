import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CalendarDays,
  CheckSquare,
  Megaphone,
  ClipboardCheck,
  User,
  LogOut,
  GraduationCap,
  CircleHelp,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./StudentLayout.css";

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/student",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "My Course",
      path: "/student/course",
      icon: BookOpen,
    },
    {
      name: "Digital Notes",
      path: "https://skillselephant.com/legendary-notes/",
      icon: FileText,
      external: true,
    },
    {
      name: "Attendance",
      path: "/student/attendance",
      icon: CalendarDays,
    },
    {
      name: "Tasks",
      path: "/student/work",
      icon: CheckSquare,
    },
    {
      name: "Task Report",
      path: "/student/task-report",
      icon: ClipboardCheck,
    },
    {
      name: "My Doubts",
      path: "/student/doubts",
      icon: CircleHelp,
    },
    {
      name: "Announcements",
      path: "/student/announcements",
      icon: Megaphone,
    },
    {
      name: "Profile",
      path: "/student/profile",
      icon: User,
    },
  ];

  const studentName = user?.name || "Student Name";
  const initial = studentName.charAt(0).toUpperCase();

  return (
    <div className="student-layout">
      <aside
        className={`student-sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <div className="student-sidebar-logo">
          <img
            src="/logo/skillselephant-logo-white.png"
            alt="Skillselephant"
            className="student-logo-image"
          />

          <div className="student-logo-portal">Student Portal</div>
        </div>

        <div className="sidebar-menu-title">STUDENT PORTAL MENU</div>

        <nav className="student-sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // External Link
            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="student-menu-item"
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </a>
              );
            }

            // Internal Routes
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `student-menu-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="student-course-card">
          <GraduationCap size={22} />

          <div>
            <strong>Digital Marketing</strong>
            <span>Training Institute</span>
          </div>
        </div>

        <div className="student-sidebar-bottom">
          <div className="student-role">
            <span className="role-dot"></span>
            Role: STUDENT
          </div>

          <button
            type="button"
            className="student-logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="student-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="student-main">
        <header className="student-topbar">
          <div className="student-topbar-left">
            <button
              type="button"
              className="student-mobile-menu-btn"
              aria-label={
                mobileMenuOpen ? "Close navigation" : "Open navigation"
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <span className="portal-label">STUDENT PORTAL</span>
          </div>

          <div className="student-topbar-right">
            <button
              type="button"
              className="notification-btn"
              onClick={() => navigate("/student/announcements")}
              title="View Announcements"
              aria-label="View Announcements"
            >
              🔔
              <span>2</span>
            </button>

            <div className="student-profile">
              <div className="student-avatar">{initial}</div>

              <div>
                <strong>{studentName}</strong>
                <span>STUDENT</span>
              </div>
            </div>
          </div>
        </header>

        <div className="student-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;