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
  if (actual == null || total == null) return null
  return `Cuota ${actual} de ${total}`
}
