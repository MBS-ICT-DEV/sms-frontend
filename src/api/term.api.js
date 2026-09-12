import apiClient from "./axios";

export const TermApi = {
  // Create Term
  createTerm: (data) =>
    apiClient.post("/terms/create-term", data),

  // Get All Terms
  getAllTerms: () =>
    apiClient.get("/terms/all-terms"),

  // Get Current Active Term
  getCurrentTerm: () =>
    apiClient.get("/terms/current-term"),

  // Activate Term
  TermActivation: (id) =>
    apiClient.put(`/terms/current-term/${id}/activate`),

  // Close Term
  closeTerm: (id) =>
    apiClient.put(`/terms/current-term/${id}/close`),

  // Submit Term Results
  submitTerm: (id) =>
    apiClient.put(`/terms/current-term/${id}/submit-results`),
};