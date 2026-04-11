import apiClient from "./client";

export const outcomesAPI = {
  list: (params) => apiClient.get("/outcomes/", { params }),
};
