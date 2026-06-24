import apiClient from "./client";

export const paymentsAPI = {
  getSummary() {
    return apiClient.get("/payments/summary/");
  },
  submitPayment(data) {
    return apiClient.post("/payments/pay/", data);
  },
};
