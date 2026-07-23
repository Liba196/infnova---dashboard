import type { ApplicantStatus } from '../types/applicant';

const STYLES: Record<ApplicantStatus, string> = {
  pending: 'text-status-pending bg-status-pending-bg border-status-pending/30',
  shortlisted: 'text-status-reviewed bg-status-reviewed-bg border-status-reviewed/30',
  accepted: 'text-status-accepted bg-status-accepted-bg border-status-accepted/30',
  rejected: 'text-status-rejected bg-status-rejected-bg border-status-rejected/30',
};

const LABELS: Record<ApplicantStatus, string> = {
  pending: 'Pending',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export function StatusBadge({ status }: { status: ApplicantStatus }) {
  return (
    <span
      className={`stamp inline-block text-[11px] font-semibold uppercase border-2 rounded px-2 py-0.5 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
