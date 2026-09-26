import api from "./api";

/* =====================================================
   GET ALL SPECIALIZATIONS
   Admin panel
   Includes active + inactive
===================================================== */

export const getAllSpecializations = async () => {
  const response = await api.get("/specializations");
  return response.data;
};

/* =====================================================
   GET ACTIVE SPECIALIZATIONS
   Used by:
   - Teacher Signup
   - Student Ask a Doubt
===================================================== */

export const getActiveSpecializations = async () => {
  const response = await api.get("/specializations/active");
  return response.data;
};

/* =====================================================
   GET SINGLE SPECIALIZATION
===================================================== */

export const getSpecializationById = async (id) => {
  const response = await api.get(`/specializations/${id}`);
  return response.data;
};

/* =====================================================
   CREATE SPECIALIZATION
===================================================== */

export const createSpecialization = async (data) => {
  const response = await api.post("/specializations", data);
  return response.data;
};

/* =====================================================
   UPDATE SPECIALIZATION
===================================================== */

export const updateSpecialization = async (id, data) => {
  const response = await api.put(`/specializations/${id}`, data);
  return response.data;
};

/* =====================================================
   DEACTIVATE SPECIALIZATION
===================================================== */

export const deactivateSpecialization = async (id) => {
  const response = await api.patch(`/specializations/${id}/deactivate`, {});
  return response.data;
};

/* =====================================================
   ACTIVATE SPECIALIZATION
===================================================== */

export const activateSpecialization = async (id) => {
  const response = await api.patch(`/specializations/${id}/activate`, {});
  return response.data;
};