/** Carimbo de publicação efetiva (RL06 B-05). */

const formatarLocal = (data: Date): string => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  const hora = String(data.getHours()).padStart(2, '0')
  const minuto = String(data.getMinutes()).padStart(2, '0')
  const segundo = String(data.getSeconds()).padStart(2, '0')
  return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`
}

/**
 * Data agendada para publicação efetiva quando ela ainda está no futuro.
 * Devolve `null` quando a data é passada/ausente — nesse caso o chamador deve
 * usar o instante da transição (`CURRENT_TIMESTAMP(6)`/agora).
 */
export function publicadoEmFuturo(data: string | null | undefined, hoje = new Date()): string | null {
  if (!data) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(data)
  if (!match) return null
  const alvo = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  if (Number.isNaN(alvo.getTime()) || alvo.getTime() <= base.getTime()) return null
  return `${match[1]}-${match[2]}-${match[3]} 00:00:00`
}

/** Carimbo efetivo completo: data agendada futura ou o instante informado. */
export function publicadoEmPara(data: string | null | undefined, agora = new Date()): string {
  return publicadoEmFuturo(data, agora) ?? formatarLocal(agora)
}
