import { api } from "./api";
import type { LoginRequest, LoginResponse } from "../types/auth";
import type {
  Applicant,
  ApplicantListParams,
  ApplicantListResponse,
  ApplicantStats,
  ApplicantStatus,
} from "../types/applicant";
import {
  getMockApplicants,
  getMockApplicant,
  MOCK_APPLICANTS,
} from "./mockApplicants";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function login(credentials: LoginRequest) {
  return api.post<LoginResponse>("/auth/login", credentials);
}

export function getApplicants(params: ApplicantListParams, token: string) {
  if (USE_MOCKS) return Promise.resolve(getMockApplicants(params));
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return api.get<ApplicantListResponse>(
    `/applicants?${query.toString()}`,
    token,
  );
}

export function getApplicant(id: string, token: string) {
  if (USE_MOCKS) return Promise.resolve(getMockApplicant(id) as Applicant);
  return api.get<Applicant>(`/applicants/${id}`, token);
}

// Confirmed: PATCH, body field is `status`.
// Path itself wasn't visible in the docs screenshots — using the
// conventional REST shape (PATCH /applicants/:id with { status }). If the
// docs show a dedicated /applicants/:id/status path instead, this is the
// one line to change.
export function updateApplicantStatus(
  id: string,
  status: ApplicantStatus,
  token: string,
) {
  return api.patch<Applicant>(`/applicants/${id}`, { status }, token);
}

// No dedicated /stats endpoint was shown in the docs so far — computing
// summary stats client-side from the full unpaginated list is the fallback
// if one doesn't exist. Flag to confirm once you've scrolled the full
// endpoint list.
export function getStats(token: string) {
  if (USE_MOCKS) {
    const total = MOCK_APPLICANTS.length;
    const pending = MOCK_APPLICANTS.filter(
      (a) => a.status === "pending",
    ).length;
    const shortlisted = MOCK_APPLICANTS.filter(
      (a) => a.status === "shortlisted",
    ).length;
    const accepted = MOCK_APPLICANTS.filter(
      (a) => a.status === "accepted",
    ).length;
    const rejected = MOCK_APPLICANTS.filter(
      (a) => a.status === "rejected",
    ).length;
    return Promise.resolve({ total, pending, shortlisted, accepted, rejected });
  }
  return api.get<ApplicantStats>("/applicants/stats", token);
}
