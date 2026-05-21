# CuentaLimpia — Design System

A complete design system for **CuentaLimpia**, a responsive web app (mobile‑first, also desktop) for personal & family financial management. The product helps people register income and expenses, manage debit & credit cards (including installment tracking — *cuotas*), and visualize money with first‑class charts. The brand voice is **empowering, close, modern — never corporate, never cold, never spreadsheet**.

> **Audience:** designers and engineers building screens, marketing, and reports inside CuentaLimpia. Drop this folder into any project and you have the full brand kit: tokens, type, color, components, voice, accessibility rules, and a working UI kit.

---

## Index

| File / folder | What's in it |
|---|---|
| `README.md` (this file) | Overview, content fundamentals, visual foundations, iconography |
| `colors_and_type.css` | All design tokens as CSS variables — colors (light + dark), typography, spacing, radii, shadows |
| `tokens.json` | Same tokens in JSON, for cross‑platform / Style Dictionary use |
| `assets/` | Brand mark, logos, favicons, illustration placeholders |
| `fonts/` | Self‑hosted webfont (Plus Jakarta Sans via Google Fonts CDN — see note) |
| `preview/` | The cards you see in the Design System tab. Open any to inspect |
| `ui_kits/cuentalimpia/` | High‑fidelity UI kit: dashboard, transactions, cards, add‑expense, empty states. Open `index.html` to see it in action |
| `SKILL.md` | Cross‑compatible skill manifest — drop this folder into Claude Code as an Agent Skill |

---

## Product context

CuentaLimpia (codebase: `02- CuentaLimpia/`) is a Next.js + Supabase web app. The brand promise: *"control sin ansiedad"* — let me see what's mine, where it's going, and what's coming up — without the bank‑grade severity of most fintech tools.

### Surfaces we cover
- **Dashboard** — KPIs (income / expenses / balance), category pie, monthly bars, dólar ticker (Argentina‑specific MEP/Blue toggle).
- **Ingresos & Egresos** — table of operations with month/year filter, add/edit dialog, CSV export, expenses‑by‑card chart.
- **Tarjetas** — credit/debit cards with active installments (*cuotas*).
- **Configuración** — categories, profile, preferences.
- **Auth** — login, register, password reset.

