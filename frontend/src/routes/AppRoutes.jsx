import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

/* ================= AUTH CONTEXT & COMPONENTS ================= */
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PublicRoute from "../components/common/PublicRoute";

/* ================= AUTH PAGES ================= */
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import AdminSetup from "../pages/auth/AdminSetup";

/* ================= LAYOUTS ================= */
import AdminLayout from "../components/layout/AdminLayout";
import TeacherLayout from "../components/layout/TeacherLayout";
import StudentLayout from "../components/layout/StudentLayout";

/* =====================================================
   ADMIN PAGES
===================================================== */
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminStudents from "../pages/admin/AdminStudents";
import AdminEducators from "../pages/admin/AdminEducators";
import AdminBatches from "../pages/admin/AdminBatches";
import AdminAttendance from "../pages/admin/AdminAttendance";
import AdminTasks from "../pages/admin/AdminTasks";
import AdminTaskReport from "../pages/admin/AdminTaskReport";
import AdminDoubts from "../pages/admin/AdminDoubts";
import AdminAnnouncements from "../pages/admin/AdminAnnouncements";
import AdminReports from "../pages/admin/AdminReports";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminSpecializations from "../pages/admin/AdminSpecializations";
import AdminCourseModules from "../pages/admin/AdminCourseModules";

/* =====================================================
   TEACHER PAGES
===================================================== */
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import TeacherStudents from "../pages/teacher/TeacherStudents";
import TeacherAttendance from "../pages/teacher/TeacherAttendance";
import TeacherTasks from "../pages/teacher/TeacherTasks";
import TeacherTaskReport from "../pages/teacher/TeacherTaskReports";
import TeacherAnnouncements from "../pages/teacher/TeacherAnnouncements";
import TeacherProfile from "../pages/teacher/TeacherProfile";
import TeacherDoubts from "../pages/teacher/TeacherDoubts";
import TeacherDoubtDetails from "../pages/teacher/TeacherDoubtDetails";

/* =====================================================
   STUDENT PAGES
===================================================== */
import StudentDashboard from "../pages/student/StudentDashboard";
import MyCourse from "../pages/student/MyCourse";
import MyWork from "../pages/student/MyWork";
import Attendance from "../pages/student/Attendance";
import StudentTaskReport from "../pages/student/StudentTaskReport";
import Announcements from "../pages/student/Announcements";
import Profile from "../pages/student/Profile";
import MyDoubts from "../pages/student/MyDoubts";
import DoubtConversation from "../pages/student/DoubtConversation";

/* =====================================================
   ROOT REDIRECT
===================================================== */
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "TEACHER") {
    return <Navigate to="/teacher" replace />;
  }

  if (user.role === "STUDENT") {
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/login" replace />;
};

/* =====================================================
   APP ROUTES
===================================================== */
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* =============================================
            AUTH & PUBLIC ROUTES
        ============================================= */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* SETUP ROUTE (UNPROTECTED) */}
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* =============================================
            ADMIN ROUTES
        ============================================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="course-modules" element={<AdminCourseModules />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="specializations" element={<AdminSpecializations />} />
          <Route path="educators" element={<AdminEducators />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="task-report" element={<AdminTaskReport />} />
          <Route path="doubts" element={<AdminDoubts />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* =============================================
            TEACHER ROUTES
        ============================================= */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="tasks" element={<TeacherTasks />} />
          <Route path="task-report" element={<TeacherTaskReport />} />
          <Route path="doubts" element={<TeacherDoubts />} />
          <Route path="doubts/:id" element={<TeacherDoubtDetails />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
          <Route path="profile" element={<TeacherProfile />} />
        </Route>

        {/* =============================================
            STUDENT ROUTES
        ============================================= */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="course" element={<MyCourse />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="work" element={<MyWork />} />
          <Route path="task-report" element={<StudentTaskReport />} />
          <Route path="doubts" element={<MyDoubts />} />
          <Route path="doubts/:id" element={<DoubtConversation />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* =============================================
            ROOT & FALLBACK
        ============================================= */}
        <Route path="/" element={<DashboardRedirect />} />
        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;