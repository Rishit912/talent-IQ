import axiosInstance from "../lib/axios";

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/sessions", data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axiosInstance.get("/sessions/active");
    return response.data;
  },
  getHostActiveSessions: async () => {
    const response = await axiosInstance.get("/sessions/host-active");
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/sessions/my-recent");
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/sessions/${id}`);
    return response.data;
  },

  joinSession: async (idOrPayload) => {
    let id;
    let accessCode;
    if (typeof idOrPayload === 'object' && idOrPayload !== null) {
      id = idOrPayload.id;
      accessCode = idOrPayload.accessCode;
    } else {
      id = idOrPayload;
    }
    const response = await axiosInstance.post(`/sessions/${id}/join`, { accessCode });
    return response.data;
  },
  endSession: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/end`);
    return response.data;
  },
  createInvite: async (sessionId) => {
    const response = await axiosInstance.post(`/sessions/${sessionId}/invite`);
    return response.data;
  },
  joinWithInvite: async (token) => {
    const response = await axiosInstance.post(`/sessions/invite/${token}/join`);
    return response.data;
  },
  getStreamToken: async () => {
    const response = await axiosInstance.get(`/chat/token`);
    return response.data;
  },
};