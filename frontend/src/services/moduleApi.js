import api from "./api";

// Get all modules for a course
export const getModulesByCourse = async (courseId) => {
  try {
    const response = await api.get(
      `/modules/course/${courseId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch course modules";

    throw new Error(message);
  }
};

// Get single module
export const getModuleById = async (moduleId) => {
  try {
    const response = await api.get(
      `/modules/${moduleId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch module";

    throw new Error(message);
  }
};

// Create module
export const createModule = async (moduleData) => {
  try {
    const response = await api.post(
      "/modules",
      moduleData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to create module";

    throw new Error(message);
  }
};

// Update module
export const updateModule = async (
  moduleId,
  moduleData
) => {
  try {
    const response = await api.put(
      `/modules/${moduleId}`,
      moduleData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to update module";

    throw new Error(message);
  }
};

// Deactivate module
export const deactivateModule = async (
  moduleId
) => {
  try {
    const response = await api.patch(
      `/modules/${moduleId}/deactivate`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to deactivate module";

    throw new Error(message);
  }
};
// Activate module
export const activateModule = async (
  moduleId
) => {
  try {
    const response = await api.patch(
      `/modules/${moduleId}/activate`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to activate module";

    throw new Error(message);
  }
};
