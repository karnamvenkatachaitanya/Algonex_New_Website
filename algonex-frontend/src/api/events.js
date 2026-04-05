import apiClient from "./client";

export const eventsAPI = {
  list(params = {}) {
    return apiClient.get("/events/", { params });
  },

  detail(slug) {
    return apiClient.get(`/events/${slug}/`);
  },

  register(slug) {
    return apiClient.post(`/events/${slug}/register/`);
  },

  cancel(slug) {
    return apiClient.post(`/events/${slug}/cancel/`);
  },

  myRegistrations(params = {}) {
    return apiClient.get("/event-registrations/", { params });
  },
};
