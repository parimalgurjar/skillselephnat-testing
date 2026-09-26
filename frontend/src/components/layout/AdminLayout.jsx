import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  Layers3,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  BarChart3,
  Layers,
  User,
  LogOut,

  CircleHelp,
  ClipboardCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },
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
  path: "/admin/specializations",
  name: "Specializations",
  icon: Layers,
},
   {
  path: "/admin/course-modules",
  name: "Course Modules",
  icon: Layers,
},
    {
      name: "Batches",
      path: "/admin/batches",
      icon: Layers3,
    },
    {
      name: "Attendance",
      path: "/admin/attendance",
      icon: CalendarCheck,
    },
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
    {
  name: "Student Doubts",
  path: "/admin/doubts",
  icon: CircleHelp,
},
    {
      name: "Announcements",
      path: "/admin/announcements",
      icon: Megaphone,
    },
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
  const initial = adminName.charAt(0).toUpperCase();

  return (
    <div className="admin-layout">
      {/* ================= SIDEBAR ================= */}

      <aside className="admin-sidebar">
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
                className={({ isActive }) =>
                  `admin-nav-item ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

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

      {/* ================= MAIN AREA ================= */}

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>ADMINISTRATION PORTAL</span>
            <h3>Welcome back, {adminName}</h3>
          </div>

          <div className="admin-profile-top">
            <div className="admin-info">
              <strong>{adminName}</strong>
              <span>ADMIN</span>
            </div>

            <div className="admin-avatar">
              {initial}
            </div>
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