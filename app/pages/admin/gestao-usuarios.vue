<script setup lang="ts">
import { ref } from 'vue'
import type { UsuarioDemo, ModoUsuario } from '../../components/usuarios/useUsuariosDemo'

definePageMeta({ layout: 'admin' })

// Coordenação do modal único (docs/06 §2): a página é dona do estado
const modalAberto = ref(false)
const modo = ref<ModoUsuario>('novo')
const usuarioAlvo = ref<UsuarioDemo | null>(null)

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
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl">
      <UsuariosCabecalho @novo="abrirNovo" />

      <UsuariosKpis class="mt-6" />

      <UsuariosTabela class="mt-5" @editar="abrirEdicao" />

      <UsuariosFormulario
        v-model="modalAberto"
        :modo="modo"
        :usuario="usuarioAlvo"
      />
    </div>
  </div>
</template>
