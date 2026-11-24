
import api from "./api";

// Get all resources for Admin
export const getAdminResources = async () => {
  try {
    const response = await api.get("/resources/admin");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch resources";

    throw new Error(message);
  }
};

// Get published resources for Student / Teacher
export const getPublishedResources = async () => {
  try {
    const response = await api.get("/resources/published");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch published resources";

    throw new Error(message);
  }
};

// Create resource
export const createResource = async (resourceData) => {
  try {
    const response = await api.post("/resources", resourceData);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to create resource";

    throw new Error(message);
  }
};

// Update resource
export const updateResource = async (resourceId, resourceData) => {
  try {
    const response = await api.put(
      `/resources/${resourceId}`,
      resourceData
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to update resource";

    throw new Error(message);
  }
};

// Publish / Move resource to Draft
export const updateResourceStatus = async (resourceId, status) => {
  try {
    const response = await api.patch(
      `/resources/${resourceId}/status`,
      { status }
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to update resource status";

    throw new Error(message);
  }
};

// Delete resource
export const deleteResource = async (resourceId) => {
  try {
    const response = await api.delete(
      `/resources/${resourceId}`
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to delete resource";

    throw new Error(message);
  }
};
