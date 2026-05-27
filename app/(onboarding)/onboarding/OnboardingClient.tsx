'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { BRAND_PRIMARY_HEX } from '@/lib/theme'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { createCard } from '@/app/dashboard/tarjetas/actions'
import { addTransaction } from '@/app/dashboard/ingresos-egresos/actions'

interface Props {
    expenseCategories: { id: string; name: string }[]
    incomeCategories: { id: string; name: string }[]
}

export default function OnboardingClient({ expenseCategories, incomeCategories }: Props) {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [isPending, startTransition] = useTransition()

    // ── Paso 1 state ──
    const [cardName, setCardName] = useState('')
    const [cardType, setCardType] = useState('')
    const [cardColor, setCardColor] = useState(BRAND_PRIMARY_HEX)

    // ── Paso 3 state ──
    const [txType, setTxType] = useState<'income' | 'expense'>('expense')
    const [txDescription, setTxDescription] = useState('')
    const [txAmount, setTxAmount] = useState('')
    const [txCategory, setTxCategory] = useState('')
    const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])

    const activeCategories = txType === 'income' ? incomeCategories : expenseCategories

    // ── Handlers ──
    function handleSkipCard() {
        setStep(2)
    }

    function handleCreateCard() {
        if (!cardName.trim() || !cardType) {
            toast.error('⚠ Completá el nombre y el tipo de tarjeta.')
            return
        }
        startTransition(async () => {
            const fd = new FormData()
            fd.set('name', cardName.trim())
            fd.set('card_type', cardType)
            fd.set('color', cardColor)
            const result = await createCard(fd)
            if (result.error) {
                toast.error(`⚠ ${result.error}`)
                return
            }
            setStep(2)
        })
    }

    function handleContinueStep2() {
        setStep(3)
    }

    function handleSaveTransaction() {
        if (!txDescription.trim() || !txAmount || !txDate) {
            toast.error('⚠ Completá todos los campos obligatorios.')
            return
        }
        startTransition(async () => {
            const fd = new FormData()
            fd.set('description', txDescription.trim())
            fd.set('amount', txAmount)
            fd.set('transaction_type', txType)
            fd.set('date', txDate)
            fd.set('category', txCategory)
            const result = await addTransaction(fd)
            if (result.error) {
                toast.error(`⚠ ${result.error}`)
                return
            }
            router.push('/dashboard')
        })
    }

    return (
        <>
            {/* Progress bar */}
            <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
                {([1, 2, 3] as const).map(n => (
                    <div
                        key={n}
                        className={cn(
                            'h-1.5 flex-1 rounded-full transition-all duration-300',
                            step >= n ? 'bg-primary' : 'bg-border'
                        )}
                    />
                ))}
            </div>
            <p className="mb-4 text-center text-xs text-muted-foreground">
                Paso {step} de 3
            </p>

            <Card className="w-full">
                <CardHeader className="space-y-3 text-center">
                    {/* Brand mark */}
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-brand">
                        <DollarSign className="h-5 w-5 text-primary-foreground" aria-hidden />
                    </div>
                    <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                        CuentaLimpia
                    </p>

                    {step === 1 && (
                        <>
                            <CardTitle className="text-xl font-bold">
                                Agregá tu primera tarjeta
                            </CardTitle>
                            <CardDescription>
                                Podés asociar gastos a tus tarjetas para ver cuánto gastás con cada una. Este paso es opcional.
                            </CardDescription>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <CardTitle className="text-xl font-bold">
                                Tus categorías por defecto
                            </CardTitle>
                            <CardDescription>
                                Estas son las categorías con las que podés clasificar tus operaciones. Las podés personalizar en Configuración cuando quieras.
                            </CardDescription>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <CardTitle className="text-xl font-bold">
                                Registrá tu primera operación
                            </CardTitle>
                            <CardDescription>
                                Ingresá un ingreso o gasto reciente para empezar a ver tus finanzas en acción.
                            </CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* ── PASO 1 ── */}
                    {step === 1 && (
                        <div className="cl-animate-enter space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="card-name">Nombre de la tarjeta</Label>
                                <Input
                                    id="card-name"
                                    type="text"
                                    placeholder="Ej: Visa Galicia"
                                    value={cardName}
                                    onChange={e => setCardName(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="card-type">Tipo</Label>
                                <Select value={cardType} onValueChange={setCardType}>
                                    <SelectTrigger id="card-type" className="w-full">
                                        <SelectValue placeholder="Seleccioná un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Crédito">Crédito</SelectItem>
                                        <SelectItem value="Débito">Débito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="card-color">Color identificador (opcional)</Label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="card-color"
                                        type="color"
                                        value={cardColor}
                                        onChange={e => setCardColor(e.target.value)}
                                        className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
                                        aria-label="Color identificador de la tarjeta"
                                    />
                                    <span className="text-sm text-muted-foreground">{cardColor}</span>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                                <Button
                                    variant="ghost"
                                    className="cl-press flex-1"
                                    onClick={handleSkipCard}
                                    disabled={isPending}
                                >
                                    Omitir
                                </Button>
                                <Button
                                    variant="default"
                                    className="cl-press flex-1 gap-2 font-semibold shadow-brand"
                                    onClick={handleCreateCard}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                            <span>Creando...</span>
                                        </>
                                    ) : (
                                        'Crear tarjeta y continuar'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── PASO 2 ── */}
                    {step === 2 && (
                        <div className="cl-animate-enter space-y-5">
                            {expenseCategories.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-foreground">Gastos</p>
                                    <div className="flex flex-wrap gap-2">
                                        {expenseCategories.map(cat => (
                                            <Badge key={cat.id} variant="expense">
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {incomeCategories.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-foreground">Ingresos</p>
                                    <div className="flex flex-wrap gap-2">
                                        {incomeCategories.map(cat => (
                                            <Badge key={cat.id} variant="income">
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="default"
                                className="cl-press w-full font-semibold shadow-brand"
                                onClick={handleContinueStep2}
                            >
                                Continuar
                            </Button>
                        </div>
                    )}

                    {/* ── PASO 3 ── */}
                    {step === 3 && (
                        <div className="cl-animate-enter space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tx-type">Tipo</Label>
                                <Select
                                    value={txType}
                                    onValueChange={val => {
                                        setTxType(val as 'income' | 'expense')
                                        setTxCategory('')
                                    }}
                                >
                                    <SelectTrigger id="tx-type" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Ingreso</SelectItem>
                                        <SelectItem value="expense">Gasto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tx-description">Descripción</Label>
                                <Input
                                    id="tx-description"
                                    type="text"
                                    placeholder="Ej: Supermercado"
                                    value={txDescription}
                                    onChange={e => setTxDescription(e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tx-amount">Monto</Label>
                                <Input
                                    id="tx-amount"
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={txAmount}
                                    onChange={e => setTxAmount(e.target.value)}
                                    required
                                    className="tabular-nums"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tx-category">Categoría</Label>
                                <Select value={txCategory} onValueChange={setTxCategory}>
                                    <SelectTrigger id="tx-category" className="w-full">
                                        <SelectValue placeholder="Seleccioná una categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tx-date">Fecha</Label>
                                <Input
                                    id="tx-date"
                                    type="date"
                                    value={txDate}
                                    onChange={e => setTxDate(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                variant="default"
                                className="cl-press w-full gap-2 font-semibold shadow-brand"
                                onClick={handleSaveTransaction}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    'Guardar y entrar al dashboard'
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
