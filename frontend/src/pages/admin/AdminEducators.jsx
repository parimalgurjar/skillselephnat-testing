import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  GraduationCap,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  X,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import { getActiveSpecializations } from "../../services/specializationApi";
import "./AdminEducators.css";

const initialFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  joiningDate: "",
  status: "ACTIVE",
};

const AdminEducators = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [educators, setEducators] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [editingEducator, setEditingEducator] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const [specializations, setSpecializations] = useState([]);
  const [specializationsLoading, setSpecializationsLoading] = useState(true);

  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);

  /* =====================================================
     FETCH SPECIALIZATIONS
  ===================================================== */

  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        setSpecializationsLoading(true);

        const response = await getActiveSpecializations();

        setSpecializations(
          response?.specializations || []
        );
      } catch (error) {
        console.error(
          "Failed to load specializations:",
          error
        );

        setSpecializations([]);
      } finally {
        setSpecializationsLoading(false);
      }
    };

    loadSpecializations();
  }, []);

  /* =====================================================
     FETCH EDUCATORS
  ===================================================== */

  const fetchEducators = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/teachers");

      setEducators(
        response.data.teachers || []
      );
    } catch (error) {
      console.error(
        "Fetch Educators Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load educators"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducators();
  }, []);

  /* =====================================================
     TOGGLE SPECIALIZATION HANDLER
  ===================================================== */

  const toggleSpecialization = (name) => {
    setSelectedSpecializations((prev) => {
      if (prev.includes(name)) {
        return prev.filter(
          (item) => item !== name
        );
      }

      return [...prev, name];
    });
  };

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const handleAddEducator = () => {
    setEditingEducator(null);
    setFormError("");
    setFormData(initialFormState);
    setSelectedSpecializations([]);
    setShowSpecializationDropdown(false);

    setShowModal(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const handleEditEducator = (educator) => {
    setEditingEducator(educator);
    setFormError("");

    setSelectedSpecializations(
      educator.specializations || []
    );
    setShowSpecializationDropdown(false);

    setFormData({
      name: educator.name || "",

      email: educator.email || "",

      password: "",

      phone: educator.phone || "",

      joiningDate:
        educator.joiningDate
          ? new Date(educator.joiningDate)
              .toISOString()
              .split("T")[0]
          : "",

      status: educator.status || "ACTIVE",
    });

    setShowModal(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const handleCloseModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingEducator(null);
    setFormError("");
    setSelectedSpecializations([]);
    setShowSpecializationDropdown(false);
    setFormData(initialFormState);
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     CREATE / UPDATE EDUCATOR
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");

      if (!formData.name.trim() || !formData.email.trim()) {
        setFormError("Name and email are required");
        return;
      }

      if (!editingEducator && !formData.password.trim()) {
        setFormError("Temporary password is required");
        return;
      }

      if (selectedSpecializations.length === 0) {
        setFormError("Please select at least one specialization");
        return;
      }

      const payload = {
        name: formData.name.trim(),

        email: formData.email.trim().toLowerCase(),

        phone: formData.phone.trim(),

        specializations: selectedSpecializations,

        joiningDate: formData.joiningDate || null,

        status: formData.status,
      };

      if (!editingEducator) {
        payload.password = formData.password;
      }

      if (editingEducator) {
        await api.put(`/teachers/${editingEducator._id}`, payload);
      } else {
        await api.post("/teachers", payload);
      }

      await fetchEducators();
      handleCloseModal();
    } catch (error) {
      console.error("Save Educator Error:", error);

      setFormError(
        error.response?.data?.message || "Failed to save educator"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     DEACTIVATE / DELETE EDUCATOR
  ===================================================== */

  const handleDelete = async (educator) => {
    try {
      const response = await api.delete(`/teachers/${educator._id}`);

      setEducators((previousEducators) =>
        previousEducators.filter(
          (item) => item._id !== educator._id
        )
      );

      setAlert({
        isOpen: true,
        type: "success",
        title: "Teacher Deleted",
        message:
          response.data.message || "Educator deleted successfully",
      });
    } catch (error) {
      console.error("Delete Educator Error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message:
          error.response?.data?.message || "Failed to delete educator",
      });
    }
  };

  /* =====================================================
     FILTER EDUCATORS
  ===================================================== */

  const filteredEducators = educators.filter((educator) => {
    const searchValue = search.toLowerCase();

    return (
      educator.name?.toLowerCase().includes(searchValue) ||
      educator.email?.toLowerCase().includes(searchValue) ||
      educator.phone?.toLowerCase().includes(searchValue) ||
      educator.specializations?.some((specialization) =>
        specialization?.toLowerCase().includes(searchValue)
      )
    );
  });

  /* =====================================================
     STATS
  ===================================================== */

  const totalEducators = educators.length;

  const activeEducators = educators.filter(
    (educator) => educator.status === "ACTIVE"
  ).length;

  const inactiveEducators = educators.filter(
    (educator) => educator.status !== "ACTIVE"
  ).length;

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="admin-educators-page">
        <p>Loading educators...</p>
      </div>
    );
  }

  return (
    <div className="admin-educators-page">
      {/* ================= HEADER ================= */}

      <div className="admin-educators-header">
        <div>
          <span className="admin-page-label">ADMIN PORTAL</span>

          <h1>Educators Management</h1>

          <p>Manage educators and their professional information.</p>
        </div>

        <button className="add-educator-btn" onClick={handleAddEducator}>
          <Plus size={18} />
          Add Educator
        </button>
      </div>

      {/* ================= STATS ================= */}

      <div className="admin-educator-stats">
        <div className="admin-educator-stat-card">
          <div className="admin-educator-icon navy">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Total Educators</span>

            <strong>{totalEducators}</strong>

            <small>Registered educators</small>
          </div>
        </div>

        <div className="admin-educator-stat-card">
          <div className="admin-educator-icon green">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Active Educators</span>

            <strong>{activeEducators}</strong>

            <small>Currently active</small>
          </div>
        </div>

        <div className="admin-educator-stat-card">
          <div className="admin-educator-icon red">
            <UserX size={22} />
          </div>

          <div>
            <span>Inactive Educators</span>

            <strong>{inactiveEducators}</strong>

            <small>Account inactive</small>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="admin-educators-table-card">
        <div className="admin-educators-table-header">
          <div>
            <h2>All Educators</h2>

            <p>View and manage your institute educators.</p>
          </div>

          <div className="admin-educator-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search educator..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="admin-educators-table-wrapper">
          <table className="admin-educators-table">
            <thead>
              <tr>
                <th>Educator</th>
                <th>Contact</th>
                <th>Specializations</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {error ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredEducators.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    No educators found
                  </td>
                </tr>
              ) : (
                filteredEducators.map((educator) => (
                  <tr key={educator._id}>
                    {/* EDUCATOR */}

                    <td>
                      <div className="admin-educator-profile">
                        <div className="admin-educator-avatar">
                          {educator.name?.charAt(0)?.toUpperCase()}
                        </div>

                        <div>
                          <strong>{educator.name}</strong>

                          <span>
                            {educator._id?.slice(-8)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}

                    <td>
                      <div className="educator-contact">
                        <span>{educator.email}</span>

                        <small>{educator.phone || "—"}</small>
                      </div>
                    </td>

                    {/* SPECIALIZATIONS */}

                    <td>
                      <span className="specializations-badge">
                        {educator.specializations?.length > 0
                          ? educator.specializations.join(", ")
                          : "Not specified"}
                      </span>
                    </td>

                    {/* JOINING DATE */}

                    <td>
                      {formatDate(
                        educator.joiningDate || educator.createdAt
                      )}
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`educator-status ${
                          educator.status === "ACTIVE"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {educator.status}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td>
                      <div className="educator-table-actions">
                        <button
                          title="Edit Educator"
                          type="button"
                          onClick={() => handleEditEducator(educator)}
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          className="delete-educator-btn"
                          type="button"
                          title="Delete Educator"
                          onClick={() => handleDelete(educator)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}

      {showModal && (
        <div className="educator-modal-overlay">
          <div className="educator-modal">
            <div className="educator-modal-header">
              <div>
                <h2>
                  {editingEducator
                    ? "Edit Educator"
                    : "Add New Educator"}
                </h2>

                <p>
                  {editingEducator
                    ? "Update educator details and professional information."
                    : "Create a new educator account."}
                </p>
              </div>

              <button onClick={handleCloseModal} disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="educator-form">
                {formError && (
                  <div className="educator-form-error">{formError}</div>
                )}

                {/* NAME + EMAIL */}

                <div className="educator-form-row">
                  <div className="educator-form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={submitting}
                    />
                  </div>

                  <div className="educator-form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* PHONE + SPECIALIZATION */}

                <div className="educator-form-row">
                  <div className="educator-form-group">
                    <label>Phone Number</label>

                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      disabled={submitting}
                    />
                  </div>

                  <div className="educator-form-group">
                    <label>Specializations</label>

                    <div className="admin-specialization-select-wrapper">
                      <button
                        type="button"
                        className="admin-specialization-select"
                        onClick={() =>
                          setShowSpecializationDropdown((prev) => !prev)
                        }
                        disabled={submitting}
                      >
                        <span>
                          {selectedSpecializations.length > 0
                            ? selectedSpecializations.join(", ")
                            : specializationsLoading
                            ? "Loading specializations..."
                            : "Select specializations"}
                        </span>

                        <span className="admin-specialization-arrow">
                          ▾
                        </span>
                      </button>

                      {showSpecializationDropdown && (
                        <div className="admin-specialization-dropdown">
                          {specializations.length === 0 ? (
                            <div className="admin-specialization-empty">
                              No active specializations found.
                            </div>
                          ) : (
                            specializations.map((item) => (
                              <label
                                key={item._id}
                                className="admin-specialization-option"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSpecializations.includes(
                                    item.name
                                  )}
                                  onChange={() =>
                                    toggleSpecialization(item.name)
                                  }
                                />

                                <span>{item.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* JOINING DATE + STATUS */}

                <div className="educator-form-row">
                  <div className="educator-form-group">
                    <label>Joining Date</label>

                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="educator-form-group">
                    <label>Account Status</label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      <option value="ACTIVE">ACTIVE</option>

                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* PASSWORD ONLY CREATE */}

                {!editingEducator && (
                  <div className="educator-form-group">
                    <label>Temporary Password</label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div className="educator-modal-footer">
                <button
                  type="button"
                  className="cancel-educator-btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-educator-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingEducator
                    ? "Update Educator"
                    : "Create Educator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AdminEducators;