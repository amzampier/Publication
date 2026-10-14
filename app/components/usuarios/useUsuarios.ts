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
  UsuarioDemo
} from './useUsuariosDemo'

/** Rascunho do modal de usuário: registro + senha provisória digitada no form. */
export type RascunhoUsuario = UsuarioDemo & { confirmarSenha?: string }

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
  base: UsuarioDemo[],
  rascunho: RascunhoUsuario,
  modo: ModoUsuario
): Promise<{ base: UsuarioDemo[]; usuario: UsuarioDemo }> => {
  let avatar = rascunho.avatar
  if (avatar.startsWith('data:')) {
    avatar = await enviarAvatar(avatar)
  }
  const corpo = corpoDoRascunho(rascunho, avatar)

  if (modo === 'novo') {
    const criado = await useApiFetch<UsuarioDemo>('/api/usuarios', {
      method: 'POST',
      body: corpo
    })
    return { base: [...base, criado], usuario: criado }
  }
  const atualizado = await useApiFetch<UsuarioDemo>(`/api/usuarios/${rascunho.id}`, {
    method: 'PUT',
    body: corpo
  })
  return { base: base.map((u) => (u.id === atualizado.id ? atualizado : u)), usuario: atualizado }
}

/** Remove o usuário via API (DELETE) e devolve a base sem ele. */
export const excluirUsuario = async (
  base: UsuarioDemo[],
  id: string
): Promise<{ base: UsuarioDemo[] }> => {
  await useApiFetch(`/api/usuarios/${id}`, { method: 'DELETE' })
  return { base: base.filter((u) => u.id !== id) }
}

/**
 * Bloquear (Ativo→Inativo) ou desbloquear (não Ativo→Ativo) via API; a
 * resposta substitui o registro na base (badge/KPIs acompanham).
 */
export const alterarSituacaoUsuario = async (
  base: UsuarioDemo[],
  id: string,
  situacao: StatusUsuario
): Promise<{ base: UsuarioDemo[] }> => {
  const atualizado = await useApiFetch<UsuarioDemo>(`/api/usuarios/${id}/situacao`, {
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
  _base: UsuarioDemo[],
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

export const useUsuarios = () => {
  // Base reativa compartilhada: inicia VAZIA (a carga preenche com o banco —
  // spec: nunca simular dados na falha).
  const usuarios = useState<UsuarioDemo[]>('usuarios-base', () => [])
  const carregando = useState<boolean>('usuarios-carregando', () => false)
  const carregado = useState<boolean>('usuarios-carregado', () => false)

  /**
   * Hidrata a base de GET /api/usuarios (idempotente; `forcar` refaz após
   * mutações em lote como a importação). Devolve false em falha (o chamador
   * mostra o toast; a lista fica vazia).
   */
  const carregarUsuarios = async (forcar = false): Promise<boolean> => {
    if (carregado.value && !forcar) return true
    if (carregando.value) return false
    carregando.value = true
    try {
      const lista = await useApiFetch<UsuarioDemo[]>('/api/usuarios')
      usuarios.value = Array.isArray(lista) ? lista : []
      carregado.value = true
      return true
    } catch {
      usuarios.value = []
      return false
    } finally {
      carregando.value = false
    }
  }

  // Filtros estruturais — em memória sobre o conjunto carregado (spec).
  const filtros = useState<FiltrosUsuarios>('usuarios-filtros', () => ({
    usuario: '',
    perfil: '',
    status: ''
  }))

  const usuariosFiltrados = computed<UsuarioDemo[]>(() => {
    const f = filtros.value
    return usuarios.value.filter((u) => {
      if (f.usuario && u.nome !== f.usuario) return false
      if (f.perfil && u.perfil !== f.perfil) return false
      if (f.status && u.status !== f.status) return false
      return true
    })
  })

  const filtrosAtivosCount = computed(() => {
    const f = filtros.value
    return [!!f.usuario, !!f.perfil, !!f.status].filter(Boolean).length
  })

  // Opções do select de Usuário derivam da BASE (não do conjunto filtrado).
  const opcoesUsuarios = computed(() =>
    [...new Set(usuarios.value.map((u) => u.nome))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  )

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
    limparFiltros
  }
}
