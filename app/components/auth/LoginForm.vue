<script setup lang="ts">
import { ArrowRight, Eye, EyeOff, Lock, Mail } from '@lucide/vue'
import { COOKIE_EMAIL_LEMBRADO } from '../../utils/cookies'

interface Props {
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  submit: [payload: { email: string; senha: string; lembrar: boolean }]
}>()

const emailLembrado = useCookie<string | null>(COOKIE_EMAIL_LEMBRADO, {
  default: () => null
})

/*
 * Rótulos em cinza claro e sem negrito (pedido no card de login): `font-medium`
 * vence o `font-bold` base por ordem de emissão do Tailwind; `!text-slate-500`
 * é necessário porque `text-slate-700` vem depois no CSS — e é omitido no erro
 * para o rótulo manter o `text-rose-700` do kit (docs/01 §5.3).
 */
const labelClass = (temErro?: string) => (temErro ? 'font-medium' : 'font-medium !text-slate-500')

const email = ref(emailLembrado.value ?? '')
const senha = ref('')
const lembrar = ref(Boolean(emailLembrado.value))
const showPassword = ref(false)

// O olho só aparece com senha digitada; ao limpar o campo, volta a password.
watch(senha, (valor) => {
  if (!valor) showPassword.value = false
})

/*
 * O UiInput não expõe focus(): o foco no primeiro campo inválido resolve-se
 * pelo $el público do componente (instância pública via template ref).
 */
const emailRef = ref<{ $el?: Element } | null>(null)
const senhaRef = ref<{ $el?: Element } | null>(null)

const erros = reactive<{ email?: string; senha?: string }>({})

const emailValido = (valor: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}

const validar = () => {
  erros.email = undefined
  erros.senha = undefined

  if (!email.value.trim()) {
    erros.email = 'Informe o e-mail.'
  } else if (!emailValido(email.value)) {
    erros.email = 'Informe um e-mail válido.'
  }

  if (!senha.value) {
    erros.senha = 'Informe a senha.'
  }

  return !erros.email && !erros.senha
}

const focar = (campo: typeof emailRef) => {
  campo.value?.$el?.querySelector('input')?.focus()
}

const aoEnviar = async () => {
  if (!validar()) {
    /*
     * Foca apenas o primeiro campo inválido para que o tooltip apareça
     * só nele; os demais ficam com o contorno vermelho.
     */
    await nextTick()

    if (erros.email) focar(emailRef)
    else if (erros.senha) focar(senhaRef)

    return
  }

  emit('submit', {
    email: email.value.trim(),
    senha: senha.value,
    lembrar: lembrar.value
  })
}

const aoEsquecerSenha = async () => {
  // Fase 1: navega para a tela de recuperação (sem backend/e-mail real).
  await navigateTo('/admin/esqueci-senha')
}

watch(email, () => {
  if (erros.email) erros.email = undefined
})

watch(senha, () => {
  if (erros.senha) erros.senha = undefined
})
</script>

<template>
  <form
    class="space-y-4"
    novalidate
    @submit.prevent="aoEnviar"
  >
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

    <UiInput
      ref="senhaRef"
      v-model="senha"
      label="Senha"
      :label-class="labelClass(erros.senha)"
      :type="showPassword ? 'text' : 'password'"
      placeholder="Digite sua senha"
      autocomplete="current-password"
      :left-icon="Lock"
      :right-icon="senha ? (showPassword ? EyeOff : Eye) : null"
      :error="erros.senha"
      required
      @right-icon-click="showPassword = !showPassword"
    />

    <div class="flex items-center justify-between gap-3">
      <UiCheckbox
        v-model="lembrar"
        label="Lembrar-me"
        size="sm"
        label-class="!text-slate-500"
      />

      <button
        type="button"
        class="text-[11px] font-medium text-[#2161ef]
               transition hover:text-[#183b8c] hover:underline"
        @click="aoEsquecerSenha"
      >
        Esqueceu a senha?
      </button>
    </div>

    <UiButton
      type="submit"
      class="w-full"
      :loading="loading"
    >
      <template #leftIcon>
        <ArrowRight class="h-3.5 w-3.5" />
      </template>
      Entrar no Portal
    </UiButton>
  </form>
</template>
