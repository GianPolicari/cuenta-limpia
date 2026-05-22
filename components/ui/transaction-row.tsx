import { Amount } from "@/components/ui/amount"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCuota } from "@/lib/format"

export function TransactionRow({
  description,
  category,
  date,
  amount,
  kind,
  currency = "ARS",
  cuotaActual = null,
  cuotaTotal = null,
  actions,
  className,
}: {
  description: string
  category: string | null
  date: string
  amount: number
  kind: "income" | "expense"
  currency?: "ARS" | "USD"
  cuotaActual?: number | null
  cuotaTotal?: number | null
  actions?: React.ReactNode
  className?: string
}) {
  const cuota = formatCuota(cuotaActual, cuotaTotal)
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{description}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {category && <span className="truncate">{category}</span>}
          <span>{date}</span>
          {cuota && <Badge variant="pending">{cuota}</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Amount value={amount} kind={kind} currency={currency} className="text-sm font-semibold" />
        {actions}
      </div>
    </div>
  )
}
