'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import {
    ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, Trash2,
    Pencil, Loader2, Inbox, CreditCard, ArrowUp, ArrowDown, Download
} from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, getCategoriesByType } from './actions'

// ==================== TYPES ====================

type TxRow = {
    id: string; description: string | null; amount: number;
    category: string | null; transaction_type: string | null;
    transaction_date: string; card_id: string | null
}
type CatRow = { id: string; name: string }
type CardRow = { id: string; name: string; card_type: string; color: string | null }

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatARS(v: number) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)
}

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
    cards: CardRow[]
}

export default function IngresosEgresosClient({
    initialTransactions,
    initialMonth,
    initialYear,
    expenseCategories,
    incomeCategories,
    cards,
}: Props) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [month, setMonth] = useState(String(initialMonth))
    const [year, setYear] = useState(String(initialYear))
    const [addOpen, setAddOpen] = useState(false)
    const [editTx, setEditTx] = useState<TxRow | null>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [dynamicCats, setDynamicCats] = useState<CatRow[]>([])
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'fecha', direction: 'desc' })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const router = useRouter()
    const now = new Date()
    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i))

    // Refetch transactions when month/year changes
    useEffect(() => {
        let cancelled = false
        async function fetch() {
            const res = await getTransactions(Number(month), Number(year))
            if (!cancelled && res.data) {
                setTransactions(res.data)
                setCurrentPage(1)
            }
        }
        fetch()
        return () => { cancelled = true }
    }, [month, year])

    // KPIs
    const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpense

    // Fetch categories by type when add/edit form type changes
    async function fetchCategoriesForType(type: string) {
        if (type === 'expense') setDynamicCats(expenseCategories.length > 0 ? expenseCategories : await getCategoriesByType('expense'))
        else setDynamicCats(incomeCategories.length > 0 ? incomeCategories : await getCategoriesByType('income'))
    }

    function handleAdd(formData: FormData) {
        startTransition(async () => {
            const result = await addTransaction(formData)
            if (result.error) {
                setError(result.error)
                toast.error("Error al añadir", { description: result.error })
                return
            }
            setError(null); setAddOpen(false)
            toast.success("✅ Operación guardada")
            const res = await getTransactions(Number(month), Number(year))
            if (res.data) setTransactions(res.data)
        })
    }

    function handleEdit(formData: FormData) {
        if (!editTx) return
        startTransition(async () => {
            const result = await updateTransaction(editTx.id, formData)
            if (result.error) {
                setError(result.error)
                toast.error("Error al actualizar", { description: result.error })
                return
            }
            setError(null); setEditTx(null)
            toast.success("✅ Operación actualizada")
            const res = await getTransactions(Number(month), Number(year))
            if (res.data) setTransactions(res.data)
        })
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteTransaction(id)
            toast.success("🗑️ Eliminado correctamente")
            const res = await getTransactions(Number(month), Number(year))
            if (res.data) setTransactions(res.data)
        })
    }

    function cardName(cardId: string | null) {
        if (!cardId) return null
        return cards.find(c => c.id === cardId)?.name ?? null
    }

    function handleSort(key: string) {
        setSortConfig(prev => {
            if (!prev || prev.key !== key) return { key, direction: 'asc' }
            if (prev.direction === 'asc') return { key, direction: 'desc' }
            return { key: 'fecha', direction: 'desc' }
        })
    }

    const sortedTransactions = [...transactions].sort((a, b) => {
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

    const renderSortArrow = (key: string) => {
        if (sortConfig?.key !== key) return null
        return sortConfig.direction === 'asc' ? <ArrowUp className="inline ml-1 h-3 w-3" /> : <ArrowDown className="inline ml-1 h-3 w-3" />
    }

    function exportToCSV() {
        if (transactions.length === 0) {
            toast.error("No hay datos para exportar")
            return
        }

        const headers = ["Fecha", "Descripción", "Categoría", "Tarjeta", "Tipo", "Monto"]
        const csvRows = [headers.join(",")]

        sortedTransactions.forEach(tx => {
            const fecha = formatDate(tx.transaction_date)
            let desc = tx.description || "—"
            if (desc.includes(",")) desc = `"${desc}"`
            const cat = tx.category || "—"
            const tarjeta = cardName(tx.card_id) || (tx.card_id ? "Eliminada" : "—")
            const tipo = tx.transaction_type === 'income' ? 'Ingreso' : 'Gasto'
            const monto = tx.amount
            csvRows.push(`${fecha},${desc},${cat},${tarjeta},${tipo},${monto}`)
        })

        const csvString = csvRows.join("\n")
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "movimientos_cuentalimpia.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Exportado a CSV exitosamente")
    }

    const cardExpensesTable = transactions.filter(t => t.transaction_type === 'expense' && t.card_id !== null)
    const cardGrouped = cardExpensesTable.reduce((acc, t) => {
        const c = cards.find(card => card.id === t.card_id)
        const cName = c?.name || 'Eliminada'
        const cColor = c?.color || '#94a3b8'
        if (!acc[cName]) acc[cName] = { amount: 0, color: cColor }
        acc[cName].amount += t.amount
        return acc
    }, {} as Record<string, { amount: number, color: string }>)
    const cardChartData = Object.entries(cardGrouped).map(([name, data]) => ({ name, amount: data.amount, color: data.color }))

    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
    const paginatedTransactions = sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
                        Ingresos & Egresos
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Registro mensual de operaciones
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-36 border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)} className="dark:focus:bg-slate-700">{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-24 border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            {years.map(y => <SelectItem key={y} value={y} className="dark:focus:bg-slate-700">{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><ArrowUpRight className="h-5 w-5 text-emerald-500" /></div>
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Ingresos Totales</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatARS(totalIncome)}</p></div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10"><ArrowDownRight className="h-5 w-5 text-red-500" /></div>
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Gastos Totales</p><p className="text-lg font-bold text-red-600 dark:text-red-400">{formatARS(totalExpense)}</p></div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><ArrowLeftRight className="h-5 w-5 text-blue-500" /></div>
                        <div><p className="text-xs text-slate-500 dark:text-slate-400">Balance</p><p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatARS(balance)}</p></div>
                    </CardContent>
                </Card>
            </div>

            {/* Add button */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={exportToCSV} className="gap-2 border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <Download className="h-4 w-4" /> Exportar CSV
                </Button>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25">
                            <Plus className="h-4 w-4" /> Nueva Operación
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Nueva Operación</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">Registrá un ingreso o egreso.</DialogDescription>
                        </DialogHeader>
                        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
                        <TxForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} cards={cards} onTypeChange={fetchCategoriesForType} dynamicCats={dynamicCats} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editTx} onOpenChange={o => !o && setEditTx(null)}>
                <DialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Editar Operación</DialogTitle>
                    </DialogHeader>
                    {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
                    {editTx && <TxForm onSubmit={handleEdit} isPending={isPending} onCancel={() => setEditTx(null)} cards={cards} defaults={editTx} onTypeChange={fetchCategoriesForType} dynamicCats={dynamicCats} />}
                </DialogContent>
            </Dialog>

            {/* Table */}
            {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/60 py-20 dark:border-slate-800 dark:bg-slate-900/60">
                    <Inbox className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Sin operaciones</h3>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">No hay registros para {MONTHS[Number(month)]} {year}.</p>
                </div>
            ) : (
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-200 dark:border-slate-800">
                                    <TableHead className="text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('fecha')}>
                                        Fecha {renderSortArrow('fecha')}
                                    </TableHead>
                                    <TableHead className="text-slate-500 dark:text-slate-400">Descripción</TableHead>
                                    <TableHead className="text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('categoria')}>
                                        Categoría {renderSortArrow('categoria')}
                                    </TableHead>
                                    <TableHead className="text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('tarjeta')}>
                                        Tarjeta {renderSortArrow('tarjeta')}
                                    </TableHead>
                                    <TableHead className="text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('tipo')}>
                                        Tipo {renderSortArrow('tipo')}
                                    </TableHead>
                                    <TableHead className="text-right text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('monto')}>
                                        Monto {renderSortArrow('monto')}
                                    </TableHead>
                                    <TableHead className="w-20 text-slate-500 dark:text-slate-400"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTransactions.map(tx => {
                                    const isIncome = tx.transaction_type === 'income'
                                    const linkedCard = cardName(tx.card_id)
                                    return (
                                        <TableRow key={tx.id} className="border-slate-100 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                                            <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(tx.transaction_date)}</TableCell>
                                            <TableCell className="font-medium text-slate-900 dark:text-white">{tx.description ?? '—'}</TableCell>
                                            <TableCell>
                                                {tx.category ? (
                                                    <span className="inline-flex rounded-md bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">{tx.category}</span>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {linkedCard ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                                        <CreditCard className="h-3 w-3" /> {linkedCard}
                                                    </span>
                                                ) : tx.card_id ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                                        <CreditCard className="h-3 w-3" /> Eliminada
                                                    </span>
                                                ) : <span className="text-slate-400">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isIncome
                                                    ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="h-3 w-3" />Ingreso</span>
                                                    : <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><ArrowDownRight className="h-3 w-3" />Gasto</span>
                                                }
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {isIncome ? '+' : '-'}{formatARS(tx.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500" onClick={() => { fetchCategoriesForType(tx.transaction_type ?? 'expense'); setEditTx(tx) }}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" disabled={isPending} onClick={() => handleDelete(tx.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <p>
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} de {sortedTransactions.length} operaciones
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="bg-white dark:bg-slate-800 dark:border-slate-700"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="bg-white dark:bg-slate-800 dark:border-slate-700"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            {/* Expenses By Card Chart */}
            {cardChartData.length > 0 && (
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Gastos Totales por Tarjetas</h2>
                    <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60 p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cardChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                                        formatter={(value: any) => [formatARS(value as number), 'Total Gasto']}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                        {cardChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#ec4899'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

// ==================== TRANSACTION FORM ====================

function TxForm({ onSubmit, isPending, onCancel, cards, defaults, onTypeChange, dynamicCats }: {
    onSubmit: (fd: FormData) => void; isPending: boolean; onCancel: () => void;
    cards: CardRow[]; defaults?: TxRow;
    onTypeChange: (type: string) => void; dynamicCats: CatRow[]
}) {
    const [txType, setTxType] = useState(defaults?.transaction_type ?? 'expense')
    const [category, setCategory] = useState(defaults?.category ?? '')
    const [cardId, setCardId] = useState(defaults?.card_id ?? 'none')
    const [isInstallment, setIsInstallment] = useState(false)
    const [installmentsCount, setInstallmentsCount] = useState(1)

    // Fetch categories when type changes
    useEffect(() => { onTypeChange(txType) }, [txType, onTypeChange])

    return (
        <form action={(fd) => {
            fd.set('transaction_type', txType)
            fd.set('category', category)
            if (cardId !== 'none') fd.set('card_id', cardId)
            fd.set('isInstallment', String(isInstallment))
            fd.set('installmentsCount', String(installmentsCount))
            onSubmit(fd)
        }} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Descripción</Label>
                <Input name="description" placeholder="Ej: Compra en Carrefour" required defaultValue={defaults?.description ?? ''} className="border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Monto</Label>
                    <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required defaultValue={defaults?.amount ?? ''} className="border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Fecha</Label>
                    <Input name="date" type="date" required defaultValue={defaults?.transaction_date ?? new Date().toISOString().split('T')[0]} className="border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:[color-scheme:dark]" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Tipo</Label>
                <div className="flex gap-2">
                    <Button type="button" variant={txType === 'expense' ? 'default' : 'outline'} onClick={() => setTxType('expense')}
                        className={txType === 'expense' ? 'flex-1 bg-red-500/20 text-red-600 hover:bg-red-500/30 dark:text-red-400' : 'flex-1 border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'}>
                        Gasto
                    </Button>
                    <Button type="button" variant={txType === 'income' ? 'default' : 'outline'} onClick={() => setTxType('income')}
                        className={txType === 'income' ? 'flex-1 bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 dark:text-emerald-400' : 'flex-1 border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'}>
                        Ingreso
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                        {dynamicCats.length > 0
                            ? dynamicCats.map(c => <SelectItem key={c.id} value={c.name} className="dark:focus:bg-slate-700">{c.name}</SelectItem>)
                            : <SelectItem value="_empty" disabled className="text-slate-400">Sin categorías — creá una en Configuración</SelectItem>
                        }
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Tarjeta (opcional)</Label>
                <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"><SelectValue placeholder="Sin tarjeta" /></SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                        <SelectItem value="none" className="dark:focus:bg-slate-700">Sin tarjeta</SelectItem>
                        {cards.map(c => <SelectItem key={c.id} value={c.id} className="dark:focus:bg-slate-700">{c.name} ({c.card_type})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {txType === 'expense' && !defaults && (
                <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/20">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isInstallment"
                            checked={isInstallment}
                            onChange={(e) => setIsInstallment(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <Label htmlFor="isInstallment" className="text-slate-700 dark:text-slate-300 cursor-pointer">¿Es un pago en cuotas?</Label>
                    </div>
                    {isInstallment && (
                        <div className="space-y-2 mt-3 block">
                            <Label className="text-slate-700 dark:text-slate-300">Cantidad de cuotas</Label>
                            <Input
                                type="number"
                                min="2"
                                max="24"
                                value={installmentsCount}
                                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                                className="border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white w-full"
                            />
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400">Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white">
                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </Button>
            </DialogFooter>
        </form>
    )
}
