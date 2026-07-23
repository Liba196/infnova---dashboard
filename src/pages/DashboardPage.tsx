import { useApplicantListParams } from '../hooks/useApplicantListParams';
import { useApplicants } from '../hooks/useApplicants';
import { ApplicantFilters } from '../components/ApplicantFilters';
import { ApplicantTable } from '../components/ApplicantTable';
import { Pagination } from '../components/Pagination';
import { ApplicantListSkeleton } from '../components/ApplicantListSkeleton';
import { EmptyState, ErrorState } from '../components/ApplicantListStates';

export function DashboardPage() {
  const { params, updateParams } = useApplicantListParams();
  const { data, isLoading, isError, refetch, isFetching } = useApplicants(params);

  const hasFilters = !!(params.search || params.status || params.track || params.experienceLevel);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-ink">Applicants</h2>
        <p className="text-ink-muted text-sm mt-0.5">
          {data ? `${data.meta.total} total applicant${data.meta.total === 1 ? '' : 's'}` : 'Review and manage internship applications'}
        </p>
      </div>

      <ApplicantFilters params={params} onChange={updateParams} />

      {isLoading ? (
        <ApplicantListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.data.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : data ? (
        <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
          <ApplicantTable applicants={data.data} />
          <Pagination meta={data.meta} onPageChange={(page) => updateParams({ page })} />
        </div>
      ) : null}
    </div>
  );
}
