import api from "./api";

/* =====================================================
   GET ALL USERS
===================================================== */

export const getAllUsers = async () => {
  try {
    const response = await api.get("/admin/users");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch users"
    );
  }
};

/* =====================================================
   GET PENDING USERS
===================================================== */

export const getPendingUsers = async () => {
  try {
    const response = await api.get(
      "/admin/pending-users"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch pending users"
    );
  }
};

/* =====================================================
   APPROVE USER
===================================================== */

export const approveUser = async (userId) => {
  try {
    const response = await api.put(
      `/admin/approve/${userId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to approve user"
    );
  }
};

/* =====================================================
   REJECT USER
===================================================== */

export const rejectUser = async (userId) => {
  try {
    const response = await api.put(
      `/admin/reject/${userId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to reject user"
    );
  }
};

/* =====================================================
   GET ALL STUDENTS
===================================================== */

export const getStudents = async () => {
  try {
    const response = await api.get(
      "/admin/students"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch students"
    );
  }
};

/* =====================================================
   GET ALL TEACHERS
===================================================== */

export const getTeachers = async () => {
  try {
    const response = await api.get(
      "/admin/teachers"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch teachers"
    );
  }
};