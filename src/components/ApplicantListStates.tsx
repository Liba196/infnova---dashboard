import { Inbox, TriangleAlert } from 'lucide-react';

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-16 flex flex-col items-center text-center px-4">
      <Inbox size={28} className="text-ink-muted mb-3" />
      <p className="text-ink font-medium">No applicants found</p>
      <p className="text-ink-muted text-sm mt-1 max-w-sm">
        {hasFilters
          ? 'No one matches these filters. Try widening your search or clearing a filter.'
          : 'Applicants will show up here once they apply.'}
      </p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-status-rejected/30 bg-status-rejected-bg rounded-lg py-16 flex flex-col items-center text-center px-4">
      <TriangleAlert size={28} className="text-status-rejected mb-3" />
      <p className="text-ink font-medium">Couldn't load applicants</p>
      <p className="text-ink-muted text-sm mt-1 max-w-sm">
        Something went wrong fetching this list. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-md px-4 py-1.5 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
