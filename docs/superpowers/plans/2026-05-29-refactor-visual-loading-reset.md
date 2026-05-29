# Refactor Visual + Loading States + Reset BD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinear la UI al Design System (logo SVG + tarjetas bancarias visuales), agregar skeletons de carga en todas las rutas, corregir el bug off-by-one de meses en I&E, y agregar un mecanismo de reset de BD solo en desarrollo.

**Architecture:** Next.js 15 App Router — los Server Components pasan datos como props a Client Components. Los `loading.tsx` por ruta activan el Suspense boundary nativo de Next.js. El bug de meses se corrige unificando el contrato de `getTransactions` a 1-indexed (1-12). Los SVG assets se sirven desde `public/assets/`.

**Tech Stack:** Next.js App Router, React 19, Supabase (server actions), Tailwind v4, shadcn/ui, lucide-react, sonner.

**Spec:** `docs/superpowers/specs/2026-05-29-refactor-visual-loading-reset.md`

---

## File Map

```
public/
  assets/
    logo.svg                          ← NUEVO (copiado de design-system/assets/)
    logo-wordmark.svg                 ← NUEVO
    logo-wordmark-dark.svg            ← NUEVO

components/ui/
  skeleton.tsx                        ← NUEVO
  credit-card-visual.tsx              ← NUEVO

app/dashboard/
  layout.tsx                          ← MODIFICAR (logo)
  loading.tsx                         ← NUEVO

app/dashboard/ingresos-egresos/
  actions.ts                          ← MODIFICAR (getTransactions 1-indexed)
  page.tsx                            ← MODIFICAR (initialMonth +1)
  IngresosEgresosClient.tsx           ← MODIFICAR (skeleton overlay, cl-animate-enter)
  loading.tsx                         ← NUEVO

app/dashboard/tarjetas/
  TarjetasClient.tsx                  ← MODIFICAR (CreditCardVisual + cuotas section)
  loading.tsx                         ← NUEVO

app/dashboard/metas/
  MetasClient.tsx                     ← MODIFICAR (cl-animate-enter consistente)
  loading.tsx                         ← NUEVO

app/dashboard/configuracion/
  actions.ts                          ← MODIFICAR (resetDevDatabase + applyRecurring fix)
  page.tsx                            ← MODIFICAR (isDev prop)
  SettingsClient.tsx                  ← MODIFICAR (DevZone section)
  loading.tsx                         ← NUEVO

app/globals.css                       ← MODIFICAR (shimmer keyframe)
```

---

## Task 1: Copiar SVG assets del Design System a public/

**Files:**
- Create: `public/assets/logo.svg`
- Create: `public/assets/logo-wordmark.svg`
- Create: `public/assets/logo-wordmark-dark.svg`

- [ ] **Step 1: Crear carpeta y copiar los tres SVG**

```bash
mkdir -p public/assets
cp design-system/assets/logo.svg public/assets/logo.svg
cp design-system/assets/logo-wordmark.svg public/assets/logo-wordmark.svg
cp design-system/assets/logo-wordmark-dark.svg public/assets/logo-wordmark-dark.svg
```

- [ ] **Step 2: Verificar que los archivos existen y son válidos**

```bash
ls -la public/assets/
```

Esperado: tres archivos `.svg`, cada uno > 200 bytes.

- [ ] **Step 3: Commit**

```bash
git add public/assets/
git commit -m "feat: add SVG logo assets from design system"
```

---

## Task 2: Reemplazar logo en el sidebar

**Files:**
- Modify: `app/dashboard/layout.tsx`

- [ ] **Step 1: Reemplazar el bloque de logo**

En `app/dashboard/layout.tsx`, reemplazar el bloque completo del logo (el `<div className="flex h-16 items-center gap-3 ...">`) por:

```tsx
{/* Logo */}
<div className="flex h-16 items-center border-b border-sidebar-border px-6">
    <img
        src="/assets/logo-wordmark.svg"
        alt="CuentaLimpia"
        width={140}
        height={40}
        className="dark:hidden"
    />
    <img
        src="/assets/logo-wordmark-dark.svg"
        alt="CuentaLimpia"
        width={140}
        height={40}
        className="hidden dark:block"
    />
</div>
```

Eliminar también el import de `DollarSign` si ya no se usa en otro lugar del archivo.

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Verificar visualmente**

