<script setup lang="ts">
import { ArrowLeft, Mail, MailCheck, Send } from '@lucide/vue'
import { useToast } from '../../composables/useToast'

/*
 * Formulário "Esqueci a senha" (change auth-backend-resend): chama
 * POST /api/auth/esqueci-senha. A API responde SEMPRE o mesmo estado
 * (anti-enumeração) — quando o e-mail existe, o servidor gera a provisória,
 * grava o hash e ENVIA POR E-MAIL (Resend); a senha nunca aparece na tela
 * (spec `login`: página /admin/esqueci-senha envia a senha provisória por
 * e-mail). O card de sucesso é genérico: mesma forma existe/não existe.
 */

const { toast } = useToast()

const email = ref('')
const carregando = ref(false)
const sucesso = ref(false)

const labelClass = (temErro?: string) => (temErro ? 'font-medium' : 'font-medium !text-slate-500')

const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())

const erros = reactive<{ email?: string }>({})

const emailRef = ref<{ $el?: Element } | null>(null)

const validar = () => {
  erros.email = undefined

  if (!email.value.trim()) {
    erros.email = 'Informe o e-mail.'
  } else if (!emailValido(email.value)) {
    erros.email = 'Informe um e-mail válido.'
  }

  return !erros.email
}

const aoEnviar = async () => {
  if (carregando.value) return
  if (!validar()) {
    await nextTick()
    if (erros.email) emailRef.value?.$el?.querySelector('input')?.focus()
    return
  }

  carregando.value = true
  try {
    await $fetch('/api/auth/esqueci-senha', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase() },
      credentials: 'include'
    })
    sucesso.value = true
  } catch (erro) {
    const status = (erro as { statusCode?: number })?.statusCode
    if (status === 400) {
      erros.email = (erro as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Informe um e-mail válido.'
      await nextTick()
      emailRef.value?.$el?.querySelector('input')?.focus()
    } else {
      toast.danger('Não foi possível enviar agora. Tente novamente em instantes.')
    }
  } finally {
    carregando.value = false
  }
}

const voltarLogin = async () => {
  await navigateTo('/admin/login')
}

const reenviar = () => {
  sucesso.value = false
}

watch(email, () => {
  if (erros.email) erros.email = undefined
})
</script>

<template>
  <form
    v-if="!sucesso"
    class="space-y-4"
    novalidate
    @submit.prevent="aoEnviar"
  >
    <p class="text-xs text-slate-500">
      Recuperar Acesso ao Portal
    </p>

    <UiInput
      ref="emailRef"
      v-model="email"
      label="E-mail"
      :label-class="labelClass(erros.email)"
      type="email"
      placeholder="voce@exemplo.com"
      autocomplete="username"
      :left-icon="Mail"
      :error="erros.email"
      required
    />

    <UiButton
      type="submit"
      class="w-full"
      :loading="carregando"
    >
      <template #leftIcon>
        <Send class="h-3.5 w-3.5" />
      </template>
      Enviar senha provisória
    </UiButton>

    <div>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-[11px] font-medium text-brand-structure
               transition hover:text-brand-primary hover:underline"
        @click="voltarLogin"
      >
        <ArrowLeft class="h-3 w-3" />
        Voltar ao login
      </button>
    </div>
  </form>

  <div
    v-else
    class="space-y-4 text-center"
  >
    <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-focus/10">
      <MailCheck class="h-5 w-5 text-brand-focus" />
    </div>

    <div class="space-y-1">
      <p class="text-sm font-medium text-slate-800">
        Verifique seu e-mail
      </p>
      <p class="text-xs text-slate-500">
        Se o e-mail informado estiver cadastrado no sistema, enviamos as
        instruções de recuperação com a senha provisória — mesma resposta
        para qualquer e-mail.
      </p>
    </div>

    <p class="text-[11px] text-slate-500">
      Use a senha recebida para entrar; a troca será exigida no primeiro acesso.
    </p>

    <UiButton
      class="w-full"
      @click="voltarLogin"
    >
      <template #leftIcon>
        <ArrowLeft class="h-3.5 w-3.5" />
      </template>
      Voltar ao login
    </UiButton>

    <button
      type="button"
      class="block w-full text-center text-[11px] font-medium text-brand-structure
             transition hover:text-brand-primary hover:underline"
      @click="reenviar"
    >
      Enviar para outro e-mail
    </button>
  </div>
</template>
