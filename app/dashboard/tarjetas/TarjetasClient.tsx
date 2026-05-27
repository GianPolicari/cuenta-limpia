'use client'

import { useState, useTransition } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Amount } from '@/components/ui/amount'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CreditCard, Plus, Trash2, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCard, updateCard, deleteCard } from './actions'
import { BRAND_PRIMARY_HEX, CONTRAST_ON_DARK, CONTRAST_ON_LIGHT } from '@/lib/theme'

function getIconContrast(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? CONTRAST_ON_LIGHT : CONTRAST_ON_DARK
}

// ==================== TYPES ====================

type CardRow = {
    id: string
    name: string
    card_type: string
    color: string | null
}

type CuotaRow = {
    id: string
    description: string | null
    amount: number
    transaction_date: string
    card_id: string | null
    cuota_actual: number | null
    total_cuotas: number | null
}

interface Props {
    initialCards: CardRow[]
    cuotas: CuotaRow[]
}

function isCredit(cardType: string) {
    return cardType.toLowerCase().startsWith('cr')
}

// ==================== MAIN COMPONENT ====================

export default function TarjetasClient({ initialCards, cuotas }: Props) {
    const [cards, setCards] = useState<CardRow[]>(initialCards)
    const [addOpen, setAddOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<CardRow | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CardRow | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleAdd(formData: FormData) {
        const name = (formData.get('name') as string)?.trim()
        const card_type = (formData.get('card_type') as string)?.trim()
        const color = ((formData.get('color') as string) || '').trim() || null

        if (!name || !card_type) {
            setFormError('Completá el nombre y el tipo de tarjeta.')
            return
        }

        const previousCards = cards
        const tempId = `temp-${Date.now()}`
        const optimisticCard: CardRow = { id: tempId, name, card_type, color }

        setCards((prev) => [...prev, optimisticCard].sort((a, b) => a.name.localeCompare(b.name)))
        setFormError(null)
        setAddOpen(false)

        startTransition(async () => {
            const result = await createCard(formData)
            if (result.error || !result.card) {
                setCards(previousCards)
                toast.error('⚠ No pudimos agregar la tarjeta. Probá de nuevo.')
                setFormError(result.error ?? 'Error inesperado')
                setAddOpen(true)
                return
            }
            setCards((prev) =>
                prev.map((c) => c.id === tempId ? result.card! : c)
            )
            toast.success('✅ Tarjeta agregada')
        })
    }

    function handleEdit(formData: FormData) {
        if (!editTarget) return
        const name = (formData.get('name') as string)?.trim()
        const card_type = (formData.get('card_type') as string)?.trim()
        const color = ((formData.get('color') as string) || '').trim() || null

        const previousCards = cards
        setCards((prev) =>
            prev.map((c) => c.id === editTarget.id ? { ...c, name: name || c.name, card_type: card_type || c.card_type, color } : c)
                .sort((a, b) => a.name.localeCompare(b.name))
        )
        setEditTarget(null)
        setFormError(null)

        startTransition(async () => {
            const result = await updateCard(editTarget.id, formData)
            if (result.error) {
                setCards(previousCards)
                setFormError(result.error)
                setEditTarget(editTarget)
                toast.error('⚠ No pudimos guardar los cambios. Probá de nuevo.')
                return
            }
            toast.success('✅ Tarjeta actualizada')
        })
    }

    function handleDelete(id: string) {
        const previousCards = cards
        setCards((prev) => prev.filter((c) => c.id !== id))
        setDeleteTarget(null)

        startTransition(async () => {
            const result = await deleteCard(id)
            if (result.error) {
                setCards(previousCards)
                toast.error('⚠ No pudimos eliminar la tarjeta. Probá de nuevo.')
                return
            }
            toast.success('✅ Tarjeta eliminada')
        })
    }

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header */}
            <div className="cl-animate-enter mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                        Tarjetas
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tus tarjetas y cuotas activas
                    </p>
                </div>
                <Button className="cl-press gap-2 font-semibold" onClick={() => { setFormError(null); setAddOpen(true) }}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Agregar tarjeta
                </Button>
            </div>

            {/* Cards grid or empty state */}
            {cards.length === 0 ? (
                <div className="cl-animate-scale">
                    <EmptyState
                        icon={CreditCard}
                        title="Todavía no agregaste ninguna tarjeta"
                        description="Sumá tus tarjetas de crédito y débito para hacer seguimiento de cuotas y gastos por tarjeta."
                        action={
                            <Button className="cl-press gap-2 font-semibold" onClick={() => { setFormError(null); setAddOpen(true) }}>
                                <Plus className="h-4 w-4" aria-hidden="true" /> Agregar tarjeta
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="cl-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => {
                        const credit = isCredit(card.card_type)
                        const cardCuotas = cuotas.filter((q) => q.card_id === card.id)
                        return (
                            <Card key={card.id} className="cl-hover-lift">
                                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                card.color ? '' : 'bg-primary-subtle'
                                            )}
                                            style={card.color ? { backgroundColor: card.color } : undefined}
                                        >
                                            <CreditCard
                                                className={cn('h-5 w-5', !card.color && 'text-primary')}
                                                style={card.color ? { color: getIconContrast(card.color) } : undefined}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="truncate text-base font-semibold text-foreground">
                                                {card.name}
                                            </CardTitle>
                                            <Badge variant={credit ? 'info' : 'neutral'} className="mt-1">
                                                {credit ? 'Crédito' : 'Débito'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-muted-foreground hover:text-info"
                                            aria-label={`Editar tarjeta ${card.name}`}
                                            disabled={isPending}
                                            onClick={() => { setFormError(null); setEditTarget(card) }}
                                        >
                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-muted-foreground hover:text-expense"
                                            aria-label={`Eliminar tarjeta ${card.name}`}
                                            disabled={isPending}
                                            onClick={() => setDeleteTarget(card)}
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {cardCuotas.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Sin cuotas activas</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {cardCuotas.map((q) => {
                                                const cuota = formatCuota(q.cuota_actual, q.total_cuotas)
                                                return (
                                                    <li key={q.id} className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-foreground">
                                                                {q.description ?? '—'}
                                                            </p>
                                                            {cuota && (
                                                                <Badge variant="pending" className="mt-1">{cuota}</Badge>
                                                            )}
                                                        </div>
                                                        <Amount
                                                            value={q.amount}
                                                            kind="expense"
                                                            showIcon={false}
                                                            className="shrink-0 text-sm font-semibold"
                                                        />
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Add card dialog */}
            <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setFormError(null) }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar tarjeta</DialogTitle>
                        <DialogDescription>Sumá una tarjeta de crédito o débito.</DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">
                            {formError}
                        </div>
                    )}
                    <CardForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setAddOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit card dialog */}
            <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) { setEditTarget(null); setFormError(null) } }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar tarjeta</DialogTitle>
                        <DialogDescription>Modificá los datos de la tarjeta.</DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">
                            {formError}
                        </div>
                    )}
                    {editTarget && (
                        <CardForm onSubmit={handleEdit} isPending={isPending} onCancel={() => { setEditTarget(null); setFormError(null) }} defaults={editTarget} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar esta tarjeta?</DialogTitle>
                        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ==================== CARD FORM ====================

function CardForm({ onSubmit, isPending, onCancel, defaults }: {
    onSubmit: (fd: FormData) => void
    isPending: boolean
    onCancel: () => void
    defaults?: CardRow
}) {
    const [cardType, setCardType] = useState(defaults?.card_type ?? 'Crédito')

    return (
        <form
            action={(fd) => {
                fd.set('card_type', cardType)
                onSubmit(fd)
            }}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="card-name">Nombre</Label>
                <Input id="card-name" name="name" placeholder="Ej: Visa Galicia" required defaultValue={defaults?.name ?? ''} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="card-type">Tipo</Label>
                <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger id="card-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Crédito">Crédito</SelectItem>
                        <SelectItem value="Débito">Débito</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="card-color">Color (opcional)</Label>
                <Input id="card-color" name="color" type="color" defaultValue={defaults?.color ?? BRAND_PRIMARY_HEX} className="h-10 w-16 p-1" />
            </div>
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="font-semibold">
                    {isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Guardando...</>
                    ) : 'Agregar'}
                </Button>
            </DialogFooter>
        </form>
    )
}
