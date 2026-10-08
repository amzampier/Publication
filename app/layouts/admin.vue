<script setup lang="ts">
import { onMounted } from 'vue'

// Estado em memória compartilhado com Configurações > Sidebar (ver docs/03)
// — o toggle do header e o cartão da aba escrevem na mesma fonte.
const { expandida: sidebarOpen, aplicarLarguraInicial, marcarPreferenciaManual } =
  useSidebarExpandida()

// Primeira carga: abaixo de lg a sidebar inicia recolhida (escolha manual prevalece).
onMounted(() => aplicarLarguraInicial())

const alternar = (valor: boolean) => {
  sidebarOpen.value = valor
  marcarPreferenciaManual()
}
</script>

<template>
  <div class="fp-shell h-dvh flex flex-col overflow-hidden">
    <LayoutAppHeader
      :sidebar-open="sidebarOpen"
      @update:sidebar-open="alternar($event)"
    />

    <div class="fp-shell-body flex flex-1 min-h-0">
      <LayoutAppSidebar :sidebar-open="sidebarOpen" />

      <!-- Backdrop do drawer (apenas abaixo de lg, quando a sidebar está expandida) -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
        aria-hidden="true"
        @click="alternar(false)"
      />

      <main
        class="fp-shell-content flex-1 overflow-y-auto scrollbar-discreta"
        style="background-color: #f8fafc"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
