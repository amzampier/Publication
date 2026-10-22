<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ExternalLink, Workflow } from '@lucide/vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarUsuario } from '../../composables/useAvatarUsuario'

const { usuario } = useAuth()
const { avatar, carregar } = useAvatarUsuario()

onMounted(() => {
  void carregar()
})

const iniciais = computed(() => {
  const nome = usuario.value?.nome?.trim() ?? ''
  if (!nome) return '?'
  const partes = nome.split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase()
  return `${partes[0]![0] ?? ''}${partes[partes.length - 1]![0] ?? ''}`.toUpperCase()
})

const abrirPortal = () => {
  window.open('/', '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-3">
    <div class="flex min-w-0 items-start gap-3">
      <div class="shrink-0 rounded-lg bg-brand-primary p-2 text-[#8b5cf6]">
        <Workflow class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-slate-900">Esteira de Revisão</h1>
        <p class="mt-1 max-w-3xl text-xs text-slate-500">
          Faça a conferência de chamadas técnicas, releases vinculadas e evidências de forma
          visual e ágil. Acompanhe o fluxo de
          <strong class="font-semibold text-slate-700">1. Revisar → 2. Aprovado → 3. Publicar</strong>
          para Releases Week, Manuais e Projetos de Escopo.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs sm:flex">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary text-[11px] font-bold text-white">
          <img v-if="avatar" :src="avatar" alt="" class="h-full w-full object-cover">
          <span v-else>{{ iniciais }}</span>
        </span>
        <div class="min-w-0">
          <p class="truncate text-[11px] font-semibold text-slate-800">
            {{ usuario?.nome || 'Usuário' }}
          </p>
          <p class="truncate text-[10px] text-slate-500">
            {{ usuario?.perfil || 'Revisor / QA' }}
          </p>
        </div>
      </div>

      <UiButton variant="outline" size="md" @click="abrirPortal">
        <template #leftIcon><ExternalLink class="h-4 w-4" /></template>
        Ver Portal Público
      </UiButton>
    </div>
  </header>
</template>
