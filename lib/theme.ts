// Hex fallbacks para contextos donde CSS variables no son válidas:
// SVG fill/stroke, input[type=color] defaultValue, cálculos de contraste en runtime.
// Deben mantenerse sincronizados con los tokens en globals.css.

export const BRAND_PRIMARY_HEX = '#5B47E0'   // --primary (light mode)
export const CONTRAST_ON_DARK = '#FFFFFF'     // foreground sobre fondos oscuros
export const CONTRAST_ON_LIGHT = '#0B0B12'   // foreground sobre fondos claros
export const MUTED_FG_LIGHT_HEX = '#4A4A55'  // --muted-foreground (light mode)
export const BORDER_LIGHT_HEX = '#E6E6EC'    // --border (light mode)
export const INCOME_STRONG_HEX = '#10B981'   // --income-strong (light mode)
export const EXPENSE_STRONG_HEX = '#EF4444'  // --expense-strong (light mode)

// Chart color fallbacks (light mode) — sincronizar con globals.css
export const CHART_COLORS_HEX = [
    '#7C6BFF', // --chart-1
    '#10B981', // --chart-2
    '#F59E0B', // --chart-3
    '#3B82F6', // --chart-4
    '#EC4899', // --chart-5
    '#14B8A6', // --chart-6
    '#6366F1', // --chart-7
    '#F87171', // --chart-8
]
