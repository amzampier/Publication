<script setup lang="ts">
import { nextTick, ref } from 'vue'
import {
  excluirUsuario,
  useUsuariosDemo,
  type UsuarioDemo,
  type ModoUsuario
} from '../../components/usuarios/useUsuariosDemo'
import { useToast } from '../../composables/useToast'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { usuarios } = useUsuariosDemo()

// Coordenação dos modais (docs/06 §2): a página é dona do estado
const modalAberto = ref(false)
const modo = ref<ModoUsuario>('novo')
const usuarioAlvo = ref<UsuarioDemo | null>(null)

const exclusaoAberta = ref(false)
const usuarioExcluir = ref<UsuarioDemo | null>(null)
const tabelaRef = ref<{ focarBusca: () => void } | null>(null)

// Modal de filtros (docs/06 §3.7): a página é dona do estado, como os demais
const filtrosAbertos = ref(false)

// Modal de importação (docs/06): a página é dona do estado, como os demais
const importarAberto = ref(false)

// Modal de convite (docs/06 §5.7): a página é dona do estado, como os demais
const conviteAberto = ref(false)
const usuarioConvite = ref<UsuarioDemo | null>(null)

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

const confirmarExclusao = () => {
  const alvo = usuarioExcluir.value
  if (!alvo) return

  usuarios.value = excluirUsuario(usuarios.value, alvo.id).base
  exclusaoAberta.value = false
  usuarioExcluir.value = null
  toast.success('Gestão de Usuários', 'Usuário excluído com sucesso.')

  // O gatilho (Trash2) saiu do DOM com a linha: o UiModal devolve foco a um nó
  // detachado (no-op) e o próximo tick move o foco à busca da tabela (docs/06 §5.6)
  nextTick(() => tabelaRef.value?.focarBusca())
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
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

      <UsuariosFiltros v-model="filtrosAbertos" />

      <UsuariosImportar v-model="importarAberto" />

      <UsuariosConvite v-model="conviteAberto" :usuario="usuarioConvite" />
    </div>
  </div>
</template>
