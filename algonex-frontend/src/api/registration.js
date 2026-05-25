import apiClient from "./client";

export const registrationAPI = {
  step1(data) {
    return apiClient.post("/register/step1/", data);
  },

  step2(data) {
    return apiClient.post("/register/step2/", data);
  },
};
