// Camada de serviço API genérica para conectar com backend MySQL
// Configure a BASE_URL para apontar para seu servidor backend

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Erro ${res.status}`);
  }

  return res.json();
}

// ========== Auth ==========
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; full_name: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string, fullName: string) =>
    request<{ message: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  me: () =>
    request<{ id: string; email: string; full_name: string }>("/auth/me"),
};

// ========== Patients ==========
export const patientsApi = {
  list: () => request<any[]>("/patients"),
  create: (data: any) => request<any>("/patients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/patients/${id}`, { method: "DELETE" }),
};

// ========== Professionals ==========
export const professionalsApi = {
  list: () => request<any[]>("/professionals"),
  listActive: () => request<any[]>("/professionals?active=true"),
  create: (data: any) => request<any>("/professionals", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/professionals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/professionals/${id}`, { method: "DELETE" }),
};

// ========== Appointments ==========
export const appointmentsApi = {
  list: (params?: { dateFrom?: string; dateTo?: string }) => {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.set("date_from", params.dateFrom);
    if (params?.dateTo) query.set("date_to", params.dateTo);
    const qs = query.toString();
    return request<any[]>(`/appointments${qs ? `?${qs}` : ""}`);
  },
  listByDate: (date: string) => request<any[]>(`/appointments?date=${date}`),
  count: (params?: { date?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    const qs = query.toString();
    return request<{ count: number }>(`/appointments/count${qs ? `?${qs}` : ""}`);
  },
  create: (data: any) => request<any>("/appointments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/appointments/${id}`, { method: "DELETE" }),
};

// ========== Sessions ==========
export const sessionsApi = {
  list: () => request<any[]>("/sessions"),
  count: () => request<{ count: number }>("/sessions/count"),
  create: (data: any) => request<any>("/sessions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/sessions/${id}`, { method: "DELETE" }),
};

// ========== Dashboard ==========
export const dashboardApi = {
  stats: (date: string) =>
    request<{
      todayAppointments: number;
      totalPatients: number;
      totalSessions: number;
      todayList: any[];
    }>(`/dashboard/stats?date=${date}`),
};
