// server/utils/seguranca.ts — log de tentativas de login e estado exibido
// pela aba Segurança de Configurações Globais (change seguranca-rate-limits-reais).
// O log é append-only: a aplicação só insere e lê (regra da auditoria).
import { query } from './db'
import { TENTATIVAS_MAX, JANELA_BLOQUEIO_MIN, limparFalhasLogin, bloqueioVigente } from './auth'

export type TipoEventoLogin =
  | 'senha-invalida'
  | 'email-inexistente'
  | 'bloqueio-aplicado'
  | 'tentativa-bloqueado'
  | 'bloqueio-liberado'

export interface EventoLogin {
  id: number
  ocorridoEm: string
  emailAlvo: string
  ip: string
  tipo: TipoEventoLogin
  tentativasAcumuladas: number | null
}

export interface ContaSeguranca {
  id: string
  email: string
  tentativas: number
  /** ISO do fim do bloqueio; null = sem bloqueio (só falhas consecutivas) */
  bloqueadoAte: string | null
  /** Minutos restantes do bloqueio vigente; null quando não bloqueada */
  minutosRestantes: number | null
}

export interface EstadoSeguranca {
  constantes: {
    tentativas_max: number
    janela_bloqueio_min: number
    limite_requisicoes_minuto: number
    rate_limit_ativo: boolean
  }
  contas: ContaSeguranca[]
  eventos: EventoLogin[]
}

/** Últimos eventos exibidos na aba (mais recentes primeiro). */
const LIMITE_EVENTOS = 50

/**
 * Registra um evento no log append-only. Nunca derruba o fluxo chamador:
 * falha de gravação do log é logada no console e ignorada (o login continua).
 */
export async function registrarEventoLogin(evento: {
  emailAlvo: string
  usuarioId: string | null
  ip: string
  tipo: TipoEventoLogin
  tentativas?: number
}): Promise<void> {
  try {
    await query(
      `INSERT INTO seguranca_eventos_login (email_alvo, usuario_id, ip, tipo, tentativas_acumuladas)
       VALUES (?, ?, ?, ?, ?)`,
      [
        evento.emailAlvo.slice(0, 255),
        evento.usuarioId,
        evento.ip,
        evento.tipo,
        evento.tentativas ?? null
      ]
    )
  } catch (erro) {
    console.error('[seguranca] Falha ao registrar evento de login:', erro)
  }
}

/** Libera a conta (zera falhas e bloqueio). Devolve false se a conta não existe. */
export async function liberarBloqueio(usuarioId: string): Promise<boolean> {
  return await limparFalhasLogin(usuarioId)
}

export interface BloqueioEmailInexistente {
  bloqueado: boolean
  /** Tentativas do e-mail na janela (base do bloqueio e do contador do log) */
  tentativas: number
  minutosRestantes: number | null
}

/**
 * Bloqueio de e-mail inexistente: 5 tentativas (`TENTATIVAS_MAX`) com o mesmo
 * e-mail dentro da janela de `JANELA_BLOQUEIO_MIN` travam as próximas tentativas
 * daquele e-mail com o MESMO aviso das contas — comportamento uniforme que fecha
 * o oráculo de enumeração. O estado vive no próprio log (janela deslizante):
 * eventos 'tentativa-bloqueado' têm outro tipo e não renovam a janela; uma
 * liberação ('bloqueio-liberado') zera a contagem, que volta a contar só os
 * eventos posteriores — o log nunca é alterado.
 */
export async function consultarBloqueioEmailInexistente(
  email: string
): Promise<BloqueioEmailInexistente> {
  const linhas = await query<Array<{ contagem: number; ultimo: Date | null }>>(
    `SELECT COUNT(*) AS contagem, MAX(ocorrido_em) AS ultimo
       FROM seguranca_eventos_login e
      WHERE e.email_alvo = ?
        AND e.tipo = 'email-inexistente'
        AND e.ocorrido_em > NOW(6) - INTERVAL ${JANELA_BLOQUEIO_MIN} MINUTE
        AND e.ocorrido_em > COALESCE(
          (SELECT MAX(ocorrido_em) FROM seguranca_eventos_login
            WHERE email_alvo = ? AND tipo = 'bloqueio-liberado'),
          '1970-01-01')
      `,
    [email, email]
  )
  const contagem = Number(linhas[0]?.contagem ?? 0)
  if (contagem < TENTATIVAS_MAX || !linhas[0]?.ultimo) {
    return { bloqueado: false, tentativas: contagem, minutosRestantes: null }
  }
  // Bloqueio vigente a partir da última tentativa registrada
  const ate = new Date(new Date(linhas[0].ultimo).getTime() + JANELA_BLOQUEIO_MIN * 60000)
  const minutos = Math.max(1, Math.ceil((ate.getTime() - Date.now()) / 60000))
  return { bloqueado: true, tentativas: contagem, minutosRestantes: minutos }
}

/**
 * Libera um bloqueio de e-mail inexistente INSERTANDO um evento novo no log
 * (append-only: nada é alterado) — as janelas passam a contar só eventos
 * posteriores. `ip` é o do admin que acionou a liberação na aba.
 */
