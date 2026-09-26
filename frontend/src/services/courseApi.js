import api from "./api";

// Get all courses
export const getCourses = async () => {
  try {
    const response = await api.get("/courses");

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch courses";

    throw new Error(message);
  }
};

// Get single course
export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(
      `/courses/${courseId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch course";

    throw new Error(message);
  }
};

// Create course
export const createCourse = async (courseData) => {
  try {
    const response = await api.post(
      "/courses",
      courseData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to create course";

    throw new Error(message);
  }
};

// Update course
export const updateCourse = async (
  courseId,
  courseData
) => {
  try {
    const response = await api.put(
      `/courses/${courseId}`,
      courseData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to update course";

    throw new Error(message);
  }
};

// Deactivate course
export const deactivateCourse = async (
  courseId
) => {
  try {
    const response = await api.patch(
      `/courses/${courseId}/deactivate`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to deactivate course";

    throw new Error(message);
  }
};