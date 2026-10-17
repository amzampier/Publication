<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Database,
  LockOpen,
  RefreshCw,
  ShieldAlert,
  Gauge
} from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'
import type { ColumnDef } from '../../utils/dataGrid'

// Aba Segurança & Rate Limits — estado REAL (change seguranca-rate-limits-reais):
// constantes do servidor, contas com falhas/bloqueio, log append-only de
// eventos de login e o rate limit editável (rascunho donado pela página).
const props = defineProps<{
  limiteRequisicoesMinuto: number
  rateLimitAtivo: boolean
}>()

const emit = defineEmits<{
  (e: 'update:limiteRequisicoesMinuto', valor: number): void
  (e: 'update:rateLimitAtivo', valor: boolean): void
  (e: 'change'): void
}>()

const { toast } = useToast()

interface ContaSeguranca {
  id: string
  email: string
  tentativas: number
  bloqueadoAte: string | null
  minutosRestantes: number | null
}

interface EventoLogin {
  id: number
  ocorridoEm: string
  emailAlvo: string
  ip: string
  tipo: string
  tentativasAcumuladas: number | null
}

interface EstadoSeguranca {
  constantes: {
    tentativas_max: number
    janela_bloqueio_min: number
    limite_requisicoes_minuto: number
    rate_limit_ativo: boolean
  }
  contas: ContaSeguranca[]
  eventos: EventoLogin[]
}

const carregando = ref(true)
const estado = ref<EstadoSeguranca | null>(null)

