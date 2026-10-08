<script setup lang="ts">
import { nextTick, ref } from 'vue'
import {
  excluirPerfil,
  usePerfisDemo,
  type LinhaPerfil,
  type PerfilDemo,
  type ModoPerfis
} from '../../components/perfis/usePerfisDemo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { perfis } = usePerfisDemo()

// Coordenação do modal de permissões: a página é dona do estado (mesmo padrão dos
// demais modais desta tela). A ação Permissões (KeyRound) abre o modal com a matriz
// do perfil — sem toast de transição (spec perfis-acesso).
const permissoesAbertas = ref(false)
const perfilPermissoes = ref<PerfilDemo | null>(null)

const abrirPermissoes = (linha: LinhaPerfil) => {
  // O modal precisa da matriz completa - resolve por id na base.
  const registro = perfis.value.find((p) => p.id === linha.id)
  if (!registro) return
  perfilPermissoes.value = registro
  permissoesAbertas.value = true
}

// Coordenação do modal de cadastro/edição: a página é dona do estado (mesmo padrão
// de gestao-usuarios e do modal de exclusão desta tela).
const modalAberto = ref(false)
const modo = ref<ModoPerfis>('novo')
const perfilEditar = ref<PerfilDemo | null>(null)

const abrirNovo = () => {
  modo.value = 'novo'
  perfilEditar.value = null
  modalAberto.value = true
}

const abrirEdicao = (linha: LinhaPerfil) => {
  // O modal precisa do registro completo (timestamps, matriz) - resolve por id na base.
  const registro = perfis.value.find((p) => p.id === linha.id)
  if (!registro) return
  modo.value = 'editar'
  perfilEditar.value = registro
  modalAberto.value = true
}

// Coordenação do modal de exclusão: a página é dona do estado (mesmo padrão de
// gestao-usuarios).
const exclusaoAberta = ref(false)
const perfilExcluir = ref<LinhaPerfil | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

const abrirExclusao = (perfil: LinhaPerfil) => {
  perfilExcluir.value = perfil
  exclusaoAberta.value = true
}

// Guarda de vínculo na confirmação (spec perfis-acesso): perfil em uso não pode ser
// excluído — espelho da validação futura do banco (docs/02 §3.5). O modal fecha e o
// toast de bloqueio é o feedback; sem vínculos a remoção acontece.
const confirmarExclusao = () => {
  const alvo = perfilExcluir.value
  if (!alvo) return

  exclusaoAberta.value = false
  perfilExcluir.value = null

  if (alvo.usuarios > 0) {
    toast.warning(
      'Perfis de Acesso (RBAC)',
      `O perfil "${alvo.nome}" não pode ser excluído: existem usuários vinculados a ele.`
    )
    return
  }

  perfis.value = excluirPerfil(perfis.value, alvo.id).base
  toast.success('Perfis de Acesso (RBAC)', 'Perfil excluído com sucesso.')

  // O gatilho (Trash2) saiu do DOM com a linha: o UiModal devolve foco a um nó
  // detachado (no-op) e o próximo tick move o foco à busca da tabela.
  nextTick(() => tabelaRef.value?.focarBusca())
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
      <PerfisCabecalho @novo="abrirNovo" />

      <PerfisKpis class="mt-6" />

      <PerfisTabela
        ref="tabelaRef"
        class="mt-5"
        @permissoes="abrirPermissoes"
        @editar="abrirEdicao"
        @excluir="abrirExclusao"
      />

      <PerfisFormulario
        v-model="modalAberto"
        :modo="modo"
        :perfil="perfilEditar"
      />

      <PerfisPermissoes
        v-model="permissoesAbertas"
        :perfil="perfilPermissoes"
      />

      <PerfisExclusao
        v-model="exclusaoAberta"
        :perfil="perfilExcluir"
        @confirmar="confirmarExclusao"
      />
    </div>
  </div>
</template>
