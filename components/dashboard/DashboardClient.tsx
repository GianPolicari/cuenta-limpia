'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CategoryChart from '@/components/dashboard/CategoryChart'
import MonthlyChart from '@/components/dashboard/MonthlyChart'

function formatARS(value: number) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

function formatUSD(value: number) {
    return `US$ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
}

interface DashboardClientProps {
    dolar: { venta: number; compra: number; variacion: number }
    dolarMep: number
    transactions: {
        id: string
        amount: number
        category: string | null
        transaction_type: string | null
        transaction_date: string
    }[]
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function DashboardClient({
    dolar,
    dolarMep,
    transactions,
}: DashboardClientProps) {
    const [showUSD, setShowUSD] = useState(false)
    const [liveMep, setLiveMep] = useState<number>(dolarMep)
    const dolarPositive = dolar.variacion >= 0

    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
    const years = Array.from({ length: 7 }, (_, i) => String(now.getFullYear() - 2 + i)) // 2024 to 2030 roughly

    // Force client-fetch if server fetch failed (e.g., returned 0 or cached erroneously)
    useEffect(() => {
        if (liveMep <= 0) {
            const fetchMep = async () => {
                try {
                    const res = await fetch('https://dolarapi.com/v1/dolares/bolsa')
                    if (!res.ok) throw new Error('Bad response')
                    const text = await res.text()
                    if (!text) throw new Error('Empty response')
                    const data = JSON.parse(text)
                    setLiveMep(data.venta)
                } catch (error) {
                    console.error('MEP Fetch fallback:', error)
                    setLiveMep(1400) // Fallback to safe numeric value so math NEVER breaks
                }
            }
            fetchMep()
        }
    }, [liveMep])

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

    const formatCurrency = (value: number) => {
        return isUsdMep ? formatUSD(value) : formatARS(value)
    }

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
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Resumen de tus finanzas personales</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Time Filter Selects */}
                    <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-36 border-slate-300 bg-white text-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i} value={String(i + 1)} className="dark:focus:bg-slate-800">
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-24 border-slate-300 bg-white text-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                                {years.map((y) => (
                                    <SelectItem key={y} value={y} className="dark:focus:bg-slate-800">
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* USD MEP Toggle */}
                    <button
                        onClick={() => setShowUSD(!showUSD)}
                        className={`group flex items-center gap-2.5 rounded-xl border px-4 py-2.5 backdrop-blur-sm transition-all duration-300 ${showUSD
                            ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-300 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/60'
                            }`}
                    >
                        <div className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 ${showUSD ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}>
                            <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${showUSD ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                        </div>
                        <div className="text-left leading-none">
                            <p className={`text-xs font-semibold transition-colors ${showUSD ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                Ver en USD MEP
                            </p>
                        </div>
                    </button>

                    {/* Dolar MEP Ticker */}
                    <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100/60 px-4 py-2 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dólar MEP</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    ${liveMep.toLocaleString('es-AR')}
                                </span>
                                <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${dolarPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {dolarPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {Math.abs(dolar.variacion)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos del Mes</CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><ArrowUpRight className="h-5 w-5 text-emerald-400" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(displayIngresos)}</div>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">ingresos registrados</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Gastos del Mes</CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10"><TrendingDown className="h-5 w-5 text-red-400" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(displayGastos)}</div>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{monthExpensesCount} transacciones este mes</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Balance del Mes</CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-400" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(displayBalance)}
                        </div>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Ingresos vs Gastos</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Transacciones</CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10"><CreditCard className="h-5 w-5 text-indigo-400" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</div>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">registradas en total</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">Gastos por Categoría</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Distribución del mes actual {showUSD && '(USD MEP)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent><CategoryChart data={convertedCategoryData} showUSD={showUSD} /></CardContent>
                </Card>
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">Ingresos vs Gastos</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Evolución mensual {showUSD && '(USD MEP)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent><MonthlyChart data={convertedMonthlyData} showUSD={showUSD} /></CardContent>
                </Card>
            </div>

        </div>
    )
}
