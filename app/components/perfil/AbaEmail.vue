<script setup lang="ts">
import { computed } from 'vue'
import { Info } from '@lucide/vue'
import type { ConfigSmtpUsuario } from '../usuarios/useUsuariosModelo'

// Aba E-mail: consome o bloco compartilhado extraído do modal de usuários
// (UsuariosCamposSmtp) — mesma máquina de estados (porta sugerida, reset de
// status, teste simulado e badge).

interface Props {
  modelValue: ConfigSmtpUsuario
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', valor: ConfigSmtpUsuario): void
  (e: 'change'): void
}>()

const smtp = computed({
  get: () => props.modelValue,
  set: (valor: ConfigSmtpUsuario) => emit('update:modelValue', valor)
})
</script>

<template>
  <div class="grid gap-y-4">
    <section>
      <h2 class="text-sm font-bold text-slate-900">Configurações de E-mail</h2>
      <p class="mt-0.5 text-xs text-slate-500">
        Conta SMTP usada pelo sistema para enviar mensagens em seu nome.
      </p>

      <!-- Filete verde da marca separando o cabeçalho dos campos -->
      <div class="mt-3 h-px bg-brand-accent" aria-hidden="true" />

      <!-- Wrapper explícito: CamposSmtp tem 2 nós raiz (campos + ações), então a
           classe no componente seria descartada pelo fallthrough — o espaçamento
           fica no wrapper (mesmo efeito do UiModalSection no modal) -->
      <div class="mt-4 grid gap-4 [&>*]:min-w-0">
        <UsuariosCamposSmtp
          v-model="smtp"
          @change="emit('change')"
        />
      </div>

      <div class="mt-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info class="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
        <p class="text-xs leading-snug text-blue-900">
          A verificação de conexão confere a configuração informada e não envia
          mensagens.
        </p>
      </div>
    </section>
  </div>
</template>
