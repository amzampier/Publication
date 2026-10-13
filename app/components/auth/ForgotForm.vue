<script setup lang="ts">
import { ArrowLeft, KeyRound, Mail, Send } from '@lucide/vue'
import { useUsuariosDemo } from '../usuarios/useUsuariosDemo'

/*
 * Formulário "Esqueci a senha" (fase 1, envio simulado — spec `login`:
 * requirement "A página /admin/esqueci-senha coleta o e-mail e envia a senha
 * provisória"). Tudo acontece no card: valida o e-mail, gera uma senha
 * provisória aleatória, grava-a como senha vigente do registro (quando o
 * e-mail existe na base demo) e troca o conteúdo do card pelo estado de
 * sucesso exibindo a senha — única forma de "entregar" o e-mail sem backend.
 *
 * Resposta genérica: o mesmo código roda para e-mail cadastrado ou não
 * (mesmo atraso, mesma forma, mesma senha exibida) — para não cadastrado a
 * senha simplesmente não autentica e o login responde com o erro genérico.
 */

const { usuarios } = useUsuariosDemo()

const email = ref('')
const carregando = ref(false)
const sucesso = ref(false)
const senhaProvisoria = ref('')

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

/*
 * Senha provisória aleatória de 12 caracteres (crypto.getRandomValues) sem
 * ambíguos visuais (0/O/1/l/I) — fase 1 gerada no cliente, sem backend.
 */
const gerarSenhaProvisoria = () => {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(12))
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('')
}

const aguardar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const aoEnviar = async () => {
  if (carregando.value) return
  if (!validar()) {
    await nextTick()
    if (erros.email) emailRef.value?.$el?.querySelector('input')?.focus()
    return
  }

  carregando.value = true
  // Simula a latência do envio para o botão exibir o estado de carregamento.
  await aguardar(600)

  const senha = gerarSenhaProvisoria()
  const alvo = usuarios.value.find((u) => u.email.toLowerCase() === email.value.trim().toLowerCase())
  if (alvo) alvo.senha = senha

  senhaProvisoria.value = senha
  sucesso.value = true
  carregando.value = false
}

const voltarLogin = async () => {
  await navigateTo('/admin/login')
}

const reenviar = () => {
  sucesso.value = false
  senhaProvisoria.value = ''
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
      Enviar link
    </UiButton>

    <div>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-[11px] font-medium text-[#2161ef]
               transition hover:text-[#183b8c] hover:underline"
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
      <KeyRound class="h-5 w-5 text-brand-focus" />
    </div>

    <div class="space-y-1">
      <p class="text-sm font-medium text-slate-800">
        Senha provisória gerada
      </p>
      <p class="text-xs text-slate-500">
        Se o e-mail informado estiver cadastrado, use a senha abaixo para entrar.
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <code class="select-all break-all font-mono text-sm font-medium text-slate-800">{{ senhaProvisoria }}</code>
    </div>

    <p class="text-[11px] text-slate-500">
      Ela substitui a senha atual deste cadastro enquanto estiver vigente.
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
      class="block w-full text-center text-[11px] font-medium text-[#2161ef]
             transition hover:text-[#183b8c] hover:underline"
      @click="reenviar"
    >
      Enviar para outro e-mail
    </button>
  </div>
</template>
