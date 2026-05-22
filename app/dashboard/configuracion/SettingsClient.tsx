'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    User, CreditCard, Tag, Mail, Calendar, Shield,
    LogOut, Plus, Trash2, Pencil, Loader2, Check,
} from 'lucide-react'
import { toast } from 'sonner'

import {
    addCard, updateCard, deleteCard,
    addCategory, updateCategory, deleteCategory,
    upsertBudget, deleteBudget,
} from './actions'

// ==================== TYPES ====================

type CardRow = { id: string; name: string; card_type: string; color: string | null }
type CategoryRow = { id: string; name: string; type: string }
type BudgetRow = { id: string; category_name: string; monthly_amount: number }


// ==================== MAIN COMPONENT ====================

interface SettingsClientProps {
    email: string
    createdAt: string
    signOut: () => Promise<void>
    initialCards: CardRow[]
    initialCategories: CategoryRow[]
    initialBudgets: BudgetRow[]
}

const CARD_TYPES = ['Crédito', 'Débito']
export default function SettingsClient({
    email,
    createdAt,
    signOut,
    initialCards,
    initialCategories,
    initialBudgets,
}: SettingsClientProps) {
    return (
        <div className="min-h-screen bg-background p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    Configuración
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tu perfil, tus tarjetas y tus categorías
                </p>
            </div>

            {/* Profile + Account strip */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-subtle">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="truncate text-sm font-medium text-foreground">{email || '—'}</p>
                            </div>
                            {createdAt && (
                                <div className="mt-0.5 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Miembro desde {createdAt}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-expense-subtle">
                                <Shield className="h-5 w-5 text-expense" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Sesión</p>
                                <p className="text-xs text-muted-foreground">Cerrá tu sesión actual</p>
                            </div>
                        </div>
                        <form action={signOut}>
                            <Button type="submit" variant="outline" size="sm" className="gap-2 border-expense/30 text-expense hover:bg-expense-subtle">
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
                    <CategoriasTab initialCategories={initialCategories} initialBudgets={initialBudgets} />
                </TabsContent>

            </Tabs>
        </div>
    )
}

// ==================== TAB: TARJETAS ====================

function TarjetasTab({ initialCards }: { initialCards: CardRow[] }) {
    const [addOpen, setAddOpen] = useState(false)
    const [editCard, setEditCard] = useState<CardRow | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CardRow | null>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    function handleAdd(formData: FormData) {
        startTransition(async () => {
            const result = await addCard(formData)
            if (result.error) {
                setError(result.error)
                toast.error("⚠ No pudimos agregar la tarjeta. Probá de nuevo.", { description: result.error })
                return
            }
            setError(null)
            setAddOpen(false)
            toast.success("✅ Tarjeta agregada")
            router.refresh()
        })
    }

    function handleEdit(formData: FormData) {
        if (!editCard) return
        startTransition(async () => {
            const result = await updateCard(editCard.id, formData)
            if (result.error) {
                setError(result.error)
                toast.error("⚠ No pudimos guardar los cambios. Probá de nuevo.", { description: result.error })
                return
            }
            setError(null)
            setEditCard(null)
            toast.success("✅ Tarjeta actualizada")
            router.refresh()
        })
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            const result = await deleteCard(id)
            if (result?.error) {
                toast.error("⚠ No pudimos eliminar la tarjeta. Probá de nuevo.", { description: result.error })
                return
            }
            setDeleteTarget(null)
            toast.success("✅ Tarjeta eliminada")
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            {/* Add button */}
            <div className="flex justify-end">
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Agregar tarjeta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva tarjeta</DialogTitle>
                            <DialogDescription>Agregá una tarjeta de crédito o débito.</DialogDescription>
                        </DialogHeader>
                        {error && <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">{error}</div>}
                        <CardForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editCard} onOpenChange={(o) => !o && setEditCard(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar tarjeta</DialogTitle>
                        <DialogDescription>Modificá los datos de la tarjeta.</DialogDescription>
                    </DialogHeader>
                    {error && <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">{error}</div>}
                    {editCard && <CardForm onSubmit={handleEdit} isPending={isPending} onCancel={() => setEditCard(null)} defaults={editCard} />}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar esta tarjeta?</DialogTitle>
                        <DialogDescription>No se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button type="button" variant="destructive" disabled={isPending} onClick={() => deleteTarget && handleDelete(deleteTarget.id)}>
                            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</> : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            {initialCards.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="Sin tarjetas"
                    description="Agregá tu primera tarjeta para empezar a organizar tus gastos."
                />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-muted-foreground">Nombre</TableHead>
                                    <TableHead className="text-muted-foreground">Tipo</TableHead>
                                    <TableHead className="w-20 text-muted-foreground"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialCards.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium text-foreground">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full border border-border shadow-sm"
                                                    style={{ backgroundColor: c.color || 'var(--muted-foreground)' }}
                                                />
                                                {c.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={c.card_type === 'Crédito' ? 'info' : 'income'}>
                                                {c.card_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" aria-label={`Editar ${c.name}`} onClick={() => setEditCard(c)}>
                                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-expense" aria-label={`Eliminar ${c.name}`} disabled={isPending} onClick={() => setDeleteTarget(c)}>
                                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
    const [color, setColor] = useState(defaults?.color ?? '#5B47E0')
    return (
        <form action={(fd) => {
            fd.set('card_type', cardType)
            fd.set('color', color)
            onSubmit(fd)
        }} className="space-y-4">
            <div className="space-y-2">
                <Label>Nombre</Label>
                <Input name="name" placeholder="Ej: Visa Galicia" required defaultValue={defaults?.name ?? ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={cardType} onValueChange={setCardType}>
                        <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                        <SelectContent>
                            {CARD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-10 w-14 cursor-pointer p-1"
                        />
                        <span className="text-xs uppercase text-muted-foreground">{color}</span>
                    </div>
                </div>
            </div>
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isPending || !cardType}>
                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </Button>
            </DialogFooter>
        </form>
    )
}

// ==================== TAB: CATEGORÍAS ====================

function CategoriasTab({ initialCategories, initialBudgets }: { initialCategories: CategoryRow[]; initialBudgets: BudgetRow[] }) {
    const [addOpen, setAddOpen] = useState(false)
    const [editCat, setEditCat] = useState<CategoryRow | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [budgets, setBudgets] = useState<BudgetRow[]>(initialBudgets)
    const router = useRouter()

    const expenseCats = initialCategories.filter((c) => c.type === 'expense')
    const incomeCats = initialCategories.filter((c) => c.type === 'income')

    function handleUpsertBudget(categoryName: string, amount: number) {
        // Optimistic update
        setBudgets((prev) => {
            const exists = prev.find((b) => b.category_name === categoryName)
            if (exists) return prev.map((b) => b.category_name === categoryName ? { ...b, monthly_amount: amount } : b)
            return [...prev, { id: `temp-${Date.now()}`, category_name: categoryName, monthly_amount: amount }]
        })
        startTransition(async () => {
            const result = await upsertBudget(categoryName, amount)
            if (result.error) {
                setBudgets(initialBudgets)
                toast.error("No pudimos guardar el presupuesto. Probá de nuevo.", { description: result.error })
            } else {
                toast.success("Presupuesto guardado")
                router.refresh()
            }
        })
    }

    function handleDeleteBudget(categoryName: string) {
        // Optimistic update
        setBudgets((prev) => prev.filter((b) => b.category_name !== categoryName))
        startTransition(async () => {
            const result = await deleteBudget(categoryName)
            if (result.error) {
                setBudgets(initialBudgets)
                toast.error("No pudimos eliminar el presupuesto. Probá de nuevo.", { description: result.error })
            } else {
                router.refresh()
            }
        })
    }

    function handleAdd(formData: FormData) {
        startTransition(async () => {
            const result = await addCategory(formData)
            if (result.error) {
                setError(result.error)
                toast.error("⚠ No pudimos crear la categoría. Probá de nuevo.", { description: result.error })
                return
            }
            setError(null); setAddOpen(false);
            toast.success("✅ Categoría creada");
            router.refresh()
        })
    }

    function handleEdit(formData: FormData) {
        if (!editCat) return
        startTransition(async () => {
            const result = await updateCategory(editCat.id, formData)
            if (result.error) {
                setError(result.error)
                toast.error("⚠ No pudimos guardar los cambios. Probá de nuevo.", { description: result.error })
                return
            }
            setError(null); setEditCat(null);
            toast.success("✅ Categoría actualizada")
            router.refresh()
        })
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            const result = await deleteCategory(id)
            if (result?.error) {
                toast.error("⚠ No pudimos eliminar la categoría. Probá de nuevo.", { description: result.error })
                return
            }
            setDeleteTarget(null)
            toast.success("✅ Categoría eliminada")
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Tus categorías para gastos e ingresos</p>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Agregar categoría
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva categoría</DialogTitle>
                            <DialogDescription>Creá una categoría para organizar tus operaciones.</DialogDescription>
                        </DialogHeader>
                        {error && <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">{error}</div>}
                        <CategoryForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit dialog */}
            <Dialog open={!!editCat} onOpenChange={(o) => !o && setEditCat(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar categoría</DialogTitle>
                    </DialogHeader>
                    {editCat && <CategoryForm onSubmit={handleEdit} isPending={isPending} onCancel={() => setEditCat(null)} defaults={editCat} />}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar esta categoría?</DialogTitle>
                        <DialogDescription>No se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button type="button" variant="destructive" disabled={isPending} onClick={() => deleteTarget && handleDelete(deleteTarget.id)}>
                            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</> : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {initialCategories.length === 0 ? (
                <EmptyState
                    icon={Tag}
                    title="Sin categorías"
                    description="Agregá categorías para organizar tus gastos e ingresos."
                    action={
                        <Button className="gap-2" onClick={() => setAddOpen(true)}>
                            <Plus className="h-4 w-4" /> Agregar categoría
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    <CategoryGroup title="Gastos" items={expenseCats} variant="expense" onEdit={setEditCat} onDelete={setDeleteTarget} isPending={isPending} budgets={budgets} onUpsertBudget={handleUpsertBudget} onDeleteBudget={handleDeleteBudget} />
                    <CategoryGroup title="Ingresos" items={incomeCats} variant="income" onEdit={setEditCat} onDelete={setDeleteTarget} isPending={isPending} />
                </div>
            )}
        </div>
    )
}

function CategoryGroup({ title, items, variant, onEdit, onDelete, isPending, budgets, onUpsertBudget, onDeleteBudget }: {
    title: string
    items: CategoryRow[]
    variant: 'expense' | 'income'
    onEdit: (c: CategoryRow) => void
    onDelete: (c: CategoryRow) => void
    isPending: boolean
    budgets?: BudgetRow[]
    onUpsertBudget?: (categoryName: string, amount: number) => void
    onDeleteBudget?: (categoryName: string) => void
}) {
    if (items.length === 0) return null
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map((c) => (
                    <div key={c.id} className="space-y-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                        <div className="flex items-center justify-between">
                            <Badge variant={variant}>{c.name}</Badge>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-info" aria-label={`Editar ${c.name}`} onClick={() => onEdit(c)}>
                                    <Pencil className="h-3 w-3" aria-hidden="true" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-expense" aria-label={`Eliminar ${c.name}`} disabled={isPending} onClick={() => onDelete(c)}>
                                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                        {variant === 'expense' && onUpsertBudget && onDeleteBudget && (
                            <BudgetInput
                                categoryName={c.name}
                                currentBudget={budgets?.find((b) => b.category_name === c.name)?.monthly_amount ?? null}
                                onSave={onUpsertBudget}
                                onClear={onDeleteBudget}
                                isPending={isPending}
                            />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function BudgetInput({ categoryName, currentBudget, onSave, onClear, isPending }: {
    categoryName: string
    currentBudget: number | null
    onSave: (categoryName: string, amount: number) => void
    onClear: (categoryName: string) => void
    isPending: boolean
}) {
    const [value, setValue] = useState(currentBudget !== null ? String(currentBudget) : '')
    const [dirty, setDirty] = useState(false)

    // Sync if parent updates (e.g. after refresh)
    useState(() => {
        setValue(currentBudget !== null ? String(currentBudget) : '')
        setDirty(false)
    })

    function handleSave() {
        const num = parseFloat(value.replace(',', '.'))
        if (!value.trim() || isNaN(num) || num <= 0) {
            if (currentBudget !== null) {
                onClear(categoryName)
                setValue('')
                setDirty(false)
            }
            return
        }
        onSave(categoryName, num)
        setDirty(false)
    }

    return (
        <div className="flex items-center gap-2">
            <Label htmlFor={`budget-${categoryName}`} className="shrink-0 text-xs text-muted-foreground">
                Presupuesto mensual
            </Label>
            <div className="flex flex-1 items-center gap-1">
                <span className="text-xs text-muted-foreground">$</span>
                <Input
                    id={`budget-${categoryName}`}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Sin tope"
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setDirty(true) }}
                    onBlur={handleSave}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } }}
                    className="h-7 text-xs"
                    aria-label={`Presupuesto mensual para ${categoryName}`}
                    disabled={isPending}
                />
                {dirty && value.trim() !== '' && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-income hover:bg-income-subtle"
                        onClick={handleSave}
                        aria-label="Guardar presupuesto"
                        disabled={isPending}
                    >
                        <Check className="h-3 w-3" aria-hidden="true" />
                    </Button>
                )}
                {currentBudget !== null && !dirty && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-expense"
                        onClick={() => { onClear(categoryName); setValue(''); setDirty(false) }}
                        aria-label={`Eliminar presupuesto de ${categoryName}`}
                        disabled={isPending}
                    >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                )}
            </div>
        </div>
    )
}

function CategoryForm({ onSubmit, isPending, onCancel, defaults }: {
    onSubmit: (fd: FormData) => void; isPending: boolean; onCancel: () => void; defaults?: CategoryRow
}) {
    const [catType, setCatType] = useState(defaults?.type ?? '')
    return (
        <form action={(fd) => { fd.set('type', catType); onSubmit(fd) }} className="space-y-4">
            <div className="space-y-2">
                <Label>Nombre</Label>
                <Input name="name" placeholder="Ej: Gimnasio" required defaultValue={defaults?.name ?? ''} />
            </div>
            <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={catType} onValueChange={setCatType}>
                    <SelectTrigger><SelectValue placeholder="Gasto o ingreso" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="expense">Gasto</SelectItem>
                        <SelectItem value="income">Ingreso</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isPending || !catType}>
                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </Button>
            </DialogFooter>
        </form>
    )
}
