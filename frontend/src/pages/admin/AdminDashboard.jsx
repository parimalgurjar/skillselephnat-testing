import { useEffect, useState } from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  GraduationCap,
  UserRoundCog,
  Layers3,
  Clock3,
  ArrowUpRight,
  UserCheck,
  UserX,
} from "lucide-react";

import { Link } from "react-router-dom";
import AlertModal from "../../components/common/AlertModal";
import Card from "../../components/common/Card";

import {
  getStudents,
  getTeachers,
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../../services/adminApi";

import api from "../../services/api";

import "./AdminDashboard.css";

const AdminDashboard = () => {
  /* =====================================================
     STATE
  ===================================================== */

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
const [rejectModal, setRejectModal] = useState({
  isOpen: false,
  userId: null,
});

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(null);

  /* =====================================================
     FETCH DASHBOARD DATA
  ===================================================== */

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        studentsResponse,
        teachersResponse,
        batchesResponse,
        pendingResponse,
      ] = await Promise.all([
        getStudents(),
        getTeachers(),
        api.get("/batches"),
        getPendingUsers(),
      ]);

      /* STUDENTS */

      if (studentsResponse?.success) {
        setStudents(studentsResponse.students || []);
      }

      /* TEACHERS */

      if (teachersResponse?.success) {
        setTeachers(teachersResponse.teachers || []);
      }

      /* BATCHES */

      if (batchesResponse.data?.success) {
        setBatches(batchesResponse.data.batches || []);
      }

      /* PENDING USERS */

      if (pendingResponse?.success) {
        setPendingUsers(pendingResponse.users || []);
      }
    } catch (error) {
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* =====================================================
     APPROVE USER
  ===================================================== */

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId);

      await approveUser(userId);

      await fetchDashboardData();
    } catch (error) {
      setAlert({
  isOpen: true,
  type: "error",
  title: "Approval Failed",
  message:
    error.message ||
    "Failed to approve user",
});
    } finally {
      setActionLoading(null);
    }
  };

  /* =====================================================
     REJECT USER
  ===================================================== */

const handleReject = (userId) => {
  setRejectModal({
    isOpen: true,
    userId,
  });
};

