
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  BarChart3,
  User,
  LogOut,
  CircleHelp,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  UsersRound,
  Menu,
  X,
  Video,
  Wallet,
  FolderOpen,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";
import NotificationBadge from "../common/NotificationBadge";
import ProfileAvatar from "../common/ProfileAvatar";

import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ================= SIDEBAR MENU =================

  const menuItems = [
    // Dashboard
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },

    // People Management
    {
      name: "Students",
      path: "/admin/students",
      icon: Users,
    },
    {
      name: "Educators",
      path: "/admin/educators",
      icon: UserRoundCog,
    },
    {
      name: "Batches",
      path: "/admin/batches",
      icon: UsersRound,
    },

    // Academic Management
    {
      name: "Course Modules",
      path: "/admin/course-modules",
      icon: BookOpen,
    },
    {
      name: "Specializations",
      path: "/admin/specializations",
      icon: GraduationCap,
    },

    // Attendance & Fees
    {
      name: "Attendance",
      path: "/admin/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Leave Requests",
      path: "/admin/leaves",
      icon: CalendarCheck,
    },
    {
      name: "Fees",
      path: "/admin/fees",
      icon: Wallet,
    },

    // Tasks & Performance
    {
      name: "Tasks",
      path: "/admin/tasks",
      icon: ClipboardList,
    },
    {
      name: "Task Report",
      path: "/admin/task-report",
      icon: ClipboardCheck,
    },

    // Student Support
    {
      name: "Student Doubts",
      path: "/admin/doubts",
      icon: CircleHelp,
    },

    // Learning Resources
    {
      name: "Resources",
      path: "/admin/resources",
      icon: FolderOpen,
    },
    {
      name: "Video Tutorials",
      path: "/admin/video-tutorials",
      icon: Video,
    },

    // Communication
    {
      name: "Announcements",
      path: "/admin/announcements",
      icon: Megaphone,
    },

    // Reports & Account
    {
      name: "Reports",
      path: "/admin/reports",
      icon: BarChart3,
    },
    {
      name: "My Profile",
      path: "/admin/profile",
      icon: User,
    },
  ];

  const adminName = user?.name || "Administrator";

  return (
    <div className="admin-layout">

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`admin-sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <div className="admin-logo">
          <img
            src="/logo/skillselephant-logo-white.png"
            alt="Skillselephant"
            className="admin-logo-image"
          />

          <div className="admin-logo-portal">
            Admin Portal
          </div>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-label">
            MANAGEMENT
          </span>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `admin-nav-item ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={19} />

                <span>{item.name}</span>

                <NotificationBadge path={item.path} />
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}

        <div className="admin-sidebar-bottom">
          <div className="admin-role">
            <span className="admin-role-dot" />
            ADMINISTRATOR
          </div>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MOBILE OVERLAY ================= */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ================= MAIN AREA ================= */}

      <main className="admin-main">

        {/* Topbar */}

        <header className="admin-topbar">

          <div className="admin-topbar-left">

            <button
              type="button"
              className="admin-mobile-menu-btn"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={mobileMenuOpen}
              onClick={() =>
                setMobileMenuOpen((prev) => !prev)
              }
            >
              {mobileMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>

            <div>
              <span>ADMINISTRATION PORTAL</span>

              <h3>
                Welcome Back,{" "}
                {adminName.charAt(0).toUpperCase() +
                  adminName.slice(1)}
              </h3>
            </div>

          </div>

          <div className="admin-profile-top">

            <NotificationBell />

            <div className="admin-info">
              <strong>{adminName}</strong>
              <span>ADMIN</span>
            </div>

            <button
              type="button"
              className="profile-avatar-button"
              onClick={() => navigate("/admin/profile")}
              aria-label="Open admin profile"
              title="My Profile"
            >
              <ProfileAvatar
                user={user}
                size={42}
                className="admin-avatar"
              />
            </button>

          </div>

        </header>

        {/* Dynamic Pages */}

        <div className="admin-content">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default AdminLayout;
