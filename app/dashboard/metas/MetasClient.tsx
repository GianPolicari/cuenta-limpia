'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Amount } from '@/components/ui/amount'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { Target, Plus, Pencil, Trash2, Loader2, PiggyBank } from 'lucide-react'
import { toast } from 'sonner'
import {
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
    getSavingsGoals,
} from './actions'

// ==================== TYPES ====================

type GoalRow = {
    id: string
    name: string
    target_amount: number
    current_amount: number
    deadline: string | null
    created_at: string
}

interface Props {
    initialGoals: GoalRow[]
}

// ==================== HELPERS ====================

function calcDaysLeft(deadline: string | null): number | null {
    if (!deadline) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dl = new Date(deadline + 'T00:00:00')
    return Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDeadline(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ==================== MAIN COMPONENT ====================

export default function MetasClient({ initialGoals }: Props) {
    const [goals, setGoals] = useState<GoalRow[]>(initialGoals)
    const [addOpen, setAddOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<GoalRow | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<GoalRow | null>(null)
    const [contributeTarget, setContributeTarget] = useState<GoalRow | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    async function refetchGoals() {
        const res = await getSavingsGoals()
        if (res.data) setGoals(res.data)
    }

    function handleAdd(formData: FormData) {
        const name = (formData.get('name') as string)?.trim()
        const target_amount = parseFloat(formData.get('target_amount') as string)
        const deadlineRaw = (formData.get('deadline') as string)?.trim()
        const deadline = deadlineRaw || null

        if (!name) { setFormError('El nombre es requerido.'); return }
        if (isNaN(target_amount) || target_amount <= 0) { setFormError('El monto objetivo debe ser mayor a 0.'); return }

        const previousGoals = goals
        const tempId = `temp-${Date.now()}`
        const optimisticGoal: GoalRow = {
            id: tempId,
            name,
            target_amount,
            current_amount: 0,
            deadline,
            created_at: new Date().toISOString(),
        }

        setGoals((prev) => [...prev, optimisticGoal])
        setFormError(null)
        setAddOpen(false)

        startTransition(async () => {
            const result = await addSavingsGoal(formData)
            if (result.error || !result.goal) {
                setGoals(previousGoals)
                toast.error('⚠ No pudimos agregar la meta. Probá de nuevo.')
                setFormError(result.error ?? 'Error inesperado')
                setAddOpen(true)
                return
            }
            await refetchGoals()
            toast.success('✅ Meta de ahorro creada')
        })
    }

    function handleEdit(formData: FormData) {
        if (!editTarget) return
        const name = (formData.get('name') as string)?.trim()
        const target_amount = parseFloat(formData.get('target_amount') as string)
        const deadlineRaw = (formData.get('deadline') as string)?.trim()
        const deadline = deadlineRaw || null

        if (!name) { setFormError('El nombre es requerido.'); return }
        if (isNaN(target_amount) || target_amount <= 0) { setFormError('El monto objetivo debe ser mayor a 0.'); return }

        const previousGoals = goals
        setGoals((prev) =>
            prev.map((g) =>
                g.id === editTarget.id ? { ...g, name, target_amount, deadline } : g
            )
        )
        const savedEditTarget = editTarget
        setEditTarget(null)
        setFormError(null)

        startTransition(async () => {
            const result = await updateSavingsGoal(savedEditTarget.id, formData)
            if (result.error) {
                setGoals(previousGoals)
                setFormError(result.error)
                setEditTarget(savedEditTarget)
                toast.error('⚠ No pudimos guardar los cambios. Probá de nuevo.')
                return
            }
            toast.success('✅ Meta actualizada')
        })
    }

    function handleDelete(id: string) {
        const previousGoals = goals
        setGoals((prev) => prev.filter((g) => g.id !== id))
        setDeleteTarget(null)

        startTransition(async () => {
            const result = await deleteSavingsGoal(id)
            if (result.error) {
                setGoals(previousGoals)
                toast.error('⚠ No pudimos eliminar la meta. Probá de nuevo.')
                return
            }
            toast.success('✅ Meta eliminada')
        })
    }

    function handleContribute(id: string, amount: number) {
        const previousGoals = goals
        setGoals((prev) =>
            prev.map((g) =>
                g.id === id ? { ...g, current_amount: g.current_amount + amount } : g
            )
        )
        setContributeTarget(null)

        startTransition(async () => {
            const result = await contributeToGoal(id, amount)
            if (result.error) {
                setGoals(previousGoals)
                toast.error('⚠ No pudimos registrar la contribución. Probá de nuevo.')
                return
            }
            toast.success('✅ Contribución registrada')
        })
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="cl-animate-enter mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                        Metas de Ahorro
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Seguí el progreso de tus objetivos financieros
                    </p>
                </div>
                <Button
                    className="cl-press gap-2 font-semibold"
                    onClick={() => { setFormError(null); setAddOpen(true) }}
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Nueva meta
                </Button>
            </div>

            {/* Goals grid or empty state */}
            {goals.length === 0 ? (
                <div className="cl-animate-fade">
                    <EmptyState
                        icon={Target}
                        title="Sin metas todavía"
                        description="Creá tu primera meta de ahorro y seguí tu progreso mes a mes."
                        action={
                            <Button
                                className="cl-press gap-2"
                                onClick={() => { setFormError(null); setAddOpen(true) }}
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Nueva meta
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="cl-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal) => {
                        const pct = goal.target_amount > 0
                            ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                            : 0
                        const completed = pct >= 100
                        const daysLeft = calcDaysLeft(goal.deadline)

                        return (
                            <Card key={goal.id} className="cl-hover-lift flex flex-col">
                                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle">
                                            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                                        </div>
                                        <CardTitle className="truncate text-base font-semibold text-foreground">
                                            {goal.name}
                                        </CardTitle>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-muted-foreground hover:text-info"
                                            aria-label={`Editar meta ${goal.name}`}
                                            disabled={isPending}
                                            onClick={() => { setFormError(null); setEditTarget(goal) }}
                                        >
                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-muted-foreground hover:text-expense"
                                            aria-label={`Eliminar meta ${goal.name}`}
                                            disabled={isPending}
                                            onClick={() => setDeleteTarget(goal)}
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-1 flex-col gap-3">
                                    {/* Progress bar */}
                                    <div
                                        className="h-2 w-full rounded-full bg-secondary"
                                        role="progressbar"
                                        aria-valuenow={pct}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`Progreso: ${pct}%`}
                                    >
                                        <div
                                            className={cn(
                                                'cl-progress-fill h-2 rounded-full',
                                                completed
                                                    ? 'bg-income'
                                                    : pct >= 75
                                                    ? 'bg-pending'
                                                    : 'bg-info'
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    {/* Amounts + badge */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Amount value={goal.current_amount} kind="neutral" showIcon={false} showSign={false} className="text-sm font-semibold" />
                                        <span className="text-xs text-muted-foreground">de</span>
                                        <Amount value={goal.target_amount} kind="neutral" showIcon={false} showSign={false} className="text-sm text-muted-foreground" />
                                        {completed ? (
                                            <Badge variant="income">Completada</Badge>
                                        ) : (
                                            <Badge variant="neutral">{pct}%</Badge>
                                        )}
                                    </div>

                                    {/* Deadline */}
                                    {goal.deadline && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                Vence el {formatDeadline(goal.deadline)}
                                            </span>
                                            {daysLeft !== null && (
                                                daysLeft <= 0 ? (
                                                    <Badge variant="expense">Vencida</Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        · Quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Contribute button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cl-press mt-auto gap-2 font-semibold"
                                        disabled={isPending || completed}
                                        onClick={() => setContributeTarget(goal)}
                                        aria-label={`Contribuir a la meta ${goal.name}`}
                                    >
                                        <PiggyBank className="h-4 w-4" aria-hidden="true" />
                                        Contribuir
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Add goal dialog */}
            <Dialog
                open={addOpen}
                onOpenChange={(o) => { setAddOpen(o); if (!o) setFormError(null) }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nueva meta de ahorro</DialogTitle>
                        <DialogDescription>
                            Definí tu objetivo y empezá a ahorrar paso a paso.
                        </DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">
                            {formError}
                        </div>
                    )}
                    <GoalForm
                        onSubmit={handleAdd}
                        isPending={isPending}
                        onCancel={() => { setAddOpen(false); setFormError(null) }}
                        submitLabel="Crear meta"
                    />
                </DialogContent>
            </Dialog>

            {/* Edit goal dialog */}
            <Dialog
                open={!!editTarget}
                onOpenChange={(o) => { if (!o) { setEditTarget(null); setFormError(null) } }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar meta</DialogTitle>
                        <DialogDescription>Modificá los datos de tu meta de ahorro.</DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="rounded-lg border border-expense/20 bg-expense-subtle p-3 text-center text-sm text-expense">
                            {formError}
                        </div>
                    )}
                    {editTarget && (
                        <GoalForm
                            onSubmit={handleEdit}
                            isPending={isPending}
                            onCancel={() => { setEditTarget(null); setFormError(null) }}
                            defaults={editTarget}
                            submitLabel="Guardar cambios"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar esta meta?</DialogTitle>
                        <DialogDescription>
                            No se puede deshacer. Se perderá el progreso registrado.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            )}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contribute dialog */}
            <Dialog
                open={!!contributeTarget}
                onOpenChange={(o) => { if (!o) setContributeTarget(null) }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Contribuir a &ldquo;{contributeTarget?.name}&rdquo;
                        </DialogTitle>
                        <DialogDescription>
                            Ingresá el monto que querés agregar a esta meta.
                        </DialogDescription>
                    </DialogHeader>
                    {contributeTarget && (
                        <ContributeForm
                            goal={contributeTarget}
                            onSubmit={(amount) => handleContribute(contributeTarget.id, amount)}
                            isPending={isPending}
                            onCancel={() => setContributeTarget(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ==================== GOAL FORM ====================

function GoalForm({
    onSubmit,
    isPending,
    onCancel,
    defaults,
    submitLabel,
}: {
    onSubmit: (fd: FormData) => void
    isPending: boolean
    onCancel: () => void
    defaults?: GoalRow
    submitLabel: string
}) {
    return (
        <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="goal-name">Nombre</Label>
                <Input
                    id="goal-name"
                    name="name"
                    placeholder="Ej: Vacaciones, auto nuevo..."
                    required
                    defaultValue={defaults?.name ?? ''}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="goal-target">Monto objetivo</Label>
                <Input
                    id="goal-target"
                    name="target_amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0"
                    required
                    defaultValue={defaults?.target_amount ?? ''}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="goal-deadline">Fecha límite (opcional)</Label>
                <Input
                    id="goal-deadline"
                    name="deadline"
                    type="date"
                    defaultValue={defaults?.deadline ?? ''}
                />
            </div>
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="font-semibold">
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Guardando...
                        </>
                    ) : (
                        submitLabel
                    )}
                </Button>
            </DialogFooter>
        </form>
    )
}

// ==================== CONTRIBUTE FORM ====================

function ContributeForm({
    goal,
    onSubmit,
    isPending,
    onCancel,
}: {
    goal: GoalRow
    onSubmit: (amount: number) => void
    isPending: boolean
    onCancel: () => void
}) {
    const [amountStr, setAmountStr] = useState('')
    const [error, setError] = useState<string | null>(null)

    const remaining = Math.max(0, goal.target_amount - goal.current_amount)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const amount = parseFloat(amountStr)
        if (isNaN(amount) || amount <= 0) {
            setError('Ingresá un monto válido mayor a 0.')
            return
        }
        setError(null)
        onSubmit(amount)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {remaining > 0 && (
                <p className="text-sm text-muted-foreground">
                    Te faltan{' '}
                    <span className="font-semibold text-foreground">
                        <Amount value={remaining} kind="neutral" showIcon={false} showSign={false} />
                    </span>{' '}
                    para completar esta meta.
                </p>
            )}
            <div className="space-y-2">
                <Label htmlFor="contribute-amount">Monto a agregar</Label>
                <Input
                    id="contribute-amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    autoFocus
                    aria-describedby={error ? 'contribute-error' : undefined}
                />
            </div>
            {error && (
                <p id="contribute-error" className="text-sm text-expense">{error}</p>
            )}
            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending || !amountStr} className="font-semibold">
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Agregando...
                        </>
                    ) : (
                        <>
                            <PiggyBank className="h-4 w-4" aria-hidden="true" />
                            Agregar al ahorro
                        </>
                    )}
                </Button>
            </DialogFooter>
        </form>
    )
}
