// Camada de acesso do módulo Escopo de Projetos (change
// escopo-projetos-backend-e-importacao). Regras puras vêm de
// `#shared/escopo-projetos`; aqui ficam validação de entrada, código
// PE-<ano>.<seq>, softwares derivados, arquivamento soft, guarda de exclusão e
// importação transacional. As rotas aplicam RBAC e auditoria.
import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { query, getTransaction } from './db'
import {
  chaveAnoVersao,
  gerarCodigo,
  hojeIso,
  validarEscopo,
  type EntradaEscopo,
  type ItemProjeto,
  type ProjetoEscopoModelo,
  type StatusEscopo
} from '#shared/escopo-projetos'

const LIMITE_IMPORTACAO = 500
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function erro400(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 400, statusMessage: mensagem, data })
}
function erro404(mensagem = 'Escopo de Projetos não encontrado.'): never {
  throw createError({ statusCode: 404, statusMessage: mensagem })
}
function erro409(mensagem: string, data?: unknown): never {
  throw createError({ statusCode: 409, statusMessage: mensagem, data })
}

type Row = Record<string, unknown>

const texto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : String(valor)

/** Valida o id do path (UUID); inválido -> 404. */
export function validarIdEscopo(id: unknown): string {
  const valor = typeof id === 'string' ? id.trim() : ''
  if (!UUID_RE.test(valor)) erro404()
  return valor
}

const dataIso = (valor: unknown): string => {
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'string' && valor) {
    const data = new Date(valor)
    if (!Number.isNaN(data.getTime())) return data.toISOString()
    return valor
  }
  return ''
}

