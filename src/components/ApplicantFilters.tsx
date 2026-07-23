import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { ApplicantListParams } from '../types/applicant';
import { APPLICANT_STATUSES, APPLICANT_TRACKS, EXPERIENCE_LEVELS } from '../types/applicant';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface Props {
  params: ApplicantListParams;
  onChange: (patch: Partial<ApplicantListParams>) => void;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'applicationDate', label: 'Application date' },
  { value: 'fullName', label: 'Name' },
];

export function ApplicantFilters({ params, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(params.search ?? '');
  const debouncedSearch = useDebouncedValue(searchInput);

  useEffect(() => {
    if (debouncedSearch !== (params.search ?? '')) {
      onChange({ search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const selectClass =
    'text-sm border border-border rounded-md px-2.5 py-2 bg-surface text-ink focus:border-accent focus:ring-1 focus:ring-accent outline-none';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-2 bg-surface text-ink focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
      </div>

      <select
        value={params.status ?? ''}
        onChange={(e) => onChange({ status: e.target.value as ApplicantListParams['status'] })}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {APPLICANT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={params.track ?? ''}
        onChange={(e) => onChange({ track: e.target.value as ApplicantListParams['track'] })}
        className={selectClass}
        aria-label="Filter by track"
      >
        <option value="">All tracks</option>
        {APPLICANT_TRACKS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={params.experienceLevel ?? ''}
        onChange={(e) => onChange({ experienceLevel: e.target.value as ApplicantListParams['experienceLevel'] })}
        className={selectClass}
        aria-label="Filter by experience level"
      >
        <option value="">All levels</option>
        {EXPERIENCE_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l[0].toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={`${params.sortBy}:${params.sortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':');
          onChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
        }}
        className={selectClass}
        aria-label="Sort applicants"
      >
        {SORT_OPTIONS.flatMap((opt) => [
          <option key={`${opt.value}:desc`} value={`${opt.value}:desc`}>
            {opt.label} (newest/Z–A)
          </option>,
          <option key={`${opt.value}:asc`} value={`${opt.value}:asc`}>
            {opt.label} (oldest/A–Z)
          </option>,
        ])}
      </select>
    </div>
  );
}
