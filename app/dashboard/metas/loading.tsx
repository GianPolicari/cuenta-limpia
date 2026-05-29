import { Skeleton } from '@/components/ui/skeleton'

export default function MetasLoading() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="mb-1.5 h-2 w-full rounded-full" />
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
