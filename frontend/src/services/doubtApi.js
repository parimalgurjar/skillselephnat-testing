import api from "./api";

/* =====================================================
   CREATE DOUBT
===================================================== */

export const createDoubt = async (data) => {
  try {
    const response = await api.post(
      "/doubts",
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to submit doubt"
    );
  }
};

/* =====================================================
   GET DOUBTS
===================================================== */

export const getDoubts = async () => {
  try {
    const response = await api.get(
      "/doubts"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch doubts"
    );
  }
};

/* =====================================================
   GET SINGLE DOUBT
===================================================== */

export const getDoubtById = async (id) => {
  try {
    const response = await api.get(
      `/doubts/${id}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch doubt"
    );
  }
};

/* =====================================================
   ADD REPLY
===================================================== */

export const addDoubtReply = async (
  id,
  data
) => {
  try {
    const response = await api.post(
      `/doubts/${id}/reply`,
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to send reply"
    );
  }
};

/* =====================================================
   RESOLVE DOUBT
===================================================== */

export const resolveDoubt = async (id) => {
  try {
    const response = await api.patch(
      `/doubts/${id}/resolve`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to resolve doubt"
    );
  }
};
/* =====================================================
   GET CONVERSATION MESSAGES
===================================================== */

export const getConversationMessages = async (id) => {
  try {
    const response = await api.get(
      `/doubts/${id}/messages`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch conversation"
    );
  }
};

/* =====================================================
   SEND MESSAGE WITH OPTIONAL ATTACHMENT
===================================================== */

export const sendDoubtMessage = async (
  id,
  { message = "", file = null }
) => {
  try {
    const formData = new FormData();

    if (message.trim()) {
      formData.append("message", message.trim());
    }

    if (file) {
      formData.append("attachment", file);
    }

    const response = await api.post(
      `/doubts/${id}/messages`,
      formData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to send message"
    );
  }
};