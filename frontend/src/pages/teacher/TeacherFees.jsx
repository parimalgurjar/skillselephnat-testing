
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IndianRupee,
  RefreshCw,
  Search,
  Wallet,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import "./TeacherFees.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const dateLabel = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not configured";

const getBatchId = (student) => {
  const batch = student?.batchId;

  if (batch && typeof batch === "object") {
    return batch._id ? String(batch._id) : "";
  }

  return batch ? String(batch) : "";
};

const getBatchLabel = (student) => {
  const batch = student?.batchId;

  if (batch && typeof batch === "object") {
    return (
      batch.batchTiming ||
      batch.name ||
      student.batchTiming ||
      "Batch not assigned"
    );
  }

  return student?.batchTiming || "Batch not assigned";
};

const getBatchKey = (student) => {
  const batchId = getBatchId(student);

  // Use canonical Batch ID wherever it is available.
  if (batchId) return `batch:${batchId}`;

  // Legacy records without batchId use their timing.
  const timing = student?.batchTiming?.trim();

  return timing ? `legacy:${timing}` : "unassigned";
};

const TeacherFees = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [savingId, setSavingId] = useState("");

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/fees/students");
      setStudents(response.data?.students || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Fees load nahi hui. Permission aur backend check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const batches = useMemo(() => {
    const batchMap = new Map();

    students.forEach((record) => {
      const student = record.student || {};
      const key = getBatchKey(student);

      if (key === "unassigned" || batchMap.has(key)) return;

      batchMap.set(key, {
        value: key,
        label: getBatchLabel(student),
      });
    });

    return Array.from(batchMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "en")
    );
  }, [students]);

  const setFee = async (record) => {
    const student = record.student;

    if (!student?._id) return;

    const input = window.prompt(
      `${student.name} ki total fee enter karein (₹):`,
      record.configured ? String(record.totalFee) : ""
    );

    if (input === null) return;

    const totalFee = Number(input);

    if (!Number.isFinite(totalFee) || totalFee <= 0) {
      window.alert("Valid fee amount enter karein.");
      return;
    }

    try {
      setSavingId(student._id);

      await api.put(`/fees/students/${student._id}`, {
        totalFee,
      });

      await loadFees();
      window.alert("Student ki fee save ho gayi.");
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Fee save nahi ho payi."
      );
    } finally {
      setSavingId("");
    }
  };

  const addInstallment = async (record) => {
    const student = record.student;

    if (!student?._id || !record.configured) {
      window.alert("Pehle student ki total fee set karein.");
      return;
    }

    if (record.balanceAmount <= 0) {
      window.alert("Student ki fee already complete hai.");
      return;
    }

    const input = window.prompt(
      `${student.name} ki payment amount enter karein (₹):`,
      String(record.balanceAmount)
    );

    if (input === null) return;

    const amount = Number(input);

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Valid installment amount enter karein.");
      return;
    }

    const note = window.prompt("Payment note (optional):", "") ?? "";

    try {
      setSavingId(student._id);

      await api.post(`/fees/students/${student._id}/installments`, {
        amount,
        note,
      });

      await loadFees();
      window.alert("Installment record ho gayi.");
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Payment record nahi ho payi."
      );
    } finally {
      setSavingId("");
    }
  };

  const batchStudents = useMemo(() => {
    if (selectedBatch === "all") return students;

    return students.filter(
      (record) => getBatchKey(record.student || {}) === selectedBatch
    );
  }, [students, selectedBatch]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return batchStudents.filter((record) => {
      const student = record.student || {};

      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        getBatchLabel(student).toLowerCase().includes(query);

      const status = record.configured
        ? record.status
        : "NOT_SET";

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "notset" && status === "NOT_SET") ||
        (selectedStatus === "pending" && status === "PENDING") ||
        (selectedStatus === "completed" && status === "COMPLETED");

      return matchesSearch && matchesStatus;
    });
  }, [batchStudents, search, selectedStatus]);

  const summary = useMemo(() => {
    const configured = batchStudents.filter(
      (record) => record.configured
    );

    const pending = configured.filter(
      (record) => record.status === "PENDING"
    );

    const completed = configured.filter(
      (record) => record.status === "COMPLETED"
    );

    const notSet = batchStudents.filter(
      (record) => !record.configured
    );

    const totalPaid = configured.reduce(
      (sum, record) => sum + Number(record.paidAmount || 0),
      0
    );

    const totalBalance = configured.reduce(
      (sum, record) => sum + Number(record.balanceAmount || 0),
      0
    );

    return {
      total: batchStudents.length,
      pending: pending.length,
      completed: completed.length,
      notSet: notSet.length,
      totalPaid,
      totalBalance,
    };
  }, [batchStudents]);

  const activeBatchLabel =
    selectedBatch === "all"
      ? "All Batches"
      : batches.find((batch) => batch.value === selectedBatch)?.label ||
        "Selected Batch";

  return (
    <section className="teacher-fees-page">
      <div className="teacher-fees-heading">
        <div>
          <span className="teacher-fees-eyebrow">EDUCATOR PORTAL</span>
          <h1>Fee Management</h1>
          <p>
            Batch-wise student fees, installments aur payment status
            manage karein.
          </p>
        </div>

        <button
          type="button"
          className="teacher-fees-refresh"
          onClick={loadFees}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="teacher-fees-filters">
        <label className="teacher-fees-filter-field">
          <span>Filter by Batch</span>

          <select
            value={selectedBatch}
            onChange={(event) => setSelectedBatch(event.target.value)}
          >
            <option value="all">All Batches</option>

            {batches.map((batch) => (
              <option key={batch.value} value={batch.value}>
                {batch.label}
              </option>
            ))}

            {students.some(
              (record) =>
                getBatchKey(record.student || {}) === "unassigned"
            ) && <option value="unassigned">Batch not assigned</option>}
          </select>
        </label>

        <label className="teacher-fees-filter-field">
          <span>Filter by Fee Status</span>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="notset">Not Set</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="teacher-fees-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student..."
          />
        </label>
      </div>

      <div className="teacher-fees-active-filter">
        Showing: <strong>{activeBatchLabel}</strong>
        <span>{summary.total} students</span>
      </div>

      <div className="teacher-fees-stats">
        <article>
          <div className="teacher-fees-stat-icon blue">
            <Users size={19} />
          </div>
          <span>Students in Batch</span>
          <strong>{summary.total}</strong>
        </article>

        <article>
          <div className="teacher-fees-stat-icon orange">
            <Clock size={19} />
          </div>
          <span>Pending Fees</span>
          <strong>{summary.pending}</strong>
        </article>

        <article>
          <div className="teacher-fees-stat-icon green">
            <CheckCircle2 size={19} />
          </div>
          <span>Completed Fees</span>
          <strong>{summary.completed}</strong>
        </article>

        <article>
          <div className="teacher-fees-stat-icon gray">
            <Wallet size={19} />
          </div>
          <span>Fees Not Set</span>
          <strong>{summary.notSet}</strong>
        </article>
      </div>

      <div className="teacher-fees-card">
        <div className="teacher-fees-toolbar">
          <div>
            <h2>Student Fee Records</h2>
            <p>
              {activeBatchLabel} · {filteredStudents.length} records
            </p>
          </div>
        </div>

        {error && (
          <div className="teacher-fees-error">
            {error}
            <button type="button" onClick={loadFees}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="teacher-fees-empty">Loading fee records...</div>
        ) : !error && filteredStudents.length === 0 ? (
          <div className="teacher-fees-empty">
            <Wallet size={28} />
            <p>Is filter ke liye koi student record nahi mila.</p>
          </div>
        ) : (
          !error && (
            <div className="teacher-fees-table-wrap">
              <table className="teacher-fees-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
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
                    const completed = record.status === "COMPLETED";
                    const isSaving = savingId === student._id;

                    return (
                      <tr key={student._id}>
                        <td>
                          <strong>{student.name || "Student"}</strong>
                          <small>{student.email || "—"}</small>
                        </td>

                        <td>{getBatchLabel(student)}</td>

                        <td>
                          {record.configured ? money(record.totalFee) : "—"}
                        </td>

                        <td>
                          {record.configured ? money(record.paidAmount) : "—"}
                        </td>

                        <td>
                          {record.configured
                            ? money(record.balanceAmount)
                            : "—"}
                        </td>

                        <td>{dateLabel(record.deadline)}</td>

                        <td>
                          <span
                            className={`teacher-fees-status ${
                              completed
                                ? "completed"
                                : record.configured
                                  ? "pending"
                                  : "not-set"
                            }`}
                          >
                            {record.configured ? record.status : "Not set"}
                          </span>
                        </td>

                        <td>
                          <div className="teacher-fees-actions">
                            <button
                              type="button"
                              onClick={() => setFee(record)}
                              disabled={isSaving}
                            >
                              {isSaving
                                ? "Saving..."
                                : record.configured
                                  ? "Edit Fee"
                                  : "Set Fee"}
                            </button>

                            <button
                              type="button"
                              className="secondary"
                              onClick={() => addInstallment(record)}
                              disabled={
                                isSaving ||
                                !record.configured ||
                                record.balanceAmount <= 0
                              }
                            >
                              <IndianRupee size={14} />
                              Payment
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default TeacherFees;
