import apiClient from "./client";

export const alumniAPI = {
  list: (params) => apiClient.get("/alumni/", { params }),
  featured: () => apiClient.get("/alumni/featured/"),
};

export const projectsAPI = {
  list: (params) => apiClient.get("/projects/", { params }),
  featured: () => apiClient.get("/projects/featured/"),
  detail: (slug) => apiClient.get(`/projects/${slug}/`),
};
