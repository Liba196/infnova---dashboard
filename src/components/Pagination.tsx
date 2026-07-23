import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../types/applicant';

interface Props {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: Props) {
  const { page, totalPages, total, limit } = meta;
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-ink-muted">
        Showing <span className="text-ink font-medium">{start}–{end}</span> of{' '}
        <span className="text-ink font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 border border-border rounded-md px-2.5 py-1.5 text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-soft transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <span className="px-2 text-ink-muted font-mono text-xs">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 border border-border rounded-md px-2.5 py-1.5 text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-soft transition-colors"
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
