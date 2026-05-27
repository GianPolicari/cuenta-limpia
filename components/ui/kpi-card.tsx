import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "brand" | "income" | "expense" | "info" | "pending"

const toneClasses: Record<Tone, string> = {
  brand: "bg-primary-subtle text-primary",
  income: "bg-income-subtle text-income",
  expense: "bg-expense-subtle text-expense",
  info: "bg-info-subtle text-info",
  pending: "bg-pending-subtle text-pending",
}

export function KpiCard({
  title,
  icon: Icon,
  tone = "info",
  hint,
  children,
  className,
}: {
  title: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("cl-hover-lift", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClasses[tone])} aria-hidden="true">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums text-foreground">{children}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
