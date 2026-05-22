import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"

type AmountKind = "income" | "expense" | "neutral"

export function Amount({
  value,
  kind = "neutral",
  currency = "ARS",
  showIcon = true,
  showSign = true,
  className,
}: {
  value: number
  kind?: AmountKind
  currency?: "ARS" | "USD"
  showIcon?: boolean
  showSign?: boolean
  className?: string
}) {
  const formatted = formatMoney(Math.abs(value), currency)
  const sign = kind === "income" ? "+" : kind === "expense" ? "−" : ""
  const color =
    kind === "income" ? "text-income" : kind === "expense" ? "text-expense" : "text-foreground"
  const Icon = kind === "income" ? ArrowUpRight : kind === "expense" ? ArrowDownRight : null

  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", color, className)}>
      {showIcon && Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {showSign && sign}
      {formatted}
    </span>
  )
}
