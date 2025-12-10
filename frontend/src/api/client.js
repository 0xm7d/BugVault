import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  return res.data.user;
}

export async function register(name, email, password) {
  const res = await api.post("/auth/register", { name, email, password });
  localStorage.setItem("token", res.data.token);
  return res.data.user;
}

export async function getProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");
  const res = await api.get("/auth/me");
  return res.data;
}

export async function listVulnerabilities(params) {
  const res = await api.get("/vulnerabilities", { params });
  return res.data;
}

export async function getVulnerability(id) {
  const res = await api.get(`/vulnerabilities/${id}`);
  return res.data;
}

export async function upsertVulnerability(id, payload) {
  if (id) {
    const res = await api.put(`/vulnerabilities/${id}`, payload);
    return res.data;
  }
  const res = await api.post("/vulnerabilities", payload);
  return res.data;
}

export async function deleteVulnerability(id) {
  await api.delete(`/vulnerabilities/${id}`);
}

export async function getStats() {
  const res = await api.get("/stats");
  return res.data;
}

export async function getPublicStats() {
  const res = await api.get("/stats/public");
  return res.data;
}

export async function updateProfile(name) {
  const res = await api.put("/auth/profile", { name });
  return res.data;
}

export async function updatePassword(currentPassword, newPassword) {
  const res = await api.put("/auth/password", { currentPassword, newPassword });
  return res.data;
}

export async function listUsers() {
  const res = await api.get("/auth/users");
  return res.data;
}

export async function updateUserRole(userId, role) {
  const res = await api.put(`/auth/users/${userId}/role`, { role });
  return res.data;
}

export async function getTrends(range = "month") {
  const res = await api.get("/stats/trends", { params: { range } });
  return res.data;
}

export default api;

