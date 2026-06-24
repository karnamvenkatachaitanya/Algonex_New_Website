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

  checkEmail(email) {
    return apiClient.post("/auth/check-email/", { email });
  },

  sendSetupEmail(email) {
    return apiClient.post("/auth/send-setup-email/", { email });
  },

  setPassword(data) {
    return apiClient.post("/auth/set-password/", data);
  },

  requestPasswordResetOTP(email) {
    return apiClient.post("/auth/password-reset-otp/request/", { email });
  },

  verifyPasswordResetOTP(data) {
    return apiClient.post("/auth/password-reset-otp/verify/", data);
  },
};