const dataDia = (valor: unknown): string => {
  if (valor instanceof Date) {
    const ano = valor.getFullYear()
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  return texto(valor).slice(0, 10)
}

const montarEscopo = (row: Row): ProjetoEscopoModelo => ({
  id: texto(row.id),
  codigo: texto(row.codigo),
  nome: texto(row.nome),
  versao: texto(row.versao),
  ano: Number(row.ano ?? 0),
  dataInicio: dataDia(row.data_inicio),
  dataFinal: dataDia(row.data_final),
  dataPrevisao: dataDia(row.data_previsao),
  dataPublicacao: dataDia(row.data_publicacao),
  status: (texto(row.status) || 'Em Andamento') as StatusEscopo,
  // Preenchido por carregarSoftwares(); o JSON do banco não é fonte de verdade.
  softwaresContemplados: [],
  descricaoGeral: texto(row.descricao_geral),
  totalVisualizacoes: Number(row.total_visualizacoes ?? 0),
  itensCount: Number(row.itens_count ?? 0),
  arquivada: Number(row.arquivada ?? 0) === 1,
  criadoEm: dataIso(row.criado_em),
  atualizadoEm: dataIso(row.atualizado_em)
})

const COLUNAS = `p.id, p.codigo, p.nome, p.versao, p.ano,
  p.data_inicio, p.data_final, p.data_previsao, p.data_publicacao,
  p.status, p.descricao_geral, p.total_visualizacoes, p.arquivada,
  p.criado_em, p.atualizado_em,
  (SELECT COUNT(*) FROM entregas_itens e WHERE e.projeto_id = p.id) AS itens_count`

// ---------------------------------------------------------------------------
// Softwares derivados das chamadas
// ---------------------------------------------------------------------------

/**
 * Carrega os softwares distintos por projeto a partir de `entregas_itens`.
 * Prefere `softwares.descricao` (via `software_id`) e usa o texto do item como
 * fallback. A ordem é alfabética para a saída ser estável.
 */
async function carregarSoftwares(ids: string[]): Promise<Record<string, string[]>> {
  const mapa: Record<string, string[]> = {}
  if (!ids.length) return mapa
  const placeholders = ids.map(() => '?').join(', ')
  const linhas = await query<Row[]>(
    `SELECT e.projeto_id,
            COALESCE(NULLIF(TRIM(s.descricao), ''), NULLIF(TRIM(e.software), '')) AS nome
       FROM entregas_itens e
       LEFT JOIN softwares s ON s.codigo = e.software_id
      WHERE e.projeto_id IN (${placeholders})
        AND COALESCE(NULLIF(TRIM(s.descricao), ''), NULLIF(TRIM(e.software), '')) IS NOT NULL
      ORDER BY e.projeto_id ASC, nome ASC`,
    ids
  )
  for (const linha of linhas) {
    const projeto = texto(linha.projeto_id)
    const nome = texto(linha.nome)
    if (!projeto || !nome) continue
    const lista = mapa[projeto] ?? []
    if (!lista.includes(nome)) lista.push(nome)
    mapa[projeto] = lista
  }
  return mapa
}

async function anexarSoftwares(escopos: ProjetoEscopoModelo[]): Promise<ProjetoEscopoModelo[]> {
  const softwares = await carregarSoftwares(escopos.map((escopo) => escopo.id))
  return escopos.map((escopo) => ({
    ...escopo,
    softwaresContemplados: softwares[escopo.id] ?? []
  }))
}

// ---------------------------------------------------------------------------
// Validação de entrada
// ---------------------------------------------------------------------------

export interface EntradaEscopoApi {
  nome?: unknown
  versao?: unknown
  ano?: unknown
  dataInicio?: unknown
  dataFinal?: unknown
  dataPrevisao?: unknown
  dataPublicacao?: unknown
  status?: unknown
  descricaoGeral?: unknown
}

interface EscopoValidado extends EntradaEscopo {
  descricaoGeral: string
}

export function validarEntradaEscopo(dados: EntradaEscopoApi): EscopoValidado {
  const resultado = validarEscopo(dados)
  const erros = { ...resultado.erros }

  const descricaoGeral =
    typeof dados.descricaoGeral === 'string' ? dados.descricaoGeral.trim() : ''

  if (resultado.primeiroErro) {
    erro400('Verifique os campos do escopo.', { erros })
  }

  const status = (typeof dados.status === 'string' && dados.status) || 'Em Andamento'

  return {
    nome: String(dados.nome).trim(),
    versao: String(dados.versao).trim(),
    ano: Number(dados.ano),
    dataInicio: String(dados.dataInicio),
    dataFinal: String(dados.dataFinal),
    dataPrevisao: String(dados.dataPrevisao),
    dataPublicacao: String(dados.dataPublicacao),
    status: status as EscopoValidado['status'],
    descricaoGeral
  }
}

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

/** Escopos não arquivados, ordenados por ano/nome. */
export async function listarEscopos(): Promise<ProjetoEscopoModelo[]> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS}
       FROM projetos_escopo p
      WHERE p.arquivada = 0
      ORDER BY p.ano DESC, p.nome ASC`
  )
  return anexarSoftwares(linhas.map(montarEscopo))
}

/** Um escopo por id (inclui arquivados — usado em edição/exclusão). */
export async function buscarEscopo(id: string): Promise<ProjetoEscopoModelo | null> {
  const linhas = await query<Row[]>(
    `SELECT ${COLUNAS} FROM projetos_escopo p WHERE p.id = ? LIMIT 1`,
    [id]
  )
  const linha = linhas[0]
  if (!linha) return null
  const escopo = montarEscopo(linha)
  const comSoftwares = await anexarSoftwares([escopo])
  return comSoftwares[0] ?? escopo
}

/** Itens (entregas_itens) vinculados ao projeto, somente leitura. */
export async function listarItensEscopo(id: string): Promise<ItemProjeto[]> {
  const escopo = await buscarEscopo(id)
  if (!escopo) erro404()

  const linhas = await query<Row[]>(
    `SELECT id, projeto_id, chamada, titulo, software, modulo, tipo, impacto,
            situacao, status, data_liberacao
       FROM entregas_itens
      WHERE projeto_id = ?
      ORDER BY ordem_apresentacao ASC, chamada ASC`,
    [id]
  )
  return linhas.map((row) => ({
    id: texto(row.id),
    projetoId: texto(row.projeto_id),
    chamada: texto(row.chamada),
    titulo: texto(row.titulo),
    software: texto(row.software),
    modulo: texto(row.modulo),
    tipo: texto(row.tipo) as ItemProjeto['tipo'],
    impacto: texto(row.impacto) as ItemProjeto['impacto'],
    situacao: texto(row.situacao) as ItemProjeto['situacao'],
    status: texto(row.status) as ItemProjeto['status'],
    dataLiberacao: dataDia(row.data_liberacao)
  }))
}

// ---------------------------------------------------------------------------
// Código
// ---------------------------------------------------------------------------

/** Próximo código do ano, calculado no banco. */
async function proximoCodigoDoAno(ano: number, ignorarId?: string): Promise<string> {
  const linhas = await query<Array<{ codigo: string }>>(
    'SELECT codigo FROM projetos_escopo WHERE ano = ?',
    [ano]
  )
  let maior = 0
  for (const linha of linhas) {
    const match = /^PE-(\d{4})\.(\d+)$/.exec(texto(linha.codigo))
    if (!match || Number(match[1]) !== ano) continue
    maior = Math.max(maior, Number(match[2]))
  }
  void ignorarId
  return gerarCodigo(ano, maior + 1)
}

// ---------------------------------------------------------------------------
// Escritas
// ---------------------------------------------------------------------------

export async function criarEscopo(dados: EntradaEscopoApi): Promise<ProjetoEscopoModelo> {
  const validada = validarEntradaEscopo(dados)
  const id = randomUUID()

  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const codigo = await proximoCodigoDoAno(validada.ano)
    try {
      await query(
        `INSERT INTO projetos_escopo
          (id, codigo, nome, versao, ano, data_inicio, data_final, data_previsao,
           data_publicacao, status, softwares_contemplados, descricao_geral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          codigo,
          validada.nome,
          validada.versao,
          validada.ano,
          validada.dataInicio,
          validada.dataFinal,
          validada.dataPrevisao,
          validada.dataPublicacao,
          validada.status,
          JSON.stringify([]),
          validada.descricaoGeral
        ]
      )
      const criado = await buscarEscopo(id)
      if (!criado) erro404('Falha ao criar o escopo.')
      return criado
    } catch (erro) {
      if ((erro as { errno?: number } | null)?.errno === 1062) {
        const mensagem = String((erro as { message?: string }).message ?? '')
        if (/uk_projetos_ano_versao|ano_versao/i.test(mensagem)) {
          erro409('Já existe um escopo para este ano e versão.', {
            erros: { versao: 'Já existe um escopo para este ano e versão.' }
          })
        }
        // Colisão de código: tenta novamente com o próximo sequencial.
        continue
      }
      throw erro
    }
  }

  erro409('Não foi possível gerar um código livre para o escopo. Tente novamente.')
}

