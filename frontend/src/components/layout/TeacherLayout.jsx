import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  CircleHelp,
  Megaphone,
  User,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./TeacherLayout.css";

const TeacherLayout = () => {
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
      path: "/teacher",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "Students",
      path: "/teacher/students",
      icon: Users,
    },
    {
      name: "Attendance",
      path: "/teacher/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Tasks",
      path: "/teacher/tasks",
      icon: ClipboardList,
    },
    {
      name: "Task Report",
      path: "/teacher/task-report",
      icon: ClipboardCheck,
    },
    {
      name: "Student Doubts",
      path: "/teacher/doubts",
      icon: CircleHelp,
    },
    {
      name: "Announcements",
      path: "/teacher/announcements",
      icon: Megaphone,
    },
    {
      name: "My Profile",
      path: "/teacher/profile",
      icon: User,
    },
  ];

  const teacherName = user?.name || "Educator";
  const initial = teacherName.charAt(0).toUpperCase();

  return (
    <div className="teacher-layout">
      {/* ================= SIDEBAR ================= */}

      <aside
        className={`teacher-sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <div className="teacher-logo">
          <img
            src="/logo/skillselephant-logo-white.png"
            alt="Skillselephant"
            className="teacher-logo-image"
          />

          <div className="teacher-logo-portal">Teacher Portal</div>
        </div>

        <nav className="teacher-nav">
          <span className="teacher-nav-label">MAIN MENU</span>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `teacher-nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="teacher-sidebar-bottom">
          <button
            type="button"
            className="teacher-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="teacher-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ================= MAIN AREA ================= */}

      <main className="teacher-main">
        <header className="teacher-topbar">
          <div className="teacher-topbar-left">
            <button
              type="button"
              className="teacher-mobile-menu-btn"
              aria-label={
                mobileMenuOpen ? "Close navigation" : "Open navigation"
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div>
              <span>WELCOME BACK</span>
              <h3>Educator Dashboard</h3>
            </div>
          </div>

          <div className="teacher-profile-top">
            <div className="teacher-info">
              <strong>{teacherName}</strong>
              <span>EDUCATOR</span>
            </div>

            <div className="teacher-avatar">{initial}</div>
          </div>
        </header>

        {/* ================= DYNAMIC PAGES ================= */}

        <div className="teacher-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;