Levantar dev server (`npm run dev`), abrir `http://localhost:3000/dashboard`. Confirmar:
- El logo muestra el wordmark con el símbolo "CL" + texto "CuentaLimpia"
- Cambiar a dark mode con el toggle — el wordmark cambia a la versión clara sobre fondo oscuro

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: replace DollarSign icon with official SVG wordmark"
```

---

## Task 3: Agregar shimmer keyframe y componente Skeleton

**Files:**
- Modify: `app/globals.css`
- Create: `components/ui/skeleton.tsx`

- [ ] **Step 1: Agregar keyframe shimmer en globals.css**

Agregar dentro del bloque `@layer utilities` existente (al final, antes del `}` de cierre de ese bloque):

```css
/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 2: Crear components/ui/skeleton.tsx**

```tsx
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md',
        'bg-[linear-gradient(90deg,var(--muted)_0%,var(--border)_50%,var(--muted)_100%)]',
        'bg-[length:200%_100%]',
        'animate-[shimmer_1.6s_linear_infinite]',
        className
      )}
    />
  )
}
```

- [ ] **Step 3: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css components/ui/skeleton.tsx
git commit -m "feat: add Skeleton component with DS shimmer animation"
```

---

## Task 4: Crear loading.tsx para las 5 rutas del dashboard

**Files:**
- Create: `app/dashboard/loading.tsx`
- Create: `app/dashboard/ingresos-egresos/loading.tsx`
- Create: `app/dashboard/tarjetas/loading.tsx`
- Create: `app/dashboard/metas/loading.tsx`
- Create: `app/dashboard/configuracion/loading.tsx`

- [ ] **Step 1: Crear app/dashboard/loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mb-1 h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="mb-1 h-5 w-40" />
            <Skeleton className="mb-4 h-3 w-32" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear app/dashboard/ingresos-egresos/loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function IngresosEgresosLoading() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-border p-3 last:border-0"
          >
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="mb-1.5 h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear app/dashboard/tarjetas/loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function TarjetasLoading() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full rounded-[20px]"
            style={{ aspectRatio: '1.586 / 1' }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear app/dashboard/metas/loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function MetasLoading() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="mb-1.5 h-2 w-full rounded-full" />
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Crear app/dashboard/configuracion/loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ConfiguracionLoading() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div>
                <Skeleton className="mb-1.5 h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 7: Verificar visualmente en dev server**

Navegar entre `/dashboard`, `/dashboard/ingresos-egresos`, `/dashboard/tarjetas`, `/dashboard/metas`, `/dashboard/configuracion`. Confirmar que al navegar se ve el skeleton antes de que carguen los datos (puede requerir throttle de red en DevTools → "Slow 3G").

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/loading.tsx \
        app/dashboard/ingresos-egresos/loading.tsx \
        app/dashboard/tarjetas/loading.tsx \
        app/dashboard/metas/loading.tsx \
        app/dashboard/configuracion/loading.tsx
git commit -m "feat: add route-level loading skeletons for all dashboard sections"
```

---

## Task 5: Fix bug off-by-one en meses (I&E)

**Files:**
- Modify: `app/dashboard/ingresos-egresos/actions.ts` (líneas 8-13)
- Modify: `app/dashboard/ingresos-egresos/page.tsx` (líneas 6-7)
- Modify: `app/dashboard/configuracion/actions.ts` (líneas 302-304)

- [ ] **Step 1: Corregir getTransactions en actions.ts**

En `app/dashboard/ingresos-egresos/actions.ts`, reemplazar las líneas 10-11:

```ts
// ANTES:
const mm = String(month + 1).padStart(2, '0')
const lastDay = new Date(year, month + 1, 0).getDate()

// DESPUÉS (month ahora es 1-indexed, 1-12):
const mm = String(month).padStart(2, '0')
const lastDay = new Date(year, month, 0).getDate()
```

El resto de la función no cambia.

- [ ] **Step 2: Corregir initialMonth en page.tsx**

En `app/dashboard/ingresos-egresos/page.tsx`, línea 7:

```ts
// ANTES:
const month = now.getMonth()

// DESPUÉS:
const month = now.getMonth() + 1
```

Verificar también que la llamada `getRecurringApplied(month, year)` en la línea ~19 usa este mismo `month` ya corregido — así es, no requiere cambio adicional.

