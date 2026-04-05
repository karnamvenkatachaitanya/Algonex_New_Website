import apiClient from "./client";

export const authAPI = {
  register(data) {
    return apiClient.post("/auth/register/", data);
  },

  login(data) {
    return apiClient.post("/auth/login/", data);
  },

  logout() {
    return apiClient.post("/auth/logout/");
  },

  getUser() {
    return apiClient.get("/auth/user/");
  },

  updateUser(data) {
    return apiClient.patch("/auth/user/", data);
  },

  changePassword(data) {
    return apiClient.post("/auth/password/change/", data);
  },

  resetPassword(email) {
    return apiClient.post("/auth/password/reset/", { email });
  },

  confirmResetPassword(data) {
    return apiClient.post("/auth/password/reset/confirm/", data);
  },
};
