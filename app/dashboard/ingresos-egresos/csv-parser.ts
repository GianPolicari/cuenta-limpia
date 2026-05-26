export type ParsedRow = {
  fecha: string        // YYYY-MM-DD
  descripcion: string
  monto: number
  tipo: 'income' | 'expense'
  error?: string
}

export type ColMapping = {
  fecha: number
  descripcion: number
  monto: number
  tipo: number | null  // null = inferir del signo del monto
}

export type ParseResult = {
  headers: string[]
  validRows: ParsedRow[]
  errorRows: { raw: string[]; reason: string }[]
  totalRaw: number
}

// Parsea una línea CSV respetando strings entre comillas con comas internas
function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Normaliza fecha: acepta DD/MM/YYYY, YYYY-MM-DD → devuelve YYYY-MM-DD o null
function parseDate(raw: string): string | null {
  const s = raw.trim()

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const month = parseInt(m)
    const day = parseInt(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return null
  }

  // DD/MM/YYYY o D/M/YYYY
  const dmmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmmyMatch) {
    const [, d, m, y] = dmmyMatch
    const month = parseInt(m)
    const day = parseInt(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return null
  }

  // DD-MM-YYYY
  const dmmyDashMatch = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dmmyDashMatch) {
    const [, d, m, y] = dmmyDashMatch
    const month = parseInt(m)
    const day = parseInt(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return null
  }

  return null
}

// Normaliza tipo: ingreso/income/credito → 'income', egreso/gasto/expense/debito → 'expense', null si no reconoce
function parseType(raw: string): 'income' | 'expense' | null {
  const s = raw.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents

  if (['ingreso', 'income', 'credito', 'credit', 'entrada', 'haber'].includes(s)) {
    return 'income'
  }
  if (['egreso', 'gasto', 'expense', 'debito', 'debit', 'salida', 'debe'].includes(s)) {
    return 'expense'
  }
  return null
}

export function parseCsv(text: string, mapping: ColMapping): ParseResult {
  // 1. Split lines, filtrar vacías
  const allLines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (allLines.length === 0) {
    return { headers: [], validRows: [], errorRows: [], totalRaw: 0 }
  }

  // 2. Primera fila = headers
  const headers = parseLine(allLines[0])
  const dataLines = allLines.slice(1)
  const totalRaw = dataLines.length

  const validRows: ParsedRow[] = []
  const errorRows: { raw: string[]; reason: string }[] = []

  // 3. Por cada fila de datos
  for (const line of dataLines) {
    const cols = parseLine(line)

    // Extraer campos según mapping
    const rawFecha = cols[mapping.fecha] ?? ''
    const rawDesc = cols[mapping.descripcion] ?? ''
    const rawMonto = cols[mapping.monto] ?? ''
    const rawTipo = mapping.tipo !== null ? (cols[mapping.tipo] ?? '') : null

    // parseDate
    const fecha = parseDate(rawFecha)
    if (!fecha) {
      errorRows.push({ raw: cols, reason: 'Fecha inválida' })
      continue
    }

    // parseFloat monto
    const montoRaw = parseFloat(rawMonto.replace(',', '.'))
    if (isNaN(montoRaw) || montoRaw === 0) {
      errorRows.push({ raw: cols, reason: 'Monto inválido' })
      continue
    }

    // tipo: si mapping.tipo !== null usar parseType; si null inferir del signo del monto
    let tipo: 'income' | 'expense' | null
    if (mapping.tipo !== null && rawTipo !== null) {
      tipo = parseType(rawTipo)
    } else {
      // inferir del signo
      tipo = montoRaw < 0 ? 'expense' : 'income'
    }

    if (tipo === null) {
      errorRows.push({ raw: cols, reason: 'Tipo no reconocido' })
      continue
    }

    // monto = Math.abs(monto)
    const monto = Math.abs(montoRaw)

    const descripcion = rawDesc || '(sin descripción)'

    validRows.push({ fecha, descripcion, monto, tipo })
  }

  return { headers, validRows, errorRows, totalRaw }
}