### Sources referenced
- Codebase (read‑only, mounted): `02- CuentaLimpia/` — Next.js 16, React 19, Tailwind v4, shadcn/ui, lucide‑react, recharts, Supabase. Argentina‑specific (ARS / USD MEP toggle, *cuotas*).
- GitHub repo: **[GianPolicari/cuenta-limpia](https://github.com/GianPolicari/cuenta-limpia)** — same project on GitHub. The reader is encouraged to open this repo for the full source of truth on screens, server actions, and database schema.

> ⚠️ **Brand evolution.** The original codebase used an **emerald‑green** primary with slate neutrals. This design system shifts to a **deep violet** primary per the product brief, keeps electric green for *income*, and uses a softer coral for *expense*. The semantic intent is preserved (green = positive, red = negative), but green is now reserved for **earnings**, not for the brand itself. Treat any emerald accents in the codebase as legacy.

---

## CONTENT FUNDAMENTALS

### Language

**Spanish (Argentina, *voseo*).** Always. Use **vos** and Río de la Plata verb forms: *registrá, ingresá, guardá, agregá, mirá, tenés, podés, querés*. Never *registra, ingresa, tienes, puedes*.

> ✅ *Registrá un ingreso o egreso.*
> ❌ *Registra un ingreso o egreso.*
> ✅ *¿Ya tenés cuenta?*
> ❌ *¿Ya tienes cuenta?*

### Tone

**Empowering, close, jargon‑free.** We are the user's *aliado financiero*, not their accountant. Plain words win.

| Avoid (bank jargon) | Use (CuentaLimpia voice) |
|---|---|
| Total de egresos del período | Lo que gastaste este mes |
| Saldo deudor | Lo que llevás gastado |
| Movimiento débito | Gasto |
| Período de facturación | Mes actual |
| Cuota nominal | Cuota de \$X (3 de 12) |
| Pasivo financiero | Pagos pendientes |
| Categorización de erogaciones | Categorías de gastos |

### Casing

- **Headers / page titles:** Sentence case. *"Ingresos & Egresos"*, *"Nueva operación"*, *"Sin operaciones"*. Title Case is fine for the product name (*CuentaLimpia*) and for very short button labels (*Iniciar Sesión*, *Crear Cuenta*) — match the existing codebase.
- **Buttons:** Verb‑first, short. *Guardar*, *Cancelar*, *Nueva operación*, *Exportar CSV*. Sentence case unless brand label.
- **Form labels:** Single word when possible — *Descripción*, *Monto*, *Fecha*, *Categoría*, *Tarjeta*.
- **Empty states:** *"Sin operaciones"*, *"Sin tarjetas"*, *"Sin categorías"* — flat, no apology.

### Numbers, currency, dates

- Currency: `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })` → `$ 12.450`
- USD MEP toggle: `US$ 12,450.00` (en‑US locale, two decimals).
- Dates in lists: `26 may. 2026` (`day: '2-digit', month: 'short', year: 'numeric'`).
- Dates in headers: `Mayo 2026` (full month).
- Months and years come from explicit selects — **never** trust the device locale silently.
- Never show negative balance as red without also showing the minus sign **and** an Arrow‑Down icon (color is never the only signal — see Accessibility).

### Microcopy glossary

| Concept | Term to use | Notes |
|---|---|---|
| Income | **Ingreso** | Plural *ingresos*. "+\$X" with ↗ icon. |
| Expense | **Gasto** | Plural *gastos*. "-\$X" with ↘ icon. Never *egreso* in user‑facing UI; use *gasto*. (*Egreso* is allowed in admin/export contexts like "Ingresos & Egresos" page title.) |
| Balance | **Balance** | "Ingresos vs Gastos". |
| Installment | **Cuota** | Show as *"Cuota 3 de 12 — \$8.400"*. |
| Credit card | **Tarjeta de crédito** | |
| Debit card | **Tarjeta de débito** | |
| Period / month | **Mes** | Avoid *período*. *"Lo que gastaste este mes"*. |
| Budget | **Presupuesto** | |
| Category | **Categoría** | |
| Empty list | **Sin [X]** | *"Sin operaciones"*, *"Sin tarjetas"*. |
| Delete | **Eliminar** | Confirmation: *"¿Eliminar este gasto? No se puede deshacer."* |
| Save | **Guardar** | Toast: *"✅ Operación guardada"*. |

### Microcopy examples

**Empty state — no transactions**
> ## Sin operaciones todavía
> Registrá tu primer ingreso o gasto y empezá a ver a dónde va tu plata.
> [ + Nueva operación ]

**Empty state — no cards**
> ## Todavía no agregaste ninguna tarjeta
> Sumá tus tarjetas de crédito y débito para hacer seguimiento de cuotas y gastos por tarjeta.
> [ + Agregar tarjeta ]

**Destructive confirmation**
> ## ¿Eliminar este gasto?
> Esta acción no se puede deshacer.
> [ Cancelar ]   [ Eliminar ]

**Success toast**
> ✅ Operación guardada

**Error toast**
> ⚠ No pudimos guardar la operación. Probá de nuevo.

**Login subtitle**
> Ingresá a tu cuenta para gestionar tus finanzas

**Footer reassurance line**
> Tu información financiera, siempre segura.

### Emoji usage

**Sparingly, only in toasts and confirmation messages, and only the four "system" glyphs already in the codebase:** ✅ (success), ⚠ / ⚠️ (warning), 🗑️ (delete), 💸 (optional, monetary action). **Never** in headings, button labels, navigation, KPIs, or marketing copy. Never as decoration. Never as bullet replacements. When in doubt, use a Lucide icon instead.

---

## VISUAL FOUNDATIONS

### The vibe in one line

**"Modern Argentine fintech that doesn't feel like a bank."** Deep violet brand color with electric‑green and coral accents, on a high‑contrast slate canvas. Soft, generous rounding. Glassy cards (subtle backdrop blur over the page bg). Plenty of breathing room. No gradients except a single brand‑mark gradient and one subtle ambient blur behind auth screens.

### Colors

Full token list lives in `colors_and_type.css` and `tokens.json`. The semantic system:

| Token (CSS var) | Role | Light | Dark |
|---|---|---|---|
| `--color-primary` | Brand, primary actions, active nav | `#5B47E0` (violet 600) | `#7C6BFF` (violet 400) |
| `--color-primary-hover` | Hover on primary | `#4F3DCC` | `#9080FF` |
| `--color-primary-subtle` | Tinted bg (chips, badges, focus rings) | `#EEEBFF` | `rgba(124,107,255,.14)` |
| `--color-income` | Income, positive delta | `#10B981` (emerald 500) | `#34D399` (emerald 400) |
| `--color-income-subtle` | Tinted bg for ingreso badges | `#D1FAE5` | `rgba(52,211,153,.14)` |
| `--color-expense` | Expense, negative delta | `#EF4444` (red 500) | `#F87171` (red 400) |
| `--color-expense-subtle` | Tinted bg for gasto badges | `#FEE2E2` | `rgba(248,113,113,.14)` |
| `--color-pending` | Installments, scheduled, neutral attention | `#F59E0B` (amber 500) | `#FBBF24` (amber 400) |
| `--color-info` | Info, charts secondary | `#3B82F6` (blue 500) | `#60A5FA` (blue 400) |
| `--color-bg` | Page background | `#F8F8FB` | `#0B0B12` |
| `--color-surface` | Card / sheet | `#FFFFFF` | `#15151F` |
| `--color-surface-2` | Inner well (input bg) | `#F1F1F6` | `#1C1C28` |
| `--color-fg-1` | Primary text | `#0B0B12` | `#F4F4F8` |
| `--color-fg-2` | Secondary text | `#4A4A55` | `#A1A1AD` |
| `--color-fg-3` | Tertiary / placeholder | `#8A8A95` | `#6B6B78` |
| `--color-border` | Hairline border | `#E6E6EC` | `#262633` |
| `--color-border-strong` | Strong border / dividers | `#D1D1DA` | `#33333F` |

Gray scale: 6 steps in light + 6 in dark (`--gray-50` → `--gray-900`). See `colors_and_type.css`.

**Color usage rules**
- Brand violet only on the primary action of any view, plus active nav, plus the brand mark. Never as a row tint, never as a chart series fill unless it *is* the brand category.
- Income green and expense red are **always** paired with an icon (↗/↘) and a text label (+/-, *Ingreso* / *Gasto*). Never color alone.
- The pending‑amber is for *cuotas activas* and scheduled items only.
- All decisions in dark mode use the *400‑tone* of the family for adequate contrast on dark surfaces; light mode uses the *500/600 tone*.

### Typography

**Plus Jakarta Sans** — a modern geometric humanist sans with friendly terminals, optimized for screens. Chosen over Inter/DM Sans because its slightly rounder forms (a, g, t) reinforce the *empowering, close* voice without going playful. It pairs cleanly with numerals (tabular‑lining works perfectly for amounts).

> 🔁 **Substitution flag:** The original codebase uses **Geist Sans** (via `next/font/google`). We deliberately substituted to Plus Jakarta Sans for the design system. If you want to keep Geist, swap `--font-sans` in `colors_and_type.css` to `'Geist', ui-sans-serif, system-ui, …` and everything else still works.

**Type scale** (mobile values; desktop scales up via the same vars):

| Token | Size / Line‑height | Weight | Letter‑spacing | Use |
|---|---|---|---|---|
| `--type-display` | 40 / 44 px | 700 | -0.02em | Hero numbers (account balance) |
| `--type-h1` | 28 / 34 px | 700 | -0.01em | Page titles ("Dashboard") |
| `--type-h2` | 22 / 28 px | 600 | -0.01em | Section heads ("Ingresos vs Gastos") |
| `--type-h3` | 18 / 24 px | 600 | 0 | Card titles |
| `--type-body` | 16 / 24 px | 400 | 0 | Default body copy |
| `--type-body-strong` | 16 / 24 px | 600 | 0 | KPI values, emphasized rows |
| `--type-label` | 14 / 20 px | 500 | 0 | Form labels, badges, table headers |
| `--type-caption` | 12 / 16 px | 500 | 0.01em | Helper text, timestamps |
| `--type-mono` | 14 / 20 px | 500 | 0 | Amounts in tables (tabular‑nums) |

Weights used: 400, 500, 600, 700.
Base font size: **16px**. Body line‑height: **1.5**.
Mobile touch targets: **min 44×44px** on any tappable.
Numbers: `font-variant-numeric: tabular-nums lining-nums;` on everything that shows money or a count.

### Spacing & layout

Base unit **4 px**. Scale:

| Token | px |
|---|---|
| `--space-xs` | 4 |
| `--space-sm` | 8 |
| `--space-md` | 12 |
| `--space-lg` | 16 |
| `--space-xl` | 24 |
| `--space-2xl` | 32 |
| `--space-3xl` | 48 |
| `--space-4xl` | 64 |
| `--space-5xl` | 96 |

**Breakpoints**

| Token | Min‑width | Columns | Gutter | Page margin |
|---|---|---|---|---|
| `--bp-mobile` | 375px | 4 | 16 | 16 |
| `--bp-tablet` | 768px | 8 | 24 | 24 |
| `--bp-desktop` | 1280px | 12 | 24 | 32 |

Mobile is always the design starting point. The desktop dashboard is mobile‑shaped patterns *side‑by‑side*, not a different layout language.

### Backgrounds, surfaces, depth

- Page background is a **flat tinted off‑white** (light) or **near‑black** (dark) — no gradients, no patterns.
- Cards sit on the page with a faint **backdrop blur** and **80% opaque surface** in dark mode (matches the codebase's `bg-slate-900/60 backdrop-blur-sm` motif). In light mode, cards are 100% opaque white with a 1px border + soft shadow.
- The brand mark uses a **violet→violet** gradient (`#7C6BFF → #5B47E0`). This is the **only** allowed gradient in the system.
- Auth screens (login/register) get a single ambient violet glow `radius=320px, blur=120px, opacity=0.10` in the top‑right and a secondary at bottom‑left — also lifted directly from the codebase pattern. Nothing else uses ambient glows.

### Corner radii

| Token | px | Use |
|---|---|---|
| `--radius-sm` | 6 | Small chips, dense controls |
| `--radius-md` | 10 | Inputs, buttons, badges |
| `--radius-lg` | 14 | Cards, dialogs |
| `--radius-xl` | 20 | Hero / KPI / featured cards |
| `--radius-full` | 9999 | Pills, avatars, toggle thumbs |

Slightly **softer than shadcn defaults** to reinforce the friendly voice. Cards lean on 14–20px.

### Shadows / elevation

Two distinct elevation tracks (light mode shown; dark mode uses lower opacities + faint violet tint).

| Token | Definition | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px 0 rgba(11,11,18,0.04)` | Inputs, ghost borders |
| `--shadow-sm` | `0 1px 3px 0 rgba(11,11,18,0.06), 0 1px 2px -1px rgba(11,11,18,0.04)` | Cards at rest |
| `--shadow-md` | `0 4px 12px -2px rgba(11,11,18,0.08), 0 2px 6px -2px rgba(11,11,18,0.04)` | Hovered cards, popovers |
| `--shadow-lg` | `0 12px 32px -6px rgba(11,11,18,0.12)` | Dialogs, sheets |
| `--shadow-brand` | `0 8px 24px -6px rgba(91,71,224,0.30)` | The primary CTA only — earns its weight |

**Inner shadows** are not used. We use the `--surface-2` background tone instead, for input wells.

### Borders

Single hairline `1px solid var(--color-border)`. On hover and focus we change **color**, not width — the layout never jumps. Focus is **always** a 3px outer ring at `var(--color-primary-subtle)` plus a 1px `var(--color-primary)` border. This is the **only** focus treatment in the system.

### States (every interactive element)

| State | Treatment |
|---|---|
| **Default** | Token color |
| **Hover** | -8% lightness on solid fills (use `--color-primary-hover`); -4% on subtle fills; +2% lightness on tints |
| **Active / press** | -2px in transform isn't used; instead we drop one shadow step (sm → xs) and bump bg one step darker |
| **Focus** | 3px `var(--color-primary-subtle)` outer ring + 1px primary border. Visible on **keyboard focus only** (use `:focus-visible`) |
| **Disabled** | 50% opacity, `cursor: not-allowed`, no hover transitions |
| **Error** | Border becomes `--color-expense`, ring becomes `--color-expense-subtle`, helper text turns `--color-expense` |
| **Loading** | Show `<Loader2 />` spinning at 1s/360°. Disable button. Keep label visible. |

### Motion

- Default transition: `all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)` — a gentle ease‑out.
- Page chrome doesn't animate. Cards / popovers fade + 4px translate‑Y in over 200ms.
- Number tickers (KPI values changing) crossfade over 240ms — never odometer roll.
- Skeleton shimmer: 1.6s linear loop, low‑contrast.
- **No bounces, no springs, no parallax.** Calm is a feature.

### Transparency & blur

- `backdrop-filter: blur(12px)` on cards over the dark page bg (dark mode only). Light mode cards are solid.
- Toasts: 90% opaque on the page bg.
- Modal overlay: `rgba(11,11,18,0.5)` light / `rgba(0,0,0,0.6)` dark, no blur.

### Charts (first‑class citizens)

Per the brief, charts are not afterthoughts.

- **Series palette** (in order, never reuse within a single chart): violet `#7C6BFF`, emerald `#10B981`, amber `#F59E0B`, blue `#3B82F6`, pink `#EC4899`, teal `#14B8A6`, indigo `#6366F1`, coral `#F87171`. Income vs Expense bars: **always** emerald for income, coral for expense — never swap.
- Grid: dashed `3 3`, vertical lines off, stroke `var(--color-border)` at 30% opacity.
- Axis ticks: `--type-caption`, `--color-fg-2`, no axis lines.
- Tooltip: dark `--color-surface` (even in light mode) for legibility, 10px radius, `--shadow-md`, 12px padding. Always show the formatted currency string and the category name.
- Pie/donut: 60→100px radii on desktop, 4px paddingAngle, no stroke.
- Bars: `radius={[6,6,0,0]}`, `maxBarSize={40}`.

---

## ICONOGRAPHY

**Lucide React** is the icon system, inherited from the codebase (`lucide-react@^0.576`). It's a clean, rounded‑stroke set that matches the friendly voice without going playful. We do **not** mix Lucide with other libraries.

- **Stroke width: 2px** always. Never mix with 1.5 or filled icons in the same hierarchy.
- **Sizes:** 16 (`h-4 w-4`), 20 (`h-5 w-5`), 24 (`h-6 w-6`), 32 (`h-8 w-8`).
- **Color:** never primary‑violet by default — icons inherit `currentColor` from the text they sit beside, except inside an active/selected state where they take the brand color.
- **Accessibility:** every functional icon has either visible text beside it or an `aria-label`. Icon‑only buttons must have an `aria-label`. Decorative icons must have `aria-hidden="true"`.

Common Lucide icons used in the system (with semantic role):

| Icon | Role |
|---|---|
| `ArrowUpRight` | Income, positive delta |
| `ArrowDownRight` | Expense, negative delta |
| `ArrowLeftRight` | Transactions, transfer |
| `LayoutDashboard` | Dashboard nav |
| `CreditCard` | Cards |
| `Settings` | Settings nav |
| `Plus` | Add new |
| `Pencil` | Edit |
| `Trash2` | Delete (always with confirm) |
| `Loader2` | Loading spinner |
| `Inbox` | Empty state |
| `DollarSign` | Brand mark sub‑element, USD ticker |
| `TrendingDown`, `TrendingUp` | KPI deltas |
| `LogOut` | Sign out |
| `Download` | Export |
| `Check`, `X` | Confirm / dismiss |

How to include: load Lucide from CDN in HTML mockups (`https://unpkg.com/lucide@latest`) and call `lucide.createIcons()`, or import `{ ArrowUpRight }` from `lucide-react` in React.

**SVG / PNG / icon font?** No icon font. No PNG icons. All icons are inline SVG from Lucide. The brand mark is a single hand‑authored SVG in `assets/logo.svg` (a stacked "CL" monogram inside a rounded‑square gradient tile).

**Unicode characters as icons?** No — except the `$` glyph inline with text (e.g. `$ 12.450`).

---

## ACCESSIBILITY

Targets **WCAG 2.2 AA**.

1. **Contrast.** All text/background pairs in `colors_and_type.css` are validated at ≥ 4.5:1 (normal text) and ≥ 3:1 (large text and non‑text UI). Brand violet on white is ~5.2:1; brand violet on `--color-bg` light is ~5.0:1. Emerald `#10B981` on white is borderline (3.0:1) — use it for **icons, large numbers, and bg tints**, *not* for body copy. Use `--color-income` (emerald 600 = `#059669`) when income text sits on a light card. The token system handles this for you.
2. **Color is never the only signal.** Income gets ↗ + `+` + label. Expense gets ↘ + `−` + label. Errors get an icon and helper text. Cuotas get a label "*3 de 12*".
3. **Focus is always visible.** Use the single focus treatment (3px subtle ring + 1px primary border) on every interactive element. Don't suppress focus.
4. **Keyboard navigation.** Tab order follows reading order. Dialogs trap focus, return to opener on close. `Esc` closes any sheet/dialog/popover. Tables: arrow keys move row focus when implemented; sort headers are buttons.
5. **Touch targets.** Min 44×44px on mobile. Buttons that *look* smaller (icon‑only 32×32) have an invisible 44×44 hit area via padding.
6. **Reduced motion.** Respect `prefers-reduced-motion: reduce` — disable shimmer, disable translate‑in entrances, keep fades.
7. **Forms.** Every input has a visible label (placeholders are not labels). Errors are announced via `aria-describedby` linking to helper text. Required fields are marked in copy, not just with `*`.
8. **Screen readers.** Currency values are read in full: render the visible `$ 12.450` and an `aria-label="doce mil cuatrocientos cincuenta pesos"` when the formatted string is ambiguous.
9. **Dark mode** is native, not a recolor — every contrast pair re‑validated. There is no flash of light mode on load (the `ThemeProvider` sets it before paint).

---

## How to use this design system

1. **Import the tokens.** Either link `colors_and_type.css` directly, or generate platform output from `tokens.json` via Style Dictionary.
2. **Inherit the type stack.** `body { font-family: var(--font-sans); }`.
3. **Use semantic vars, never raw values.** Write `color: var(--color-income)`, not `color: #10B981`. This makes dark mode and rebrands trivial.
4. **Match the components in `ui_kits/cuentalimpia/`.** Don't reinvent buttons, cards, inputs, badges. They're modular and copy‑pastable.
5. **Speak Argentine.** The voice section is non‑optional.

When in doubt, open `preview/` and `ui_kits/cuentalimpia/index.html` and copy the closest match.
