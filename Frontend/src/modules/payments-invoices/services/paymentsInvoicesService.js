import apiClient from "@shared/api/client";

async function paymentsRequest(path, options = {}) {
  const method = options.method || "GET";
  let data;
  if (options.body) {
    try {
      data = JSON.parse(options.body);
    } catch {
      data = options.body;
    }
  }

  try {
    const res = await apiClient.request({
      url: `/${path}`,
      method,
      data,
      headers: options.headers,
    });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Request failed";
    throw new Error(message);
  }
}

export const paymentsInvoicesService = {
  getAllInstallments() {
    return paymentsRequest("leads/all-installments");
  },

  getTrainers() {
    return paymentsRequest("api/trainers");
  },

  getBatches() {
    return paymentsRequest("leads/batches");
  },

  getLeads() {
    return paymentsRequest("leads");
  },

  getLeadPaymentInfo(leadId) {
    return paymentsRequest(`leads/${leadId}/payment-info`);
  },

  getLeadById(leadId) {
    return paymentsRequest(`leads/${leadId}`);
  },

  getLeadInstallments(leadId) {
    return paymentsRequest(`leads/${leadId}/installments`);
  },

  getLeadPlacementPayments(leadId) {
    return paymentsRequest(`leads/${leadId}/placement-payments`);
  },

  recordCoursePayment(leadId, body) {
    return paymentsRequest(`leads/${leadId}/installments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  recordPlacementPayment(leadId, body) {
    return paymentsRequest(`leads/${leadId}/placement-payments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateInstallment(installmentId, body) {
    return paymentsRequest(`leads/installments/${installmentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  updatePlacementPayment(placementInstallmentId, body) {
    return paymentsRequest(`leads/placement-payments/${placementInstallmentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteInstallment(installmentId) {
    return paymentsRequest(`leads/installments/${installmentId}`, {
      method: "DELETE",
    });
  },

  deletePlacementPayment(placementInstallmentId) {
    return paymentsRequest(`leads/placement-payments/${placementInstallmentId}`, {
      method: "DELETE",
    });
  },
};
