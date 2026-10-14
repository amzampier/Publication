<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, ShieldCheck } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'

// Troca de senha atômica via API (change auth-backend-resend, design D10):
// o cliente valida só a forma (presença, ≥8, confirmação) e o SERVIDOR confere
// a senha atual contra o hash bcrypt vigente — erro do servidor volta no campo.

const { toast } = useToast()

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

  if (!senhaAtual.value) {
    e.senhaAtual = 'Informe a senha atual.'
  }

  if (!novaSenha.value) {
    e.novaSenha = 'Informe a nova senha.'
  } else if (novaSenha.value.length < 8) {
    e.novaSenha = 'A senha deve ter pelo menos 8 caracteres.'
  }

  if (!confirmacao.value) {
    e.confirmacao = 'Confirme a nova senha.'
  } else if (novaSenha.value && novaSenha.value !== confirmacao.value) {
    e.confirmacao = 'As senhas não conferem.'
  }

  erros.value = e
  return Object.keys(e).length === 0
}

const salvarSenha = async () => {
  if (enviando.value) return
  if (!validarForma()) return

  enviando.value = true
  try {
    await useApiFetch('/api/auth/trocar-senha', {
      method: 'POST',
      body: { atual: senhaAtual.value, nova: novaSenha.value }
    })
    toast.success('Meu Perfil', 'Senha alterada com sucesso. Use-a no próximo login.')
    senhaAtual.value = ''
    novaSenha.value = ''
    confirmacao.value = ''
    erros.value = {}
    mostrarAtual.value = false
    mostrarNova.value = false
    mostrarConfirmacao.value = false
  } catch (erro) {
    const status = (erro as { statusCode?: number }).statusCode
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    if (status === 400) {
      // Erros do servidor mapeados ao campo correspondente (spec meu-perfil).
      if (mensagem?.includes('nova senha')) erros.value = { novaSenha: mensagem }
      else erros.value = { senhaAtual: mensagem ?? 'Senha atual incorreta.' }
    } else if (status === 401) {
      toast.danger('Sessão expirada. Faça login novamente para trocar a senha.')
    } else {
      toast.danger('Não foi possível alterar a senha. Verifique a conexão e tente novamente.')
    }
  } finally {
    enviando.value = false
  }
}

const limparErro = (campo: string) => {
  delete erros.value[campo]
}
</script>

<template>
  <section>
    <h2 class="text-sm font-bold text-slate-900">Alterar senha</h2>
    <p class="mt-0.5 text-xs text-slate-500">
      Ao trocar a senha, a nova passa a valer imediatamente no próximo login.
    </p>

    <!-- Filete verde da marca separando o cabeçalho dos campos -->
    <div class="mt-3 h-px bg-brand-accent" aria-hidden="true" />

    <!-- Layout em 2 colunas: senha atual ocupa a 1ª linha (à esquerda),
         nova senha e confirmação ficam lado a lado na 2ª linha -->
    <div class="mt-4 grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
      <UiInput
        v-model="senhaAtual"
        data-campo="senha-atual"
        label="Senha atual"
        :type="mostrarAtual ? 'text' : 'password'"
        placeholder="Digite sua senha atual"
        :right-icon="mostrarAtual ? EyeOff : Eye"
        :error="erros.senhaAtual"
        @right-icon-click="mostrarAtual = !mostrarAtual"
        @update:model-value="limparErro('senhaAtual')"
      />
      <!-- Espaçador: empurra nova senha e confirmação para a 2ª linha (só em 2 colunas) -->
      <div aria-hidden="true" class="hidden sm:block" />
      <UiInput
        v-model="novaSenha"
        data-campo="nova-senha"
        label="Nova senha"
        :type="mostrarNova ? 'text' : 'password'"
        placeholder="Mínimo de 8 caracteres"
        :right-icon="mostrarNova ? EyeOff : Eye"
        :error="erros.novaSenha"
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
        @right-icon-click="mostrarConfirmacao = !mostrarConfirmacao"
        @update:model-value="limparErro('confirmacao')"
      />
    </div>

    <div class="mt-5 flex justify-end">
      <UiButton variant="primary" size="md" :loading="enviando" @click="salvarSenha">
        <template #leftIcon><ShieldCheck class="h-4 w-4" /></template>
        Alterar senha
      </UiButton>
    </div>

    <!-- Dica de segurança (movida do resumo lateral para a aba) -->
    <div class="mt-6 flex gap-3 rounded-lg bg-slate-50 p-3.5">
      <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-focus">
        <ShieldCheck class="h-4 w-4" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="text-xs font-semibold text-slate-900">Sua conta está segura</p>
        <p class="mt-0.5 text-[11px] leading-snug text-slate-500">
          Utilize uma senha forte e mantenha seus dados sempre atualizados.
        </p>
      </div>
    </div>
  </section>
</template>
