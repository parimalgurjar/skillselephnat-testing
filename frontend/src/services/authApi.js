import api from "./api";

/* Preserve Axios HTTP status and friendly error messages. */
const prepareError = (error, fallback) => {
  error.message =
    error.response?.data?.message ||
    error.userMessage ||
    error.message ||
    fallback;

  return error;
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    return response.data;
  } catch (error) {
    throw prepareError(error, "Login failed");
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post(
      "/auth/register",
      userData
    );

    return response.data;
  } catch (error) {
    throw prepareError(error, "Registration failed");
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");

    return response.data;
  } catch (error) {
    throw prepareError(
      error,
      "Unable to fetch current user"
    );
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put(
      "/auth/update-profile",
      userData
    );

    return response.data;
  } catch (error) {
    throw prepareError(
      error,
      "Unable to update profile"
    );
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await api.put(
      "/auth/change-password",
      passwordData
    );

    return response.data;
  } catch (error) {
    throw prepareError(
      error,
      "Unable to change password"
    );
  }
};