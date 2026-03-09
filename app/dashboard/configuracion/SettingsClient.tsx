'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    User, CreditCard, Tag, Mail, Calendar, Shield,
    LogOut, Plus, Trash2, Pencil, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import {
    addCard, updateCard, deleteCard,
    addCategory, updateCategory, deleteCategory,
} from './actions'

// ==================== TYPES ====================

type CardRow = { id: string; name: string; card_type: string; color: string | null }
type CategoryRow = { id: string; name: string; type: string }


// ==================== MAIN COMPONENT ====================

interface SettingsClientProps {
    email: string
    createdAt: string
    signOut: () => Promise<void>
    initialCards: CardRow[]
    initialCategories: CategoryRow[]
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const CARD_TYPES = ['Crédito', 'Débito']
export default function SettingsClient({
    email,
    createdAt,
    signOut,
    initialCards,
    initialCategories,
}: SettingsClientProps) {
    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
                    Configuración
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Centro de control — gestión de tarjetas y categorías
                </p>
            </div>

            {/* Profile + Account strip */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                            <User className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{email || '—'}</p>
                            </div>
                            {createdAt && (
                                <div className="mt-0.5 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Miembro desde {createdAt}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                                <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Sesión</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Cerrar sesión actual</p>
                            </div>
                        </div>
                        <form action={signOut}>
                            <Button type="submit" variant="outline" size="sm" className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 dark:text-red-400">
                                <LogOut className="h-3.5 w-3.5" />
                                Salir
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tarjetas" className="w-full">
                <TabsList className="mb-6 w-full sm:w-auto">
                    <TabsTrigger value="tarjetas" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tarjetas
                    </TabsTrigger>
                    <TabsTrigger value="categorias" className="gap-2">
                        <Tag className="h-4 w-4" />
                        Categorías
                    </TabsTrigger>

                </TabsList>

                <TabsContent value="tarjetas">
                    <TarjetasTab initialCards={initialCards} />
                </TabsContent>
                <TabsContent value="categorias">
                    <CategoriasTab initialCategories={initialCategories} />
                </TabsContent>

            </Tabs>
        </div>
    )
}

// ==================== TAB: TARJETAS ====================

function TarjetasTab({ initialCards }: { initialCards: CardRow[] }) {
    const [cards, setCards] = useState(initialCards)
    const [addOpen, setAddOpen] = useState(false)
    const [editCard, setEditCard] = useState<CardRow | null>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Month/Year filter (UI-only for now)
    const now = new Date()
    const [filterMonth, setFilterMonth] = useState(String(now.getMonth()))
    const [filterYear, setFilterYear] = useState(String(now.getFullYear()))
    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i))

    function handleAdd(formData: FormData) {
        startTransition(async () => {
            const result = await addCard(formData)
            if (result.error) {
                setError(result.error)
                toast.error("Error al añadir", { description: result.error })
                return
            }
            setError(null)
            setAddOpen(false)
            toast.success("¡Tarjeta añadida!")
            router.refresh()
        })
    }

    function handleEdit(formData: FormData) {
        if (!editCard) return
        startTransition(async () => {
            const result = await updateCard(editCard.id, formData)
            if (result.error) {
                setError(result.error)
                toast.error("Error al actualizar", { description: result.error })
                return
            }
            setError(null)
            setEditCard(null)
            toast.success("Tarjeta actualizada correctamente")
            router.refresh()
        })
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteCard(id)
            toast.success("Tarjeta eliminada")
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            {/* Filter + Add button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="w-36 border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            {MONTHS.map((m, i) => (
                                <SelectItem key={i} value={String(i)} className="dark:focus:bg-slate-700">{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-24 border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            {years.map((y) => (
                                <SelectItem key={y} value={y} className="dark:focus:bg-slate-700">{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500">
                            <Plus className="h-4 w-4" /> Nueva Tarjeta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Nueva Tarjeta</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">Agregá una tarjeta de crédito o débito.</DialogDescription>
                        </DialogHeader>
                        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
                        <CardForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editCard} onOpenChange={(o) => !o && setEditCard(null)}>
                <DialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Editar Tarjeta</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">Modificá los datos de la tarjeta.</DialogDescription>
                    </DialogHeader>
                    {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
                    {editCard && <CardForm onSubmit={handleEdit} isPending={isPending} onCancel={() => setEditCard(null)} defaults={editCard} />}
                </DialogContent>
            </Dialog>

            {/* Table */}
            {initialCards.length === 0 ? (
                <EmptyState text="Sin tarjetas registradas" sub="Agregá tu primera tarjeta para comenzar." />
            ) : (
                <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-200 dark:border-slate-800">
                                    <TableHead className="text-slate-500 dark:text-slate-400">Nombre</TableHead>
                                    <TableHead className="text-slate-500 dark:text-slate-400">Tipo</TableHead>
                                    <TableHead className="w-20 text-slate-500 dark:text-slate-400"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialCards.map((c) => (
                                    <TableRow key={c.id} className="border-slate-100 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                                        <TableCell className="font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full border border-slate-200 shadow-sm dark:border-slate-700"
                                                    style={{ backgroundColor: c.color || '#94a3b8' }}
                                                />
                                                {c.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${c.card_type === 'Crédito' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                                {c.card_type}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500" onClick={() => setEditCard(c)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" disabled={isPending} onClick={() => handleDelete(c.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function CardForm({ onSubmit, isPending, onCancel, defaults }: {
    onSubmit: (fd: FormData) => void; isPending: boolean; onCancel: () => void; defaults?: CardRow
}) {
    const [cardType, setCardType] = useState(defaults?.card_type ?? '')
    const [color, setColor] = useState(defaults?.color ?? '#10b981')
    return (
        <form action={(fd) => {
            fd.set('card_type', cardType)
            fd.set('color', color)
            onSubmit(fd)
        }} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Nombre</Label>
                <Input name="name" placeholder="Ej: Visa Galicia" required defaultValue={defaults?.name ?? ''} className="border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Tipo</Label>
                    <Select value={cardType} onValueChange={setCardType}>
                        <SelectTrigger className="border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            {CARD_TYPES.map((t) => <SelectItem key={t} value={t} className="dark:focus:bg-slate-700">{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Color (opcional)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-10 w-14 cursor-pointer p-1"
                        />
                        <span className="text-xs text-slate-500 uppercase">{color}</span>
                    </div>
                </div>
            </div>
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400">Cancelar</Button>
                <Button type="submit" disabled={isPending || !cardType} className="bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white">
                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </Button>
            </DialogFooter>
        </form>
    )
}

// ==================== TAB: CATEGORÍAS ====================

function CategoriasTab({ initialCategories }: { initialCategories: CategoryRow[] }) {
    const [addOpen, setAddOpen] = useState(false)
    const [editCat, setEditCat] = useState<CategoryRow | null>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const expenseCats = initialCategories.filter((c) => c.type === 'expense')
    const incomeCats = initialCategories.filter((c) => c.type === 'income')

    function handleAdd(formData: FormData) {
        startTransition(async () => {
            const result = await addCategory(formData)
            if (result.error) {
                setError(result.error)
                toast.error("Error al crear", { description: result.error })
                return
            }
            setError(null); setAddOpen(false);
            toast.success("Categoría creada");
            router.refresh()
        })
    }

    function handleEdit(formData: FormData) {
        if (!editCat) return
        startTransition(async () => {
            const result = await updateCategory(editCat.id, formData)
            if (result.error) {
                setError(result.error)
                toast.error("Error al actualizar", { description: result.error })
                return
            }
            setError(null); setEditCat(null);
            toast.success("Categoría actualizada")
            router.refresh()
        })
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteCategory(id);
            toast.success("Categoría eliminada")
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Categorías personalizadas para gastos e ingresos</p>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500">
                            <Plus className="h-4 w-4" /> Nueva Categoría
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Nueva Categoría</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">Creá una categoría personalizada.</DialogDescription>
                        </DialogHeader>
                        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
                        <CategoryForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit dialog */}
            <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
                <DialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Editar Categoría</DialogTitle>
                    </DialogHeader>
                    {editCat && <CategoryForm onSubmit={handleEdit} isPending={isPending} onCancel={() => setEditCat(null)} defaults={editCat} />}
                </DialogContent>
            </Dialog>

            {initialCategories.length === 0 ? (
                <EmptyState text="Sin categorías personalizadas" sub="Agregá categorías para organizar tus transacciones." />
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    <CategoryGroup title="Gastos" items={expenseCats} color="red" onEdit={setEditCat} onDelete={handleDelete} isPending={isPending} />
                    <CategoryGroup title="Ingresos" items={incomeCats} color="emerald" onEdit={setEditCat} onDelete={handleDelete} isPending={isPending} />
                </div>
            )}
        </div>
    )
}

function CategoryGroup({ title, items, color, onEdit, onDelete, isPending }: {
    title: string; items: CategoryRow[]; color: string; onEdit: (c: CategoryRow) => void; onDelete: (id: string) => void; isPending: boolean
}) {
    if (items.length === 0) return null
    const colorMap: Record<string, string> = {
        red: 'bg-red-500/10 text-red-600 dark:text-red-400',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    }
    return (
        <Card className="border-slate-200 bg-white/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/30">
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${colorMap[color] ?? ''}`}>{c.name}</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-500" onClick={() => onEdit(c)}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" disabled={isPending} onClick={() => onDelete(c.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function CategoryForm({ onSubmit, isPending, onCancel, defaults }: {
    onSubmit: (fd: FormData) => void; isPending: boolean; onCancel: () => void; defaults?: CategoryRow
}) {
    const [catType, setCatType] = useState(defaults?.type ?? '')
    return (
        <form action={(fd) => { fd.set('type', catType); onSubmit(fd) }} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Nombre</Label>
                <Input name="name" placeholder="Ej: Gimnasio" required defaultValue={defaults?.name ?? ''} className="border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
            </div>
            <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Tipo</Label>
                <Select value={catType} onValueChange={setCatType}>
                    <SelectTrigger className="border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"><SelectValue placeholder="Gasto o Ingreso" /></SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                        <SelectItem value="expense" className="dark:focus:bg-slate-700">Gasto</SelectItem>
                        <SelectItem value="income" className="dark:focus:bg-slate-700">Ingreso</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className="border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400">Cancelar</Button>
                <Button type="submit" disabled={isPending || !catType} className="bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white">
                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </Button>
            </DialogFooter>
        </form>
    )
}



// ==================== SHARED ====================

function EmptyState({ text, sub }: { text: string; sub: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/60 py-16 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Tag className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">{text}</h3>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{sub}</p>
        </div>
    )
}
