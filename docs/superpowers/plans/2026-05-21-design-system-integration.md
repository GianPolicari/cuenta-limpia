# Integración del Design System — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar el Design System de CuentaLimpia (violeta + Plus Jakarta Sans + tokens semánticos + voseo) en toda la app y agregar la feature Tarjetas/cuotas, usando un equipo reutilizable de 3 agentes.

**Architecture:** Estrategia de tokens "Opción A" — los tokens del DS se mapean sobre los nombres de shadcn en `globals.css` (light + dark) y los semánticos de finanzas se exponen como utilities nuevas de Tailwind v4. Los componentes shadcn conservan su estructura y heredan la marca automáticamente. El trabajo se ejecuta en fases con un equipo de agentes: guardian (QA), screen-migrator (restyle de pantallas) y feature-builder (features con datos).

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, lucide-react, recharts, Supabase, next-themes, sonner.

---

## Nota sobre verificación (adaptación de TDD)

Este repo **no tiene runner de tests** (no hay `test` en `package.json`, ni vitest/jest). Un restyle visual además no es unit-testeable de forma significativa. Por lo tanto, la "verificación antes de avanzar" de cada tarea usa:

1. `npm run build` — debe compilar sin errores.
2. `npm run lint` — sin errores nuevos.
3. **Revisión del `cl-design-guardian`** — sin violaciones del DS.
4. **Verificación manual en navegador** (`npm run dev`) — golden path + dark mode, en las tareas de UI.

La única lógica con tests unitarios reales es el formateo de montos/cuotas (Fase 3), que sí lleva test con un runner mínimo si se desea; por defecto se verifica vía build + uso en pantalla.

## Mapa de archivos

**Crear:**
- `.claude/agents/cl-design-guardian.md`, `.claude/agents/cl-screen-migrator.md`, `.claude/agents/cl-feature-builder.md`
- `design-system/**` (copia versionada del DS — referencia estable para los agentes)
- `components/ui/badge.tsx`, `components/ui/amount.tsx`, `components/ui/kpi-card.tsx`, `components/ui/empty-state.tsx`, `components/ui/transaction-row.tsx`
- `lib/format.ts` (formateo ARS/USD/cuotas centralizado)
- `app/dashboard/tarjetas/page.tsx`, `app/dashboard/tarjetas/TarjetasClient.tsx`, `app/dashboard/tarjetas/actions.ts`

**Modificar:**
- `app/globals.css` (remapeo total de tokens)
- `app/layout.tsx` (fuente Geist → Plus Jakarta Sans)
- `app/dashboard/layout.tsx` (sidebar violeta + nav, agregar Tarjetas)
- `components/dashboard/DashboardClient.tsx`, `CategoryChart.tsx`, `MonthlyChart.tsx`
- `app/dashboard/ingresos-egresos/IngresosEgresosClient.tsx` (+ `actions.ts`, `page.tsx` si aplica)
- `app/dashboard/configuracion/SettingsClient.tsx`
- `app/login/page.tsx`, `app/register/page.tsx`, `app/olvide-password/page.tsx`, `app/reset-password/page.tsx`
- `database.types.ts` (campos de cuotas)

---

## FASE 0 — Crear el equipo y la referencia del DS

### Task 0.1: Copiar el Design System al repo

**Files:**
- Create: `design-system/` (copia completa del DS extraído)

- [ ] **Step 1: Copiar la carpeta del DS al repo**

El DS está extraído en `%TEMP%\cl-ds` (origen: `../CuentaLimpia Design System.zip`).

```bash
cp -r "$TMPDIR/cl-ds/." "design-system/"
ls design-system
```
Expected: `README.md SKILL.md colors_and_type.css tokens.json assets preview screenshots ui_kits uploads`

- [ ] **Step 2: Commit**

```bash
git add design-system
git commit -m "Agrega Design System versionado como referencia"
```

### Task 0.2: Agente `cl-design-guardian`

**Files:**
- Create: `.claude/agents/cl-design-guardian.md`

- [ ] **Step 1: Crear la definición del agente**

