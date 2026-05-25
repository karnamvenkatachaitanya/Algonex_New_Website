import apiClient from "./client";

export const programsAPI = {
  list(params = {}) {
    return apiClient.get("/programs/", { params });
  },

  detail(slug) {
    return apiClient.get(`/programs/${slug}/`);
  },
};
