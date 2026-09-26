import api from "./api";

// Get all students
export const getStudents = async () => {
  try {
    const response = await api.get("/students");

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch students";
    throw new Error(message);
  }
};

// Get single student
export const getStudentById = async (studentId) => {
  try {
    const response = await api.get(
      `/students/${studentId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch student";

    throw new Error(message);
  }
};

// Create student
export const createStudent = async (studentData) => {
  try {
    const response = await api.post(
      "/students",
      studentData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to create student";

    throw new Error(message);
  }
};

// Update student
export const updateStudent = async (
  studentId,
  studentData
) => {
  try {
    const response = await api.put(
      `/students/${studentId}`,
      studentData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to update student";

    throw new Error(message);
  }
};

// Deactivate student
export const deactivateStudent = async (
  studentId
) => {
  try {
    const response = await api.patch(
      `/students/${studentId}/deactivate`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to deactivate student";

    throw new Error(message);
  }
};