export async function liberarBloqueioEmail(email: string, ip: string): Promise<void> {
  const atual = await consultarBloqueioEmailInexistente(email)
  await registrarEventoLogin({
    emailAlvo: email,
    usuarioId: null,
    ip,
    tipo: 'bloqueio-liberado',
    tentativas: atual.bloqueado ? atual.tentativas : undefined
  })
}

/**
 * Estado completo para a aba Segurança: constantes do servidor (fonte única),
 * contas com falhas/bloqueio vigente e os últimos eventos do log.
 */
export async function listarEstadoSeguranca(): Promise<EstadoSeguranca> {
  const [contasRows, bloqueiosEmailRows, eventosRows, rateRows] = await Promise.all([
    query<Array<{ id: string; email_corporativo: string; tentativas_falhas: number; bloqueado_ate: Date | null }>>(
      `SELECT id, email_corporativo, tentativas_falhas, bloqueado_ate FROM usuarios
        WHERE tentativas_falhas > 0
           OR (bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW(6))
        ORDER BY bloqueado_ate DESC, email_corporativo ASC`
    ),
    // Bloqueios vigentes de e-mails INEXISTENTES (sem conta), derivados do log
    // e pós-liberação (eventos anteriores a um 'bloqueio-liberado' não contam).
    query<Array<{ email: string; contagem: number; ultimo: Date }>>(
      `SELECT e.email_alvo AS email, COUNT(*) AS contagem, MAX(e.ocorrido_em) AS ultimo
         FROM seguranca_eventos_login e
        WHERE e.tipo = 'email-inexistente'
          AND e.ocorrido_em > NOW(6) - INTERVAL ${JANELA_BLOQUEIO_MIN} MINUTE
          AND e.ocorrido_em > COALESCE(
            (SELECT MAX(ocorrido_em) FROM seguranca_eventos_login
              WHERE email_alvo = e.email_alvo AND tipo = 'bloqueio-liberado'),
            '1970-01-01')
          AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.email_corporativo = e.email_alvo)
        GROUP BY e.email_alvo
       HAVING COUNT(*) >= ${TENTATIVAS_MAX}`
    ),
    query<Array<{ id: number; ocorrido_em: Date; email_alvo: string; ip: string; tipo: TipoEventoLogin; tentativas_acumuladas: number | null }>>(
      `SELECT id, ocorrido_em, email_alvo, ip, tipo, tentativas_acumuladas
         FROM seguranca_eventos_login
        ORDER BY ocorrido_em DESC, id DESC
        LIMIT ?`,
      [LIMITE_EVENTOS]
    ),
    query<Array<{ ativo: number; limite_requisicoes_minuto: number }>>(
      "SELECT ativo, limite_requisicoes_minuto FROM configuracoes_limite_requisicao WHERE id = 'rate_limit_default' LIMIT 1"
    )
  ])

  const contasReais: ContaSeguranca[] = contasRows.map((row) => {
    const minutos = bloqueioVigente(row.bloqueado_ate)
    return {
      id: String(row.id),
      email: String(row.email_corporativo),
      // No bloqueio o contador no banco está zerado (reset no ato do bloqueio);
      // a causa do bloqueio é sempre TENTATIVAS_MAX — exibir essa é o honesto.
      tentativas: minutos !== null ? TENTATIVAS_MAX : Number(row.tentativas_falhas),
      bloqueadoAte: row.bloqueado_ate ? new Date(row.bloqueado_ate).toISOString() : null,
      minutosRestantes: minutos
    }
  })

  const bloqueiosEmail: ContaSeguranca[] = bloqueiosEmailRows.map((row) => {
    const ultimo = new Date(row.ultimo)
    const ate = new Date(ultimo.getTime() + JANELA_BLOQUEIO_MIN * 60000)
    return {
      id: '', // sem conta correspondente — o Liberar envia { email }
      email: String(row.email),
      tentativas: Number(row.contagem),
      bloqueadoAte: ate.toISOString(),
      minutosRestantes: Math.max(1, Math.ceil((ate.getTime() - Date.now()) / 60000))
    }
  })

  const eventos: EventoLogin[] = eventosRows.map((row) => ({
    id: Number(row.id),
    ocorridoEm: new Date(row.ocorrido_em).toISOString(),
    emailAlvo: String(row.email_alvo),
    ip: String(row.ip),
    tipo: row.tipo,
    tentativasAcumuladas: row.tentativas_acumuladas === null ? null : Number(row.tentativas_acumuladas)
  }))

  return {
    constantes: {
      tentativas_max: TENTATIVAS_MAX,
      janela_bloqueio_min: JANELA_BLOQUEIO_MIN,
      limite_requisicoes_minuto: rateRows.length > 0 ? Number(rateRows[0]!.limite_requisicoes_minuto) : 120,
      rate_limit_ativo: rateRows.length > 0 ? Number(rateRows[0]!.ativo) === 1 : true
    },
    contas: [...contasReais, ...bloqueiosEmail],
    eventos
  }
}