- [ ] **Step 3: Corregir applyRecurring en configuracion/actions.ts**

En `app/dashboard/configuracion/actions.ts`, líneas 302-304:

```ts
// ANTES:
const daysInMonth = new Date(year, month + 1, 0).getDate()
const day = Math.min(rec.day_of_month, daysInMonth)
const mm = String(month + 1).padStart(2, '0')

// DESPUÉS (month ahora es 1-indexed):
const daysInMonth = new Date(year, month, 0).getDate()
const day = Math.min(rec.day_of_month, daysInMonth)
const mm = String(month).padStart(2, '0')
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 5: Verificar el fix manualmente**

Abrir `/dashboard/ingresos-egresos`. Confirmar:
- El Select muestra el mes actual correcto (ej. "Mayo" en Mayo, "Junio" en Junio)
- Las transacciones mostradas corresponden al mes seleccionado
- Cambiar al mes anterior y volver al mes actual — los datos son consistentes con lo que muestra el Dashboard

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/ingresos-egresos/actions.ts \
        app/dashboard/ingresos-egresos/page.tsx \
        app/dashboard/configuracion/actions.ts
git commit -m "fix: correct off-by-one month indexing in getTransactions and applyRecurring"
```

---

## Task 6: Skeleton overlay en I&E al cambiar mes/año

**Files:**
- Modify: `app/dashboard/ingresos-egresos/IngresosEgresosClient.tsx`

- [ ] **Step 1: Localizar la sección de KPIs y tabla (alrededor de línea 441)**

Buscar en el archivo la sección que empieza con `{/* KPI Cards */}` y la tabla de transacciones.

- [ ] **Step 2: Envolver KPIs y tabla en un bloque condicional**

Reemplazar la sección de KPIs (el `<div className="cl-stagger mb-6 grid gap-4 sm:grid-cols-3">`) por:

```tsx
{/* KPI Cards */}
{isLoadingTransactions ? (
  <div className="mb-6 grid gap-4 sm:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-32" />
      </div>
    ))}
  </div>
) : (
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
)}
```

- [ ] **Step 3: Agregar skeleton para la tabla cuando isLoadingTransactions**

Justo antes del bloque de la tabla/lista de transacciones (buscar `{/* Search + type filter */}`), envolver el bloque de búsqueda + tabla en:

```tsx
{isLoadingTransactions ? (
  <div className="rounded-xl border border-border bg-card">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="grid grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-border p-3 last:border-0"
      >
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="mb-1.5 h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
    ))}
  </div>
) : (
  {/* ...bloque de búsqueda + tabla existente sin cambios... */}
)}
```

- [ ] **Step 4: Deshabilitar los Selects de mes/año durante la carga**

En los `<Select>` de mes y año (alrededor de línea 422-437), agregar `disabled={isLoadingTransactions}`:

```tsx
<Select value={month} onValueChange={setMonth} disabled={isLoadingTransactions}>
  {/* ... */}
</Select>
<Select value={year} onValueChange={setYear} disabled={isLoadingTransactions}>
  {/* ... */}
</Select>
```

- [ ] **Step 5: Agregar import de Skeleton**

Al inicio del archivo, agregar el import:

```tsx
import { Skeleton } from '@/components/ui/skeleton'
```

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Verificar visualmente**

En `/dashboard/ingresos-egresos`, cambiar el mes en el Select. Confirmar que los KPIs y la tabla muestran skeletons durante la carga y los Selects están deshabilitados.

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/ingresos-egresos/IngresosEgresosClient.tsx
git commit -m "feat: show skeleton overlay during month/year change in I&E"
```

---

## Task 7: Componente CreditCardVisual

**Files:**
- Create: `components/ui/credit-card-visual.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import { cn } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

interface CreditCardVisualProps {
  name: string
  card_type: string
  color: string | null
  activeCuotas?: number
  className?: string
}

