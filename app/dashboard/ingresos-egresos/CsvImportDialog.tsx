'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Amount } from '@/components/ui/amount'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { parseCsv, type ColMapping, type ParseResult } from './csv-parser'
import { batchInsertTransactions } from './actions'

interface CsvImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: { id: string; name: string }[]
    onImported: (count: number) => void
}

const DEFAULT_MAPPING: ColMapping = { fecha: 0, descripcion: 1, monto: 2, tipo: 3 }

export function CsvImportDialog({ open, onOpenChange, categories, onImported }: CsvImportDialogProps) {
    const [view, setView] = useState<'upload' | 'mapping' | 'preview'>('upload')
    const [rawText, setRawText] = useState('')
    const [mapping, setMapping] = useState<ColMapping>(DEFAULT_MAPPING)
    const [parseResult, setParseResult] = useState<ParseResult | null>(null)
    const [selectedCategory, setSelectedCategory] = useState('__none__')
    const [isPending, startTransition] = useTransition()
    const [isDragging, setIsDragging] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    // Resetear al abrir — setState intencional al cambiar `open`
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (open) {
            setView('upload')
            setRawText('')
            setMapping(DEFAULT_MAPPING)
            setParseResult(null)
            setSelectedCategory('__none__')
        }
    }, [open])
    /* eslint-enable react-hooks/set-state-in-effect */

    function handleFileRead(file: File) {
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            setRawText(text)

            // Parseo inicial con mapping por defecto para detectar columnas
            const initialMapping = { ...DEFAULT_MAPPING }

            // Detectar cantidad de columnas a partir de la primera línea
            const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 0) ?? ''
            const colCount = firstLine.split(',').length
            if (colCount <= 3) {
                initialMapping.tipo = null
            }

            setMapping(initialMapping)
            const result = parseCsv(text, initialMapping)
            setParseResult(result)
            setView('mapping')
        }
        reader.readAsText(file, 'utf-8')
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleFileRead(file)
        // Reset input value so same file can be re-selected
        e.target.value = ''
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
            handleFileRead(file)
        } else {
            toast.error('Seleccioná un archivo .csv o .txt')
        }
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setIsDragging(true)
    }

    function handleDragLeave() {
        setIsDragging(false)
    }

    function handleConfirmMapping() {
        const result = parseCsv(rawText, mapping)
        setParseResult(result)
        setView('preview')
    }

    function handleImport() {
        if (!parseResult || parseResult.validRows.length === 0) return

        const rows = parseResult.validRows.map(r => ({
            transaction_date: r.fecha,
            description: r.descripcion,
            amount: r.monto,
            transaction_type: r.tipo,
            category: selectedCategory && selectedCategory !== '__none__' ? selectedCategory : null,
        }))

        startTransition(async () => {
            const result = await batchInsertTransactions(rows)
            if (result.error) {
                toast.error(`No pudimos importar. ${result.error}`)
                return
            }
            const count = result.inserted
            toast.success(`✅ ${count} operación${count !== 1 ? 'es' : ''} importada${count !== 1 ? 's' : ''}`)
            onImported(count)
            onOpenChange(false)
        })
    }

    // Opciones de columna para los selects de mapping
    const colOptions = parseResult?.headers?.length
        ? parseResult.headers.map((h, i) => ({ label: h || `Columna ${i + 1}`, value: i }))
        : Array.from({ length: Math.max(4, mapping.fecha + 1, mapping.descripcion + 1, mapping.monto + 1) }, (_, i) => ({
            label: `Columna ${i + 1}`,
            value: i,
        }))

    // Preview raw de primeras 3 filas
    const rawPreviewRows = rawText
        ? rawText.split(/\r?\n/).filter(l => l.trim().length > 0).slice(1, 4).map(l => l.split(','))
        : []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                {/* ===== UPLOAD ===== */}
                {view === 'upload' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Importar CSV</DialogTitle>
                            <DialogDescription>
                                Importá tus movimientos desde un archivo CSV de tu banco o app.
                            </DialogDescription>
                        </DialogHeader>

                        <div
                            className={`mt-2 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${isDragging
                                ? 'border-primary bg-primary-subtle'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                }`}
                            onClick={() => fileRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            role="button"
                            tabIndex={0}
                            aria-label="Área de carga de archivo CSV"
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
                        >
                            <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <p className="text-sm font-medium text-foreground">
                                Arrastrá o seleccioná un archivo CSV
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Columnas esperadas: fecha, descripción, monto, tipo (ingreso/gasto)
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                            >
                                Seleccionar archivo
                            </Button>
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            aria-hidden="true"
                            onChange={handleFileChange}
                        />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ===== MAPPING ===== */}
                {view === 'mapping' && parseResult && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Configurá las columnas</DialogTitle>
                            <DialogDescription>
                                Indicá qué columna del CSV corresponde a cada campo.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Select: Fecha */}
                            <div className="space-y-1.5">
                                <Label htmlFor="map-fecha">Columna de fecha</Label>
                                <Select
                                    value={String(mapping.fecha)}
                                    onValueChange={(v) => setMapping(prev => ({ ...prev, fecha: Number(v) }))}
                                >
                                    <SelectTrigger id="map-fecha">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colOptions.map(o => (
                                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select: Descripción */}
                            <div className="space-y-1.5">
                                <Label htmlFor="map-desc">Columna de descripción</Label>
                                <Select
                                    value={String(mapping.descripcion)}
                                    onValueChange={(v) => setMapping(prev => ({ ...prev, descripcion: Number(v) }))}
                                >
                                    <SelectTrigger id="map-desc">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colOptions.map(o => (
                                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select: Monto */}
                            <div className="space-y-1.5">
                                <Label htmlFor="map-monto">Columna de monto</Label>
                                <Select
                                    value={String(mapping.monto)}
                                    onValueChange={(v) => setMapping(prev => ({ ...prev, monto: Number(v) }))}
                                >
                                    <SelectTrigger id="map-monto">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colOptions.map(o => (
                                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select: Tipo (opcional) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="map-tipo">Columna de tipo (opcional)</Label>
                                <Select
                                    value={mapping.tipo === null ? '__infer__' : String(mapping.tipo)}
                                    onValueChange={(v) => setMapping(prev => ({
                                        ...prev,
                                        tipo: v === '__infer__' ? null : Number(v),
                                    }))}
                                >
                                    <SelectTrigger id="map-tipo">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__infer__">Inferir del signo del monto</SelectItem>
                                        {colOptions.map(o => (
                                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Preview de primeras 3 filas */}
                            {rawPreviewRows.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                                        Vista previa (primeras {rawPreviewRows.length} filas)
                                    </p>
                                    <div className="overflow-x-auto rounded-lg border border-border">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-border bg-secondary/50">
                                                    {parseResult.headers.map((h, i) => (
                                                        <th key={i} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                                                            {h || `Col ${i + 1}`}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rawPreviewRows.map((row, ri) => (
                                                    <tr key={ri} className="border-b border-border last:border-0">
                                                        {row.map((cell, ci) => (
                                                            <td key={ci} className="max-w-[120px] truncate px-2 py-1.5 text-foreground">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setView('upload')}>
                                Volver
                            </Button>
                            <Button type="button" onClick={handleConfirmMapping} className="font-semibold">
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ===== PREVIEW ===== */}
                {view === 'preview' && parseResult && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Revisá antes de importar</DialogTitle>
                            <DialogDescription>
                                Revisá los datos detectados y elegí una categoría opcional.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="income">
                                {parseResult.validRows.length} válida{parseResult.validRows.length !== 1 ? 's' : ''}
                            </Badge>
                            {parseResult.errorRows.length > 0 && (
                                <Badge variant="expense">
                                    {parseResult.errorRows.length} con error
                                </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                                de {parseResult.totalRaw} fila{parseResult.totalRaw !== 1 ? 's' : ''} totales
                            </span>
                        </div>

                        {/* Categoría global */}
                        <div className="space-y-1.5">
                            <Label htmlFor="import-category">
                                Categoría para todas las importaciones (opcional)
                            </Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="import-category">
                                    <SelectValue placeholder="Sin categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin categoría</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tabla preview de filas válidas (máx 50) */}
                        {parseResult.validRows.length > 0 && (
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-secondary/50">
                                            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Fecha</th>
                                            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Descripción</th>
                                            <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Monto</th>
                                            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parseResult.validRows.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="px-2 py-1.5 text-muted-foreground">{row.fecha}</td>
                                                <td className="max-w-[160px] truncate px-2 py-1.5 font-medium text-foreground">
                                                    {row.descripcion}
                                                </td>
                                                <td className="px-2 py-1.5 text-right">
                                                    <Amount
                                                        value={row.monto}
                                                        kind={row.tipo}
                                                        showIcon={false}
                                                        className="text-xs"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <Badge variant={row.tipo}>
                                                        {row.tipo === 'income' ? 'Ingreso' : 'Gasto'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parseResult.validRows.length > 50 && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground">
                                        Mostrando 50 de {parseResult.validRows.length} filas válidas.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Acordeón de errores */}
                        {parseResult.errorRows.length > 0 && (
                            <details className="mt-2 text-sm text-muted-foreground">
                                <summary className="cursor-pointer select-none font-medium hover:text-foreground">
                                    Ver {parseResult.errorRows.length} fila{parseResult.errorRows.length !== 1 ? 's' : ''} con error
                                </summary>
                                <ul className="mt-2 space-y-1">
                                    {parseResult.errorRows.map((er, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 rounded-md border border-expense/20 bg-expense-subtle/40 px-2 py-1.5 text-xs"
                                        >
                                            <span className="shrink-0 font-medium text-expense">Error:</span>
                                            <span className="text-muted-foreground">{er.reason}</span>
                                            <span className="ml-auto shrink-0 max-w-[140px] truncate text-muted-foreground/60">
                                                {er.raw.join(', ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setView('mapping')}>
                                Volver
                            </Button>
                            <Button
                                type="button"
                                disabled={parseResult.validRows.length === 0 || isPending}
                                onClick={handleImport}
                                className="font-semibold"
                            >
                                {isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Importando...</>
                                    : `Importar ${parseResult.validRows.length} operación${parseResult.validRows.length !== 1 ? 'es' : ''}`
                                }
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
