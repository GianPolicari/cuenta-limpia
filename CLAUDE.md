# CuentaLimpia — Contexto del Proyecto

## Stack
Next.js 16 App Router · React 19 · Supabase (PostgreSQL + RLS) · Tailwind v4 · shadcn/ui · sonner · recharts · lucide-react · Vercel

## Supabase
- project_id: `gvtkufuatosxlblloxtg` (sa-east-1)
- Aplicar migraciones DB vía Supabase MCP (`apply_migration` / `execute_sql`), nunca via CLI (password no configurada)
- Insertar `user_id: user.id` explícitamente en todas las server actions

## Convenciones de código
- UI optimista: guardar prev → actualizar estado → llamar action → revertir si error → toast (sonner)
- Server actions en `actions.ts` dentro de cada carpeta de ruta
- Tipos en `types/` o inline si son simples

## Design System
- Tokens semánticos: `income` (ingresos), `expense` (gastos), `info` (estado saludable / < 75%), `pending` (75-99%), `expense` (≥ 100%)
- Touch targets mínimo 44px (h-11)
- `text-primary-foreground` sobre fondos `bg-primary` (nunca `text-white` hardcodeado)
- Spinners en botones siempre acompañados de texto label

## Copy / Voz
- Voseo rioplatense en todo el copy ("Guardá", "Eliminá", "¿Estás seguro?")
- "operación" no "transacción", "gasto" no "egreso"
- Toasts con emoji (✅ éxito, ❌ error)

## Agentes disponibles
- `cl-feature-builder` — features nuevas end-to-end con datos
- `cl-screen-migrator` — restyle/migración de pantallas existentes al DS
- `cl-design-guardian` — QA visual (read-only, usar tras cambios visuales)

## DB — Tablas
- `cards` · `transactions` (cuota_actual, total_cuotas) · `custom_categories` · `budgets` · `recurring_transactions` · `recurring_applied` · `savings_goals`

## Rutas
- `/` landing · `/login` `/register` `/olvide-password` `/reset-password`
- `/onboarding` — wizard 3 pasos (fuera del DashboardLayout, route group)
- `/dashboard` · `/dashboard/ingresos-egresos` · `/dashboard/tarjetas` · `/dashboard/metas` · `/dashboard/configuracion`

## Nav
- Sidebar desktop: 5 ítems
- Bottom nav mobile: 4 ítems (Configuración oculta con `mobileHidden: true`)
