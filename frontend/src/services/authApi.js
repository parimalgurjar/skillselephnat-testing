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
      userData,
      {
        timeout: 45000,
      }
    );

    return response.data;

  } catch (error) {
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      error.userMessage =
        "Registration is taking longer than expected. Please do not submit repeatedly. Wait and check with the admin before trying again.";
    }

    throw prepareError(
      error,
      "Registration failed"
    );
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
/* =====================================================
   PROFILE PHOTO UPLOAD
===================================================== */

export const uploadProfilePhoto = async (
  file,
  onUploadProgress
) => {
  try {
    const formData = new FormData();

    formData.append("profilePhoto", file);

    const response = await api.post(
      "/auth/profile-photo",
      formData,
      {
        timeout: 60000,
        onUploadProgress,
      }
    );

    return response.data;
  } catch (error) {
    throw prepareError(
      error,
      "Unable to upload profile photo"
    );
  }
};


/* =====================================================
   REMOVE PROFILE PHOTO
===================================================== */

export const removeProfilePhoto = async () => {
  try {
    const response = await api.delete(
      "/auth/profile-photo"
    );

    return response.data;
  } catch (error) {
    throw prepareError(
      error,
      "Unable to remove profile photo"
    );
  }
};