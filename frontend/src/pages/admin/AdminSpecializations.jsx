import React, { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  CheckCircle,
  XCircle,
  RefreshCw,
  Layers,
  GripVertical,
} from "lucide-react";
import {
  getAllSpecializations,
  createSpecialization,
  updateSpecialization,
  activateSpecialization,
  deactivateSpecialization,
} from "../../services/specializationApi";
import "./AdminSpecializations.css";

const AdminSpecializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    displayOrder: 0,
  });

  /* =====================================================
     FETCH SPECIALIZATIONS
  ===================================================== */

  const fetchSpecializations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllSpecializations();

      setSpecializations(
        response?.specializations || []
      );
    } catch (err) {
      console.error(
        "Fetch Specializations Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load specializations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  /* =====================================================
     FORM
  ===================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      displayOrder: specializations.length + 1,
    });

    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setForm({
      name: "",
      displayOrder: specializations.length + 1,
    });

    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setError("");
    setSuccess("");

    setForm({
      name: item.name || "",
      displayOrder: item.displayOrder ?? 0,
    });

    setEditingId(item._id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     CREATE / UPDATE
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Please enter specialization name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name,
        displayOrder: Number(
          form.displayOrder || 0
        ),
      };

      if (editingId) {
        await updateSpecialization(
          editingId,
          payload
        );

        setSuccess(
          "Specialization updated successfully."
        );
      } else {
        await createSpecialization(payload);

        setSuccess(
          "Specialization created successfully."
        );
      }

      await fetchSpecializations();
      resetForm();
    } catch (err) {
      console.error(
        "Save Specialization Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save specialization."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     ACTIVATE / DEACTIVATE
  ===================================================== */

  const handleStatusChange = async (item) => {
    try {
      setError("");
      setSuccess("");

      if (item.isActive) {
        await deactivateSpecialization(
          item._id
        );

        setSuccess(
          `${item.name} deactivated successfully.`
        );
      } else {
        await activateSpecialization(item._id);

        setSuccess(
          `${item.name} activated successfully.`
        );
      }

      await fetchSpecializations();
    } catch (err) {
      console.error(
        "Specialization Status Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update specialization status."
      );
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="admin-specializations-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-specializations-header">
        <div className="admin-specializations-title">
          <div className="admin-specializations-icon">
            <Layers size={24} />
          </div>

          <div>
            <h1>Specializations</h1>

            <p>
              Manage the topics used for teacher
              expertise and student doubts.
            </p>
          </div>
        </div>

        <div className="admin-specializations-actions">
          <button
            type="button"
            className="admin-specializations-refresh"
            onClick={fetchSpecializations}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="admin-specializations-add"
            onClick={openAddForm}
          >
            <Plus size={18} />

            Add Specialization
          </button>
        </div>
      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (
        <div className="admin-specializations-alert error">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="admin-specializations-alert success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* =================================================
          ADD / EDIT FORM
      ================================================= */}

      {showForm && (
        <div className="admin-specializations-form-card">
          <div className="admin-specializations-form-header">
            <div>
              <h2>
                {editingId
                  ? "Edit Specialization"
                  : "Add Specialization"}
              </h2>

              <p>
                This topic will appear in teacher
                specialization and student doubt forms.
              </p>
            </div>

            <button
              type="button"
              className="admin-specializations-close"
              onClick={resetForm}
              disabled={saving}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-specializations-form-grid">
              <div className="admin-specializations-field">
                <label htmlFor="specialization-name">
                  Specialization Name
                </label>

                <input
                  id="specialization-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. WordPress"
                  disabled={saving}
                  autoComplete="off"
                />
              </div>

              <div className="admin-specializations-field">
                <label htmlFor="specialization-order">
                  Display Order
                </label>

                <input
                  id="specialization-order"
                  type="number"
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={handleChange}
                  min="0"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="admin-specializations-form-footer">
              <button
                type="button"
                className="admin-specializations-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-specializations-save"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Specialization"
                  : "Create Specialization"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================
          LIST
      ================================================= */}

      <div className="admin-specializations-card">
        <div className="admin-specializations-card-header">
          <div>
            <h2>All Specializations</h2>

            <p>
              {specializations.length} specialization
              {specializations.length !== 1
                ? "s"
                : ""}{" "}
              configured
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-specializations-loading">
            <RefreshCw
              size={22}
              className="admin-spin"
            />

            <span>
              Loading specializations...
            </span>
          </div>
        ) : specializations.length === 0 ? (
          <div className="admin-specializations-empty">
            <Layers size={42} />

            <h3>
              No specializations yet
            </h3>

            <p>
              Add your first specialization to
              start assigning topics to teachers.
            </p>

            <button
              type="button"
              onClick={openAddForm}
            >
              <Plus size={17} />
              Add Specialization
            </button>
          </div>
        ) : (
          <div className="admin-specializations-list">
            {specializations.map(
              (item, index) => (
                <div
                  className={`admin-specialization-row ${
                    item.isActive
                      ? "active"
                      : "inactive"
                  }`}
                  key={item._id}
                >
                  <div className="admin-specialization-order">
                    <GripVertical size={18} />
                    <span>
                      {item.displayOrder ||
                        index + 1}
                    </span>
                  </div>

                  <div className="admin-specialization-info">
                    <div className="admin-specialization-name">
                      {item.name}
                    </div>

                    <div className="admin-specialization-status">
                      <span
                        className={`admin-specialization-status-dot ${
                          item.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      />

                      {item.isActive
                        ? "Active"
                        : "Inactive"}
                    </div>
                  </div>

                  <div className="admin-specialization-actions">
                    <button
                      type="button"
                      className="admin-specialization-edit"
                      onClick={() =>
                        openEditForm(item)
                      }
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className={
                        item.isActive
                          ? "admin-specialization-deactivate"
                          : "admin-specialization-activate"
                      }
                      onClick={() =>
                        handleStatusChange(item)
                      }
                    >
                      {item.isActive ? (
                        <>
                          <XCircle size={16} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSpecializations;