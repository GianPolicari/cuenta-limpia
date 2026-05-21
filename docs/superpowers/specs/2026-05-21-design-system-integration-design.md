# CuentaLimpia — Integración del Design System

**Fecha:** 2026-05-21
**Estado:** Aprobado para planificación

## Objetivo

Reestructurar CuentaLimpia (visual y lógicamente) para incorporar el Design System
oficial de la marca, usando un equipo reutilizable de agentes especializados que
garanticen una incorporación correcta y consistente.

El DS vive en `CuentaLimpia Design System.zip` (extraído en
`%TEMP%\cl-ds`): tokens (`colors_and_type.css`, `tokens.json`), documentación
(`README.md`, `SKILL.md`), UI kit en JSX (`ui_kits/cuentalimpia/`), previews y
screenshots. Es la fuente de verdad del diseño.

### Cambio de marca (resumen)

- Primary pasa de **emerald-green** (legacy) a **violeta profundo** (`#5B47E0` light /
  `#7C6BFF` dark).
- Verde queda reservado a **ingresos**; rojo/coral a **gastos**; ámbar a **cuotas/pendientes**.
- Tipografía pasa de **Geist** a **Plus Jakarta Sans**.
- Voz: español rioplatense (**voseo**), glosario del DS ("Gasto" no "egreso" en UI).

## Decisiones tomadas

1. **Estrategia de tokens (Opción A):** mapear los tokens del DS sobre los nombres de
   shadcn y exponer los semánticos de finanzas como colores nuevos de Tailwind v4.
   Los componentes shadcn conservan su estructura (respeta `.antigravityrules`).
2. **Equipo de 3 agentes reutilizables** en `.claude/agents/`: guardian (QA), screen-migrator
   (restyle/refactor de pantallas existentes), feature-builder (features con datos).
3. **Un solo spec, ejecutado en fases.** Paralelización dentro de cada fase vía el equipo.
4. **Cuotas = etiqueta simple** en la operación (campos `total_cuotas`, `cuota_actual`),
   sin generación automática de pagos.

## Estrategia de tokens (detalle)

`app/globals.css` se reescribe para que los tokens shadcn resuelvan a valores del DS, en
light y dark. Se mantiene la estructura `@theme inline` de Tailwind v4 + `@custom-variant dark`.

### Mapeo shadcn → DS

| Token shadcn | Valor DS (light → dark) |
|---|---|
| `--background` | `--color-bg` `#F8F8FB` → `#0B0B12` |
| `--foreground` | `--color-fg-1` `#0B0B12` → `#F4F4F8` |
| `--card` / `--popover` | `--color-surface` `#FFFFFF` → `#15151F` (popover usa `surface-elevated`) |
| `--card-foreground` / `--popover-foreground` | `--color-fg-1` |
| `--primary` | `--color-primary` `#5B47E0` → `#7C6BFF` |
| `--primary-foreground` | `--color-primary-contrast` `#FFFFFF` → `#0B0B12` |
| `--secondary` / `--muted` | `--color-surface-2` `#F1F1F6` → `#1C1C28` |
| `--secondary-foreground` | `--color-fg-1` |
| `--muted-foreground` | `--color-fg-2` `#4A4A55` → `#A1A1AD` |
| `--accent` | `--color-primary-subtle` (hover/selección) |
| `--accent-foreground` | `--color-fg-1` |
| `--destructive` | `--color-expense` `#DC2626` → `#F87171` |
| `--border` / `--input` | `--color-border` `#E6E6EC` → `#262633` |
| `--ring` | `--color-primary` |
| `--chart-1..5` (+6..8) | serie del DS: violeta, emerald, amber, blue, pink, teal, indigo, coral |
| `--sidebar*` | surface / fg-1 / primary según rol |

### Colores nuevos en `@theme` (Tailwind utilities)

Exponer como utilities (`bg-income`, `text-expense`, `bg-pending-subtle`, etc.):
`income`, `income-strong`, `income-subtle`, `expense`, `expense-strong`, `expense-subtle`,
`pending`, `pending-strong`, `pending-subtle`, `info`, `info-strong`, `info-subtle`,
`primary-hover`, `primary-subtle`.

### Radios, sombras, tipografía

- **Radios:** fijar la escala del DS explícitamente (sm 6 / md 10 / lg 14 / xl 20 / full)
  en lugar del cálculo derivado de shadcn. Cards/diálogos en 14–20.
- **Sombras:** agregar `--shadow-xs..lg` + `--shadow-brand` al `@theme` (dark con menor
  opacidad + tinte violeta). `--shadow-brand` solo en la CTA primaria.
- **Tipografía:** `app/layout.tsx` cambia `next/font/google` de `Geist`/`Geist_Mono` a
  `Plus_Jakarta_Sans` (pesos 400/500/600/700), seteando `--font-sans`. `tabular-nums`
  en todo valor monetario.
