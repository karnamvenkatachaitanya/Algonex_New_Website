import apiClient from "./client";

export const coursesAPI = {
  list(params = {}) {
    return apiClient.get("/courses/", { params });
  },

  detail(slug) {
    return apiClient.get(`/courses/${slug}/`);
  },

  enroll(slug) {
    return apiClient.post(`/courses/${slug}/enroll/`);
  },

  myEnrollments(params = {}) {
    return apiClient.get("/enrollments/", { params });
  },

  dropEnrollment(id) {
    return apiClient.post(`/enrollments/${id}/drop/`);
  },
};
