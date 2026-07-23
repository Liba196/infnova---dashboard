import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ApplicantSummary } from '../types/applicant';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../lib/format';

export function ApplicantTable({ applicants }: { applicants: ApplicantSummary[] }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      {/* Desktop table */}
      <table className="w-full text-sm hidden sm:table">
        <thead>
          <tr className="border-b border-border text-left text-ink-muted text-xs uppercase tracking-wide">
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Track</th>
            <th className="px-4 py-2.5 font-medium">Country</th>
            <th className="px-4 py-2.5 font-medium">Applied</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-accent-soft/40 transition-colors">
              <td className="px-4 py-3">
                <Link to={`/applicants/${a.id}`} className="font-medium text-ink hover:text-accent">
                  {a.fullName}
                </Link>
                <p className="text-ink-muted text-xs">{a.email}</p>
              </td>
              <td className="px-4 py-3 text-ink-muted capitalize">{a.track}</td>
              <td className="px-4 py-3 text-ink-muted">{a.country}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(a.applicationDate)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/applicants/${a.id}`} aria-label={`View ${a.fullName}`}>
                  <ChevronRight size={16} className="text-ink-muted" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {applicants.map((a) => (
          <Link
            key={a.id}
            to={`/applicants/${a.id}`}
            className="block p-4 hover:bg-accent-soft/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{a.fullName}</p>
                <p className="text-ink-muted text-xs">{a.email}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
              <span className="capitalize">{a.track}</span>
              <span>·</span>
              <span>{a.country}</span>
              <span>·</span>
              <span>{formatDate(a.applicationDate)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
