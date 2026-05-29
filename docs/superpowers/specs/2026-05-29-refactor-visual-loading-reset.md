# Spec: Refactor Visual + Loading States + Reset BD

**Fecha:** 2026-05-29  
**Estado:** Aprobado  
**Frentes:** (1) Alineación Visual DS, (2) Estados de Carga, (3) Bug off-by-one + Reset BD

---

## Contexto

CuentaLimpia tiene el Design System de tokens correctamente mapeado en `globals.css`, pero presenta tres brechas concretas:

1. El logo en el sidebar usa `DollarSign` de lucide-react en lugar del SVG oficial del DS (`design-system/assets/`). Las tarjetas en `/tarjetas` son Cards planas de shadcn en lugar del diseño visual tipo tarjeta bancaria del DS.
2. No existe ningún `loading.tsx` en el proyecto. Navegar entre rutas congela la pantalla mientras los Server Components consultan Supabase. El selector de mes/año en I&E tampoco tiene feedback visual.
3. `getTransactions` en I&E tiene un bug off-by-one: recibe `month` como 0-indexed pero el Select renderiza opciones 1-indexed, causando que Junio se muestre como Mayo y que seleccionar Junio cargue Julio. No hay mecanismo de reset de BD para desarrollo.

---

## Archivos afectados

### Nuevos (10)
| Archivo | Propósito |
|---|---|
| `public/assets/logo.svg` | Logo mark copiado del DS |
| `public/assets/logo-wordmark.svg` | Wordmark light mode |
| `public/assets/logo-wordmark-dark.svg` | Wordmark dark mode |
| `components/ui/skeleton.tsx` | Componente Skeleton con shimmer DS |
| `components/ui/credit-card-visual.tsx` | Tarjeta bancaria visual (aspect-ratio 1.586:1) |
| `app/dashboard/loading.tsx` | Skeleton para dashboard principal |
| `app/dashboard/ingresos-egresos/loading.tsx` | Skeleton para I&E |
| `app/dashboard/tarjetas/loading.tsx` | Skeleton para tarjetas |
| `app/dashboard/metas/loading.tsx` | Skeleton para metas |
| `app/dashboard/configuracion/loading.tsx` | Skeleton para configuración |

### Modificados (8)
| Archivo | Cambio |
|---|---|
| `app/dashboard/layout.tsx` | Reemplaza DollarSign+span por `<Image>` del wordmark |
| `app/dashboard/tarjetas/TarjetasClient.tsx` | Usa `<CreditCardVisual>`, mueve cuotas a sección separada |
| `app/dashboard/ingresos-egresos/actions.ts` | `getTransactions` pasa a 1-indexed |
| `app/dashboard/ingresos-egresos/page.tsx` | Pasa `getMonth() + 1` como `initialMonth` |
| `app/dashboard/ingresos-egresos/IngresosEgresosClient.tsx` | Skeleton overlay durante `isLoadingTransactions`, consistencia `cl-animate-enter` |
| `app/dashboard/configuracion/actions.ts` | Agrega `resetDevDatabase()`; actualiza `applyRecurring` a 1-indexed |
| `app/dashboard/configuracion/page.tsx` | Pasa `isDev={process.env.NODE_ENV === 'development'}` como prop |
| `app/dashboard/configuracion/SettingsClient.tsx` | Sección "Zona de desarrollo" condicional vía prop `isDev` |

---

## Frente 1 — Alineación Visual

### Logo

**Assets:** Copiar `design-system/assets/logo.svg`, `logo-wordmark.svg`, `logo-wordmark-dark.svg` a `public/assets/`.

**Implementación en `layout.tsx`:**
- Reemplazar el `<div>` con gradiente + `DollarSign` + `<span>CuentaLimpia</span>` por un único `<Image>` de next/image
- Light mode: `logo-wordmark.svg`; dark mode: `logo-wordmark-dark.svg`
- Tamaño: `width={140} height={40}` (wordmark 280×80 escalado al 50%)
- Alternativa para dark mode: usar CSS `dark:hidden` / `dark:block` en dos `<Image>` superpuestos
- `alt="CuentaLimpia"` en ambas variantes

### CreditCardVisual

