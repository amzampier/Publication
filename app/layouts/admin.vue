<script setup lang="ts">
import { onMounted } from 'vue'

// Estado compartilhado com Configurações > Sidebar (ver docs/03)
// — o toggle do header e o cartão da aba escrevem na mesma fonte.
// useState ANTES do await (NUXT_E1001).
const { expandida: sidebarOpen, aplicarLarguraInicial, marcarPreferenciaManual } =
  useSidebarExpandida()

// Hidratação SSR das preferências salvas (logo, sidebar, sessões): o await no
// setup roda o GET /api/configuracoes durante o SSR (cookies encaminhados) e o
// estado vai no payload — o primeiro paint já sai com a logo e a sidebar
// recolhida, sem flash de defaults no F5 (bug da hidratação só em onMounted).
// Em falha do GET o loader devolve null e valem os defaults do seed.
// Shell e permissões são independentes: carregam em paralelo.
const permissoes = usePermissions()
await Promise.all([carregarShell(), permissoes.garantir()])

// Ajuste pela largura da viewport continua no cliente (o servidor não a
// conhece); com preferência salva o marcarPreferenciaManual já veio true no
// payload e o aplicarLarguraInicial respeita o banco sem sobrescrever.
onMounted(() => {
  aplicarLarguraInicial()
})

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
      <LayoutAppSidebar :sidebar-open="sidebarOpen" @fechar="alternar(false)" />

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
