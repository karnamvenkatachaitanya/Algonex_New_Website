import apiClient from "./client";

export const certificatesAPI = {
  myCertificates(params = {}) {
    return apiClient.get("/certificates/", { params });
  },

  detail(id) {
    return apiClient.get(`/certificates/${id}/`);
  },
};
