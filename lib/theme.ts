// Hex fallbacks para contextos donde CSS variables no son válidas:
// SVG fill/stroke, input[type=color] defaultValue, cálculos de contraste en runtime.
// Deben mantenerse sincronizados con los tokens en globals.css.

export const BRAND_PRIMARY_HEX = '#5B47E0'   // --primary (light mode)
export const CONTRAST_ON_DARK = '#FFFFFF'     // foreground sobre fondos oscuros
export const CONTRAST_ON_LIGHT = '#0B0B12'   // foreground sobre fondos claros
