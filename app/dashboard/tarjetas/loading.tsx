import { Skeleton } from '@/components/ui/skeleton'

export default function TarjetasLoading() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1.586 / 1' }}>
            <Skeleton className="h-full w-full rounded-[20px]" />
          </div>
        ))}
      </div>
    </div>
  )
}