export async function atualizarEscopo(
  id: string,
  dados: EntradaEscopoApi
): Promise<ProjetoEscopoModelo> {
  const atual = await buscarEscopo(id)
  if (!atual) erro404()

  const mesclado: EntradaEscopoApi = {
    nome: 'nome' in dados ? dados.nome : atual.nome,
    versao: 'versao' in dados ? dados.versao : atual.versao,
    ano: 'ano' in dados ? dados.ano : atual.ano,
    dataInicio: 'dataInicio' in dados ? dados.dataInicio : atual.dataInicio,
    dataFinal: 'dataFinal' in dados ? dados.dataFinal : atual.dataFinal,
    dataPrevisao: 'dataPrevisao' in dados ? dados.dataPrevisao : atual.dataPrevisao,
    dataPublicacao: 'dataPublicacao' in dados ? dados.dataPublicacao : atual.dataPublicacao,
    status: 'status' in dados ? dados.status : atual.status,
    descricaoGeral: 'descricaoGeral' in dados ? dados.descricaoGeral : atual.descricaoGeral
  }

  const validada = validarEntradaEscopo(mesclado)

  try {
    await query(
      `UPDATE projetos_escopo
          SET nome = ?, versao = ?, ano = ?, data_inicio = ?, data_final = ?,
              data_previsao = ?, data_publicacao = ?, status = ?,
              softwares_contemplados = ?, descricao_geral = ?
        WHERE id = ?`,
      [
        validada.nome,
        validada.versao,
        validada.ano,
        validada.dataInicio,
        validada.dataFinal,
        validada.dataPrevisao,
        validada.dataPublicacao,
        validada.status,
        JSON.stringify([]),
        validada.descricaoGeral,
        id
      ]
    )
  } catch (erro) {
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('Já existe um escopo para este ano e versão.', {
        erros: { versao: 'Já existe um escopo para este ano e versão.' }
      })
    }
    throw erro
  }

  const atualizado = await buscarEscopo(id)
  if (!atualizado) erro404()
  return atualizado
}

export async function publicarEscopo(id: string): Promise<ProjetoEscopoModelo> {
  const atual = await buscarEscopo(id)
  if (!atual) erro404()
  await query("UPDATE projetos_escopo SET status = 'Publicado', data_publicacao = ? WHERE id = ?", [
    hojeIso(),
    id
  ])
  const publicado = await buscarEscopo(id)
  if (!publicado) erro404()
  return publicado
}