- **Focus:** tratamiento único — anillo externo 3px `primary-subtle` + borde 1px primary,
  solo en `:focus-visible`.

## Equipo de agentes (`.claude/agents/`)

Cada archivo es una definición reutilizable con su rol, alcance y reglas del DS embebidas.

### 1. `cl-design-guardian` (revisor / QA, read-only)

Tools: solo lectura (Read, Grep, Glob). Revisa cualquier cambio de UI y reporta
violaciones contra reglas concretas:
- Violeta solo en acción primaria + nav activo + brand mark.
- Ingreso (verde) y gasto (rojo) **siempre** con ícono (↗/↘) + signo (+/−) + label.
- Ámbar solo para cuotas/pendientes.
- Tokens semánticos; cero hex crudo o clases legacy `slate-*`/`emerald-*`.
- Voseo + glosario del DS (CONTENT FUNDAMENTALS del README).
- A11y WCAG 2.2 AA: focus único, targets 44×44, color nunca señal única, contraste.
- Plus Jakarta Sans; escala de radios/sombras/espaciado correcta.
Devuelve lista de hallazgos accionables; no edita.

### 2. `cl-screen-migrator` (implementador, paralelizable)

Migra una pantalla/componente existente de clases hardcodeadas a tokens semánticos +
aplica voz y refactor (extraer primitivos, separar lógica/presentación). Cumple
`.antigravityrules`: Server Components por defecto, `'use client'` empujado abajo,
`cn()`, sin inline styles, tipado estricto, UI optimista, errores con toast. Se despacha
uno por pantalla en paralelo.

### 3. `cl-feature-builder` (implementador de features con datos)

Construye features nuevas end-to-end con el DS: migración de esquema Supabase +
`database.types.ts`, server actions con manejo de errores graceful, UI optimista,
pantallas con primitivos + tokens + voseo. Migraciones de esquema se presentan al
usuario para confirmación antes de aplicarse al proyecto real.

## Arquitectura de componentes

### Primitivos (Fase 1)

Actualizar shadcn existentes a tokens: `button`, `card`, `input`, `label`, `select`,
`dialog`, `tabs`, `table`, `sonner`. Crear los nuevos del DS (basados en
`ui_kits/cuentalimpia/Primitives.jsx` y `Widgets.jsx`):
- **Badge/Chip** (variantes income/expense/pending/info/neutral).
- **KPI Card** (label + valor `tabular-nums` + ícono + delta opcional).
- **Amount** (formatea ARS/USD con signo + color + ícono según signo).
- **TransactionRow** (fila de operación: categoría, fecha, monto con semántica).
- **EmptyState** (ícono Lucide + título + copy + CTA, voz del DS).

### Pantallas (Fase 2, en paralelo)

- `app/dashboard/page.tsx` + `components/dashboard/*` (KPIs, ticker dólar, charts).
- `app/dashboard/ingresos-egresos/*`.
- `app/dashboard/configuracion/*`.
- `app/login`, `app/register`, `app/olvide-password`, `app/reset-password`.
- `app/dashboard/layout.tsx` (sidebar violeta + bottom nav móvil).

Charts (recharts) siguen reglas del DS: serie emerald=ingreso / coral=gasto siempre,
grid dashed `3 3`, tooltip oscuro, barras `radius=[6,6,0,0] maxBarSize=40`, pie 4px paddingAngle.

## Modelo de datos — cuotas (Fase 3)

Agregar a `transactions`: `total_cuotas integer null`, `cuota_actual integer null`.
Actualizar `database.types.ts`. UI muestra "Cuota 3 de 12 — $8.400" cuando ambos
campos están presentes. Pantalla **Tarjetas** (`app/dashboard/tarjetas/`): lista de
tarjetas (tabla `cards` ya existe) + cuotas activas derivadas de transactions.

## Fases de ejecución

- **Fase 0:** crear las 3 definiciones de agentes.
- **Fase 1 (secuencial, bloqueante):** tokens en `globals.css` + fuente + primitivos.
- **Fase 2 (paralela):** restyle + voz de todas las pantallas existentes.
- **Fase 3:** feature Tarjetas/cuotas (esquema → tipos → actions → UI).
- **Fase 4:** barrido final del guardian + verificación manual en navegador.

## Verificación

- `cl-design-guardian` revisa cada pantalla/primitivo y la fase final completa.
- `npm run build` + `npm run lint` sin errores.
- Verificación manual en navegador: golden path por pantalla, dark mode sin flash,
  focus visible por teclado, reduced-motion.
- Migraciones Supabase confirmadas por el usuario antes de aplicar.

## Fuera de alcance (YAGNI)

- Generación automática de pagos por cuotas (se eligió etiqueta simple).
- Rediseño de marketing/landing fuera de la app.
- Nuevas features más allá de Tarjetas/cuotas.
- Self-hosting de la fuente (se usa Google Fonts vía `next/font`).
