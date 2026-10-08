<script setup lang="ts">
import { ArrowLeft, ShieldCheck } from '@lucide/vue'

// Página de erro standalone do Nuxt (fora de app.vue e dos layouts):
// mantém o status HTTP real e substitui a saída padrão do framework.
const error = useError()
const eh404 = computed(() => error.value?.statusCode === 404)

const titulo = computed(() => (eh404.value ? 'Página não encontrada' : 'Algo deu errado'))
const mensagem = computed(() =>
  eh404.value
    ? 'O endereço que você tentou acessar não existe ou foi movido. Use os botões abaixo para voltar à navegação.'
    : 'Ocorreu um erro inesperado ao processar a solicitação. Volte ao início e tente novamente em instantes.'
)

useHead({
  title: computed(() =>
    eh404.value ? 'Página não encontrada | Publications' : 'Erro | Publications'
  )
})

const voltarAoInicio = () => navigateTo('/')
const irParaAdmin = () => navigateTo('/admin')
</script>

<template>
  <main class="min-h-dvh bg-slate-50 font-sans flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xs p-8 text-center">
      <p class="font-mono font-bold text-brand-primary text-5xl leading-none tabular-nums">
        {{ error?.statusCode ?? 500 }}
      </p>

      <h1 class="mt-4 text-base font-bold text-slate-900 tracking-tight">
        {{ titulo }}
      </h1>

      <p class="mt-2 text-xs text-slate-500 leading-relaxed">
        {{ mensagem }}
      </p>

      <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
        <UiButton @click="voltarAoInicio">
          <template #leftIcon><ArrowLeft class="h-3.5 w-3.5" /></template>
          Voltar ao início
        </UiButton>
        <UiButton v-if="eh404" variant="outline" @click="irParaAdmin">
          <template #leftIcon><ShieldCheck class="h-3.5 w-3.5" /></template>
          Área Administrativa
        </UiButton>
      </div>

      <p class="mt-6 text-[11px] text-slate-400">
        Publications Design System · Nuxt 4 + Tailwind CSS
      </p>
    </div>
  </main>
</template>
