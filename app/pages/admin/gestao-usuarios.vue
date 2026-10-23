<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import {
  excluirUsuario,
  alterarSituacaoUsuario,
  buscarUsuario,
  useUsuarios
} from '../../components/usuarios/useUsuarios'
import type { UsuarioModelo, ModoUsuario } from '../../components/usuarios/useUsuariosModelo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { mensagem, limpar } = useErroCarga()
const erroCarga = ref('')
const { usuarios, carregarUsuarios } = useUsuarios()

// Loading no F5 (padrão Meu Perfil/Configurações): `carregando` nasce true — o SSR
// renderiza só o overlay e o conteúdo só monta via v-else após a resposta, sem
// flash de KPIs/tabela vazios. Carga inicial pela API (spec gestao-usuarios):
// falha → toast de erro + lista vazia — nada de simular dados.
const carregando = ref(true)

const recarregar = async () => {
  carregando.value = true
  erroCarga.value = ''
  const ok = await carregarUsuarios(true)
  carregando.value = false
  if (!ok) {
    erroCarga.value = mensagem('os usuários')
    return
  }
  limpar()
}

onMounted(async () => {
  await recarregar()
  if (erroCarga.value) toast.danger('Gestão de Usuários', erroCarga.value)
})

// Coordenação dos modais: a página é dona do estado
const modalAberto = ref(false)
const modo = ref<ModoUsuario>('novo')
const usuarioAlvo = ref<UsuarioModelo | null>(null)

const exclusaoAberta = ref(false)
const usuarioExcluir = ref<UsuarioModelo | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

// Modal de filtros: a página é dona do estado, como os demais
const filtrosAbertos = ref(false)

// Modal de importação: a página é dona do estado, como os demais
const importarAberto = ref(false)

// Modal de convite: a página é dona do estado, como os demais
const conviteAberto = ref(false)
const usuarioConvite = ref<UsuarioModelo | null>(null)

// Modal de bloqueio (Bloquear/Desbloquear real — spec gestao-usuarios)
const bloqueioAberto = ref(false)
const usuarioBloquear = ref<UsuarioModelo | null>(null)

const abrirConvite = (usuario: UsuarioModelo) => {
  usuarioConvite.value = usuario
  conviteAberto.value = true
}

const abrirNovo = () => {
  modo.value = 'novo'
  usuarioAlvo.value = null
  modalAberto.value = true
}

const abrirEdicao = async (usuario: UsuarioModelo) => {
  modo.value = 'editar'
  // RL04 B-23: a listagem traz só as colunas exibidas — busca o detalhe por id.
  usuarioAlvo.value = await buscarUsuario(usuario.id).catch(() => usuario)
  modalAberto.value = true
}

const abrirExclusao = (usuario: UsuarioModelo) => {
  usuarioExcluir.value = usuario
  exclusaoAberta.value = true
}

const abrirBloqueio = (usuario: UsuarioModelo) => {
  usuarioBloquear.value = usuario
  bloqueioAberto.value = true
}

const confirmarExclusao = async () => {
  const alvo = usuarioExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  usuarioExcluir.value = null

  try {
    await excluirUsuario(usuarios.value, alvo.id)
    await carregarUsuarios(true)
    toast.success('Gestão de Usuários', 'Usuário excluído com sucesso.')
    // O gatilho (Trash2) saiu do DOM com a linha: o próximo tick move o foco
    // à busca da tabela.
    nextTick(() => tabelaRef.value?.focarBusca())
  } catch (erro) {
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    toast.danger(
      'Gestão de Usuários',
      mensagem ?? 'Não foi possível excluir o usuário. Tente novamente.'
    )
  }
}

const confirmarBloqueio = async () => {
  const alvo = usuarioBloquear.value
  if (!alvo) return

  bloqueioAberto.value = false
  usuarioBloquear.value = null

  try {
    const destino = alvo.status === 'Ativo' ? 'Inativo' : 'Ativo'
    await alterarSituacaoUsuario(usuarios.value, alvo.id, destino)
    await carregarUsuarios(true)
    toast.success(
      'Gestão de Usuários',
      destino === 'Inativo'
        ? `Usuário "${alvo.nome}" bloqueado (Inativo). O login foi recusado.`
        : `Usuário "${alvo.nome}" desbloqueado (Ativo).`
    )
  } catch (erro) {
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    toast.danger(
      'Gestão de Usuários',
      mensagem ?? 'Não foi possível alterar a situação do usuário.'
    )
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Loading no F5: enquanto o GET resolve, só o overlay (sem conteúdo parcial) -->
    <UiLoading v-if="carregando" message="Carregando usuários…" />

    <div v-else class="mx-auto max-w-7xl">
      <UsuariosCabecalho @novo="abrirNovo" />

      <UsuariosKpis class="mt-6" />

      <UiErrorState
        v-if="erroCarga"
        class="mt-5"
        :message="erroCarga"
        :retrying="carregando"
        @retry="recarregar"
      />

      <UsuariosTabela
        v-else
        ref="tabelaRef"
        class="mt-5"
        @filtros="filtrosAbertos = true"
        @editar="abrirEdicao"
        @excluir="abrirExclusao"
        @importar="importarAberto = true"
        @convite="abrirConvite"
        @bloquear="abrirBloqueio"
      />

      <UsuariosFormulario
        v-model="modalAberto"
        :modo="modo"
        :usuario="usuarioAlvo"
      />

      <UsuariosExclusao
        v-model="exclusaoAberta"
        :usuario="usuarioExcluir"
        @confirmar="confirmarExclusao"
      />

      <UsuariosBloqueio
        v-model="bloqueioAberto"
        :usuario="usuarioBloquear"
        @confirmar="confirmarBloqueio"
      />

      <UsuariosFiltros v-model="filtrosAbertos" />

      <UsuariosImportar v-model="importarAberto" />

      <UsuariosConvite v-model="conviteAberto" :usuario="usuarioConvite" />
    </div>
  </div>
</template>
