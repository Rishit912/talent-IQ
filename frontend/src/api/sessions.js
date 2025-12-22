import axiosInstance from "../lib/axios";

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/api/sessions", data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axiosInstance.get("/api/sessions/active");
    return response.data;
  },
  getHostActiveSessions: async () => {
    const response = await axiosInstance.get("/api/sessions/host-active");
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/api/sessions/my-recent");
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/api/sessions/${id}`);
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
    const response = await axiosInstance.post(`/api/sessions/${id}/join`, { accessCode });
    return response.data;
  },
  endSession: async (id) => {
    const response = await axiosInstance.post(`/api/sessions/${id}/end`);
    return response.data;
  },
  createInvite: async (sessionId) => {
    const response = await axiosInstance.post(`/api/sessions/${sessionId}/invite`);
    return response.data;
  },
  joinWithInvite: async (token) => {
    const response = await axiosInstance.post(`/api/sessions/invite/${token}/join`);
    return response.data;
  },
  getStreamToken: async () => {
    const response = await axiosInstance.get(`/api/chat/token`);
    return response.data;
  },
};