'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, TrendingDown, ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KpiCard } from '@/components/ui/kpi-card'
import { Amount } from '@/components/ui/amount'
import { Badge } from '@/components/ui/badge'
import CategoryChart from '@/components/dashboard/CategoryChart'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getTransactionsByYear } from '@/app/dashboard/actions'

type TxRow = {
    id: string
    amount: number
    category: string | null
    transaction_type: string | null
    transaction_date: string
}

interface DashboardClientProps {
    dolar: { venta: number; compra: number; variacion: number }
    initialYear: number
    transactions: TxRow[]
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function DashboardClient({
    dolar,
    initialYear,
    transactions: initialTransactions,
}: DashboardClientProps) {
    const [showUSD, setShowUSD] = useState(false)
    const [liveMep, setLiveMep] = useState(dolar.venta > 0 ? dolar.venta : 0)
    const [mepEstimated, setMepEstimated] = useState(false)
    const [transactions, setTransactions] = useState<TxRow[]>(initialTransactions)
    const [isPending, startTransition] = useTransition()
    const dolarPositive = dolar.variacion >= 0

    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState(String(initialYear))
    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i))

    useEffect(() => {
        if (liveMep <= 0) {
            fetch('https://dolarapi.com/v1/dolares/bolsa')
                .then(r => r.json())
                .then(d => {
                    if (d.venta > 0) {
                        setLiveMep(d.venta)
                        setMepEstimated(false)
                    } else {
                        setLiveMep(1400)
                        setMepEstimated(true)
                    }
                })
                .catch(() => {
                    setLiveMep(1400)
                    setMepEstimated(true)
                })
        }
    }, [liveMep])

    function handleYearChange(year: string) {
        setSelectedYear(year)
        startTransition(async () => {
            const data = await getTransactionsByYear(Number(year))
            setTransactions(data)
        })
    }

    const isUsdMep = showUSD
    const mepPrice = liveMep > 0 ? liveMep : 1 // Safe fallback avoiding division by zero

    // Filter transactions for the selected month and year
    const filteredMonthTxs = transactions.filter(t => {
        if (!t.transaction_date) return false
        const yyyy = t.transaction_date.substring(0, 4)
        const mm = t.transaction_date.substring(5, 7)
        return yyyy === selectedYear && parseInt(mm, 10) === parseInt(selectedMonth, 10)
    })

    const monthExpenses = filteredMonthTxs.filter(t => t.transaction_type === 'expense')
    const monthIncomes = filteredMonthTxs.filter(t => t.transaction_type === 'income')

    const gastosMes = monthExpenses.reduce((sum, t) => sum + t.amount, 0)
    const ingresosMes = monthIncomes.reduce((sum, t) => sum + t.amount, 0)
    const monthExpensesCount = monthExpenses.length
    const balance = ingresosMes - gastosMes

    const displayIngresos = isUsdMep ? ingresosMes / mepPrice : ingresosMes
    const displayGastos = isUsdMep ? gastosMes / mepPrice : gastosMes
    const displayBalance = isUsdMep ? balance / mepPrice : balance

    const currency = isUsdMep ? 'USD' : 'ARS'

    // Category aggregation
    const catMap = new Map<string, number>()
    monthExpenses.forEach((t) => {
        const cat = t.category ?? 'Sin categoría'
        catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount)
    })
    const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }))

    const convertedCategoryData = isUsdMep
        ? categoryData.map((d) => ({ ...d, value: d.value / mepPrice }))
        : categoryData

    // Monthly aggregation (for all transactions to show evolution)
    const monthlyMap = new Map<string, { gastos: number; ingresos: number }>()
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    transactions.forEach((t) => {
        if (!t.transaction_date) return
        const yyyy = t.transaction_date.substring(0, 4)
        const mm = parseInt(t.transaction_date.substring(5, 7), 10) - 1
        const key = `${monthNames[mm]} ${yyyy.slice(2)}`
        const entry = monthlyMap.get(key) ?? { gastos: 0, ingresos: 0 }
        if (t.transaction_type === 'expense') { entry.gastos += t.amount } else { entry.ingresos += t.amount }
        monthlyMap.set(key, entry)
    })
    const monthlyData = Array.from(monthlyMap.entries()).map(([month, vals]) => ({ month, ...vals }))

    const convertedMonthlyData = isUsdMep
        ? monthlyData.map((d) => ({ ...d, gastos: d.gastos / mepPrice, ingresos: d.ingresos / mepPrice }))
        : monthlyData

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header with Dolar Blue + MEP Toggle */}
            <div className="cl-animate-enter mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Resumen de tus finanzas personales</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Time Filter Selects */}
                    <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-36 border-border bg-card text-sm text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i} value={String(i + 1)}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={handleYearChange} disabled={isPending}>
                            <SelectTrigger className="w-24 border-border bg-card text-sm text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* USD MEP Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowUSD(!showUSD)}
                        aria-pressed={showUSD}
                        aria-label={showUSD ? 'Desactivar vista en USD MEP' : 'Activar vista en USD MEP'}
                        className={cn(
                            'group flex min-h-[44px] items-center gap-2.5 rounded-xl border px-4 py-2.5 transition-all duration-300',
                            showUSD
                                ? 'border-income/40 bg-income-subtle'
                                : 'border-border bg-card'
                        )}
                    >
                        <div className={cn(
                            'relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300',
                            showUSD ? 'bg-income' : 'bg-secondary'
                        )}>
                            <div className={cn(
                                'h-6 w-6 rounded-full bg-background shadow-md transition-transform duration-300',
                                showUSD ? 'translate-x-6' : 'translate-x-0'
                            )} />
                        </div>
                        <div className="text-left leading-none">
                            <p className={cn(
                                'text-xs font-semibold transition-colors',
                                showUSD ? 'text-income' : 'text-muted-foreground'
                            )}>
                                Ver en USD MEP
                            </p>
                            {showUSD && mepEstimated && (
                                <p className="mt-1 text-[10px] font-medium text-pending">
                                    Cotización estimada
                                </p>
                            )}
                        </div>
                    </button>

                    {/* Dolar MEP Ticker */}
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-income-subtle">
                            <DollarSign className="h-5 w-5 text-income" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Dólar MEP</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold tabular-nums text-foreground">
                                    ${liveMep.toLocaleString('es-AR')}
                                </span>
                                <Badge variant={dolarPositive ? 'income' : 'expense'}>
                                    {dolarPositive ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
                                    <span className="sr-only">{dolarPositive ? 'Subió' : 'Bajó'}</span>
                                    {Math.abs(dolar.variacion).toFixed(2)}%
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="cl-stagger mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Ingresos del mes" icon={ArrowUpRight} tone="income" hint="ingresos registrados">
                    {formatMoney(displayIngresos, currency)}
                </KpiCard>

                <KpiCard title="Gastos del mes" icon={TrendingDown} tone="expense" hint={`${monthExpensesCount} operaciones este mes`}>
                    {formatMoney(displayGastos, currency)}
                </KpiCard>

                <KpiCard title="Balance del mes" icon={DollarSign} tone="info" hint="Ingresos vs Gastos">
                    <Amount
                        value={displayBalance}
                        kind={balance >= 0 ? 'income' : 'expense'}
                        currency={currency}
                    />
                </KpiCard>

                <KpiCard title="Operaciones" icon={ArrowLeftRight} tone="info" hint={`registradas en ${selectedYear}`}>
                    {transactions.length}
                </KpiCard>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="cl-animate-enter cl-hover-lift">
                    <CardHeader>
                        <CardTitle className="text-foreground">Gastos por categoría</CardTitle>
                        <CardDescription>
                            Distribución del mes actual {showUSD && '(USD MEP)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent><CategoryChart data={convertedCategoryData} showUSD={showUSD} /></CardContent>
                </Card>
                <Card className="cl-animate-enter cl-hover-lift">
                    <CardHeader>
                        <CardTitle className="text-foreground">Ingresos vs gastos</CardTitle>
                        <CardDescription>
                            Evolución mensual {showUSD && '(USD MEP)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent><MonthlyChart data={convertedMonthlyData} showUSD={showUSD} /></CardContent>
                </Card>
            </div>

        </div>
    )
}
