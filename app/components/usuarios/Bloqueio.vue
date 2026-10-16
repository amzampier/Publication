<script setup lang="ts">
// Modal de confirmação de Bloquear/Desbloquear usuário (apresentação pura — a
// página é dona do estado e da gravação via API; spec gestao-usuarios: a ação
// de linha abre a confirmação e alterna Ativo <-> Inativo).
import { computed } from 'vue'
import { Lock, LockOpen, ShieldAlert } from '@lucide/vue'
import type { UsuarioModelo } from './useUsuariosModelo'

interface Props {
  modelValue: boolean
  usuario: UsuarioModelo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar'): void
}>()

const bloqueando = computed(() => props.usuario?.status === 'Ativo')
const titulo = computed(() => (bloqueando.value ? 'Bloquear Usuário' : 'Desbloquear Usuário'))

const cancelar = () => emit('update:modelValue', false)
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="titulo"
    subtitle="Alteração de situação de acesso"
    :icon="bloqueando ? Lock : LockOpen"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UiModalSection title="Este usuário será afetado" :icon="ShieldAlert">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-900 break-words">
          {{ usuario?.nome }}
        </p>
        <p class="text-sm font-medium text-slate-900 break-words">
          {{ usuario?.email }}
        </p>
      </div>
      <p class="mt-3 flex items-start gap-2 text-xs" :class="bloqueando ? 'text-rose-700' : 'text-emerald-700'">
        <ShieldAlert class="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
        <span v-if="bloqueando">
          O usuário passará para Inativo: o login será recusado até ser desbloqueado.
        </span>
        <span v-else>
          O usuário voltará a Ativo e poderá autenticar normalmente.
        </span>
      </p>
    </UiModalSection>

    <template #footer>
      <UiButton variant="outline" size="md" @click="cancelar">Cancelar</UiButton>
      <UiButton
        :variant="bloqueando ? 'danger' : 'primary'"
        size="md"
        @click="emit('confirmar')"
      >
        <template #leftIcon>
          <component :is="bloqueando ? Lock : LockOpen" class="h-3.5 w-3.5" />
        </template>
        {{ bloqueando ? 'Bloquear' : 'Desbloquear' }}
      </UiButton>
    </template>
  </UiModal>
</template>