export async function arquivarEscopo(id: string): Promise<ProjetoEscopoModelo> {
  const atual = await buscarEscopo(id)
  if (!atual) erro404()
  await query('UPDATE projetos_escopo SET arquivada = 1 WHERE id = ?', [id])
  const arquivado = await buscarEscopo(id)
  if (!arquivado) erro404()
  return arquivado
}

export async function excluirEscopo(id: string): Promise<void> {
  const atual = await buscarEscopo(id)
  if (!atual) erro404()
  if (atual.arquivada) erro409('Escopo arquivado não pode ser excluído.')

  const itens = await query<Array<{ total: number }>>(
    'SELECT COUNT(*) AS total FROM entregas_itens WHERE projeto_id = ?',
    [id]
  )
  if (Number(itens[0]?.total ?? 0) > 0) {
    erro409('Escopo com itens vinculados não pode ser excluído.')
  }

  await query('DELETE FROM projetos_escopo WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Importação
// ---------------------------------------------------------------------------

export async function importarEscopos(linhas: unknown): Promise<{ importados: number }> {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    erro400('Envie ao menos uma linha para importar.')
  }
  if (linhas.length > LIMITE_IMPORTACAO) {
    erro400(`Limite de ${LIMITE_IMPORTACAO} linhas por importação.`)
  }

  const motivos: string[] = []
  const preparados: EscopoValidado[] = []
  const vistos = new Set<string>()

  for (const [indice, linha] of linhas.entries()) {
    try {
      const validada = validarEntradaEscopo((linha ?? {}) as EntradaEscopoApi)
      const chave = chaveAnoVersao(validada.ano, validada.versao)
      if (vistos.has(chave)) {
        erro400('ano/versão repetido no arquivo.')
      }
      vistos.add(chave)
      preparados.push(validada)
    } catch (erro) {
      const mensagem = (erro as { statusMessage?: string }).statusMessage ?? 'Linha inválida.'
      motivos.push(`Linha ${indice + 1}: ${mensagem}`)
    }
  }

  if (preparados.length === 0 || motivos.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém linhas inválidas — nada foi gravado.',
      data: { motivos: motivos.length ? motivos : ['Nenhuma linha válida para importar.'] }
    })
  }

  const existentes = await query<Array<{ ano: number; versao: string }>>(
    'SELECT ano, versao FROM projetos_escopo'
  )
  const naBase = new Set(
    existentes.map((existente) => chaveAnoVersao(existente.ano, existente.versao))
  )
  const conflitos = preparados
    .filter((preparado) => naBase.has(chaveAnoVersao(preparado.ano, preparado.versao)))
    .map((preparado) => `${preparado.versao}/${preparado.ano}`)
  if (conflitos.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A importação contém anos/versões já cadastrados — nada foi gravado.',
      data: {
        motivos: conflitos.map((conflito) => `Escopo já cadastrado: ${conflito}.`),
        conflitos
      }
    })
  }

  const tx = await getTransaction()
  try {
    const codigos = await tx.query<Array<{ ano: number; codigo: string }>>(
      'SELECT ano, codigo FROM projetos_escopo'
    )
    const maiorPorAno = new Map<number, number>()
    for (const linha of codigos) {
      const match = /^PE-(\d{4})\.(\d+)$/.exec(texto(linha.codigo))
      if (!match) continue
      const ano = Number(match[1])
      maiorPorAno.set(ano, Math.max(maiorPorAno.get(ano) ?? 0, Number(match[2])))
    }

    for (const preparado of preparados) {
      const sequencia = (maiorPorAno.get(preparado.ano) ?? 0) + 1
      maiorPorAno.set(preparado.ano, sequencia)
      await tx.query(
        `INSERT INTO projetos_escopo
          (id, codigo, nome, versao, ano, data_inicio, data_final, data_previsao,
           data_publicacao, status, softwares_contemplados, descricao_geral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          gerarCodigo(preparado.ano, sequencia),
          preparado.nome,
          preparado.versao,
          preparado.ano,
          preparado.dataInicio,
          preparado.dataFinal,
          preparado.dataPrevisao,
          preparado.dataPublicacao,
          preparado.status,
          JSON.stringify([]),
          preparado.descricaoGeral
        ]
      )
    }
    await tx.commit()
  } catch (erro) {
    await tx.rollback().catch(() => {})
    if ((erro as { errno?: number } | null)?.errno === 1062) {
      erro409('A importação encontrou escopos em conflito — nada foi gravado.')
    }
    throw erro
  }

  return { importados: preparados.length }
}