const confirmReject = async () => {
  const userId = rejectModal.userId;

  if (!userId) return;

  try {
    setActionLoading(userId);

    await rejectUser(userId);

    await fetchDashboardData();

    setRejectModal({
      isOpen: false,
      userId: null,
    });
  } catch (error) {
    setAlert({
      isOpen: true,
      type: "error",
      title: "Rejection Failed",
      message:
        error.message ||
        "Failed to reject user",
    });
  } finally {
    setActionLoading(null);
  }
};

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  // All students across all batches
  const totalStudents = students.length;

  // All registered teachers
  const totalTeachers = teachers.length;

  // Total batches created by admin
  const totalBatches = batches.length;

  // Student + Teacher registrations waiting for approval
  const pendingApprovals = pendingUsers.length;

  /* =====================================================
     STATS
  ===================================================== */

  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: GraduationCap,
      path: "/admin/students",
    },
    {
      title: "Total Teachers",
      value: totalTeachers,
      icon: UserRoundCog,
      path: "/admin/educators",
    },
    {
      title: "Total Batches",
      value: totalBatches,
      icon: Layers3,
      path: "/admin/batches",
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals,
      icon: Clock3,
      path: "/admin",
    },
  ];

  return (
    <div className="admin-dashboard">

      {/* ================= HEADER ================= */}

      <div className="admin-dashboard-heading">
        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of your Skillselephant learning portal.
          </p>
        </div>
      </div>

      {/* ================= STATS ================= */}

      <div className="admin-dashboard-stats">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.title}
              to={stat.path}
              className="admin-stat-link"
            >
              <Card>

                <div className="admin-stat-card">

                  <div className="admin-stat-top">

                    <div className="admin-stat-icon">
                      <Icon size={21} />
                    </div>

                    <ArrowUpRight size={17} />

                  </div>

                  <div className="admin-stat-value">
                    {loading ? "..." : stat.value}
                  </div>

                  <div className="admin-stat-title">
                    {stat.title}
                  </div>

                </div>

              </Card>
            </Link>
          );
        })}

      </div>

      {/* ================= PENDING APPROVALS ================= */}

      <Card
        title="Pending Approvals"
        subtitle="Review and approve new student and teacher registrations"
      >

        <div className="pending-approvals">

          {loading ? (

            <p className="dashboard-empty-text">
              Loading pending registrations...
            </p>

          ) : pendingUsers.length === 0 ? (

            <p className="dashboard-empty-text">
              No pending registrations found.
            </p>

          ) : (

            pendingUsers.map((user) => (

              <div
                className="pending-user-card"
                key={user._id}
              >

                <div className="pending-user-info">

                  <div className="pending-user-avatar">
                    {user.name?.charAt(0)}
                  </div>

                  <div>

                    <h4>{user.name}</h4>

                    <p>{user.email}</p>

                    <span>

                      {user.role === "STUDENT"
                        ? `Student • ${
                            user.batchTiming ||
                            "No batch selected"
                          }`
                        : `Teacher • ${
                            user.specializations?.length
                              ? user.specializations.join(", ")
                              : "No specializations"
                          }`}

                    </span>

                  </div>

                </div>

                <div className="pending-user-actions">

                  <button
                    type="button"
                    className="approve-user-btn"
                    onClick={() =>
                      handleApprove(user._id)
                    }
                    disabled={
                      actionLoading === user._id
                    }
                  >

                    <UserCheck size={16} />

                    {actionLoading === user._id
                      ? "Processing..."
                      : "Approve"}

                  </button>

                  <button
                    type="button"
                    className="reject-user-btn"
                    onClick={() =>
                      handleReject(user._id)
                    }
                    disabled={
                      actionLoading === user._id
                    }
                  >

                    <UserX size={16} />

                    Reject

                  </button>

                </div>

              </div>

            ))
          )}

        </div>

      </Card>

      {/* ================= QUICK ACTIONS ================= */}

      <div className="admin-dashboard-grid">

        <Card
          title="Quick Actions"
          subtitle="Common administrative actions"
        >

          <div className="admin-quick-actions">

            <Link to="/admin/students">
              <GraduationCap size={19} />

              <span>
                Manage Students
              </span>
            </Link>

            <Link to="/admin/educators">
              <UserRoundCog size={19} />

              <span>
                Manage Teachers
              </span>
            </Link>

            <Link to="/admin/batches">
              <Layers3 size={19} />

              <span>
                Manage Batches
              </span>
            </Link>

          </div>

        </Card>

        {/* ================= PORTAL OVERVIEW ================= */}

        <Card
          title="Portal Overview"
          subtitle="Current system status"
        >

          <div className="admin-overview">

            <div>
              <span>Students</span>

              <strong>
                {loading
                  ? "..."
                  : totalStudents}
              </strong>
            </div>

            <div>
              <span>Teachers</span>

              <strong>
                {loading
                  ? "..."
                  : totalTeachers}
              </strong>
            </div>

            <div>
              <span>Batches</span>

              <strong>
                {loading
                  ? "..."
                  : totalBatches}
              </strong>
            </div>

            <div>
              <span>Pending</span>

              <strong>
                {loading
                  ? "..."
                  : pendingApprovals}
              </strong>
            </div>

          </div>

        </Card>

      </div>
      <ConfirmModal
  isOpen={rejectModal.isOpen}
  onClose={() =>
    setRejectModal({
      isOpen: false,
      userId: null,
    })
  }
  onConfirm={confirmReject}
  title="Reject Registration"
  message="Are you sure you want to reject this registration?"
  confirmText="Reject"
  cancelText="Cancel"
  loading={actionLoading === rejectModal.userId}
/>
<AlertModal
  isOpen={alert.isOpen}
  onClose={() =>
    setAlert((previous) => ({
      ...previous,
      isOpen: false,
    }))
  }
  type={alert.type}
  title={alert.title}
  message={alert.message}
/>
    </div>
  );
};

export default AdminDashboard;