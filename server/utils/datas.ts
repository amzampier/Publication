// Normalização de datas vindas do mysql2 (Date) ou de strings SQL/ISO.
// O driver retorna DATETIME como Date; String(Date) não é ISO e quebra toISOString().

export function paraIso(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor.toISOString()
  }
  if (typeof valor === 'string') {
    const texto = valor.trim()
    if (!texto) return null
    const normalizado = texto.includes(' ') && !texto.includes('T') ? texto.replace(' ', 'T') : texto
    const data = new Date(normalizado)
    return Number.isNaN(data.getTime()) ? null : data.toISOString()
  }
  return null
}

export function paraMs(valor: unknown): number | null {
  const iso = paraIso(valor)
  if (!iso) return null
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? null : ms
}