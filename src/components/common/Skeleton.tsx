interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-primary-200 rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-primary-200 rounded-lg shadow-sm p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white border border-primary-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-primary-200">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
