import apiClient from "./client";

export const commonAPI = {
  getFAQs: () => apiClient.get("/faqs/"),
  getGallery: (featured = false) => apiClient.get("/gallery/", { params: { featured } }),
};
