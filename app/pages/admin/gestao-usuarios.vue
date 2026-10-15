<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import {
  excluirUsuario,
  alterarSituacaoUsuario,
  useUsuarios
} from '../../components/usuarios/useUsuarios'
import type { UsuarioDemo, ModoUsuario } from '../../components/usuarios/useUsuariosDemo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { usuarios, carregarUsuarios } = useUsuarios()

// Loading no F5 (padrão Meu Perfil/Configurações): `carregando` nasce true — o SSR
// renderiza só o overlay e o conteúdo só monta via v-else após a resposta, sem
// flash de KPIs/tabela vazios. Carga inicial pela API (spec gestao-usuarios):
// falha → toast de erro + lista vazia — nada de simular dados.
const carregando = ref(true)

onMounted(async () => {
  carregando.value = true
  const ok = await carregarUsuarios()
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Gestão de Usuários',
      'Não foi possível carregar os usuários. Verifique a conexão com o banco e recarregue a página.'
    )
  }
})

// Coordenação dos modais: a página é dona do estado
const modalAberto = ref(false)
const modo = ref<ModoUsuario>('novo')
const usuarioAlvo = ref<UsuarioDemo | null>(null)

const exclusaoAberta = ref(false)
const usuarioExcluir = ref<UsuarioDemo | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

// Modal de filtros: a página é dona do estado, como os demais
const filtrosAbertos = ref(false)

// Modal de importação: a página é dona do estado, como os demais
const importarAberto = ref(false)

// Modal de convite: a página é dona do estado, como os demais
const conviteAberto = ref(false)
const usuarioConvite = ref<UsuarioDemo | null>(null)

// Modal de bloqueio (Bloquear/Desbloquear real — spec gestao-usuarios)
const bloqueioAberto = ref(false)
const usuarioBloquear = ref<UsuarioDemo | null>(null)

const abrirConvite = (usuario: UsuarioDemo) => {
  usuarioConvite.value = usuario
  conviteAberto.value = true
}

const abrirNovo = () => {
  modo.value = 'novo'
  usuarioAlvo.value = null
  modalAberto.value = true
}

const abrirEdicao = (usuario: UsuarioDemo) => {
  modo.value = 'editar'
  usuarioAlvo.value = usuario
  modalAberto.value = true
}

const abrirExclusao = (usuario: UsuarioDemo) => {
  usuarioExcluir.value = usuario
  exclusaoAberta.value = true
}

const abrirBloqueio = (usuario: UsuarioDemo) => {
  usuarioBloquear.value = usuario
  bloqueioAberto.value = true
}

const confirmarExclusao = async () => {
  const alvo = usuarioExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  usuarioExcluir.value = null

  try {
    const { base } = await excluirUsuario(usuarios.value, alvo.id)
    usuarios.value = base
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
    const { base } = await alterarSituacaoUsuario(usuarios.value, alvo.id, destino)
    usuarios.value = base
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

      <UsuariosTabela
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
