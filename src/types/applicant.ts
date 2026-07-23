// Confirmed against /api/docs schemas (Applicant, PaginatedApplicants).

export type ApplicantStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';
export type ApplicantTrack = 'frontend' | 'backend' | 'ui-ux' | 'data-analytics' | 'mobile';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Shape returned by GET /applicants (list) — lighter than the full record.
export interface ApplicantSummary {
  id: string;
  fullName: string;
  email: string;
  country: string;
  track: ApplicantTrack;
  status: ApplicantStatus;
  applicationDate: string; // ISO date-time
}

// Shape returned by GET /applicants/:id (detail).
export interface Applicant extends ApplicantSummary {
  phoneNumber: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedInUrl?: string;
  motivation?: string;
  notes?: string;
  updatedAt: string;
}

export interface ApplicantListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicantStatus | '';
  track?: ApplicantTrack | '';
  country?: string;
  experienceLevel?: ExperienceLevel | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  delay?: number; // dev-only: demo loading state, max 5000ms
  simulateError?: boolean; // dev-only: forces a 500 for error-state testing
}

// `meta` wasn't expanded in the docs screenshot — using the conventional
// shape (page/limit/total/totalPages). If the real payload differs, this
// is the one interface to fix; everything else reads through it.
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicantListResponse {
  data: ApplicantSummary[];
  meta: PaginationMeta;
}

export const APPLICANT_STATUSES: ApplicantStatus[] = ['pending', 'shortlisted', 'accepted', 'rejected'];
export const APPLICANT_TRACKS: ApplicantTrack[] = ['frontend', 'backend', 'ui-ux', 'data-analytics', 'mobile'];
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export interface ApplicantStats {
  total: number;
  pending: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
}
