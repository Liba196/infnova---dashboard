import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, Code2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useApplicant, useUpdateApplicantStatus } from '../hooks/useApplicants';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../lib/format';
import { APPLICANT_STATUSES, type ApplicantStatus } from '../types/applicant';
import { ErrorState } from '../components/ApplicantListStates';

export function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: applicant, isLoading, isError, refetch } = useApplicant(id);
  const updateStatus = useUpdateApplicantStatus();

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4">
        <ArrowLeft size={14} />
        Back to applicants
      </Link>

      {isLoading ? (
        <div className="border border-border rounded-lg p-6 bg-surface animate-pulse space-y-3">
          <div className="h-5 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-1/2" />
          <div className="h-4 bg-border rounded w-2/3" />
        </div>
      ) : isError || !applicant ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="border border-border rounded-lg bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-ink">{applicant.fullName}</h2>
              <p className="text-ink-muted text-sm capitalize mt-0.5">
                {applicant.track} · {applicant.experienceLevel} · Applied {formatDate(applicant.applicationDate)}
              </p>
            </div>
            <StatusBadge status={applicant.status} />
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6">
            <p className="flex items-center gap-2 text-ink-muted">
              <Mail size={14} /> {applicant.email}
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <Phone size={14} /> {applicant.phoneNumber}
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <Globe size={14} /> {applicant.country}
            </p>
          </div>

          {applicant.skills?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-ink-muted font-medium mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {applicant.skills.map((skill) => (
                  <span key={skill} className="text-xs bg-accent-soft text-accent rounded px-2 py-0.5">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {applicant.motivation && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-ink-muted font-medium mb-1.5">Motivation</p>
              <p className="text-sm text-ink leading-relaxed">{applicant.motivation}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-6 text-sm">
            {applicant.portfolioUrl && (
              <a
                href={applicant.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:text-accent-hover"
              >
                <ExternalLink size={13} /> Portfolio
              </a>
            )}
            {applicant.githubUrl && (
              <a
                href={applicant.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:text-accent-hover"
              >
                <Code2 size={13} /> GitHub
              </a>
            )}
            {applicant.linkedInUrl && (
              <a
                href={applicant.linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:text-accent-hover"
              >
                <LinkIcon size={13} /> LinkedIn
              </a>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted font-medium mb-2">Update status</p>
            <div className="flex flex-wrap gap-2">
              {APPLICANT_STATUSES.map((status) => (
                <button
                  key={status}
                  disabled={updateStatus.isPending || applicant.status === status}
                  onClick={() => id && updateStatus.mutate({ id, status: status as ApplicantStatus })}
                  className="text-xs font-medium border border-border rounded-md px-3 py-1.5 capitalize hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