```markdown
---
name: cl-design-guardian
description: Revisa cambios de UI de CuentaLimpia contra el Design System (tokens, color semántico, voz voseo, accesibilidad). Read-only; devuelve hallazgos accionables, no edita. Usar tras cualquier cambio visual.
tools: Read, Grep, Glob
model: sonnet
---

Sos el guardián del Design System de CuentaLimpia. Tu fuente de verdad es `design-system/README.md`, `design-system/colors_and_type.css` y `design-system/ui_kits/cuentalimpia/`. Revisás los archivos que te indiquen y devolvés una lista de hallazgos accionables ordenados por severidad. **Nunca editás código.**

Reglas que hacés cumplir (cada hallazgo cita archivo:línea y la regla violada):

**Color**
- Violeta (`primary`) solo en: acción primaria de la vista, nav activo, brand mark. Nunca como tinte de fila ni serie de gráfico (salvo que la serie sea la categoría de marca).
- Ingreso = verde (`income`) y gasto = rojo (`expense`) SIEMPRE con ícono (ArrowUpRight/ArrowDownRight) + signo (+/−) + label textual. Color nunca es señal única.
- Ámbar (`pending`) solo para cuotas/pendientes.
- Cero colores hardcodeados: prohibido `slate-*`, `emerald-*`, `bg-white`, `text-white`, hex crudo. Debe usarse token semántico (`bg-card`, `text-muted-foreground`, `text-income`, `border-border`, etc.).

**Tipografía / tokens**
- Plus Jakarta Sans vía `--font-sans`. Montos con `tabular-nums`.
- Radios/sombras/espaciado según escala del DS.
- Focus único: `:focus-visible` con anillo 3px `primary-subtle` + borde primary. No suprimir focus.

**Voz (voseo)**
- Río de la Plata: registrá/ingresá/tenés/podés. Nunca registra/tienes/puedes.
- Glosario: "Gasto" no "egreso" en UI de usuario ("Ingresos & Egresos" se permite como título de página). Empty states "Sin [X]". Confirmación destructiva "¿Eliminar este gasto? No se puede deshacer."
- Emojis solo ✅/⚠/🗑️/💸 en toasts y confirmaciones; nunca en headings, botones, nav, KPIs.

**Accesibilidad (WCAG 2.2 AA)**
- Targets táctiles 44×44 mínimo en móvil.
- Íconos funcionales con texto visible o `aria-label`; decorativos con `aria-hidden="true"`.
- Inputs con label visible (placeholder no es label); errores vía `aria-describedby`.
- Respetar `prefers-reduced-motion`.

**Gráficos (recharts)**
- Ingreso=emerald, gasto=coral SIEMPRE (no intercambiar). Grid dashed `3 3`, sin líneas verticales. Tooltip oscuro. Barras `radius={[6,6,0,0]}` `maxBarSize={40}`. Pie `paddingAngle={4}` sin stroke.

Formato de salida: lista numerada de hallazgos `[SEVERIDAD] archivo:línea — regla — qué corregir`. Si no hay hallazgos, decilo explícitamente. Severidades: BLOQUEANTE / IMPORTANTE / MENOR.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/cl-design-guardian.md
git commit -m "Agrega agente cl-design-guardian"
```

### Task 0.3: Agente `cl-screen-migrator`

**Files:**
- Create: `.claude/agents/cl-screen-migrator.md`

- [ ] **Step 1: Crear la definición del agente**

