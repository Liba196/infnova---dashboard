import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { ApplicantListParams, ApplicantStatus, ApplicantTrack, ExperienceLevel } from '../types/applicant';

const DEFAULT_LIMIT = 10;

export function useApplicantListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ApplicantListParams = useMemo(
    () => ({
      page: Number(searchParams.get('page') ?? '1'),
      limit: Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)),
      search: searchParams.get('search') ?? '',
      status: (searchParams.get('status') ?? '') as ApplicantStatus | '',
      track: (searchParams.get('track') ?? '') as ApplicantTrack | '',
      experienceLevel: (searchParams.get('experienceLevel') ?? '') as ExperienceLevel | '',
      sortBy: searchParams.get('sortBy') ?? 'applicationDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    }),
    [searchParams]
  );

  // Any filter change resets to page 1 unless the caller is explicitly
  // changing the page itself — otherwise you can end up on page 4 of a
  // filtered set that only has 1 page.
  const updateParams = useCallback(
    (patch: Partial<ApplicantListParams>) => {
      const next = new URLSearchParams(searchParams);
      const isPageChange = 'page' in patch && Object.keys(patch).length === 1;

      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      if (!isPageChange) {
        next.delete('page');
      }

      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  return { params, updateParams };
}