**Archivo:** `components/ui/credit-card-visual.tsx`

**Props:**
```ts
interface CreditCardVisualProps {
  name: string
  card_type: string
  color: string | null
  activeCuotas?: number
}
```

**Diseño:**
- Contenedor: `aspect-[1.586/1] rounded-[20px] overflow-hidden relative`
- Fondo: si `color` → `linear-gradient(135deg, {color} 0%, {colorDarken(color, 15)} 100%)`. Si no → `linear-gradient(135deg, #7C6BFF 0%, #4131B5 100%)`
- Todo el texto: `color: white`
- Layout flex column con `justify-between`, padding 22px
- **Top row:** nombre (14px, font-weight 600, opacity 0.9) + badge cuotas (solo si `activeCuotas > 0`): `bg-white/18 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold`
- **Middle:** `•••• •••• •••• ••••` — `text-lg font-semibold tracking-[0.18em] tabular-nums`
- **Bottom row:** tipo de tarjeta en uppercase (Crédito/Débito, `text-[10px] font-bold tracking-widest opacity-70`)
- Sombra: `shadow-md`

**Función `darkenHex(hex, amount)`:** helper inline puro, sin dependencias:
```ts
function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
```
Uso: `darkenHex(color, 40)` para el stop final del gradiente. Fallback: si `color` no es un string que empiece con `#` y tenga 7 caracteres, usa gradiente violeta del DS.

**En `TarjetasClient`:**
- El grid de cards usa `<CreditCardVisual>` en lugar del Card plano
- Los botones Editar/Eliminar se mueven a un menú de tres puntos (`DropdownMenu`) sobre la card
- Las cuotas de cada tarjeta se muestran en una sección separada debajo del grid, titulada "Cuotas activas del mes", usando `InstallmentRow` con barra de progreso (como en el DS)

---

## Frente 2 — Loading States

### Componente `<Skeleton>`

**Archivo:** `components/ui/skeleton.tsx`

```tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-muted animate-[shimmer_1.6s_linear_infinite] bg-[length:200%_100%]", className)} />
}
```

La animación `shimmer` ya está definida conceptualmente en el DS (`design-system/preview/skeleton.html`) pero no en `globals.css`. Se agrega en `globals.css`:

```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

El fondo usa el gradiente del DS: `linear-gradient(90deg, var(--muted) 0%, var(--border) 50%, var(--muted) 100%)`.

### Skeletons por ruta

Cada `loading.tsx` replica el layout de su página con el mismo padding y estructura, para evitar salto visual:

**`dashboard/loading.tsx`:**
- Header skeleton (título + subtítulo)
- Grid 2×2 de KpiCard skeletons (h-32 cada uno)
- Grid 1×2 de Chart card skeletons (h-64 cada uno)

**`ingresos-egresos/loading.tsx`:**
- Header skeleton
- Grid 3-col de KpiCard skeletons
- 8 filas de transacción skeleton (dot 40px + dos líneas + amount)

**`tarjetas/loading.tsx`:**
- Header skeleton
- Grid 3-col de 3 cards con aspect-ratio 1.586:1

**`metas/loading.tsx`:**
- Header skeleton
- Grid de 3 goal cards con progress bar skeleton

**`configuracion/loading.tsx`:**
- Header skeleton
- 3 tab buttons skeleton
- Lista de 5 items skeleton

### Spinner en I&E

Cuando `isLoadingTransactions === true`:
- Los KPI cards y la tabla/lista de transacciones muestran sus equivalentes skeleton
- Los Selects de mes/año tienen `disabled`
- El texto del mes en el header muestra un `<Skeleton className="h-4 w-24" />`

### Consistencia de `cl-animate-enter`

Regla: el `<div>` raíz de retorno de cada Client Component de página lleva `cl-animate-enter`. Los grids de ítems (KPIs, cards, metas, transacciones) llevan `cl-stagger`. Se auditan y corrigen `MetasClient`, `IngresosEgresosClient` y `SettingsClient`.

---

## Frente 3 — Bug off-by-one + Reset BD

### Fix del mes

**`actions.ts` — `getTransactions`:**
```ts
// Antes:
const mm = String(month + 1).padStart(2, '0')  // esperaba 0-indexed