```markdown
---
name: cl-screen-migrator
description: Migra una pantalla/componente existente de CuentaLimpia a los tokens y la voz del Design System, refactorizando según .antigravityrules. Usar para restyle de pantallas ya existentes.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
---

Migrás UNA pantalla/componente de CuentaLimpia (la que te indiquen) a los tokens semánticos y la voz del Design System. Fuente de verdad: `design-system/README.md`, `design-system/colors_and_type.css`, `design-system/ui_kits/cuentalimpia/`.

**Reglas de migración de clases** (reemplazá hardcodeadas por tokens):
- `text-slate-900 dark:text-white` → `text-foreground`
- `text-slate-500/600 dark:text-slate-400` → `text-muted-foreground`
- `text-slate-400 dark:text-slate-500` → `text-muted-foreground`
- `border-slate-200/300 dark:border-slate-800` → `border-border`
- `bg-white`, `bg-white/60 dark:bg-slate-900/60` → `bg-card` (usá el componente `Card`; evitá glass manual)
- `bg-slate-50 dark:bg-slate-950` → `bg-background`
- Marca/logo/nav-activo en emerald (`from-emerald-400 to-emerald-600`, `text-emerald-*` de marca) → primary/violeta. El único gradiente permitido es el brand mark `from-[#7C6BFF] to-[#5B47E0]`.
- Ingreso emerald: `text-emerald-600 dark:text-emerald-400` → `text-income`; `bg-emerald-500/10` → `bg-income-subtle`; íconos → `text-income`/`text-income-strong`.
- Gasto rojo: `text-red-*` → `text-expense`; `bg-red-500/10` → `bg-expense-subtle`.
- Balance/info azul: `text-blue-*`/`bg-blue-500/10` → `text-info`/`bg-info-subtle`.
- Indigo y otros acentos de marca → `text-primary`/`bg-primary-subtle`.

**Componentes:** reutilizá los primitivos del DS (`Amount`, `Badge`, `KpiCard`, `EmptyState`, `TransactionRow`) y los shadcn (`Button`, `Card`, ...) en vez de reinventar. Ingreso/gasto SIEMPRE con `Amount` (ícono + signo + color).

**Voz:** aplicá voseo y glosario ("Gasto" no "egreso" en UI; empty states "Sin [X]"; confirmaciones del DS). Emojis solo en toasts.

**Arquitectura (.antigravityrules):** Server Components por defecto; empujá `'use client'` lo más abajo posible; `cn()` para clases condicionales; sin inline styles; tipado estricto con `database.types.ts`; UI optimista en mutaciones; errores de Supabase a `toast`. Limpiá imports/variables muertas en cada archivo que toques.

**Cierre:** corré `npm run build` y `npm run lint`; deben pasar. No commitees vos; reportá el diff y el resultado del build/lint para revisión.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/cl-screen-migrator.md
git commit -m "Agrega agente cl-screen-migrator"
```

### Task 0.4: Agente `cl-feature-builder`

**Files:**
- Create: `.claude/agents/cl-feature-builder.md`

- [ ] **Step 1: Crear la definición del agente**

```markdown
---
name: cl-feature-builder
description: Construye features nuevas end-to-end en CuentaLimpia con el Design System (esquema Supabase, tipos, server actions con UI optimista, pantallas con tokens y voseo). Usar para features con datos.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
---

Construís features nuevas end-to-end en CuentaLimpia respetando el Design System y `.antigravityrules`. Fuente de verdad de diseño: `design-system/`.

**Datos:** definí cambios de esquema Supabase como SQL idempotente (`add column if not exists ...`) y actualizá `database.types.ts` para reflejarlos. **Nunca apliques migraciones al proyecto real sin que el usuario confirme** — presentá el SQL y esperá aprobación.

**Server / mutaciones:** Server Components por defecto, `'use client'` abajo. Server actions tipadas con `database.types.ts`. UI optimista en insert/update/delete; errores de Supabase a `toast`.

**UI:** usá primitivos del DS (`Amount`, `Badge`, `KpiCard`, `EmptyState`, `TransactionRow`) y shadcn. Tokens semánticos, voseo, accesibilidad (labels, aria, 44px, focus). Ingreso/gasto con ícono+signo+color.

**Cierre:** `npm run build` + `npm run lint` deben pasar. Reportá diff y resultado para revisión; no commitees vos.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/cl-feature-builder.md
git commit -m "Agrega agente cl-feature-builder"
```

---

## FASE 1 — Fundaciones (secuencial, bloqueante)

### Task 1.1: Remapear tokens en `globals.css`

**Files:**
- Modify: `app/globals.css` (reescritura completa)

- [ ] **Step 1: Reescribir `app/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-jakarta);
  --font-mono: var(--font-jakarta);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Semánticos de finanzas (utilities nuevas) */
  --color-primary-hover: var(--primary-hover);
  --color-primary-subtle: var(--primary-subtle);
  --color-income: var(--income);
  --color-income-strong: var(--income-strong);
  --color-income-subtle: var(--income-subtle);
  --color-expense: var(--expense);
  --color-expense-strong: var(--expense-strong);
  --color-expense-subtle: var(--expense-subtle);
  --color-pending: var(--pending);
  --color-pending-strong: var(--pending-strong);
  --color-pending-subtle: var(--pending-subtle);
  --color-info: var(--info);
  --color-info-strong: var(--info-strong);
  --color-info-subtle: var(--info-subtle);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-chart-6: var(--chart-6);
  --color-chart-7: var(--chart-7);
  --color-chart-8: var(--chart-8);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  --shadow-brand: 0 8px 24px -6px rgba(91, 71, 224, 0.30);
}

:root {
  --radius: 0.875rem;
  --background: #F8F8FB;
  --foreground: #0B0B12;
  --card: #FFFFFF;
  --card-foreground: #0B0B12;
  --popover: #FFFFFF;
  --popover-foreground: #0B0B12;
  --primary: #5B47E0;
  --primary-foreground: #FFFFFF;
  --secondary: #F1F1F6;
  --secondary-foreground: #0B0B12;
  --muted: #F1F1F6;
  --muted-foreground: #4A4A55;
  --accent: #EEEBFF;
  --accent-foreground: #4131B5;
  --destructive: #DC2626;
  --border: #E6E6EC;
  --input: #E6E6EC;
  --ring: #5B47E0;

  --primary-hover: #4F3DCC;
  --primary-subtle: #EEEBFF;
  --income: #059669;
  --income-strong: #10B981;
  --income-subtle: #D1FAE5;
  --expense: #DC2626;
  --expense-strong: #EF4444;
  --expense-subtle: #FEE2E2;
  --pending: #B45309;
  --pending-strong: #F59E0B;
  --pending-subtle: #FEF3C7;
  --info: #2563EB;
  --info-strong: #3B82F6;
  --info-subtle: #DBEAFE;

  --chart-1: #7C6BFF;
  --chart-2: #10B981;
  --chart-3: #F59E0B;
  --chart-4: #3B82F6;
  --chart-5: #EC4899;
  --chart-6: #14B8A6;
  --chart-7: #6366F1;
  --chart-8: #F87171;

  --sidebar: #FFFFFF;
  --sidebar-foreground: #0B0B12;
  --sidebar-primary: #5B47E0;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #EEEBFF;
  --sidebar-accent-foreground: #5B47E0;
  --sidebar-border: #E6E6EC;
  --sidebar-ring: #5B47E0;
}

