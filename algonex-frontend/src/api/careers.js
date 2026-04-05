import apiClient from "./client";

export const careersAPI = {
  list(params = {}) {
    return apiClient.get("/careers/", { params });
  },

  detail(slug) {
    return apiClient.get(`/careers/${slug}/`);
  },

  apply(slug, formData) {
    return apiClient.post(`/careers/${slug}/apply/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  myApplications(params = {}) {
    return apiClient.get("/applications/", { params });
  },
};
