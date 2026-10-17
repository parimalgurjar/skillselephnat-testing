
import { useEffect, useState } from "react";
import {
  Wallet,
  Search,
  RefreshCw,
  IndianRupee,
  Plus,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Users,
  X,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminFees.css";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateLabel = (value) => {
  if (!value) return "Not configured";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AdminFees = () => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeInput, setFeeInput] = useState("");
  const [installmentInput, setInstallmentInput] = useState("");
  const [installmentNote, setInstallmentNote] = useState("");
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showMessage = (type, title, message) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [feesResponse, teachersResponse] = await Promise.all([
        api.get("/fees/students"),
        api.get("/teachers"),
      ]);

      setStudents(feesResponse.data?.students || []);

      const teacherList = teachersResponse.data?.teachers || [];
      setTeachers(
        teacherList.filter(
          (teacher) =>
            teacher.role === "TEACHER" &&
            teacher.isActive !== false &&
            teacher.status !== "INACTIVE"
        )
      );
    } catch (err) {
      console.error("Admin Fees Fetch Error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load fee records. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter((record) => {
    const student = record.student || {};
    const query = search.trim().toLowerCase();

    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.batchTiming?.toLowerCase().includes(query)
    );
  });

  const configuredCount = students.filter(
    (record) => record.configured
  ).length;

  const pendingCount = students.filter(
    (record) => record.configured && record.status === "PENDING"
  ).length;

  const completedCount = students.filter(
    (record) => record.configured && record.status === "COMPLETED"
  ).length;

  const openFeeModal = (record) => {
    setSelectedStudent(record);
    setFeeInput(
      record.configured ? String(record.totalFee) : ""
    );
    setShowFeeModal(true);
  };

  const openPaymentModal = (record) => {
    setSelectedStudent(record);
    setInstallmentInput("");
    setInstallmentNote("");
    setShowPaymentModal(true);
  };

  const saveFee = async (event) => {
    event.preventDefault();

    if (!selectedStudent?.student?._id) return;

    const amount = Number(feeInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("error", "Invalid fee", "Enter a valid total fee.");
      return;
    }

    try {
      setSaving(true);

      await api.put(
        `/fees/students/${selectedStudent.student._id}`,
        { totalFee: amount }
      );

      setShowFeeModal(false);
      await fetchData();

      showMessage(
        "success",
        "Fee saved",
        "The student's total fee has been saved."
      );
    } catch (err) {
      showMessage(
        "error",
        "Unable to save fee",
        err.response?.data?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveInstallment = async (event) => {
    event.preventDefault();

    if (!selectedStudent?.student?._id) return;

    const amount = Number(installmentInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage(
        "error",
        "Invalid amount",
        "Enter a valid installment amount."
      );
      return;
    }

    try {
      setSaving(true);

      await api.post(
        `/fees/students/${selectedStudent.student._id}/installments`,
        {
          amount,
          note: installmentNote.trim(),
        }
      );

      setShowPaymentModal(false);
      await fetchData();

      showMessage(
        "success",
        "Payment recorded",
        "The installment has been recorded successfully."
      );
    } catch (err) {
      showMessage(
        "error",
        "Payment not recorded",
        err.response?.data?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateTeacherPermission = async (teacher, enabled) => {
    try {
      await api.patch(
        `/fees/teachers/${teacher._id}/permission`,
        { canManageFees: enabled }
      );

      setTeachers((previous) =>
        previous.map((item) =>
          item._id === teacher._id
            ? { ...item, canManageFees: enabled }
            : item
        )
      );

      showMessage(
        "success",
        "Permission updated",
        `${teacher.name} can ${
          enabled ? "now" : "no longer"
        } manage fees.`
      );
    } catch (err) {
      showMessage(
        "error",
        "Permission update failed",
        err.response?.data?.message || "Please try again."
      );
    }
  };

  const restoreAccess = async (record) => {
    const student = record.student;

    if (
      !window.confirm(
        `Restore portal access for ${student.name}?`
      )
    ) {
      return;
    }

    try {
      await api.post(
        `/fees/students/${student._id}/restore-access`
      );

      await fetchData();

      showMessage(
        "success",
        "Access restored",
        "The student's portal access has been restored."
      );
    } catch (err) {
      showMessage(
        "error",
        "Unable to restore access",
        err.response?.data?.message || "Please try again."
      );
    }
  };

  return (
    <div className="admin-fees-page">
      <section className="admin-fees-hero">
        <div className="admin-fees-title">
          <div className="admin-fees-title-icon">
            <Wallet size={25} />
          </div>

          <div>
            <span className="admin-fees-eyebrow">
              FINANCE MANAGEMENT
            </span>
            <h1>Student Fees</h1>
            <p>Manage individual fees, installments and access.</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-fees-refresh"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </section>

      {error && (
        <div className="admin-fees-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="admin-fees-stats">
        <article className="admin-fees-stat">
          <span className="admin-fees-stat-icon blue">
            <Users size={20} />
          </span>
          <div>
            <p>Total Students</p>
            <strong>{students.length}</strong>
          </div>
        </article>

        <article className="admin-fees-stat">
          <span className="admin-fees-stat-icon amber">
            <Clock3 size={20} />
          </span>
          <div>
            <p>Fee Pending</p>
            <strong>{pendingCount}</strong>
          </div>
        </article>

        <article className="admin-fees-stat">
          <span className="admin-fees-stat-icon green">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p>Fee Completed</p>
            <strong>{completedCount}</strong>
          </div>
        </article>

        <article className="admin-fees-stat">
          <span className="admin-fees-stat-icon purple">
            <IndianRupee size={20} />
          </span>
          <div>
            <p>Fee Configured</p>
            <strong>{configuredCount}</strong>
          </div>
        </article>
      </section>

      <section className="admin-fees-panel">
        <div className="admin-fees-panel-header">
          <div>
            <h2>Student Fee Records</h2>
            <p>Individual fee amounts are visible to authorized staff only.</p>
          </div>

          <label className="admin-fees-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
            />
          </label>
        </div>

        {loading ? (
          <div className="admin-fees-empty">Loading fee records...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="admin-fees-empty">
            No matching students found.
          </div>
        ) : (
          <div className="admin-fees-table-wrap">
            <table className="admin-fees-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((record) => {
                  const student = record.student || {};
                  const isBlocked =
                    student.feeAccessBlocked === true;

                  return (
                    <tr key={student._id}>
                      <td>
                        <div className="admin-fees-student">
                          <strong>{student.name || "Unnamed student"}</strong>
                          <span>{student.email || "No email"}</span>
                          <small>
                            {student.batchTiming || "Batch not assigned"}
                          </small>
                        </div>
                      </td>

                      <td>
                        {record.configured
                          ? currency(record.totalFee)
                          : "Not set"}
                      </td>

                      <td>{currency(record.paidAmount)}</td>
                      <td>{currency(record.balanceAmount)}</td>

                      <td>
                        <span>{dateLabel(record.deadline)}</span>
                        {record.configured &&
                          record.status === "PENDING" && (
                            <small className="admin-fees-days">
                              {record.daysRemaining} days remaining
                            </small>
                          )}
                      </td>

                      <td>
                        <span
                          className={`admin-fees-status ${
                            record.status === "COMPLETED"
                              ? "completed"
                              : record.configured
                              ? "pending"
                              : "not-set"
                          }`}
                        >
                          {record.status === "COMPLETED"
                            ? "Completed"
                            : record.configured
                            ? "Pending"
                            : "Not set"}
                        </span>

                        {isBlocked && (
                          <small className="admin-fees-blocked">
                            Access blocked
                          </small>
                        )}
                      </td>

                      <td>
                        <div className="admin-fees-actions">
                          <button
                            type="button"
                            onClick={() => openFeeModal(record)}
                          >
                            {record.configured ? "Edit Fee" : "Set Fee"}
                          </button>

                          {record.configured &&
                            record.status === "PENDING" && (
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => openPaymentModal(record)}
                              >
                                <Plus size={14} />
                                Installment
                              </button>
                            )}

                          {isBlocked && (
                            <button
                              type="button"
                              className="restore"
                              onClick={() => restoreAccess(record)}
                            >
                              Restore Access
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-fees-panel admin-fees-permissions">
        <div className="admin-fees-panel-header">
          <div>
            <h2>Teacher Fee Permissions</h2>
            <p>Only enabled teachers can edit fees for their assigned students.</p>
          </div>
          <ShieldCheck size={24} />
        </div>

        {teachers.length === 0 ? (
          <div className="admin-fees-empty">No active teachers found.</div>
        ) : (
          <div className="admin-fees-teacher-list">
            {teachers.map((teacher) => (
              <div className="admin-fees-teacher" key={teacher._id}>
                <div>
                  <strong>{teacher.name}</strong>
                  <span>{teacher.email}</span>
                </div>

                <label className="admin-fees-toggle">
                  <input
                    type="checkbox"
                    checked={teacher.canManageFees === true}
                    onChange={(event) =>
                      updateTeacherPermission(
                        teacher,
                        event.target.checked
                      )
                    }
                  />
                  <span />
                  <small>
                    {teacher.canManageFees ? "Enabled" : "Disabled"}
                  </small>
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      {showFeeModal && selectedStudent && (
        <div className="admin-fees-modal-backdrop">
          <form className="admin-fees-modal" onSubmit={saveFee}>
            <button
              type="button"
              className="admin-fees-modal-close"
              onClick={() => setShowFeeModal(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <h2>
              {selectedStudent.configured ? "Edit Student Fee" : "Set Student Fee"}
            </h2>
            <p>{selectedStudent.student?.name}</p>

            <label htmlFor="student-total-fee">Total Fee (₹)</label>
            <input
              id="student-total-fee"
              type="number"
              min="1"
              step="1"
              required
              value={feeInput}
              onChange={(event) => setFeeInput(event.target.value)}
              placeholder="Enter individual total fee"
            />

            <div className="admin-fees-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowFeeModal(false)}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Fee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showPaymentModal && selectedStudent && (
        <div className="admin-fees-modal-backdrop">
          <form className="admin-fees-modal" onSubmit={saveInstallment}>
            <button
              type="button"
              className="admin-fees-modal-close"
              onClick={() => setShowPaymentModal(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <h2>Record Installment</h2>
            <p>{selectedStudent.student?.name}</p>

            <div className="admin-fees-payment-balance">
              <span>Remaining balance</span>
              <strong>{currency(selectedStudent.balanceAmount)}</strong>
            </div>

            <label htmlFor="installment-amount">Amount received (₹)</label>
            <input
              id="installment-amount"
              type="number"
              min="1"
              max={selectedStudent.balanceAmount}
              step="1"
              required
              value={installmentInput}
              onChange={(event) =>
                setInstallmentInput(event.target.value)
              }
              placeholder="Enter amount received"
            />

            <label htmlFor="installment-note">Note (optional)</label>
            <input
              id="installment-note"
              value={installmentNote}
              maxLength={300}
              onChange={(event) =>
                setInstallmentNote(event.target.value)
              }
              placeholder="Payment reference or note"
            />

            <div className="admin-fees-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert((previous) => ({ ...previous, isOpen: false }))
        }
      />
    </div>
  );
};

export default AdminFees;
