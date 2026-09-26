import api from "./api";

/* =====================================================
   GET MY PROFILE
===================================================== */

export const getTeacherProfile = async () => {
  try {
    const response = await api.get(
      "/teachers/profile"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch profile"
    );
  }
};


/* =====================================================
   UPDATE MY PROFILE
===================================================== */

export const updateTeacherProfile = async (
  data
) => {
  try {
    const response = await api.put(
      "/teachers/profile",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to update profile"
    );
  }
};