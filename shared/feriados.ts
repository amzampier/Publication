// Calendário de feriados nacionais usado pela regra de publicação da Release
// Week. Sem imports de Nuxt/Vue — compartilhado entre app, servidor e testes.
//
// Inclui feriados fixos, feriados móveis derivados da Páscoa e uma lista de
// feriados extras para necessidades locais/estaduais. A lista de extras fica
// vazia por padrão; adicione datas `AAAA-MM-DD` aqui quando a operação precisar.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Feriados extras (locais/estaduais) no formato `AAAA-MM-DD`. */
export const FERIADOS_EXTRAS: string[] = []

const paraData = (iso: string): Date | null => {
  if (!ISO_DATE.test(iso)) return null
  const [ano = 0, mes = 0, dia = 0] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null
  }
  return data
}

const paraIso = (data: Date): string => {
  const ano = data.getUTCFullYear()
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(data.getUTCDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const somarDias = (iso: string, dias: number): string => {
  const data = paraData(iso)
  if (!data) return iso
  data.setUTCDate(data.getUTCDate() + dias)
  return paraIso(data)
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), em UTC. */
const domingoDePascoa = (ano: number): string => {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Conjunto de feriados nacionais do ano (fixos + móveis + extras). */
export function feriadosNacionais(ano: number): Set<string> {
  const feriados = new Set<string>([
    `${ano}-01-01`, // Confraternização Universal
    `${ano}-04-21`, // Tiradentes
    `${ano}-05-01`, // Dia do Trabalho
    `${ano}-09-07`, // Independência
    `${ano}-10-12`, // Nossa Senhora Aparecida
    `${ano}-11-02`, // Finados
    `${ano}-11-15`, // Proclamação da República
    `${ano}-11-20`, // Consciência Negra
    `${ano}-12-25` // Natal
  ])

  const pascoa = domingoDePascoa(ano)
  feriados.add(somarDias(pascoa, -48)) // Carnaval (segunda)
  feriados.add(somarDias(pascoa, -47)) // Carnaval (terça)
  feriados.add(somarDias(pascoa, -2)) // Sexta-feira Santa
  feriados.add(somarDias(pascoa, 60)) // Corpus Christi

  for (const extra of FERIADOS_EXTRAS) {
    if (extra.startsWith(`${ano}-`)) feriados.add(extra)
  }
  return feriados
}

/** `true` quando a data é feriado nacional (ou extra) no ano correspondente. */
export function ehFeriadoNacional(iso: string): boolean {
  const data = paraData(iso)
  if (!data) return false
  return feriadosNacionais(data.getUTCFullYear()).has(iso)
}

/** Dia útil: segunda a sexta, excluindo feriados nacionais/extras. */
export function ehDiaUtil(iso: string): boolean {
  const data = paraData(iso)
  if (!data) return false
  const diaSemana = data.getUTCDay()
  return diaSemana >= 1 && diaSemana <= 5 && !ehFeriadoNacional(iso)
}

/** Primeiro dia útil estritamente após a data informada. */
export function proximoDiaUtil(iso: string): string {
  let atual = iso
  for (let i = 0; i < 370; i += 1) {
    atual = somarDias(atual, 1)
    if (ehDiaUtil(atual)) return atual
  }
  return atual
}

/** Segunda-feira da semana civil da data (em UTC). */
export function segundaDaSemana(iso: string): string {
  const data = paraData(iso)
  if (!data) return iso
  const diasDesdeSegunda = (data.getUTCDay() + 6) % 7
  return somarDias(iso, -diasDesdeSegunda)
}

/**
 * Regra de publicação da Release Week:
 * - segunda-feira é válida;
 * - quando a segunda-feira da semana é feriado nacional, o próximo dia útil é
 *   válido (ex.: Finados 02/11/2026 -> 03/11/2026);
 * - qualquer outra data é inválida.
 */
export function dataPublicacaoValida(iso: string): boolean {
  if (!ehDiaUtil(iso)) return false
  const segunda = segundaDaSemana(iso)
  if (segunda === iso) return true
  if (!ehFeriadoNacional(segunda)) return false
  return iso === proximoDiaUtil(segunda)
}
