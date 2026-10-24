<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, KeyRound } from '@lucide/vue'
import { navigateTo } from '#app'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'
import { useAuth } from '../../composables/useAuth'

// Primeiro acesso (change endurecer-banco-e-bootstrap): a sessão chegou marcada
// como provisória; o middleware bloqueia as demais rotas /admin/** até a troca.
// Reaproveita a rota POST /api/auth/trocar-senha (que limpa a flag e reemite o
// access). Após o sucesso, libera o estado local e segue para o painel.
const { toast } = useToast()
const { usuario } = useAuth()

const senhaAtual = ref('')
const novaSenha = ref('')
const confirmacao = ref('')
const erros = ref<Record<string, string>>({})
const mostrarAtual = ref(false)
const mostrarNova = ref(false)
const mostrarConfirmacao = ref(false)
const enviando = ref(false)

const validarForma = (): boolean => {
  const e: Record<string, string> = {}
  if (!senhaAtual.value) e.senhaAtual = 'Informe a senha provisória.'
  if (!novaSenha.value) e.novaSenha = 'Informe a nova senha.'
  else if (novaSenha.value.length < 8) e.novaSenha = 'A senha deve ter pelo menos 8 caracteres.'
  if (!confirmacao.value) e.confirmacao = 'Confirme a nova senha.'
  else if (novaSenha.value && novaSenha.value !== confirmacao.value) e.confirmacao = 'As senhas não conferem.'
  erros.value = e
  return Object.keys(e).length === 0
}

const limparErro = (campo: string) => {
  delete erros.value[campo]
}

const confirmar = async () => {
  if (enviando.value) return
  if (!validarForma()) return

  enviando.value = true
  try {
    await useApiFetch('/api/auth/trocar-senha', {
      method: 'POST',
      body: { atual: senhaAtual.value, nova: novaSenha.value }
    })
    if (usuario.value) usuario.value = { ...usuario.value, provisoria: false }
    toast.success('Primeiro acesso', 'Senha definida com sucesso.')
    await navigateTo('/admin')
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    if (status === 400) {
      if (mensagem?.includes('nova senha')) erros.value = { novaSenha: mensagem }
      else erros.value = { senhaAtual: mensagem ?? 'Senha provisória incorreta.' }
    } else if (status === 401) {
      toast.danger('Sessão expirada. Faça login novamente para definir a senha.')
      await navigateTo('/admin/login')
    } else {
      toast.danger('Não foi possível definir a senha. Verifique a conexão e tente novamente.')
    }
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section>
    <h1 class="text-sm font-bold text-slate-900">Defina sua nova senha</h1>
    <p class="mt-0.5 text-xs text-slate-500">
      Sua senha atual é provisória. Para continuar, escolha uma nova senha.
    </p>

    <div class="mt-4 grid gap-y-[11px]">
      <UiInput
        v-model="senhaAtual"
        data-campo="senha-provisoria"
        label="Senha provisória"
        :type="mostrarAtual ? 'text' : 'password'"
        placeholder="Digite a senha recebida"
        :right-icon="mostrarAtual ? EyeOff : Eye"
        :error="erros.senhaAtual"
        :right-icon-label="'Mostrar ou ocultar senha'"
        @right-icon-click="mostrarAtual = !mostrarAtual"
        @update:model-value="limparErro('senhaAtual')"
      />
      <UiInput
        v-model="novaSenha"
        data-campo="nova-senha"
        label="Nova senha"
        :type="mostrarNova ? 'text' : 'password'"
        placeholder="Mínimo de 8 caracteres"
        :right-icon="mostrarNova ? EyeOff : Eye"
        :error="erros.novaSenha"
        :right-icon-label="'Mostrar ou ocultar senha'"
        @right-icon-click="mostrarNova = !mostrarNova"
        @update:model-value="limparErro('novaSenha')"
      />
      <UiInput
        v-model="confirmacao"
        data-campo="confirmar-nova-senha"
        label="Confirmação da nova senha"
        :type="mostrarConfirmacao ? 'text' : 'password'"
        placeholder="Repita a nova senha"
        :right-icon="mostrarConfirmacao ? EyeOff : Eye"
        :error="erros.confirmacao"
        :right-icon-label="'Mostrar ou ocultar senha'"
        @right-icon-click="mostrarConfirmacao = !mostrarConfirmacao"
        @update:model-value="limparErro('confirmacao')"
      />
    </div>

    <div class="mt-5">
      <UiButton
        variant="primary"
        size="md"
        class="w-full"
        :loading="enviando"
        @click="confirmar"
      >
        <template #leftIcon><KeyRound class="h-4 w-4" /></template>
        Definir senha e continuar
      </UiButton>
    </div>
  </section>
</template>
