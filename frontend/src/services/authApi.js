import api from "./api";

/* =====================================================
   LOGIN USER
===================================================== */

export const loginUser = async (credentials) => {
  try {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Login failed";

    throw new Error(message);
  }
};

/* =====================================================
   REGISTER USER
===================================================== */

export const registerUser = async (userData) => {
  try {
    const response = await api.post(
      "/auth/register",
      userData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Registration failed";

    throw new Error(message);
  }
};

/* =====================================================
   GET CURRENT USER
===================================================== */

export const getCurrentUser = async () => {
  try {
    const response = await api.get(
      "/auth/me"
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch current user";

    throw new Error(message);
  }
};

/* =====================================================
   UPDATE PROFILE
===================================================== */

export const updateProfile = async (userData) => {
  try {
    const response = await api.put(
      "/auth/update-profile",
      userData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to update profile";

    throw new Error(message);
  }
};

/* =====================================================
   CHANGE PASSWORD
===================================================== */

export const changePassword = async (passwordData) => {
  try {
    const response = await api.put(
      "/auth/change-password",
      passwordData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to change password";

    throw new Error(message);
  }
};