// Después:
const mm = String(month).padStart(2, '0')  // espera 1-indexed (1-12)
```

**`page.tsx`:**
```ts
// Antes:
const month = now.getMonth()           // 0-indexed
getTransactions(month, year)
initialMonth={month}

// Después:
const month = now.getMonth() + 1       // 1-indexed
getTransactions(month, year)
initialMonth={month}
```

`getRecurringApplied(month, year)` recibe el mismo `month`. Su implementación usa `.eq('applied_month', month)` directamente — no tiene `+1` interno, por lo que actualmente almacena y consulta 0-indexed. Después del fix, `month` en el callsite será 1-indexed (6 para Junio) y `applied_month` en la BD quedará en 1-indexed consistentemente. Los registros existentes con valores 0-indexed quedarán obsoletos — se limpian con el reset de BD o se ignoran (no afectan datos financieros).

`applyRecurring(recurringId, month, year)` también tiene cálculos 0-indexed internos. Actualizar:
```ts
// Antes (0-indexed):
const daysInMonth = new Date(year, month + 1, 0).getDate()
const mm = String(month + 1).padStart(2, '0')

// Después (1-indexed):
const daysInMonth = new Date(year, month, 0).getDate()
const mm = String(month).padStart(2, '0')
```
El campo `applied_month: month` en el insert no cambia de línea, pero almacenará el valor 1-indexed.

El Select en `IngresosEgresosClient` ya genera opciones con `value={String(i + 1)}` (1-indexed) — no cambia. El `useEffect` de refetch ya llama `getTransactions(Number(month), ...)` donde `month` es el valor del Select — correcto.

### Reset BD

**`configuracion/actions.ts` — nueva acción:**

```ts
export async function resetDevDatabase() {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'Solo disponible en entorno de desarrollo' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Orden: respetar FK constraints
  // 1. recurring_applied (FK → recurring_transactions, transactions)
  // 2. transactions (FK → cards)
  // 3. recurring_transactions (FK → cards)
  // 4. savings_goals
  // 5. budgets
  // 6. custom_categories
  // 7. cards

  const tables = [
    'recurring_applied',
    'transactions',
    'recurring_transactions',
    'savings_goals',
    'budgets',
    'custom_categories',
    'cards',
  ]
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id)
    if (error) return { error: `Error en ${table}: ${error.message}` }
  }
  revalidatePath('/dashboard', 'layout')
  return { error: null }
}
```

**`SettingsClient.tsx` — sección condicional:**

Recibe prop `isDev: boolean` desde el Server Component de la página (`configuracion/page.tsx`), que la evalúa con `process.env.NODE_ENV === 'development'`. Este patrón es el correcto en App Router: las variables de entorno sin prefijo `NEXT_PUBLIC_` solo están disponibles en el servidor.

Contenido:
- Título "Zona de desarrollo" con ícono de advertencia
- Descripción: "Borra todos los datos de tu cuenta. Esta acción no se puede deshacer."
- Botón `variant="destructive"`: "Resetear base de datos"
- Diálogo de confirmación con texto "¿Estás seguro? Esto eliminará todas tus transacciones, tarjetas, metas y configuraciones."
- Toast de éxito/error con sonner

---

## Criterios de aceptación

- [ ] El logo en sidebar muestra el wordmark SVG del DS (no DollarSign)
- [ ] Las tarjetas en `/tarjetas` tienen diseño visual tipo tarjeta bancaria (aspect-ratio, gradiente)
- [ ] Navegar entre secciones del dashboard nunca muestra pantalla congelada — siempre hay skeleton
- [ ] Al cambiar mes/año en I&E aparece skeleton y los selects se deshabilitan
- [ ] Todas las páginas del dashboard tienen `cl-animate-enter` en el contenedor raíz
- [ ] Seleccionar "Junio" en I&E carga datos de Junio (no Julio)
- [ ] El Dashboard y I&E muestran el mismo mes y los mismos datos para ese mes
- [ ] El botón de reset solo aparece en `NODE_ENV=development`
- [ ] El reset borra todas las tablas del usuario en orden correcto sin errores de FK
- [ ] TypeScript compila sin errores (`tsc --noEmit`)
