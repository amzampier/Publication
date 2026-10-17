<script setup lang="ts">
import { CalendarDays, Clock, Mail } from '@lucide/vue'
import { variantePerfil, VARIANTE_POR_STATUS, type PerfilUsuario, type StatusUsuario } from '../usuarios/useUsuariosModelo'

interface Props {
  nome: string
  email: string
  status: StatusUsuario
  perfil: PerfilUsuario
  ultimoAcessoTexto: string
  criadoEmTexto: string
}

defineProps<Props>()

const linhas = [
  { id: 'email', rotulo: 'E-mail', icone: Mail },
  { id: 'ultimoAcesso', rotulo: 'Último acesso', icone: Clock },
  { id: 'criadoEm', rotulo: 'Conta criada em', icone: CalendarDays }
]
</script>

<template>
  <div
    class="rounded-xl border border-slate-200 shadow-xs bg-gradient-to-b from-brand-structure/15 to-white"
  >
    <div class="flex flex-col items-center gap-3 px-5 pb-5 pt-6 text-center">
      <!-- Avatar em destaque (slot para pré-visualização do rascunho) -->
      <slot name="avatar" />

      <div class="min-w-0">
        <p class="text-base font-bold tracking-tight text-slate-900 break-words">{{ nome }}</p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <UiBadge :variant="VARIANTE_POR_STATUS[status]" size="sm">
            {{ status }}
          </UiBadge>
          <UiBadge :variant="variantePerfil(perfil)" size="sm">
            {{ perfil }}
          </UiBadge>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-100 px-5 py-4">
      <dl class="flex flex-col gap-3">
        <div v-for="linha in linhas" :key="linha.id" class="flex items-start gap-3 text-left">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <component :is="linha.icone" class="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <dt class="text-[11px] font-medium text-slate-500">{{ linha.rotulo }}</dt>
            <dd class="text-xs font-semibold text-slate-900 break-words">
              <template v-if="linha.id === 'email'">{{ email }}</template>
              <template v-else-if="linha.id === 'ultimoAcesso'">{{ ultimoAcessoTexto }}</template>
              <template v-else>{{ criadoEmTexto }}</template>
            </dd>
          </div>
        </div>
      </dl>
    </div>
  </div>
</template>
