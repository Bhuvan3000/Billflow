import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("bf_token");
      localStorage.removeItem("bf_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post("/auth/register", data),
  login:          (data) => api.post("/auth/login", data),
  getMe:          ()     => api.get("/auth/me"),
  updateProfile:  (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/password", data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get("/dashboard"),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerAPI = {
  getAll:  (params) => api.get("/customers", { params }),
  getOne:  (id)     => api.get(`/customers/${id}`),
  create:  (data)   => api.post("/customers", data),
  update:  (id, data) => api.put(`/customers/${id}`, data),
  delete:  (id)     => api.delete(`/customers/${id}`),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoiceAPI = {
  getAll:        (params) => api.get("/invoices", { params }),
  getOne:        (id)     => api.get(`/invoices/${id}`),
  create:        (data)   => api.post("/invoices", data),
  update:        (id, data) => api.put(`/invoices/${id}`, data),
  send:          (id)     => api.post(`/invoices/${id}/send`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  cancel:        (id)     => api.delete(`/invoices/${id}`),
  pdfUrl:        (id)     => `${api.defaults.baseURL}/invoices/${id}/pdf`,
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getAll:              (params) => api.get("/payments", { params }),
  createRazorpayOrder: (data)   => api.post("/payments/razorpay/create-order", data),
  verifyRazorpay:      (data)   => api.post("/payments/razorpay/verify", data),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionAPI = {
  getPlans:   ()       => api.get("/subscriptions/plans"),
  createPlan: (data)   => api.post("/subscriptions/plans", data),
  getAll:     ()       => api.get("/subscriptions"),
  create:     (data)   => api.post("/subscriptions", data),
  cancel:     (id)     => api.put(`/subscriptions/${id}/cancel`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  get: (params) => api.get("/reports", { params }),
};

export default api;