const carregar = async () => {
  carregando.value = true
  try {
    estado.value = await useApiFetch<EstadoSeguranca>('/api/seguranca/estado')
  } catch {
    toast.danger(
      'Segurança & Rate Limits',
      'Não foi possível carregar o estado de segurança. Tente novamente.'
    )
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const liberar = async (conta: ContaSeguranca) => {
  try {
    // id vazio = bloqueio de e-mail inexistente (sem conta) — envia { email }
    await useApiFetch('/api/seguranca/liberar', {
      method: 'POST',
      body: conta.id ? { usuarioId: conta.id } : { email: conta.email }
    })
    toast.success(
      'Segurança & Rate Limits',
      conta.id
        ? `Conta ${conta.email} liberada.`
        : `Bloqueio de ${conta.email} liberado.`
    )
    await carregar()
  } catch {
    toast.danger(
      'Segurança & Rate Limits',
      `Não foi possível liberar ${conta.email}. Tente novamente.`
    )
  }
}

const atualizar = () => {
  if (!carregando.value) carregar()
}

// --- Rascunho do rate limit (donado pela página; salvo pelo Salvar global) ---
const limite = computed({
  get: () => props.limiteRequisicoesMinuto,
  set: (valor: number) => emit('update:limiteRequisicoesMinuto', valor)
})
const ativo = computed({
  get: () => props.rateLimitAtivo,
  set: (valor: boolean) => emit('update:rateLimitAtivo', valor)
})

const aoDigitarLimite = (valor: string | number) => {
  const bruto = Number(valor)
  // Mínimo 1: vazio/0/inválido não entra no rascunho (evita o 400 do PUT).
  limite.value = Number.isFinite(bruto) && bruto >= 1 ? bruto : 1
  emit('change')
}
watch(ativo, () => emit('change'))

// --- Formatações ---
const formatarQuando = (iso: string): string => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}

const statusConta = (conta: ContaSeguranca): string => {
  if (conta.minutosRestantes === null || !conta.bloqueadoAte) return 'Monitorando'
  const ate = new Date(conta.bloqueadoAte)
  const hh = String(ate.getHours()).padStart(2, '0')
  const mi = String(ate.getMinutes()).padStart(2, '0')
  return `Bloqueado até ${hh}:${mi} (restam ${conta.minutosRestantes} min)`
}

const VARIANTE_TIPO: Record<string, 'blocked' | 'pending' | 'inReview' | 'neutral' | 'done'> = {
  'senha-invalida': 'blocked',
  'email-inexistente': 'pending',
  'bloqueio-aplicado': 'blocked',
  'tentativa-bloqueado': 'inReview',
  'bloqueio-liberado': 'done'
}

const ROTULO_TIPO: Record<string, string> = {
  'senha-invalida': 'Senha inválida',
  'email-inexistente': 'E-mail inexistente',
  'bloqueio-aplicado': 'Bloqueio aplicado',
  'tentativa-bloqueado': 'Tentativa com conta bloqueada',
  'bloqueio-liberado': 'Bloqueio liberado'
}

// --- Colunas das tabelas (UiDataTable do kit) ---
const colunasContas: ColumnDef[] = [
  { id: 'email', header: 'E-mail', accessorKey: 'email', minWidth: 200 },
  { id: 'tentativas', header: 'Tentativas', accessorKey: 'tentativas', align: 'center', isNumeric: true, width: 100 },
  { id: 'status', header: 'Status / Expiração do Bloqueio', accessorKey: 'status', minWidth: 220 }
]

const colunasEventos: ColumnDef[] = [
  { id: 'quando', header: 'Quando', accessorKey: 'quando', width: 145 },
  { id: 'email', header: 'E-mail', accessorKey: 'emailAlvo', minWidth: 190 },
  { id: 'ip', header: 'IP', accessorKey: 'ip', width: 130 },
  { id: 'tipo', header: 'Tipo', accessorKey: 'tipo', minWidth: 170 },
  {
    id: 'tentativas',
    header: 'Tentativas',
    accessorKey: 'tentativasAcumuladas',
    align: 'center',
    isNumeric: true,
    width: 100
  }
]

const linhasContas = computed(() =>
  (estado.value?.contas ?? []).map((c) => ({ ...c, status: statusConta(c) }))
)
const linhasEventos = computed(() =>
  (estado.value?.eventos ?? []).map((e) => ({ ...e, quando: formatarQuando(e.ocorridoEm) }))
)
</script>

<template>
  <div>
    <UiLoading v-if="carregando && !estado" message="Carregando segurança…" />

    <div v-else>
      <!-- Cabeçalho do painel -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2.5">
            <ShieldAlert class="h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
            <h2 class="text-base font-bold text-slate-900 tracking-tight">
              Segurança de Rate Limits &amp; Bloqueio Temporário de 15 Minutos
            </h2>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Estado real do bloqueio de login (5 falhas consecutivas) e do rate limit por IP, com o
            log de tentativas.
          </p>
        </div>
        <button
          type="button"
          :disabled="carregando"
          class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus rounded disabled:opacity-50"
          @click="atualizar"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="carregando ? 'animate-spin motion-reduce:animate-none' : ''" aria-hidden="true" />
          Atualizar
        </button>
      </div>

      <!-- 1. Indicadores com as constantes do servidor -->
      <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Limite de tentativas falhas
          </p>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-3xl font-bold leading-none text-slate-900">
              {{ estado?.constantes.tentativas_max ?? '—' }}
            </span>
            <span class="text-xs text-slate-500">tentativas consecutivas</span>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Duração estrita do bloqueio
          </p>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-3xl font-bold leading-none text-rose-700">
              {{ estado?.constantes.janela_bloqueio_min ?? '—' }}
            </span>
            <span class="text-xs text-slate-500">minutos ininterruptos</span>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Limite de requisições
          </p>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-3xl font-bold leading-none text-slate-900">
              {{ estado?.constantes.limite_requisicoes_minuto ?? '—' }}
            </span>
            <span class="text-xs text-slate-500">por minuto · por IP</span>
          </div>
          <p class="mt-1 text-[11px] font-semibold uppercase tracking-wider"
             :class="estado?.constantes.rate_limit_ativo ? 'text-emerald-700' : 'text-slate-500'">
            {{ estado?.constantes.rate_limit_ativo ? 'Ativo' : 'Inativo' }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Chave de rastreio
          </p>
          <p class="mt-2 text-sm font-bold text-slate-900">
            Bloqueio: conta (e-mail) · Rate limit: IP
          </p>
          <p class="mt-1 text-xs italic text-slate-500">
            Proteção contra ataques de força bruta
          </p>
        </div>
      </div>

      <!-- 2. Contas em estado de segurança -->
      <div class="mt-6 flex items-center gap-2">
        <Database class="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <h3 class="text-xs font-bold text-slate-800">
          CONTAS EM ESTADO DE SEGURANÇA ({{ linhasContas.length }})
        </h3>
      </div>

      <UiDataTable
        v-if="linhasContas.length"
        class="mt-3"
        :data="linhasContas"
        :columns="colunasContas"
        :default-page-size="5"
        show-header-top
      >
        <template #cell(email)="{ value }">
          <span class="font-medium text-slate-800">{{ value }}</span>
        </template>
        <template #cell(tentativas)="{ value }">
          <UiBadge variant="blocked" size="sm" :show-icon="false">
            {{ value }} falha(s)
          </UiBadge>
        </template>
        <template #cell(status)="{ value }">
          <span :class="value === 'Monitorando' ? 'text-slate-500' : 'font-medium text-rose-700'">
            {{ value }}
          </span>
        </template>
        <template #actions="{ row }">
          <UiTooltip content="Liberar bloqueio" position="top">
            <button
              type="button"
              aria-label="Liberar bloqueio"
              class="inline-flex items-center justify-center rounded p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="liberar(row)"
            >
              <LockOpen class="h-4 w-4" />
            </button>
          </UiTooltip>
        </template>
      </UiDataTable>
      <p v-else class="mt-3 text-xs italic text-slate-500">
        Nenhuma conta em estado de segurança.
      </p>

      <!-- 3. Eventos de login (log append-only, somente leitura) -->
      <div class="mt-6 flex items-center gap-2">
        <Database class="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <h3 class="text-xs font-bold text-slate-800">
          EVENTOS DE LOGIN — ÚLTIMOS {{ linhasEventos.length }}
        </h3>
      </div>
      <p class="mt-1 text-[11px] text-slate-500">
        Registro imutável das tentativas (senha inválida, e-mail inexistente, bloqueio aplicado e
        tentativa com conta bloqueada) — sem edição ou exclusão.
      </p>

      <UiDataTable
        v-if="linhasEventos.length"
        class="mt-3"
        :data="linhasEventos"
        :columns="colunasEventos"
        :default-page-size="10"
        show-header-top
      >
        <template #cell(ip)="{ value }">
          <span class="font-mono">{{ value }}</span>
        </template>
        <template #cell(tipo)="{ value }">
          <UiBadge :variant="VARIANTE_TIPO[value] ?? 'neutral'" size="sm">
            {{ ROTULO_TIPO[value] ?? value }}
          </UiBadge>
        </template>
        <template #cell(tentativas)="{ value }">
          {{ value ?? '—' }}
        </template>
      </UiDataTable>
      <p v-else class="mt-3 text-xs italic text-slate-500">Nenhum evento registrado.</p>

      <!-- 4. Rate limit editável (rascunho → Salvar global) -->
      <div class="mt-6 flex items-center gap-2">
        <Gauge class="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <h3 class="text-xs font-bold text-slate-800">LIMITE DE REQUISIÇÕES</h3>
      </div>
      <div class="mt-3 grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
        <UiInput
          :model-value="String(limite)"
          type="number"
          label="Requisições por minuto"
          placeholder="120"
          @update:model-value="aoDigitarLimite"
        />
        <div class="pb-2">
          <UiSwitch v-model="ativo" label="Rate limit ativo" />
          <p class="mt-1 text-[11px] text-slate-500">
            Vale para as rotas de autenticação (janela de 1 minuto por IP). A alteração é gravada
            pelo "Salvar Alterações Globais" e passa a valer imediatamente.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
