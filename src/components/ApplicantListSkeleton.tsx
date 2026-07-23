export function ApplicantListSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading applicants">
      <div className="hidden sm:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
            <div className="h-3.5 bg-border rounded w-32" />
            <div className="h-3.5 bg-border rounded w-40" />
            <div className="h-3.5 bg-border rounded w-20" />
            <div className="h-5 bg-border rounded w-24 ml-auto" />
          </div>
        ))}
      </div>
      <div className="sm:hidden divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="h-4 bg-border rounded w-2/3" />
            <div className="h-3 bg-border rounded w-1/2" />
            <div className="h-5 bg-border rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