.dark {
  --background: #0B0B12;
  --foreground: #F4F4F8;
  --card: #15151F;
  --card-foreground: #F4F4F8;
  --popover: #1F1F2C;
  --popover-foreground: #F4F4F8;
  --primary: #7C6BFF;
  --primary-foreground: #0B0B12;
  --secondary: #1C1C28;
  --secondary-foreground: #F4F4F8;
  --muted: #1C1C28;
  --muted-foreground: #A1A1AD;
  --accent: rgba(124, 107, 255, 0.14);
  --accent-foreground: #F4F4F8;
  --destructive: #F87171;
  --border: #262633;
  --input: #262633;
  --ring: #7C6BFF;

  --primary-hover: #9080FF;
  --primary-subtle: rgba(124, 107, 255, 0.14);
  --income: #34D399;
  --income-strong: #34D399;
  --income-subtle: rgba(52, 211, 153, 0.14);
  --expense: #F87171;
  --expense-strong: #F87171;
  --expense-subtle: rgba(248, 113, 113, 0.14);
  --pending: #FBBF24;
  --pending-strong: #FBBF24;
  --pending-subtle: rgba(251, 191, 36, 0.14);
  --info: #60A5FA;
  --info-strong: #60A5FA;
  --info-subtle: rgba(96, 165, 250, 0.14);

  --chart-1: #9080FF;
  --chart-2: #34D399;
  --chart-3: #FBBF24;
  --chart-4: #60A5FA;
  --chart-5: #F472B6;
  --chart-6: #2DD4BF;
  --chart-7: #818CF8;
  --chart-8: #FCA5A5;

  --sidebar: #15151F;
  --sidebar-foreground: #F4F4F8;
  --sidebar-primary: #7C6BFF;
  --sidebar-primary-foreground: #0B0B12;
  --sidebar-accent: rgba(124, 107, 255, 0.14);
  --sidebar-accent-foreground: #F4F4F8;
  --sidebar-border: #262633;
  --sidebar-ring: #7C6BFF;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-variant-numeric: lining-nums;
  }
  *:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--primary-subtle);
    border-color: var(--primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "Remapea tokens shadcn al Design System (violeta + semanticos)"
```

### Task 1.2: Cambiar la fuente a Plus Jakarta Sans

**Files:**
- Modify: `app/layout.tsx:1-16,29-32`

- [ ] **Step 1: Reemplazar la importación y wiring de fuente**

Reemplazar las líneas de `Geist`/`Geist_Mono` y el `className` del body:

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

Y el `<body>`:

```tsx
      <body
        className={`${jakarta.variable} font-sans antialiased bg-background text-foreground`}
      >
```

- [ ] **Step 2: Verificar build y fuente en navegador**

Run: `npm run build` (debe pasar). Luego `npm run dev` y confirmar en `http://localhost:3000` que el texto usa Plus Jakarta Sans.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "Cambia la fuente a Plus Jakarta Sans"
```

### Task 1.3: Util de formateo `lib/format.ts`

**Files:**
- Create: `lib/format.ts`

- [ ] **Step 1: Crear el módulo**

```ts
export function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatUSD(value: number): string {
  return `US$ ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`
}

export function formatMoney(value: number, currency: "ARS" | "USD"): string {
  return currency === "USD" ? formatUSD(value) : formatARS(value)
}

export function formatCuota(actual: number | null, total: number | null): string | null {
  if (!actual || !total) return null
  return `Cuota ${actual} de ${total}`
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/format.ts
git commit -m "Agrega utilidades de formateo de montos y cuotas"
```

### Task 1.4: Primitivo `Amount`

**Files:**
- Create: `components/ui/amount.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"

type AmountKind = "income" | "expense" | "neutral"

export function Amount({
  value,
  kind = "neutral",
  currency = "ARS",
  showIcon = true,
  showSign = true,
  className,
}: {
  value: number
  kind?: AmountKind
  currency?: "ARS" | "USD"
  showIcon?: boolean
  showSign?: boolean
  className?: string
}) {
  const formatted = formatMoney(Math.abs(value), currency)
  const sign = kind === "income" ? "+" : kind === "expense" ? "−" : ""
  const color =
    kind === "income" ? "text-income" : kind === "expense" ? "text-expense" : "text-foreground"
  const Icon = kind === "income" ? ArrowUpRight : kind === "expense" ? ArrowDownRight : null

  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", color, className)}>
      {showIcon && Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {showSign && sign}
      {formatted}
    </span>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/amount.tsx
git commit -m "Agrega primitivo Amount (monto con icono, signo y color semantico)"
```

### Task 1.5: Primitivo `Badge`

**Files:**
- Create: `components/ui/badge.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        income: "bg-income-subtle text-income",
        expense: "bg-expense-subtle text-expense",
        pending: "bg-pending-subtle text-pending",
        info: "bg-info-subtle text-info",
        brand: "bg-primary-subtle text-primary",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "Agrega primitivo Badge con variantes semanticas"
```

### Task 1.6: Primitivo `KpiCard`

**Files:**
- Create: `components/ui/kpi-card.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "brand" | "income" | "expense" | "info" | "pending"

const toneClasses: Record<Tone, string> = {
  brand: "bg-primary-subtle text-primary",
  income: "bg-income-subtle text-income",
  expense: "bg-expense-subtle text-expense",
  info: "bg-info-subtle text-info",
  pending: "bg-pending-subtle text-pending",
}

export function KpiCard({
  title,
  icon: Icon,
  tone = "brand",
  hint,
  children,
}: {
  title: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums text-foreground">{children}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/kpi-card.tsx
git commit -m "Agrega primitivo KpiCard"
```

### Task 1.7: Primitivo `EmptyState`

**Files:**
- Create: `components/ui/empty-state.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/empty-state.tsx
git commit -m "Agrega primitivo EmptyState"
```

### Task 1.8: Primitivo `TransactionRow`

**Files:**
- Create: `components/ui/transaction-row.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import { Amount } from "@/components/ui/amount"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCuota } from "@/lib/format"

export function TransactionRow({
  description,
  category,
  date,
  amount,
  kind,
  currency = "ARS",
  cuotaActual = null,
  cuotaTotal = null,
  actions,
  className,
}: {
  description: string
  category: string | null
  date: string
  amount: number
  kind: "income" | "expense"
  currency?: "ARS" | "USD"
  cuotaActual?: number | null
  cuotaTotal?: number | null
  actions?: React.ReactNode
  className?: string
}) {
  const cuota = formatCuota(cuotaActual, cuotaTotal)
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{description}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {category && <span className="truncate">{category}</span>}
          <span>{date}</span>
          {cuota && <Badge variant="pending">{cuota}</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Amount value={amount} kind={kind} currency={currency} className="text-sm font-semibold" />
        {actions}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/transaction-row.tsx
git commit -m "Agrega primitivo TransactionRow"
```

### Task 1.9: Revisión del guardian sobre las fundaciones

- [ ] **Step 1: Despachar `cl-design-guardian`**

Pedirle que revise: `app/globals.css`, `app/layout.tsx`, `components/ui/amount.tsx`, `badge.tsx`, `kpi-card.tsx`, `empty-state.tsx`, `transaction-row.tsx`, `lib/format.ts`.
Expected: sin hallazgos BLOQUEANTES. Corregir los que aparezcan y volver a revisar.

---

## FASE 2 — Pantallas existentes (paralelizable)

Cada tarea se despacha a un `cl-screen-migrator` (pueden correr en paralelo entre sí porque tocan archivos distintos). Tras cada una, revisión del `cl-design-guardian` y verificación en navegador.

### Task 2.1: Layout del dashboard (sidebar + nav)

**Files:**
- Modify: `app/dashboard/layout.tsx` (reescritura completa)

- [ ] **Step 1: Migrar el layout a tokens + voz + nav móvil**

Reescribir aplicando la tabla de migración. Puntos concretos:
- Brand mark: tile con el único gradiente permitido `bg-gradient-to-br from-[#7C6BFF] to-[#5B47E0]` con `shadow-brand`.
- Sidebar: `bg-sidebar border-sidebar-border`. Items: texto `text-muted-foreground`, hover `hover:bg-accent hover:text-foreground`. Item **activo** (usar `usePathname`): `bg-primary-subtle text-primary` con ícono `text-primary` (requiere `'use client'` solo en el componente de nav, no en todo el layout — extraer `DashboardNav` client component).
- Agregar item Tarjetas: `{ href: '/dashboard/tarjetas', label: 'Tarjetas', icon: CreditCard }`.
- Logout: `hover:bg-expense-subtle hover:text-expense`.
- Main: `bg-background`.
- Nav inferior móvil (`<lg`): barra fija con los 4 ítems, targets 44×44.

```tsx
// app/dashboard/layout.tsx (Server Component)
import { signOut } from '@/app/login/actions'
import { LogOut, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardNav, navItems } from './DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C6BFF] to-[#5B47E0] shadow-brand">
            <DollarSign className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">CuentaLimpia</span>
        </div>
        <DashboardNav />
        <div className="border-t border-sidebar-border p-3">
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-expense-subtle hover:text-expense">
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-background pb-16 lg:ml-64 lg:pb-0">{children}</main>
      <DashboardNav variant="bottom" />
    </div>
  )
}
```

```tsx
// app/dashboard/DashboardNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CreditCard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/ingresos-egresos', label: 'Ingresos & Egresos', icon: ArrowLeftRight },
  { href: '/dashboard/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

export function DashboardNav({ variant = 'sidebar' }: { variant?: 'sidebar' | 'bottom' }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href))

  if (variant === 'bottom') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-card lg:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} aria-label={item.label}
            className={cn('flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs',
              isActive(item.href) ? 'text-primary' : 'text-muted-foreground')}>
            <item.icon className="h-5 w-5" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}
          className={cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
            isActive(item.href) ? 'bg-primary-subtle text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
          <item.icon className={cn('h-5 w-5', isActive(item.href) ? 'text-primary' : '')} aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Build + navegador**

Run: `npm run build`; luego `npm run dev` y verificar sidebar violeta, item activo, nav inferior en móvil, dark mode.

- [ ] **Step 3: Guardian + commit**

Despachar `cl-design-guardian` sobre `app/dashboard/layout.tsx` y `app/dashboard/DashboardNav.tsx`. Corregir hallazgos. Luego:

```bash
git add app/dashboard/layout.tsx app/dashboard/DashboardNav.tsx
git commit -m "Migra layout del dashboard al Design System (sidebar violeta + nav movil)"
```

### Task 2.2: Dashboard (KPIs, ticker, charts)

**Files:**
- Modify: `components/dashboard/DashboardClient.tsx`, `components/dashboard/CategoryChart.tsx`, `components/dashboard/MonthlyChart.tsx`

- [ ] **Step 1: Migrar `DashboardClient.tsx`**

Aplicar tabla de migración + reemplazos concretos:
- Las 4 tarjetas KPI → usar `KpiCard`: Ingresos (`tone="income"`, ícono `ArrowUpRight`), Gastos (`tone="expense"`, `TrendingDown`), Balance (`tone="info"`, `DollarSign`; valor con `Amount kind` según signo), Transacciones (`tone="brand"`, `CreditCard`). Usar `formatMoney` de `lib/format`.
- Quitar las funciones locales `formatARS`/`formatUSD`; importar de `@/lib/format`.
- Header: `text-foreground` / `text-muted-foreground`.
- Toggle USD MEP y ticker dólar: estados activos en `income`/`info` (no emerald hardcodeado); contenedores `bg-card border-border`. La variación usa `Amount`/`Badge` con ícono+signo (income si sube, expense si baja).
- Cards de charts → componente `Card` (heredan `bg-card`).

- [ ] **Step 2: Migrar charts a la paleta del DS**

En `CategoryChart.tsx` y `MonthlyChart.tsx`:
- Series: pie usa `var(--chart-1..8)` en orden. Barras Ingresos vs Gastos: ingreso `var(--chart-2)` (emerald), gasto `var(--chart-8)` (coral) — nunca intercambiar.
- Grid `strokeDasharray="3 3"`, sin verticales, stroke `var(--border)`.
- Tooltip: fondo `var(--popover)` oscuro, radio 10px, sombra md, padding 12px, mostrando string de moneda formateado + categoría.
- Barras `radius={[6,6,0,0]}` `maxBarSize={40}`; pie `paddingAngle={4}` sin stroke.
- Leer los colores vía `getComputedStyle` o como constantes que referencien las CSS vars (recharts necesita valores; usar `"var(--chart-2)"` funciona en `fill`/`stroke`).

- [ ] **Step 3: Build + navegador**

Run: `npm run build`; `npm run dev` → verificar `/dashboard`: KPIs con color semántico, charts con paleta DS, dark mode.

- [ ] **Step 4: Guardian + commit**

Guardian sobre los 3 archivos; corregir. Luego:

```bash
git add components/dashboard/
git commit -m "Migra dashboard y charts al Design System"
```

### Task 2.3: Ingresos & Egresos

**Files:**
- Modify: `app/dashboard/ingresos-egresos/IngresosEgresosClient.tsx` (y `actions.ts`/`page.tsx` solo si hay strings de UI)

- [ ] **Step 1: Migrar la pantalla**

- Tabla/lista de operaciones → usar `TransactionRow` (o tabla shadcn con `Amount` en la celda de monto). Ingreso/gasto SIEMPRE con `Amount`.
- Diálogo agregar/editar: inputs/labels shadcn (heredan tokens). Errores a `toast`. Mantener UI optimista existente.
- Voz: botón "Nueva operación"; "Exportar CSV"; confirmación de borrado "¿Eliminar este gasto? No se puede deshacer."; empty state con `EmptyState` (ícono `Inbox`, "Sin operaciones todavía", copy del DS, CTA "Nueva operación").
- Reemplazar todo `slate-*`/`emerald-*`/`red-*` por tokens.

- [ ] **Step 2: Build + navegador**

Run: `npm run build`; `npm run dev` → verificar lista, alta/edición, borrado, empty state, dark mode.

- [ ] **Step 3: Guardian + commit**

Guardian; corregir. Luego:

```bash
git add app/dashboard/ingresos-egresos/
git commit -m "Migra Ingresos & Egresos al Design System"
```

### Task 2.4: Configuración

**Files:**
- Modify: `app/dashboard/configuracion/SettingsClient.tsx`

- [ ] **Step 1: Migrar la pantalla**

Aplicar tabla de migración + voz. Categorías/perfil/preferencias con `Card`, `Input`, `Button`, `Badge`. Empty states con `EmptyState` ("Sin categorías"). Errores a `toast`. Mantener UI optimista.

- [ ] **Step 2: Build + navegador**

Run: `npm run build`; `npm run dev` → verificar `/dashboard/configuracion`, dark mode.

- [ ] **Step 3: Guardian + commit**

Guardian; corregir. Luego:

```bash
git add app/dashboard/configuracion/
git commit -m "Migra Configuracion al Design System"
```

### Task 2.5: Pantallas de Auth

**Files:**
- Modify: `app/login/page.tsx`, `app/register/page.tsx`, `app/olvide-password/page.tsx`, `app/reset-password/page.tsx`

- [ ] **Step 1: Migrar las 4 pantallas**

- Fondo con glow ambiente violeta del DS: dos blobs `radius≈320px blur≈120px opacity≈0.10` (top-right y bottom-left) — único uso de glow. Implementar con divs `bg-primary/10 blur-[120px]`.
- Brand mark con el gradiente permitido + `shadow-brand`.
- Botón primario violeta (`Button` default). Inputs/labels shadcn. Links `text-primary`.
- Voz: subtítulo login "Ingresá a tu cuenta para gestionar tus finanzas"; "¿Ya tenés cuenta?"; "Crear Cuenta"/"Iniciar Sesión"; línea de pie "Tu información financiera, siempre segura." Errores a `toast`.
- Reemplazar `slate-*`/`emerald-*` por tokens.

- [ ] **Step 2: Build + navegador**

Run: `npm run build`; `npm run dev` → verificar las 4 rutas, glow, dark mode, focus por teclado.

- [ ] **Step 3: Guardian + commit**

Guardian sobre las 4; corregir. Luego:

```bash
git add app/login/ app/register/ app/olvide-password/ app/reset-password/
git commit -m "Migra pantallas de Auth al Design System"
```

---

## FASE 3 — Feature Tarjetas/cuotas (`cl-feature-builder`)

### Task 3.1: Esquema de cuotas (confirmar antes de aplicar)

**Files:**
- (Migración Supabase — no archivo de repo salvo que se versione en `supabase/migrations/`)

- [ ] **Step 1: Presentar el SQL al usuario y esperar confirmación**

```sql
alter table public.transactions
  add column if not exists total_cuotas integer,
  add column if not exists cuota_actual integer;
```

- [ ] **Step 2: Aplicar la migración (tras OK del usuario)**

Aplicar vía Supabase MCP `apply_migration` (name: `add_cuotas_to_transactions`). Verificar con `list_tables` que las columnas existen.

### Task 3.2: Tipos

**Files:**
- Modify: `database.types.ts:6-37`

- [ ] **Step 1: Agregar campos de cuotas a `transactions`**

En `Row`, `Insert` y `Update` de `transactions`, agregar:

```ts
                    total_cuotas: number | null
                    cuota_actual: number | null
```
(en `Insert`/`Update` como `total_cuotas?: number | null` y `cuota_actual?: number | null`).

- [ ] **Step 2: Build + commit**

Run: `npm run build` (debe pasar).
```bash
git add database.types.ts
git commit -m "Agrega campos de cuotas a los tipos de transactions"
```

### Task 3.3: Server actions de Tarjetas

**Files:**
- Create: `app/dashboard/tarjetas/actions.ts`

- [ ] **Step 1: Crear actions CRUD de tarjetas**

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createCard(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const name = String(formData.get('name') ?? '').trim()
  const card_type = String(formData.get('card_type') ?? '')
  const color = (formData.get('color') as string) || null
  if (!name || !card_type) return { error: 'Completá nombre y tipo' }
  const { error } = await supabase.from('cards').insert({ name, card_type, color, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/tarjetas')
  return { error: null }
}

export async function deleteCard(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/tarjetas')
  return { error: null }
}
```

- [ ] **Step 2: Build + commit**

Run: `npm run build`.
```bash
git add app/dashboard/tarjetas/actions.ts
git commit -m "Agrega server actions de tarjetas"
```

### Task 3.4: Página Tarjetas (server) + cliente

**Files:**
- Create: `app/dashboard/tarjetas/page.tsx`, `app/dashboard/tarjetas/TarjetasClient.tsx`

- [ ] **Step 1: Página servidor que trae tarjetas y cuotas activas**

```tsx
// app/dashboard/tarjetas/page.tsx
import { createClient } from '@/utils/supabase/server'
import TarjetasClient from './TarjetasClient'

export default async function TarjetasPage() {
  const supabase = await createClient()
  const { data: cards } = await supabase.from('cards').select('*').order('name')
  const { data: cuotas } = await supabase
    .from('transactions')
    .select('id, description, amount, transaction_date, card_id, cuota_actual, total_cuotas')
    .not('total_cuotas', 'is', null)
  return <TarjetasClient cards={cards ?? []} cuotas={cuotas ?? []} />
}
```

- [ ] **Step 2: Cliente con lista de tarjetas + cuotas activas**

```tsx
// app/dashboard/tarjetas/TarjetasClient.tsx
'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCuota } from '@/lib/format'
import { deleteCard } from './actions'

type CardRow = { id: string; name: string; card_type: string; color: string | null }
type Cuota = {
  id: string; description: string | null; amount: number; transaction_date: string
  card_id: string | null; cuota_actual: number | null; total_cuotas: number | null
}

export default function TarjetasClient({ cards, cuotas }: { cards: CardRow[]; cuotas: Cuota[] }) {
  const [items, setItems] = useState(cards)

  async function onDelete(id: string) {
    if (!confirm('¿Eliminar esta tarjeta? No se puede deshacer.')) return
    const prev = items
    setItems((c) => c.filter((x) => x.id !== id)) // optimista
    const res = await deleteCard(id)
    if (res.error) {
      setItems(prev)
      toast.error('⚠ No pudimos eliminar la tarjeta. Probá de nuevo.')
    } else {
      toast.success('✅ Tarjeta eliminada')
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Tarjetas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tus tarjetas y cuotas activas</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" aria-hidden="true" /> Agregar tarjeta</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Todavía no agregaste ninguna tarjeta"
          description="Sumá tus tarjetas de crédito y débito para hacer seguimiento de cuotas y gastos por tarjeta."
          action={<Button className="gap-2"><Plus className="h-4 w-4" aria-hidden="true" /> Agregar tarjeta</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const cuotasDeTarjeta = cuotas.filter((q) => q.card_id === c.id)
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                    {c.name}
                  </CardTitle>
                  <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${c.name}`} onClick={() => onDelete(c.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="neutral">{c.card_type}</Badge>
                  {cuotasDeTarjeta.length > 0 && (
                    <ul className="space-y-2">
                      {cuotasDeTarjeta.map((q) => (
                        <li key={q.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">{q.description ?? 'Gasto'}</p>
                            <Badge variant="pending">{formatCuota(q.cuota_actual, q.total_cuotas)}</Badge>
                          </div>
                          <Amount value={q.amount} kind="expense" className="text-sm font-semibold" />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Build + navegador**

Run: `npm run build`; `npm run dev` → `/dashboard/tarjetas`: lista de tarjetas, cuotas como "Cuota 3 de 12", empty state, borrado optimista, dark mode.

- [ ] **Step 4: Guardian + commit**

Guardian sobre `page.tsx` y `TarjetasClient.tsx`; corregir. Luego:

```bash
git add app/dashboard/tarjetas/
git commit -m "Agrega pantalla Tarjetas con cuotas activas"
```

---

## FASE 4 — Barrido final

### Task 4.1: Revisión global del guardian

- [ ] **Step 1: Despachar `cl-design-guardian` sobre toda la app**

Alcance: `app/**`, `components/**`. Buscar específicamente clases legacy con grep: `slate-`, `emerald-`, `bg-white`, `text-white` (salvo dentro del brand mark), hex crudo en JSX.
Expected: sin hallazgos BLOQUEANTES/IMPORTANTES. Corregir lo que aparezca.

### Task 4.2: Verificación final

- [ ] **Step 1: Build + lint limpios**

Run: `npm run build && npm run lint`
Expected: ambos sin errores.

- [ ] **Step 2: Verificación manual en navegador**

`npm run dev` y recorrer golden path de cada pantalla en light y dark: login → dashboard → ingresos/egresos (alta/edición/borrado) → tarjetas → configuración. Verificar: sin flash de light al cargar, focus visible por teclado, nav inferior en móvil, montos con ícono+signo+color, ningún resto emerald de marca.

- [ ] **Step 3: Commit final (si hubo correcciones del barrido)**

```bash
git add -A
git commit -m "Barrido final de cumplimiento del Design System"
```

---

## Self-review (cobertura del spec)

- Estrategia de tokens A → Task 1.1. ✓
- Fuente Plus Jakarta Sans → Task 1.2. ✓
- Colores semánticos nuevos (income/expense/pending/info) → Task 1.1 `@theme`. ✓
- Equipo de 3 agentes reutilizables → Tasks 0.2–0.4. ✓
- DS versionado como referencia → Task 0.1. ✓
- Primitivos del DS → Tasks 1.4–1.8. ✓
- Restyle + voz de todas las pantallas existentes → Tasks 2.1–2.5. ✓
- Charts según reglas del DS → Task 2.2. ✓
- Modelo de cuotas (etiqueta simple) → Tasks 3.1–3.2. ✓
- Pantalla Tarjetas → Tasks 3.3–3.4. ✓
- Migraciones confirmadas por el usuario → Task 3.1. ✓
- Verificación (build/lint/guardian/navegador) → Fase 4. ✓
