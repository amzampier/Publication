// Estado e escritas da página de Gestão de Usuários sobre a API (change
// gestao-usuarios-backend, design D10): listagem carregada de GET /api/usuarios
// (sem seed — admin + contas convidadas), CRUD/importação/bloqueio via API e
// avatar como ARQUIVO (upload em 'avatares' antes de gravar a URL — D6).
// Filtros/KPIs/exportações continuam locais sobre o conjunto carregado (D8).
import { computed } from 'vue'
import { useState } from '#app'
import { useApiFetch } from '../../composables/useApiFetch'
import type {
  FiltrosUsuarios,
  ModoUsuario,
  RegistroImportacao,
  StatusUsuario,
  UsuarioModelo
} from './useUsuariosModelo'

/** Rascunho do modal de usuário: registro + senha provisória digitada no form. */
export type RascunhoUsuario = UsuarioModelo & { confirmarSenha?: string }

/**
 * Envia uma dataURL (upload/câmera) para o destino 'avatares' e devolve a URL
 * do arquivo gravado. Usada pelo modal de usuário e pelo Meu Perfil antes do
 * PATCH/POST — o registro guarda só o caminho (avatar_url).
 */
export async function enviarAvatar(dataUrl: string): Promise<string> {
  const [meta, dados] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] ?? 'image/png'
  const extensao = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png'
  const binario = atob(dados)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)

  const form = new FormData()
  form.append('pasta', 'avatares')
  form.append('file', new Blob([bytes], { type: mime }), `avatar.${extensao}`)
  const resp = await useApiFetch<{ url: string }>('/api/uploads', {
    method: 'POST',
    body: form
  })
  return resp.url
}

const corpoDoRascunho = (rascunho: RascunhoUsuario, avatar: string) => ({
  nome: rascunho.nome,
  email: rascunho.email,
  perfil: rascunho.perfil,
  situacao: rascunho.status,
  senha: rascunho.senha || undefined,
  telefone: rascunho.telefone,
  funcao: rascunho.funcao,
  departamento: rascunho.departamento,
  endereco: rascunho.endereco,
  smtp: rascunho.smtp,
  avatar
})

/**
 * Grava o rascunho via API: avatar dataURL vira arquivo (upload) antes; criação
 * (POST, 201) ou edição (PUT, 200). Senha vazia na edição mantém a vigente
 * (regra do servidor). Lança FetchError (400/404/409) para o chamador mapear.
 */
export const salvarUsuario = async (
  base: UsuarioModelo[],
  rascunho: RascunhoUsuario,
  modo: ModoUsuario
): Promise<{ base: UsuarioModelo[]; usuario: UsuarioModelo }> => {
  let avatar = rascunho.avatar
  if (avatar.startsWith('data:')) {
    avatar = await enviarAvatar(avatar)
  }
  const corpo = corpoDoRascunho(rascunho, avatar)

  if (modo === 'novo') {
    const criado = await useApiFetch<UsuarioModelo>('/api/usuarios', {
      method: 'POST',
      body: corpo
    })
    return { base: [...base, criado], usuario: criado }
  }
  const atualizado = await useApiFetch<UsuarioModelo>(`/api/usuarios/${rascunho.id}`, {
    method: 'PUT',
    body: corpo
  })
  return { base: base.map((u) => (u.id === atualizado.id ? atualizado : u)), usuario: atualizado }
}

/** Remove o usuário via API (DELETE) e devolve a base sem ele. */
export const excluirUsuario = async (
  base: UsuarioModelo[],
  id: string
): Promise<{ base: UsuarioModelo[] }> => {
  await useApiFetch(`/api/usuarios/${id}`, { method: 'DELETE' })
  return { base: base.filter((u) => u.id !== id) }
}

/**
 * Bloquear (Ativo→Inativo) ou desbloquear (não Ativo→Ativo) via API; a
 * resposta substitui o registro na base (badge/KPIs acompanham).
 */
export const alterarSituacaoUsuario = async (
  base: UsuarioModelo[],
  id: string,
  situacao: StatusUsuario
): Promise<{ base: UsuarioModelo[] }> => {
  const atualizado = await useApiFetch<UsuarioModelo>(`/api/usuarios/${id}/situacao`, {
    method: 'PUT',
    body: { situacao }
  })
  return { base: base.map((u) => (u.id === id ? atualizado : u)) }
}

/**
 * Envia as linhas selecionadas da planilha à API (revalidação server-side +
 * gravação em transação; o contrato da API usa `situacao` — design D4).
 * Devolve a contagem gravada; o chamador recarrega a lista
 * (`carregarUsuarios(true)`).
 */
export const importarUsuarios = async (
  _base: UsuarioModelo[],
  registros: RegistroImportacao[]
): Promise<{ importados: number }> => {
  const resp = await useApiFetch<{ importados: number }>('/api/usuarios/importar', {
    method: 'POST',
    body: {
      linhas: registros.map((r) => ({
        nome: r.nome,
        email: r.email,
        perfil: r.perfil,
        situacao: r.status
      }))
    }
  })
  return { importados: resp.importados }
}