function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function isValidHex(hex: string | null): hex is string {
  return !!hex && /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function CreditCardVisual({
  name,
  card_type,
  color,
  activeCuotas = 0,
  className,
}: CreditCardVisualProps) {
  const gradient = isValidHex(color)
    ? `linear-gradient(135deg, ${color} 0%, ${darkenHex(color, 40)} 100%)`
    : 'linear-gradient(135deg, #7C6BFF 0%, #4131B5 100%)'

  const isCredit = card_type.toLowerCase().startsWith('cr')

  return (
    <div
      className={cn('relative overflow-hidden rounded-[20px] p-5 text-white shadow-md', className)}
      style={{ aspectRatio: '1.586 / 1', background: gradient }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold opacity-90 truncate max-w-[60%]">{name}</span>
        {activeCuotas > 0 && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
          >
            {activeCuotas} {activeCuotas === 1 ? 'cuota activa' : 'cuotas activas'}
          </span>
        )}
      </div>

      {/* Masked number */}
      <div className="my-4 text-lg font-semibold tracking-[0.18em] tabular-nums opacity-80">
        •••• •••• •••• ••••
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
          {isCredit ? 'Crédito' : 'Débito'}
        </p>
        <CreditCard className="h-5 w-5 opacity-40" aria-hidden="true" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/credit-card-visual.tsx
git commit -m "feat: add CreditCardVisual component matching DS card design"
```

---

## Task 8: Actualizar TarjetasClient con diseño visual bancario

**Files:**
- Modify: `app/dashboard/tarjetas/TarjetasClient.tsx`

- [ ] **Step 1: Agregar import de CreditCardVisual**

En `app/dashboard/tarjetas/TarjetasClient.tsx`, agregar al bloque de imports:

```tsx
import { CreditCardVisual } from '@/components/ui/credit-card-visual'
```

- [ ] **Step 2: Reemplazar el grid de cards**

Reemplazar el bloque `{cards.length === 0 ? ... : <div className="cl-stagger grid gap-4 ...">` con:

```tsx
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
  <>
    {/* Grid de tarjetas visuales */}
    <div className="cl-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const cardCuotas = cuotas.filter((q) => q.card_id === card.id)
        return (
          <div key={card.id} className="group relative">
            <CreditCardVisual
              name={card.name}
              card_type={card.card_type}
              color={card.color}
              activeCuotas={cardCuotas.length}
              className="w-full"
            />
            {/* Botones flotantes sobre la card */}
            <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                aria-label={`Editar tarjeta ${card.name}`}
                disabled={isPending}
                onClick={() => { setFormError(null); setEditTarget(card) }}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                aria-label={`Eliminar tarjeta ${card.name}`}
                disabled={isPending}
                onClick={() => setDeleteTarget(card)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>

    {/* Sección de cuotas activas del mes */}
    {cuotas.length > 0 && (
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Cuotas activas del mes</h2>
          <span className="text-sm text-muted-foreground">
            {cuotas.length} en curso
          </span>
        </div>
        <div className="space-y-2">
          {cuotas.map((q) => {
            const card = cards.find((c) => c.id === q.card_id)
            const cuotaLabel = formatCuota(q.cuota_actual, q.total_cuotas)
            const pct =
              q.cuota_actual && q.total_cuotas
                ? Math.round((q.cuota_actual / q.total_cuotas) * 100)
                : 0
            return (
              <div
                key={q.id}
                className="grid grid-cols-[1fr_140px_auto] items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-xs"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {q.description ?? '—'}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CreditCard className="h-3 w-3" aria-hidden="true" />
                    {card?.name ?? '—'}
                  </p>
                </div>
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="cl-progress-fill h-full rounded-full bg-pending-strong"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {cuotaLabel && (
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {cuotaLabel}
                    </p>
                  )}
                </div>
                <Amount
                  value={q.amount}
                  kind="expense"
                  showIcon={false}
                  className="shrink-0 text-sm font-semibold"
                />
              </div>
            )
          })}
        </div>
      </section>
    )}
  </>
)}
```

- [ ] **Step 3: Eliminar el import de getIconContrast y BRAND_PRIMARY_HEX si ya no se usan**

Revisar los imports al inicio del archivo. Si `getIconContrast`, `BRAND_PRIMARY_HEX`, `CONTRAST_ON_DARK`, `CONTRAST_ON_LIGHT` ya no se usan en ningún otro lugar del archivo, eliminarlos del import de `@/lib/theme`.

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 5: Verificar visualmente**

En `/dashboard/tarjetas`:
- Las tarjetas muestran diseño visual bancario (gradiente, aspect-ratio correcto, número enmascarado)
- Al hover sobre una tarjeta aparecen los botones de editar/eliminar semitransparentes
- Si hay cuotas, aparece la sección "Cuotas activas del mes" debajo del grid

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/tarjetas/TarjetasClient.tsx
git commit -m "feat: replace flat card UI with visual credit card design from DS"
```

---

## Task 9: Consistencia cl-animate-enter en MetasClient y SettingsClient

**Files:**
- Modify: `app/dashboard/metas/MetasClient.tsx`
- Modify: `app/dashboard/configuracion/SettingsClient.tsx`

- [ ] **Step 1: Verificar MetasClient**

Abrir `app/dashboard/metas/MetasClient.tsx`. Buscar el `<div>` raíz del return. Si no tiene `cl-animate-enter`, agregarlo. Buscar el grid de goals y asegurarse que tiene `cl-stagger`:

```tsx
// Div raíz:
<div className="cl-animate-enter min-h-screen p-6 lg:p-8">

// Grid de goals:
<div className="cl-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

- [ ] **Step 2: Verificar SettingsClient**

En `app/dashboard/configuracion/SettingsClient.tsx`, el div raíz ya tiene `cl-animate-enter` en el header (línea 104). Verificar que el contenedor principal tiene la clase:

```tsx
<div className="cl-animate-enter min-h-screen bg-background p-6 lg:p-8">
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/metas/MetasClient.tsx app/dashboard/configuracion/SettingsClient.tsx
git commit -m "fix: ensure cl-animate-enter consistency across all dashboard pages"
```

---

## Task 10: Reset BD — server action + UI en Configuración

**Files:**
- Modify: `app/dashboard/configuracion/actions.ts`
- Modify: `app/dashboard/configuracion/page.tsx`
- Modify: `app/dashboard/configuracion/SettingsClient.tsx`

- [ ] **Step 1: Agregar resetDevDatabase en actions.ts**

Al final de `app/dashboard/configuracion/actions.ts`, agregar:

```ts
// ==================== DEV RESET ====================

export async function resetDevDatabase() {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'Solo disponible en entorno de desarrollo' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Orden respeta FK constraints:
  // recurring_applied → transactions → recurring_transactions
  // → savings_goals → budgets → custom_categories → cards
  const tables = [
    'recurring_applied',
    'transactions',
    'recurring_transactions',
    'savings_goals',
    'budgets',
    'custom_categories',
    'cards',
  ] as const

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id)
    if (error) return { error: `Error limpiando ${table}: ${error.message}` }
  }

  revalidatePath('/dashboard', 'layout')
  return { error: null }
}
```

Verificar que `revalidatePath` ya está importado al inicio del archivo (lo está en otros actions del mismo archivo).

- [ ] **Step 2: Pasar isDev como prop desde la página**

En `app/dashboard/configuracion/page.tsx`, agregar `isDev` en el return:

```tsx
return (
    <SettingsClient
        email={email}
        createdAt={createdAt}
        signOut={signOut}
        initialCards={cardsRes.data ?? []}
        initialCategories={categoriesRes.data ?? []}
        initialBudgets={budgetsRes.data ?? []}
        initialRecurring={
            (recurringRes.data ?? []) as unknown as Parameters<typeof SettingsClient>[0]['initialRecurring']
        }
        initialAlertPrefs={alertPrefsRes.data ?? null}
        initialAlertOverrides={alertOverridesRes.data ?? []}
        isDev={process.env.NODE_ENV === 'development'}
    />
)
```

- [ ] **Step 3: Agregar isDev a la interfaz y al componente en SettingsClient.tsx**

En `app/dashboard/configuracion/SettingsClient.tsx`, actualizar la interfaz `SettingsClientProps`:

```ts
interface SettingsClientProps {
    email: string
    createdAt: string
    signOut: () => Promise<void>
    initialCards: CardRow[]
    initialCategories: CategoryRow[]
    initialBudgets: BudgetRow[]
    initialRecurring: RecurringRow[]
    initialAlertPrefs: AlertPrefsRow
    initialAlertOverrides: AlertOverrideRow[]
    isDev?: boolean  // ← agregar
}
```

Actualizar la firma de la función:

```ts
export default function SettingsClient({
    email,
    createdAt,
    signOut,
    initialCards,
    initialCategories,
    initialBudgets,
    initialRecurring,
    initialAlertPrefs,
    initialAlertOverrides,
    isDev = false,  // ← agregar
}: SettingsClientProps) {
```

- [ ] **Step 4: Agregar el import de resetDevDatabase y el estado de reset**

Al bloque de imports de actions en `SettingsClient.tsx`:

```ts
import {
    addCard, updateCard, deleteCard,
    addCategory, updateCategory, deleteCategory,
    upsertBudget, deleteBudget,
    addRecurring, updateRecurring, deleteRecurring,
    upsertAlertPreferences, upsertAlertOverride,
    resetDevDatabase,  // ← agregar
} from './actions'
```

Dentro del componente, agregar estado y handler para el reset (después de `const [activeTab, setActiveTab] = useState('tarjetas')`):

```ts
const [resetOpen, setResetOpen] = useState(false)
const [isResetting, startResetTransition] = useTransition()

function handleReset() {
    startResetTransition(async () => {
        const result = await resetDevDatabase()
        if (result.error) {
            toast.error(`❌ ${result.error}`)
            return
        }
        setResetOpen(false)
        toast.success('✅ Base de datos reseteada')
    })
}
```

- [ ] **Step 5: Agregar la sección DevZone al final del JSX**

Al final del return de `SettingsClient`, justo antes del `</div>` de cierre raíz, agregar:

```tsx
{/* Dev Zone — solo visible en NODE_ENV=development */}
{isDev && (
    <section className="mt-12 rounded-xl border border-expense/20 bg-expense-subtle p-6">
        <h2 className="mb-1 text-base font-semibold text-expense">Zona de desarrollo</h2>
        <p className="mb-4 text-sm text-muted-foreground">
            Borra todos los datos de tu cuenta. Solo visible en entorno de desarrollo.
        </p>
        <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setResetOpen(true)}
        >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Resetear base de datos
        </Button>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>¿Estás seguro?</DialogTitle>
                    <DialogDescription>
                        Esto eliminará todas tus transacciones, tarjetas, metas, presupuestos y configuraciones. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setResetOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isResetting}
                        onClick={handleReset}
                    >
                        {isResetting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reseteando...</>
                        ) : (
                            <><Trash2 className="h-4 w-4" aria-hidden="true" /> Confirmar reset</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </section>
)}
```

Verificar que `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` ya están importados (sí lo están, líneas 16-20 del archivo).

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 7: Verificar visualmente**

En `/dashboard/configuracion` (con `NODE_ENV=development`):
- Al final de la página aparece la sección roja "Zona de desarrollo"
- Hacer click en "Resetear base de datos" — aparece diálogo de confirmación
- Confirmar: los datos se borran, se redirige al dashboard y no hay datos

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/configuracion/actions.ts \
        app/dashboard/configuracion/page.tsx \
        app/dashboard/configuracion/SettingsClient.tsx
git commit -m "feat: add dev-only DB reset in Configuración settings"
```

---

## Self-Review

### Spec coverage

| Requisito del spec | Tarea |
|---|---|
| Logo SVG en sidebar (light + dark) | Task 2 |
| CreditCardVisual (aspect-ratio, gradiente, cuotas) | Task 7 + Task 8 |
| `darkenHex` helper especificada | Task 7, Step 1 |
| Skeleton component con shimmer DS | Task 3 |
| loading.tsx en 5 rutas | Task 4 |
| Skeleton overlay en I&E durante isLoadingTransactions | Task 6 |
| Selects deshabilitados durante carga | Task 6 |
| Fix getTransactions 1-indexed | Task 5 |
| Fix applyRecurring 1-indexed | Task 5 |
| Fix initialMonth en page.tsx | Task 5 |
| cl-animate-enter consistente | Task 9 |
| resetDevDatabase solo en dev | Task 10 |
| isDev prop desde Server Component | Task 10 |
| Diálogo de confirmación antes del reset | Task 10 |
| Cuotas en sección separada bajo el grid | Task 8 |

Todos los requisitos del spec tienen tarea asignada.

### Consistencia de tipos

- `CreditCardVisual` props (`name`, `card_type`, `color`, `activeCuotas`) coinciden con los campos de `CardRow` en `TarjetasClient` ✓
- `resetDevDatabase()` devuelve `{ error: string | null }` — mismo patrón que el resto de actions ✓
- `isDev?: boolean` en la interfaz con default `false` — no rompe llamadas existentes sin la prop ✓
- `getTransactions(month, year)` con `month` 1-indexed — el callsite en `useEffect` ya usa el valor del Select (1-indexed) ✓
