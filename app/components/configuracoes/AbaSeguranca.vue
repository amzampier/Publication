<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Database,
  LockOpen,
  RefreshCw,
  ShieldAlert
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import type { ColumnDef } from '../../utils/dataGrid'

const { toast } = useToast()

// Avisa a página quando a lista de registros muda (habilita o botão "Salvar")
const emit = defineEmits<{
  (e: 'change'): void
}>()

// Colunas do UiDataTable (padrão do kit — cabeçalho navy, agrupamento, paginação)
const colunas: ColumnDef[] = [
  { id: 'email', header: 'Identificador / E-mail', accessorKey: 'email', minWidth: 170 },
  { id: 'ip', header: 'IP de Origem', accessorKey: 'ip', minWidth: 120 },
  {
    id: 'tentativas',
    header: 'Tentativas',
    accessorKey: 'tentativas',
    align: 'center',
    isNumeric: true,
    width: 110
  },
  { id: 'status', header: 'Status / Expiração do Bloqueio', accessorKey: 'status', minWidth: 190 },
  { id: 'motivo', header: 'Motivo Registrado', accessorKey: 'motivo', minWidth: 240 }
]

interface RegistroRateLimit {
  id: number
  email: string
  ip: string
  tentativas: number
  status: string
  motivo: string
}

// Estado em memória (fase 1 — sem persistência, sem chamada de rede)
const registros = ref<RegistroRateLimit[]>([
  {
    id: 1,
    email: 'tentativa.suspeita@empresa.com.br',
    ip: '200.189.45.12',
    tentativas: 5,
    status: 'Monitorando (Desbloqueado)',
    motivo:
      'Bloqueio simulado para teste de conformidade da diretriz de segurança de acesso'
  }
])

const liberar = (id: number) => {
  registros.value = registros.value.filter((registro) => registro.id !== id)
}

const atualizar = () => {
  toast.info(
    'Segurança & Rate Limits',
    'Registros atualizados (apenas demonstração — sem persistência).'
  )
}

watch(registros, () => emit('change'), { deep: true })
</script>

<template>
  <div>
    <!-- Cabeçalho do painel: ícone + título + ações -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex items-center gap-2.5">
          <ShieldAlert class="h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
          <h2 class="text-base font-bold text-slate-900 tracking-tight">
            Segurança de Rate Limits &amp; Bloqueio Temporário de 30 Minutos
          </h2>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Definição da tabela segurança para bloqueio de operadores que erram sucessivamente e-mail ou senha.
        </p>
      </div>
    </div>

    <!-- Indicadores fixos do módulo -->
    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Limite de tentativas falhas
        </p>
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-3xl font-bold leading-none text-slate-900">5</span>
          <span class="text-xs text-slate-500">tentativas consecutivas</span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Duração estrita do bloqueio
        </p>
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-3xl font-bold leading-none text-rose-700">30</span>
          <span class="text-xs text-slate-500">minutos ininterruptos</span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Chave de rastreio
        </p>
        <p class="mt-2 text-sm font-bold text-slate-900">
          E-mail em Minúsculo + IP de Origem
        </p>
        <p class="mt-1 text-xs italic text-slate-400">
          Proteção contra ataques de força bruta
        </p>
      </div>
    </div>

    <!-- Cabeçalho da seção de registros -->
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Database class="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <h3 class="text-xs font-bold text-slate-800">
          REGISTROS ATIVOS NA TABELA
        </h3>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus rounded"
        @click="atualizar"
      >
        <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" />
        Atualizar
      </button>
    </div>

    <!-- Tabela de registros bloqueados — UiDataTable do kit (padrão cxGrid),
         com coluna "Ações" via slot para liberar o bloqueio -->
    <UiDataTable
      class="mt-3"
      :data="registros"
      :columns="colunas"
      :default-page-size="5"
      show-header-top
    >
      <template #cell(ip)="{ value }">
        <span class="font-mono">{{ value }}</span>
      </template>
      <template #cell(tentativas)="{ value }">
        <UiBadge variant="blocked" size="sm" :show-icon="false">
          {{ value }} falha(s)
        </UiBadge>
      </template>
      <template #cell(motivo)="{ value }">
        <span class="block max-w-[260px] truncate" :title="value">{{ value }}</span>
      </template>
      <template #actions="{ row }">
        <UiTooltip content="Liberar bloqueio" position="top">
          <button
            type="button"
            aria-label="Liberar bloqueio"
            class="inline-flex items-center justify-center rounded p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="liberar(row.id)"
          >
            <LockOpen class="h-4 w-4" />
          </button>
        </UiTooltip>
      </template>
    </UiDataTable>
  </div>
</template>
