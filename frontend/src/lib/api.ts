import axios, { AxiosInstance, AxiosError } from "axios";

// Use the Next.js proxy (/api/backend/*) so browser requests are same-origin.
// This avoids CORS issues and Docker localhost resolution problems.
// The proxy rewrites /api/backend → http://backend:8000 server-side.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/backend";

// ── Axios instance ─────────────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly cookies (refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token management ──────────────────────────────────────────────────────────
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor — silent token refresh on 401 ───────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const isAuthEndpoint = originalRequest.url?.includes("/auth/");
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await api.post("/auth/refresh");
        const newToken: string = res.data.access_token;
        setAccessToken(newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        return api(originalRequest);
      } catch {
        // Refresh failed — clear all auth state and redirect to login
        setAccessToken(null);
        // Clear Zustand store via dynamic import to avoid circular dependency
        import("@/stores/auth").then(({ useAuthStore }) => {
          useAuthStore.getState().clearAuth();
        });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── Typed API helpers ─────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
};

export const studentsApi = {
  list: () => api.get("/students/"),
  get: (id: number) => api.get(`/students/${id}/`),
  create: (data: object) => api.post("/students/", data),
  update: (id: number, data: object) => api.patch(`/students/${id}/`, data),
  deactivate: (id: number) => api.delete(`/students/${id}/`),
  getSend: (id: number) => api.get(`/students/${id}/send/`),
  updateSend: (id: number, data: object) => api.patch(`/students/${id}/send/`, data),
};

export const curriculumApi = {
  subjects: () => api.get("/curriculum/subjects/"),
  topics: (subjectId: number, filters?: { year_group?: string; key_stage?: string }) =>
    api.get(`/curriculum/subjects/${subjectId}/topics/`, { params: filters }),
  topic: (topicId: number) => api.get(`/curriculum/topics/${topicId}/`),
};

export const lessonsApi = {
  generate: (data: object) => api.post("/lessons/generate/", data),
  list: (studentId?: number) =>
    api.get("/lessons/", { params: studentId ? { student_id: studentId } : {} }),
  get: (id: number) => api.get(`/lessons/${id}/`),
  update: (id: number, data: object) => api.patch(`/lessons/${id}/`, data),
  create: (data: object) => api.post("/lessons/", data),
};

export const sessionsApi = {
  create: (data: object) => api.post("/sessions/", data),
  list: (studentId?: number) =>
    api.get("/sessions/", { params: studentId ? { student_id: studentId } : {} }),
  get: (id: number) => api.get(`/sessions/${id}/`),
  update: (id: number, data: object) => api.patch(`/sessions/${id}/`, data),
  insights: (id: number) => api.get(`/sessions/${id}/insights/`),
};

export const assessmentsApi = {
  generate: (data: object) => api.post("/assessments/generate/", data),
  get: (id: number) => api.get(`/assessments/${id}/`),
  submitAttempt: (data: object) => api.post("/assessments/attempts/", data),
};

export const progressApi = {
  get: (studentId: number) => api.get(`/progress/${studentId}/`),
  override: (studentId: number, data: object) =>
    api.post(`/progress/${studentId}/override/`, data),
};

export const analyticsApi = {
  studentSummary: (studentId: number) => api.get(`/analytics/${studentId}/summary/`),
  interventionsDashboard: () => api.get("/analytics/interventions/dashboard/"),
  insights: () => api.get("/analytics/insights/"),
};

export const reportsApi = {
  generate: (data: object) => api.post("/reports/generate/", data),
  list: (studentId?: number) =>
    api.get("/reports/", { params: studentId ? { student_id: studentId } : {} }),
  get: (id: number) => api.get(`/reports/${id}/`),
  approve: (id: number, finalText: string) =>
    api.post(`/reports/${id}/approve/`, { final_text: finalText }),
  downloadPdf: (id: number) =>
    api.get(`/reports/${id}/pdf/`, { responseType: "blob" }),
};

