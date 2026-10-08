<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { excluirPerfil, usePerfisDemo, type LinhaPerfil } from '../../components/perfis/usePerfisDemo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { perfis } = usePerfisDemo()

// Contrato da fase 1 (spec perfis-acesso): "Novo Perfil", "Editar" e "Permissões"
// ainda avisam por toast; "Excluir" abre o modal de confirmação direto.
const avisoProximaEtapa = (acao: string) => {
  toast.info('Perfis de Acesso (RBAC)', `${acao}: funcionalidade disponível na próxima etapa.`)
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
      <PerfisCabecalho @novo="avisoProximaEtapa('Novo Perfil')" />

      <PerfisKpis class="mt-6" />

      <PerfisTabela
        ref="tabelaRef"
        class="mt-5"
        @permissoes="avisoProximaEtapa('Configurar permissões')"
        @editar="avisoProximaEtapa('Editar perfil')"
        @excluir="abrirExclusao"
      />

      <PerfisExclusao
        v-model="exclusaoAberta"
        :perfil="perfilExcluir"
        @confirmar="confirmarExclusao"
      />
    </div>
  </div>
</template>
