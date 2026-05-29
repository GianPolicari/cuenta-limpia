import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md',
        'bg-[linear-gradient(90deg,var(--muted)_0%,var(--border)_50%,var(--muted)_100%)]',
        'bg-[length:200%_100%]',
        'animate-[shimmer_1.6s_linear_infinite]',
        className
      )}
    />
  )
}