export const homeworkApi = {
  generate: (data: object) => api.post("/homework/generate/", data),
  list: (studentId: number) => api.get(`/homework/${studentId}/`),
  update: (id: number, data: object) => api.patch(`/homework/${id}/`, data),
};

export const observationsApi = {
  create: (data: object) => api.post("/observations/", data),
  list: (studentId: number, filters?: object) =>
    api.get(`/observations/${studentId}/`, { params: filters }),
};

export const parentsApi = {
  create: (data: object) => api.post("/parents/", data),
  list: () => api.get("/parents/"),
  get: (id: number) => api.get(`/parents/${id}/`),
  update: (id: number, data: object) => api.patch(`/parents/${id}/`, data),
  linkStudent: (parentId: number, studentId: number, data: object) =>
    api.post(`/parents/${parentId}/link/${studentId}/`, data),
  unlinkStudent: (parentId: number, studentId: number) =>
    api.delete(`/parents/${parentId}/link/${studentId}/`),
  // Parent-facing
  myChildren: () => api.get("/parents/my/children/"),
  myTimeline: () => api.get("/parents/my/timeline/"),
  mySessions: () => api.get("/parents/my/sessions/"),
  myMessages: () => api.get("/parents/my/messages/"),
  sendMessage: (data: { student_id: number; subject: string; body: string }) =>
    api.post("/parents/my/messages/", data),
  myInvoice: () => api.get("/parents/my/invoice/"),
};

export const usersApi = {
  me: () => api.get("/users/me/"),
  myProfile: () => api.get("/users/me/profile/"),
  updateProfile: (data: object) => api.patch("/users/me/profile/", data),
};

export const studentPortalApi = {
  dashboard: () => api.get("/student/dashboard/"),
  homework: () => api.get("/student/homework/"),
  submitHomework: (id: number) => api.patch(`/student/homework/${id}/submit/`),
  progress: () => api.get("/student/progress/"),
  getAssessment: (id: number) => api.get(`/student/assessments/${id}/`),
  submitAttempt: (assessmentId: number, data: object) =>
    api.post(`/student/assessments/${assessmentId}/attempt/`, data),
};

export const reflectionsApi = {
  create: (data: object) => api.post("/reflections/", data),
  mine: () => api.get("/reflections/mine/"),
  listForStudent: (studentId: number) =>
    api.get(`/reflections/student/${studentId}/`),
};

export const resourcesApi = {
  generate: (data: object) => api.post("/resources/generate/", data),
};

// Extend analyticsApi with the interventions endpoint
export const analyticsApiExtended = {
  interventionsDashboard: () => api.get("/analytics/interventions/dashboard/"),
};

export interface AuditParams {
  page?: number;
  limit?: number;
  action?: string;
  user_id?: number;
  student_id?: number;
  ip_address?: string;
  date_from?: string;   // ISO date string YYYY-MM-DD
  date_to?: string;     // ISO date string YYYY-MM-DD
}

export const adminApi = {
  stats:    () => api.get("/admin/stats/"),
  insights: () => api.get("/admin/insights/"),
  health:   () => api.get("/admin/health/"),
  users: (params?: { role?: string; search?: string; limit?: number; offset?: number }) =>
    api.get("/admin/users/", { params }),
  updateUser: (id: number, data: { is_active?: boolean; role?: string }) =>
    api.patch(`/admin/users/${id}/`, data),

  // Audit — paginated with full filters
  audit: (params?: AuditParams) =>
    api.get("/admin/audit/", { params }),

  // Export full filtered set as CSV (arraybuffer so we can make a Blob)
  auditExportCSV: (params?: Omit<AuditParams, "page" | "limit">) =>
    api.get("/admin/audit/export/csv/", { params, responseType: "blob" }),

  // Export full filtered set as PDF
  auditExportPDF: (params?: Omit<AuditParams, "page" | "limit">) =>
    api.get("/admin/audit/export/pdf/", { params, responseType: "blob" }),

  // GDPR compliance export — student-specific audit trail as PDF
  auditCompliancePDF: (studentId: number) =>
    api.get(`/admin/audit/compliance/${studentId}/`, { responseType: "blob" }),
};
