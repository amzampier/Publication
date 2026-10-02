<script setup lang="ts">
import { computed, watch } from 'vue'
import { Clock, Info } from '@lucide/vue'

interface Props {
  modelValue: number
}

const props = defineProps<Props>()

// Avisa a página quando os dias mudam (habilita o botão "Salvar")
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change'): void
}>()

watch(
  () => props.modelValue,
  () => emit('change')
)

const dias = computed({
  get: () => props.modelValue,
  set: (valor: number) => emit('update:modelValue', valor)
})

const atalhos = [30, 60, 90, 180, 365, 730]

const marks = [
  { value: 30, label: '30 dias (1 mês)' },
  { value: 90, label: '90 dias (Trimestre)' },
  { value: 180, label: '180 dias (Semestre)' },
  { value: 365, label: '365 dias (1 ano)' },
  { value: 730, label: '730 dias (2 anos)' }
]

const query = computed(
  () =>
    `DELETE FROM auditoria WHERE registrado_em < NOW() - INTERVAL ${props.modelValue} DAY`
)

// Seleção única: o chip ativo emite change(false) e é ignorado — sempre um valor vigente.
const marcarAtalho = (valor: number, marcado: boolean) => {
  if (marcado) dias.value = valor
}
</script>

<template>
  <div>
    <!-- Cabeçalho do painel: ícone + título (mesmo padrão da aba Segurança) -->
    <div class="flex items-center gap-2.5">
      <Clock class="h-5 w-5 shrink-0 text-[#0f7a06]" aria-hidden="true" />
      <h2 class="text-base font-bold text-slate-900 tracking-tight">
        Política de Retenção &amp; Expurgo de Logs de Auditoria
      </h2>
    </div>
    <p class="text-xs text-slate-500 mt-0.5">
      Registros com mais de <strong class="font-semibold text-slate-700">{{ dias }} dias</strong> são
      marcados para expurgo
    </p>

    <!-- Card interno: janela de retenção -->
    <div class="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50/60">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-700">Janela de Retenção Ativa</p>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Registros com mais de {{ dias }} dias são marcados para expurgo
          </p>
        </div>
        <div class="flex items-baseline gap-1.5 shrink-0">
          <span class="text-4xl font-bold font-mono tabular-nums text-[#0f7a06] leading-none">{{ dias }}</span>
          <span class="text-xs font-medium text-slate-500">dias</span>
        </div>
      </div>

      <div class="mt-4">
        <UiSlider
          v-model="dias"
          aria-label="Janela de retenção de logs de auditoria"
          :marks="marks"
        />
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <UiCheckChip
          v-for="n in atalhos"
          :key="n"
          :model-value="dias === n"
          :label="`${n} dias`"
          variant="slate"
          :show-check="false"
          @change="(marcado: boolean) => marcarAtalho(n, marcado)"
        />
      </div>
    </div>

    <!-- Banner informativo (markup de domínio — sem UiAlert no kit) -->
    <div class="mt-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <Info class="h-4 w-4 shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
      <div class="min-w-0">
        <p class="text-xs font-bold text-blue-900">Rotina de Expurgo Automático</p>
        <p class="text-[11px] text-blue-800 mt-1">
          Uma vez ao dia o sistema executa a rotina abaixo, marcando para expurgo os registros fora
          da janela:
        </p>
        <code
          class="mt-2 block overflow-x-auto rounded border border-blue-100 bg-white px-2 py-1 font-mono text-[9px] leading-relaxed text-slate-800"
        >{{ query }}</code>
      </div>
    </div>
  </div>
</template>
