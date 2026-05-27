'use client'

import { useState, useTransition, useEffect, useMemo, useCallback } from 'react'
import { BRAND_PRIMARY_HEX, CHART_COLORS_HEX } from '@/lib/theme'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Amount } from '@/components/ui/amount'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from '@/components/ui/kpi-card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatARS, formatCuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
    ArrowUpRight, ArrowDownRight, Wallet, Plus, Trash2,
    Pencil, Loader2, Inbox, CreditCard, ArrowUp, ArrowDown, Download, Search, X, RefreshCw, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, getCategoriesByType } from './actions'
import { CsvImportDialog } from './CsvImportDialog'
import { createCard } from '@/app/dashboard/tarjetas/actions'
import { applyRecurring, applyAllPendingRecurring } from '@/app/dashboard/configuracion/actions'

// ==================== TYPES ====================

type TxRow = {
    id: string; description: string | null; amount: number;
    category: string | null; transaction_type: string | null;
    transaction_date: string; card_id: string | null;
    cuota_actual: number | null; total_cuotas: number | null;
}
type CatRow = { id: string; name: string }
type CardRow = { id: string; name: string; card_type: string; color: string | null }
type BudgetRow = { id: string; category_name: string; monthly_amount: number }
type RecurringRow = {
    id: string
    description: string
    amount: number
    category: string | null
    transaction_type: string
    card_id: string | null
    day_of_month: number
    is_active: boolean
    cards: { name: string } | null
}
type RecurringAppliedRow = {
    id: string
    recurring_id: string
    applied_month: number
    applied_year: number
    transaction_id: string | null
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ==================== MAIN COMPONENT ====================

interface Props {
    initialTransactions: TxRow[]
    initialMonth: number
    initialYear: number
    expenseCategories: CatRow[]
    incomeCategories: CatRow[]
    initialCards: CardRow[]
    initialBudgets: BudgetRow[]
    initialRecurring: RecurringRow[]
    initialRecurringApplied: RecurringAppliedRow[]
}

export default function IngresosEgresosClient({
    initialTransactions,
    initialMonth,
    initialYear,
    expenseCategories,
    incomeCategories,
    initialCards,
    initialBudgets,
    initialRecurring,
    initialRecurringApplied,
}: Props) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [cards, setCards] = useState<CardRow[]>(initialCards)
    const [recurring] = useState<RecurringRow[]>(initialRecurring)
    const [recurringApplied, setRecurringApplied] = useState<RecurringAppliedRow[]>(initialRecurringApplied)
    const [month, setMonth] = useState(String(initialMonth))
    const [year, setYear] = useState(String(initialYear))
    const [addOpen, setAddOpen] = useState(false)
    const [csvOpen, setCsvOpen] = useState(false)
    const [editTx, setEditTx] = useState<TxRow | null>(null)
    const [deleteTx, setDeleteTx] = useState<TxRow | null>(null)
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [dynamicCats, setDynamicCats] = useState<CatRow[]>([])
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'fecha', direction: 'desc' })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const now = new Date()
    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i))

    // Refetch transactions when month/year changes
    useEffect(() => {
        let cancelled = false
        async function fetch() {
            setIsLoadingTransactions(true)
            const res = await getTransactions(Number(month), Number(year))
            if (!cancelled && res.data) {
                setTransactions(res.data)
                setCurrentPage(1)
            }
            if (!cancelled) setIsLoadingTransactions(false)
        }
        fetch()
        return () => { cancelled = true }
    }, [month, year])

    // KPIs
    const totalIncome = useMemo(() => transactions.filter((t: TxRow) => t.transaction_type === 'income').reduce((s: number, t: TxRow) => s + t.amount, 0), [transactions])
    const totalExpense = useMemo(() => transactions.filter((t: TxRow) => t.transaction_type === 'expense').reduce((s: number, t: TxRow) => s + t.amount, 0), [transactions])
    const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense])

    // Fetch categories by type when add/edit form type changes
    const fetchCategoriesForType = useCallback(async (type: string) => {
        if (type === 'expense') setDynamicCats(expenseCategories.length > 0 ? expenseCategories : await getCategoriesByType('expense'))
        else setDynamicCats(incomeCategories.length > 0 ? incomeCategories : await getCategoriesByType('income'))
    }, [expenseCategories, incomeCategories])

    function handleAdd(formData: FormData) {
        const previousTransactions = [...transactions]
        const isInstallment = formData.get('isInstallment') === 'true'
        const installmentsCount = parseInt(formData.get('installmentsCount') as string) || 1
        const txType = formData.get('transaction_type') as string
        const description = formData.get('description') as string
        const amount = Number(formData.get('amount'))
        const category = formData.get('category') as string
        const dateStr = (formData.get('date') as string) || new Date().toISOString().split('T')[0]
        const cardId = (formData.get('card_id') as string) || null

        let optimisticRows: TxRow[]

        if (isInstallment && txType === 'expense' && installmentsCount > 1) {
            const base = Math.round((amount / installmentsCount) * 100) / 100
            const [y, mo, d] = dateStr.split('-').map(Number)
            optimisticRows = Array.from({ length: installmentsCount }, (_, i) => {
                const dateObj = new Date(y, mo - 1 + i, d)
                const yr = dateObj.getFullYear()
                const mn = String(dateObj.getMonth() + 1).padStart(2, '0')
                const dy = String(dateObj.getDate()).padStart(2, '0')
                const isLast = i === installmentsCount - 1
                const installmentAmount = isLast
                    ? Math.round((amount - base * (installmentsCount - 1)) * 100) / 100
                    : base
                return {
                    id: `temp-${Date.now()}-${i}`,
                    description,
                    amount: installmentAmount,
                    category: category || null,
                    transaction_type: txType,
                    transaction_date: `${yr}-${mn}-${dy}`,
                    card_id: cardId,
                    cuota_actual: i + 1,
                    total_cuotas: installmentsCount,
                }
            })
        } else {
            optimisticRows = [{
                id: `temp-${Date.now()}`,
                description,
                amount,
                category: category || null,
                transaction_type: txType,
                transaction_date: dateStr,
                card_id: cardId,
                cuota_actual: null,
                total_cuotas: null,
            }]
        }

        setTransactions((prev: TxRow[]) => [...optimisticRows, ...prev])
        setAddOpen(false)

        startTransition(async () => {
            const result = await addTransaction(formData)
            if (result.error) {
                setTransactions(previousTransactions)
                setError(result.error)
                toast.error("⚠ No pudimos guardar la operación. Probá de nuevo.")
                setAddOpen(true)
                return
            }
            setError(null)
            toast.success(isInstallment && installmentsCount > 1
                ? `✅ ${installmentsCount} cuotas guardadas`
                : "✅ Operación guardada")
            const res = await getTransactions(Number(month), Number(year))
            if (res.data) setTransactions(res.data)
        })
    }

    function handleEdit(formData: FormData) {
        if (!editTx) return

        const previousTransactions = [...transactions]
        const optimisticTx: TxRow = {
            ...editTx,
            description: formData.get('description') as string,
            amount: Number(formData.get('amount')),
            category: formData.get('category') as string,
            transaction_type: formData.get('transaction_type') as string,
            transaction_date: (formData.get('date') as string) || editTx.transaction_date,
            card_id: (formData.get('card_id') as string) === 'none' ? null : (formData.get('card_id') as string),
        }

        setTransactions((prev: TxRow[]) => prev.map((t: TxRow) => t.id === editTx.id ? optimisticTx : t))
        setEditTx(null)

        startTransition(async () => {
            const result = await updateTransaction(editTx.id, formData)
            if (result.error) {
                setTransactions(previousTransactions)
                setError(result.error)
                toast.error("⚠ No pudimos guardar la operación. Probá de nuevo.")
                setEditTx(editTx)
                return
            }
            setError(null)
            toast.success("✅ Operación guardada")
            const res = await getTransactions(Number(month), Number(year))
            if (res.data) setTransactions(res.data)
        })
    }

    function handleDelete(id: string) {
        const previousTransactions = [...transactions]
        setTransactions((prev: TxRow[]) => prev.filter((t: TxRow) => t.id !== id))
        setDeleteTx(null)

        startTransition(async () => {
            try {
                await deleteTransaction(id)
                toast.success("✅ Operación eliminada")
                const res = await getTransactions(Number(month), Number(year))
                if (res.data) setTransactions(res.data)
            } catch {
                setTransactions(previousTransactions)
                toast.error("⚠ No pudimos eliminar la operación. Probá de nuevo.")
            }
        })
    }

    const handleCardCreated = useCallback((card: CardRow) => {
        setCards((prev) => [...prev, card].sort((a, b) => a.name.localeCompare(b.name)))
    }, [])

    // Reset page when filters change — intentional side effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setCurrentPage(1) }, [searchQuery, filterType])

    const cardName = useCallback((cardId: string | null) => {
        if (!cardId) return null
        return cards.find(c => c.id === cardId)?.name ?? null
    }, [cards])

    function handleSort(key: string) {
        setSortConfig(prev => {
            if (!prev || prev.key !== key) return { key, direction: 'asc' }
            if (prev.direction === 'asc') return { key, direction: 'desc' }
            return { key: 'fecha', direction: 'desc' }
        })
    }

    const sortedTransactions = useMemo(() => {
        const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        const q = norm(searchQuery.trim())
        const filtered = transactions.filter((t: TxRow) => {
            if (filterType !== 'all' && t.transaction_type !== filterType) return false
            if (!q) return true
            return (
                (t.description ? norm(t.description).includes(q) : false) ||
                (t.category ? norm(t.category).includes(q) : false)
            )
        })
        return filtered.sort((a: TxRow, b: TxRow) => {
            if (!sortConfig) return 0
            const { key, direction } = sortConfig
            const dir = direction === 'asc' ? 1 : -1
            if (key === 'fecha') {
                const da = new Date(a.transaction_date).getTime()
                const db = new Date(b.transaction_date).getTime()
                return da < db ? -dir : da > db ? dir : 0
            }
            if (key === 'categoria') {
                const ca = a.category ?? ''
                const cb = b.category ?? ''
                return ca.localeCompare(cb) * dir
            }
            if (key === 'tarjeta') {
                const ca = cardName(a.card_id) ?? ''
                const cb = cardName(b.card_id) ?? ''
                return ca.localeCompare(cb) * dir
            }
            if (key === 'tipo') {
                const ta = a.transaction_type ?? ''
                const tb = b.transaction_type ?? ''
                return ta.localeCompare(tb) * dir
            }
            if (key === 'monto') {
                return (a.amount - b.amount) * dir
            }
            return 0
        })
    }, [transactions, sortConfig, cardName, searchQuery, filterType])

    const renderSortArrow = (key: string) => {
        if (sortConfig?.key !== key) return null
        return sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 h-3 w-3" /> : <ArrowDown className="inline ml-1 h-3 w-3" />
    }

    function exportToCSV() {
        if (transactions.length === 0) {
            toast.error("⚠ No hay datos para exportar")
            return
        }

        const headers = ["Fecha", "Descripción", "Categoría", "Tarjeta", "Tipo", "Monto", "Cuota"]
        const csvRows = [headers.join(",")]

        sortedTransactions.forEach((tx: TxRow) => {
            const fecha = formatDate(tx.transaction_date)
            let desc = tx.description || "—"
            if (desc.includes(",")) desc = `"${desc}"`
            const cat = tx.category || "—"
            const tarjeta = cardName(tx.card_id) || (tx.card_id ? "Eliminada" : "—")
            const tipo = tx.transaction_type === 'income' ? 'Ingreso' : 'Gasto'
            const monto = tx.amount
            const cuota = formatCuota(tx.cuota_actual, tx.total_cuotas) || "—"
            csvRows.push(`${fecha},${desc},${cat},${tarjeta},${tipo},${monto},${cuota}`)
        })

        const csvString = csvRows.join("\n")
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "operaciones_cuentalimpia.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("✅ Exportado a CSV")
    }

    const cardChartData = useMemo(() => {
        const cardExpensesTable = transactions.filter((t: TxRow) => t.transaction_type === 'expense' && t.card_id !== null)
        const cardGrouped = cardExpensesTable.reduce((acc: Record<string, { amount: number, color: string }>, t: TxRow) => {
            const c = cards.find(card => card.id === t.card_id)
            const cName = c?.name || 'Eliminada'
            const cColor = c?.color || 'var(--chart-1)'
            if (!acc[cName]) acc[cName] = { amount: 0, color: cColor }
            acc[cName].amount += t.amount
            return acc
        }, {} as Record<string, { amount: number, color: string }>)
        return Object.entries(cardGrouped).map(([name, data]) => ({ name, amount: data.amount, color: data.color }))
    }, [transactions, cards])

    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
    const paginatedTransactions = sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="cl-animate-enter mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                        Ingresos & Egresos
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Lo que entró y salió este mes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-36 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-24 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="cl-stagger mb-6 grid gap-4 sm:grid-cols-3">
                <KpiCard title="Ingresos del mes" icon={ArrowUpRight} tone="income">
                    <Amount value={totalIncome} kind="income" />
                </KpiCard>
                <KpiCard title="Gastos del mes" icon={ArrowDownRight} tone="expense">
                    <Amount value={totalExpense} kind="expense" />
                </KpiCard>
                <KpiCard title="Balance" icon={Wallet} tone={balance >= 0 ? 'income' : 'expense'}>
                    <Amount value={balance} kind={balance >= 0 ? 'income' : 'expense'} showIcon={false} />
                </KpiCard>
            </div>

            {/* Banner recurrentes pendientes */}
            <RecurringBanner
                recurring={recurring}
                applied={recurringApplied}
                month={Number(month)}
                year={Number(year)}
                onApplied={(appliedRow, txRow) => {
                    setRecurringApplied(prev => [...prev, appliedRow])
                    setTransactions(prev => [txRow, ...prev])
                }}
                onRevert={(recurringId) => {
                    setRecurringApplied(prev => prev.filter(a => a.recurring_id !== recurringId))
                    setTransactions(prev => prev.filter(t => t.id !== `temp-tx-${recurringId}`))
                }}
            />

            {/* Budget progress section */}
            <BudgetSection budgets={initialBudgets} transactions={transactions} />

            {/* Search + type filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        placeholder="Buscar por descripción o categoría..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 text-muted-foreground hover:text-foreground"
                            aria-label="Limpiar búsqueda"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {(['all', 'income', 'expense'] as const).map((t) => (
                        <Button
                            key={t}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setFilterType(t)}
                            className={cn(
                                t === filterType && t === 'all' && 'border-primary/40 bg-primary-subtle text-primary',
                                t === filterType && t === 'income' && 'border-income/40 bg-income-subtle text-income',
                                t === filterType && t === 'expense' && 'border-expense/40 bg-expense-subtle text-expense',
                            )}
                        >
                            {t === 'all' ? 'Todos' : t === 'income' ? 'Ingresos' : 'Gastos'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Add button */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setCsvOpen(true)} className="cl-press gap-2">
                    <Upload className="h-4 w-4" aria-hidden="true" /> Importar CSV
                </Button>
                <Button variant="outline" onClick={exportToCSV} className="cl-press gap-2">
                    <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
                </Button>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="cl-press gap-2 font-semibold">
                            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva operación
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva operación</DialogTitle>
                            <DialogDescription>Registrá un ingreso o gasto.</DialogDescription>
                        </DialogHeader>
                        {error && <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">{error}</div>}
                        <TxForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} cards={cards} onTypeChange={fetchCategoriesForType} dynamicCats={dynamicCats} onCardCreated={handleCardCreated} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editTx} onOpenChange={o => !o && setEditTx(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar operación</DialogTitle>
                        <DialogDescription>Modificá los datos de la operación.</DialogDescription>
                    </DialogHeader>
                    {error && <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">{error}</div>}
                    {editTx && <TxForm onSubmit={handleEdit} isPending={isPending} onCancel={() => setEditTx(null)} cards={cards} defaults={editTx} onTypeChange={fetchCategoriesForType} dynamicCats={dynamicCats} onCardCreated={handleCardCreated} />}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTx} onOpenChange={o => !o && setDeleteTx(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar esta operación?</DialogTitle>
                        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteTx(null)}>Cancelar</Button>
                        <Button type="button" variant="destructive" disabled={isPending} onClick={() => deleteTx && handleDelete(deleteTx.id)}>
                            <Trash2 className="h-4 w-4" /> Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            {isLoadingTransactions ? (
                <Card className="flex min-h-[400px] flex-col items-center justify-center p-20">
                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                    <p className="font-medium text-muted-foreground">Cargando operaciones...</p>
                </Card>
            ) : sortedTransactions.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title={transactions.length === 0 ? 'Sin operaciones todavía' : 'Sin resultados'}
                    description={
                        transactions.length === 0
                            ? 'Registrá tu primer ingreso o gasto y empezá a ver a dónde va tu plata.'
                            : 'Probá con otra búsqueda o cambiá los filtros.'
                    }
                    action={
                        transactions.length === 0 ? (
                            <Button className="gap-2 font-semibold" onClick={() => setAddOpen(true)}>
                                <Plus className="h-4 w-4" /> Nueva operación
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterType('all') }}>
                                Limpiar filtros
                            </Button>
                        )
                    }
                />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer text-muted-foreground transition-colors hover:bg-muted" onClick={() => handleSort('fecha')}>
                                        Fecha {renderSortArrow('fecha')}
                                    </TableHead>
                                    <TableHead className="text-muted-foreground">Descripción</TableHead>
                                    <TableHead className="cursor-pointer text-muted-foreground transition-colors hover:bg-muted" onClick={() => handleSort('categoria')}>
                                        Categoría {renderSortArrow('categoria')}
                                    </TableHead>
                                    <TableHead className="cursor-pointer text-muted-foreground transition-colors hover:bg-muted" onClick={() => handleSort('tarjeta')}>
                                        Tarjeta {renderSortArrow('tarjeta')}
                                    </TableHead>
                                    <TableHead className="cursor-pointer text-muted-foreground transition-colors hover:bg-muted" onClick={() => handleSort('tipo')}>
                                        Tipo {renderSortArrow('tipo')}
                                    </TableHead>
                                    <TableHead className="cursor-pointer text-right text-muted-foreground transition-colors hover:bg-muted" onClick={() => handleSort('monto')}>
                                        Monto {renderSortArrow('monto')}
                                    </TableHead>
                                    <TableHead className="w-20 text-muted-foreground"><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="cl-stagger-fade">
                                {paginatedTransactions.map((tx: TxRow) => {
                                    const isIncome = tx.transaction_type === 'income'
                                    const linkedCard = cardName(tx.card_id)
                                    return (
                                        <TableRow key={tx.id} className="hover:bg-muted/50">
                                            <TableCell className="text-muted-foreground">{formatDate(tx.transaction_date)}</TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                <span>{tx.description ?? '—'}</span>
                                                {formatCuota(tx.cuota_actual, tx.total_cuotas) && (
                                                    <Badge variant="pending" className="ml-2">{formatCuota(tx.cuota_actual, tx.total_cuotas)}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tx.category ? (
                                                    <Badge variant="neutral">{tx.category}</Badge>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {linkedCard ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <CreditCard className="h-3 w-3" aria-hidden="true" /> {linkedCard}
                                                    </span>
                                                ) : tx.card_id ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <CreditCard className="h-3 w-3" aria-hidden="true" /> Eliminada
                                                    </span>
                                                ) : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={isIncome ? 'income' : 'expense'}>
                                                    {isIncome
                                                        ? <><ArrowUpRight className="h-3 w-3" /> Ingreso</>
                                                        : <><ArrowDownRight className="h-3 w-3" /> Gasto</>}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Amount
                                                    value={tx.amount}
                                                    kind={isIncome ? 'income' : 'expense'}
                                                    showIcon={false}
                                                    className="justify-end text-sm font-semibold"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-info" aria-label="Editar operación" onClick={() => { fetchCategoriesForType(tx.transaction_type ?? 'expense'); setEditTx(tx) }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-expense" aria-label="Eliminar operación" disabled={isPending} onClick={() => setDeleteTx(tx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
)}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
                    <p>
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} de {sortedTransactions.length} operaciones
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            {/* CSV Import Dialog */}
            <CsvImportDialog
                open={csvOpen}
                onOpenChange={setCsvOpen}
                categories={[...expenseCategories, ...incomeCategories]}
                onImported={async () => {
                    const res = await getTransactions(Number(month), Number(year))
                    if (res.data) setTransactions(res.data)
                }}
            />

            {/* Expenses By Card Chart */}
            {cards.length > 0 && (
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold text-foreground">Gastos por tarjeta</h2>
                    {cardChartData.length === 0 ? (
                        <EmptyState
                            icon={CreditCard}
                            title="Sin gastos con tarjeta este mes"
                            description="Cuando registrés un gasto asociado a una tarjeta, acá vas a ver el desglose."
                        />
                    ) : (
                        <Card className="p-4 sm:p-6">
                            <div className="h-[260px] sm:h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cardChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                            tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--popover-foreground)' }}
                                            itemStyle={{ color: 'var(--expense)', fontWeight: 'bold' }}
                                            formatter={(value: number = 0) => [formatARS(value), 'Total gastado']}
                                            labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
                                        />
                                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                            {cardChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS_HEX[0]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}

// ==================== RECURRING BANNER ====================

const MONTHS_BANNER = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function RecurringBanner({
    recurring,
    applied,
    month,
    year,
    onApplied,
    onRevert,
}: {
    recurring: RecurringRow[]
    applied: RecurringAppliedRow[]
    month: number
    year: number
    onApplied: (appliedRow: RecurringAppliedRow, txRow: TxRow) => void
    onRevert: (recurringId: string) => void
}) {
    const [isPending, startTransition] = useTransition()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [loadingAll, setLoadingAll] = useState(false)

    const pending = recurring.filter(
        r => r.is_active && !applied.some(a => a.recurring_id === r.id)
    )

    if (pending.length === 0) return null

    function handleApplyOne(r: RecurringRow) {
        const tempTxId = `temp-tx-${r.id}`
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const day = Math.min(r.day_of_month, daysInMonth)
        const mm = String(month + 1).padStart(2, '0')
        const dd = String(day).padStart(2, '0')
        const optimisticTx: TxRow = {
            id: tempTxId,
            description: r.description,
            amount: r.amount,
            category: r.category,
            transaction_type: r.transaction_type,
            transaction_date: `${year}-${mm}-${dd}`,
            card_id: r.card_id,
            cuota_actual: null,
            total_cuotas: null,
        }
        const optimisticApplied: RecurringAppliedRow = {
            id: `temp-applied-${r.id}`,
            recurring_id: r.id,
            applied_month: month,
            applied_year: year,
            transaction_id: tempTxId,
        }
        onApplied(optimisticApplied, optimisticTx)
        setLoadingId(r.id)

        startTransition(async () => {
            const result = await applyRecurring(r.id, month, year)
            setLoadingId(null)
            if (result.error) {
                onRevert(r.id)
                toast.error('⚠ No pudimos aplicar la recurrente. Probá de nuevo.', { description: result.error })
            } else {
                toast.success(`✅ Aplicada: ${r.description}`)
            }
        })
    }

    function handleApplyAll() {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const mm = String(month + 1).padStart(2, '0')
        pending.forEach(r => {
            const day = Math.min(r.day_of_month, daysInMonth)
            const dd = String(day).padStart(2, '0')
            const tempTxId = `temp-tx-${r.id}`
            const tx: TxRow = {
                id: tempTxId,
                description: r.description,
                amount: r.amount,
                category: r.category,
                transaction_type: r.transaction_type,
                transaction_date: `${year}-${mm}-${dd}`,
                card_id: r.card_id,
                cuota_actual: null,
                total_cuotas: null,
            }
            const ap: RecurringAppliedRow = {
                id: `temp-applied-${r.id}`,
                recurring_id: r.id,
                applied_month: month,
                applied_year: year,
                transaction_id: tempTxId,
            }
            onApplied(ap, tx)
        })
        setLoadingAll(true)

        startTransition(async () => {
            const result = await applyAllPendingRecurring(pending.map(r => r.id), month, year)
            setLoadingAll(false)
            if (result.error) {
                pending.forEach(r => onRevert(r.id))
                toast.error('⚠ Algunas recurrentes no pudieron aplicarse.', { description: result.error })
            } else {
                toast.success(`✅ ${pending.length} recurrente${pending.length !== 1 ? 's' : ''} aplicada${pending.length !== 1 ? 's' : ''}`)
            }
        })
    }

    return (
        <div
            className="cl-animate-enter mb-6 rounded-xl border border-pending/40 bg-pending-subtle p-4"
            role="region"
            aria-label="Operaciones recurrentes pendientes"
        >
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 shrink-0 text-pending" aria-hidden="true" />
                    <span className="text-sm font-semibold text-foreground">
                        {pending.length} operación{pending.length !== 1 ? 'es' : ''} recurrente{pending.length !== 1 ? 's' : ''} pendiente{pending.length !== 1 ? 's' : ''} para {MONTHS_BANNER[month]} {year}
                    </span>
                </div>
                <Button
                    size="sm"
                    disabled={isPending || loadingAll}
                    onClick={handleApplyAll}
                    className="shrink-0 gap-2"
                >
                    {loadingAll ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Aplicando...</> : 'Aplicar todas'}
                </Button>
            </div>
            <ul className="space-y-2">
                {pending.map((r) => (
                    <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-pending/20 bg-background/60 px-3 py-2"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <span className="truncate text-sm font-medium text-foreground">{r.description}</span>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <Amount
                                        value={r.amount}
                                        kind={r.transaction_type === 'income' ? 'income' : 'expense'}
                                        showIcon={false}
                                        className="text-xs font-semibold"
                                    />
                                    <Badge variant={r.transaction_type === 'income' ? 'income' : 'expense'} className="text-xs">
                                        {r.transaction_type === 'income' ? 'Ingreso' : 'Gasto'}
                                    </Badge>
                                    <Badge variant="pending" className="text-xs">Día {r.day_of_month}</Badge>
                                    {r.cards?.name && (
                                        <Badge variant="neutral" className="text-xs">{r.cards.name}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending || loadingId === r.id}
                            onClick={() => handleApplyOne(r)}
                            aria-label={`Aplicar ${r.description}`}
                            className="shrink-0 gap-1.5 border-pending/30 text-pending hover:bg-pending-subtle"
                        >
                            {loadingId === r.id ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                    <span>Aplicando...</span>
                                </>
                            ) : (
                                <>Aplicar</>
                            )}
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ==================== BUDGET SECTION ====================

function BudgetSection({ budgets, transactions }: { budgets: BudgetRow[]; transactions: TxRow[] }) {
    if (budgets.length === 0) return null

    const budgetItems = budgets
        .map((b) => {
            const spent = transactions
                .filter((t) => t.transaction_type === 'expense' && t.category === b.category_name)
                .reduce((sum, t) => sum + t.amount, 0)
            const pct = b.monthly_amount > 0 ? (spent / b.monthly_amount) * 100 : 0
            return { ...b, spent, pct }
        })
        .sort((a, b) => {
            // Primero las que superaron, luego por % descendente
            if (a.pct >= 100 && b.pct < 100) return -1
            if (b.pct >= 100 && a.pct < 100) return 1
            return b.pct - a.pct
        })

    return (
        <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Presupuesto del mes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {budgetItems.map((b) => {
                    const clampedPct = Math.min(b.pct, 100)
                    const barColor =
                        b.pct >= 100
                            ? 'bg-expense'
                            : b.pct >= 75
                                ? 'bg-pending'
                                : 'bg-info'

                    return (
                        <Card key={b.id}>
                            <CardContent className="py-3 px-4">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-medium text-foreground">{b.category_name}</span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        <span className="tabular-nums">{Math.round(b.pct)}%</span> del presupuesto
                                    </span>
                                </div>
                                <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className={cn('cl-progress-fill h-full rounded-full', barColor)}
                                        style={{ width: `${clampedPct}%` }}
                                        role="progressbar"
                                        aria-valuenow={Math.round(b.pct)}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`Progreso de presupuesto de ${b.category_name}`}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {formatARS(b.spent)} gastado
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        de {formatARS(b.monthly_amount)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

// ==================== TRANSACTION FORM ====================

function TxForm({ onSubmit, isPending, onCancel, cards, defaults, onTypeChange, dynamicCats, onCardCreated }: {
    onSubmit: (fd: FormData) => void; isPending: boolean; onCancel: () => void;
    cards: CardRow[]; defaults?: TxRow;
    onTypeChange: (type: string) => void; dynamicCats: CatRow[]
    onCardCreated: (card: CardRow) => void
}) {
    const [txType, setTxType] = useState(defaults?.transaction_type ?? 'expense')
    const [category, setCategory] = useState(defaults?.category ?? '')
    const [cardId, setCardId] = useState(defaults?.card_id ?? 'none')
    const [isInstallment, setIsInstallment] = useState(false)
    const [installmentsCount, setInstallmentsCount] = useState(2)
    const [newCardOpen, setNewCardOpen] = useState(false)
    const [newCardType, setNewCardType] = useState('Crédito')
    const [isCreatingCard, startCardTransition] = useTransition()

    useEffect(() => { onTypeChange(txType) }, [txType, onTypeChange])

    function handleCreateCard(fd: FormData) {
        const name = (fd.get('card-name') as string)?.trim()
        const color = (fd.get('card-color') as string) || null
        if (!name) return
        startCardTransition(async () => {
            const formData = new FormData()
            formData.set('name', name)
            formData.set('card_type', newCardType)
            if (color) formData.set('color', color)
            const result = await createCard(formData)
            if (result.error || !result.card) {
                toast.error('⚠ No pudimos crear la tarjeta.')
                return
            }
            onCardCreated(result.card)
            setCardId(result.card.id)
            setNewCardOpen(false)
            toast.success('✅ Tarjeta creada')
        })
    }

    return (
        <>
            <form action={(fd) => {
                fd.set('transaction_type', txType)
                fd.set('category', category)
                if (cardId !== 'none') fd.set('card_id', cardId)
                fd.set('isInstallment', String(isInstallment))
                fd.set('installmentsCount', String(installmentsCount))
                onSubmit(fd)
            }} className="space-y-4">
                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input name="description" placeholder="Ej: Compra en Carrefour" required defaultValue={defaults?.description ?? ''} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Monto</Label>
                        <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required defaultValue={defaults?.amount ?? ''} />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input name="date" type="date" required defaultValue={defaults?.transaction_date ?? new Date().toISOString().split('T')[0]} className="dark:[color-scheme:dark]" />
                    </div>
                </div>

                {/* Fix 1: badge de cuota en modo edición */}
                {defaults?.total_cuotas && (
                    <div className="flex items-center gap-2 rounded-lg border border-pending/20 bg-pending-subtle px-3 py-2 text-sm">
                        <Badge variant="pending">Cuota {defaults.cuota_actual} de {defaults.total_cuotas}</Badge>
                        <span className="text-muted-foreground">Editás solo esta cuota.</span>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setTxType('expense')}
                            className={cn('flex-1', txType === 'expense' && 'border-expense/40 bg-expense-subtle text-expense hover:bg-expense-subtle')}>
                            Gasto
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setTxType('income')}
                            className={cn('flex-1', txType === 'income' && 'border-income/40 bg-income-subtle text-income hover:bg-income-subtle')}>
                            Ingreso
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                        <SelectContent>
                            {dynamicCats.length > 0
                                ? dynamicCats.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                                : <SelectItem value="__no_categories__" disabled className="text-muted-foreground">Sin categorías — creá una en Configuración</SelectItem>
                            }
                        </SelectContent>
                    </Select>
                </div>

                {/* Fix 2: tarjeta con opción de crear inline */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Tarjeta (opcional)</Label>
                        <button
                            type="button"
                            onClick={() => setNewCardOpen(true)}
                            className="min-h-[44px] px-1 text-xs text-primary hover:underline"
                        >
                            + Nueva tarjeta
                        </button>
                    </div>
                    <Select value={cardId} onValueChange={setCardId}>
                        <SelectTrigger><SelectValue placeholder="Sin tarjeta" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin tarjeta</SelectItem>
                            {cards.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.card_type})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {txType === 'expense' && !defaults && (
                    <div className="space-y-3 rounded-lg border border-border bg-secondary p-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isInstallment"
                                checked={isInstallment}
                                onChange={(e) => setIsInstallment(e.target.checked)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                            />
                            <Label htmlFor="isInstallment" className="cursor-pointer">¿Es un pago en cuotas?</Label>
                        </div>
                        {isInstallment && (
                            <div className="space-y-2">
                                <Label>Cantidad de cuotas</Label>
                                <Input
                                    type="number"
                                    min="2"
                                    max="24"
                                    value={installmentsCount}
                                    onChange={(e) => setInstallmentsCount(Math.min(24, Math.max(2, Number(e.target.value) || 2)))}
                                />
                            </div>
                        )}
                    </div>
                )}
                <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" disabled={isPending} className="font-semibold">
                        {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
                    </Button>
                </DialogFooter>
            </form>

            {/* Mini dialog nueva tarjeta */}
            <Dialog open={newCardOpen} onOpenChange={setNewCardOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Nueva tarjeta</DialogTitle>
                        <DialogDescription>Sumá una tarjeta para asociarla a esta operación.</DialogDescription>
                    </DialogHeader>
                    <form action={handleCreateCard} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="card-name">Nombre</Label>
                            <Input id="card-name" name="card-name" placeholder="Ej: Visa Galicia" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={newCardType} onValueChange={setNewCardType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Crédito">Crédito</SelectItem>
                                    <SelectItem value="Débito">Débito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="card-color">Color (opcional)</Label>
                            <Input id="card-color" name="card-color" type="color" defaultValue={BRAND_PRIMARY_HEX} className="h-10 w-16 p-1" />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setNewCardOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isCreatingCard} className="font-semibold">
                                {isCreatingCard ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</> : 'Crear tarjeta'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
