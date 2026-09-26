import api from "./api";

/**
 * Create Teacher
 *
 * Backend:
 * POST /api/teachers
 */
export const createTeacher = async (teacherData) => {
  const response = await api.post(
    "/teachers",
    teacherData
  );

  return response.data;
};

/**
 * Get all teachers
 *
 * Backend:
 * GET /api/teachers
 */
export const getTeachers = async () => {
  const response = await api.get("/teachers");

  return response.data;
};

/**
 * Get single teacher
 *
 * Backend:
 * GET /api/teachers/:id
 */
export const getTeacherById = async (teacherId) => {
  const response = await api.get(
    `/teachers/${teacherId}`
  );

  return response.data;
};

/**
 * Update teacher
 *
 * Backend:
 * PUT /api/teachers/:id
 */
export const updateTeacher = async (
  teacherId,
  teacherData
) => {
  const response = await api.put(
    `/teachers/${teacherId}`,
    teacherData
  );

  return response.data;
};

/**
 * Deactivate teacher
 *
 * Backend:
 * PATCH /api/teachers/:id/deactivate
 */
export const deactivateTeacher = async (
  teacherId
) => {
  const response = await api.patch(
    `/teachers/${teacherId}/deactivate`
  );

  return response.data;
};