# CuentaLimpia UI Kit

High-fidelity, click-through prototype of the CuentaLimpia app, built against the design system tokens in `../../colors_and_type.css`.

## Run it

Open `index.html` in a browser. Demo login is pre-filled — just hit **Iniciar sesión**.

You can then navigate via the sidebar:

- **Dashboard** — KPI grid (income / expenses / balance / cards), donut by category, monthly bars, dólar MEP ticker with USD toggle.
- **Ingresos & Egresos** — month/year filter, date-grouped transaction list, add/edit/delete, CSV export button (visual).
- **Tarjetas** — credit/debit cards grid with active cuotas, plus an installments list with progress.
- **Configuración** — profile, dark-mode toggle (functional), notifications, categories.

## Files

| File | Role |
|---|---|
| `index.html` | Entrypoint — pulls React, Babel, Lucide, then each JSX in order |
| `kit.css` | Layout & component primitives bound to the design tokens |
| `App.jsx` | Top-level shell + router state + mock data |
| `Primitives.jsx` | `Icon`, `Button`, `Badge`, `Field`, `AmountInput`, `Select`, `Modal`, toast manager |
| `Widgets.jsx` | `KpiCard`, `TransactionRow`, `CreditCardTile`, `InstallmentRow`, `CategoryDonut`, `MonthlyBars` |
| `Sidebar.jsx` | Persistent desktop navigation |
| `LoginScreen.jsx` | Auth shell with ambient violet glow |
| `AddTransactionModal.jsx` | Add an income or expense, with cuota toggle |
| `DashboardScreen.jsx` | Dashboard page |
| `TransactionsScreen.jsx` | Operations list page |
| `CardsScreen.jsx` | Cards + cuotas page |
| `SettingsScreen.jsx` | Profile / appearance / categories page |

## Notes

- This is a **visual + interaction prototype**, not production code. State lives in `App.jsx` and disappears on refresh. Components are cosmetically modeled after the codebase's shadcn primitives but recreated in plain CSS so they can be lifted into any stack.
- All colors, type, spacing, radii, and shadows resolve through the design tokens — switch the `dark` class on `<html>` (the Settings page does this) and the entire kit re-themes.
- Charts are inline SVG (no Recharts) so the kit has no runtime dependencies beyond React + Lucide.