/** Conjunto completo de e-mails da base (importação: pré-classificação). Lança em falha. */
export const buscarEmailsBase = async (): Promise<string[]> => {
  const resp = await useApiFetch<{ emails: string[] }>('/api/usuarios/emails')
  return Array.isArray(resp?.emails) ? resp.emails : []
}

export interface KpisUsuarios {
  total: number
  ativos: number
  inativos: number
  perfisDistintos: number
}

interface RespostaUsuariosApi {
  usuarios: UsuarioModelo[]
  total: number
  kpis: KpisUsuarios
  opcoes: { usuarios: string[]; perfis: string[] }
  pagina: number
  porPagina: number
}

export const POR_PAGINA_PADRAO = 20

export const useUsuarios = () => {
  const usuarios = useState<UsuarioModelo[]>('usuarios-base', () => [])
  const carregando = useState<boolean>('usuarios-carregando', () => false)
  const carregado = useState<boolean>('usuarios-carregado', () => false)

  // Filtros estruturais (agora no servidor — change paginacao-server-side-e-performance)
  const filtros = useState<FiltrosUsuarios>('usuarios-filtros', () => ({
    usuario: '',
    perfil: '',
    status: ''
  }))
  const pagina = useState<number>('usuarios-pagina', () => 1)
  const porPagina = useState<number>('usuarios-por-pagina', () => POR_PAGINA_PADRAO)
  const total = useState<number>('usuarios-total', () => 0)
  const kpis = useState<KpisUsuarios>('usuarios-kpis', () => ({
    total: 0,
    ativos: 0,
    inativos: 0,
    perfisDistintos: 0
  }))
  const opcoes = useState<{ usuarios: string[]; perfis: string[] }>('usuarios-opcoes', () => ({
    usuarios: [],
    perfis: []
  }))
  const busca = useState<string>('usuarios-busca', () => '')

  /** Carrega a página/filtros vigentes do servidor. Devolve false em falha. */
  const carregarUsuarios = async (_forcar = false): Promise<boolean> => {
    if (carregando.value) return false
    carregando.value = true
    try {
      const f = filtros.value
      const resposta = await useApiFetch<RespostaUsuariosApi>('/api/usuarios', {
        query: {
          usuario: f.usuario || undefined,
          perfil: f.perfil || undefined,
          status: f.status || undefined,
          busca: busca.value || undefined,
          pagina: pagina.value,
          porPagina: porPagina.value
        }
      })
      usuarios.value = Array.isArray(resposta?.usuarios) ? resposta.usuarios : []
      total.value = Number(resposta?.total ?? 0)
      kpis.value = resposta?.kpis ?? { total: 0, ativos: 0, inativos: 0, perfisDistintos: 0 }
      opcoes.value = {
        usuarios: resposta?.opcoes?.usuarios ?? [],
        perfis: resposta?.opcoes?.perfis ?? []
      }
      carregado.value = true
      return true
    } catch {
      usuarios.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  const aplicarFiltros = async (): Promise<void> => {
    pagina.value = 1
    await carregarUsuarios(true)
  }
  const irParaPagina = async (p: number): Promise<void> => {
    pagina.value = p
    await carregarUsuarios(true)
  }
  const mudarPorPagina = async (n: number): Promise<void> => {
    porPagina.value = n
    pagina.value = 1
    await carregarUsuarios(true)
  }
  const buscar = async (termo: string): Promise<void> => {
    busca.value = termo
    pagina.value = 1
    await carregarUsuarios(true)
  }

  /** Conjunto filtrado COMPLETO (todas as páginas) para CSV/PDF. */
  const buscarParaExportacao = async (): Promise<UsuarioModelo[]> => {
    const f = filtros.value
    const resposta = await useApiFetch<RespostaUsuariosApi>('/api/usuarios', {
      query: {
        usuario: f.usuario || undefined,
        perfil: f.perfil || undefined,
        status: f.status || undefined,
        busca: busca.value || undefined,
        exportar: '1'
      }
    })
    return Array.isArray(resposta?.usuarios) ? resposta.usuarios : []
  }

  const usuariosFiltrados = computed<UsuarioModelo[]>(() => usuarios.value)

  const filtrosAtivosCount = computed(() => {
    const f = filtros.value
    return [!!f.usuario, !!f.perfil, !!f.status].filter(Boolean).length
  })

  const opcoesUsuarios = computed(() => opcoes.value.usuarios)

  const limparFiltros = () => {
    filtros.value = { usuario: '', perfil: '', status: '' }
  }

  return {
    usuarios,
    carregando,
    carregado,
    carregarUsuarios,
    filtros,
    usuariosFiltrados,
    filtrosAtivosCount,
    opcoesUsuarios,
    limparFiltros,
    pagina,
    porPagina,
    total,
    kpis,
    opcoes,
    busca,
    aplicarFiltros,
    irParaPagina,
    mudarPorPagina,
    buscar,
    buscarParaExportacao
  }
}
