import apiClient from "./client";

export const portfolioAPI = {
  list(params = {}) {
    return apiClient.get("/portfolio/", { params });
  },

  detail(slug) {
    return apiClient.get(`/portfolio/${slug}/`);
  },
};
