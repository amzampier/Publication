<script setup lang="ts">
import { ref, watch } from 'vue'
import { Info } from '@lucide/vue'

// Rascunho compartilhado da página: este componente edita os campos de dados
// pessoais diretamente no objeto (mesmo padrão do modal de usuários) e valida
// no momento do Salvar (chamado via defineExpose pela página).

interface RascunhoDados {
  nome: string
  telefone: string
}

interface Props {
  rascunho: RascunhoDados
  /** Valores somente leitura preenchidos pelo administrador no cadastro */
  funcao: string
  departamento: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const erros = ref<Record<string, string>>({})

const validar = (): boolean => {
  const e: Record<string, string> = {}

  if (!props.rascunho.nome.trim()) e.nome = 'Informe o nome.'

  erros.value = e
  return Object.keys(e).length === 0
}

// Erros são persistentes mas acompanham o campo: some quando a regra volta a passar
watch(
  () => props.rascunho.nome,
  () => {
    if (erros.value.nome && props.rascunho.nome.trim()) delete erros.value.nome
  }
)

const aoEditar = () => emit('change')

defineExpose({ validar })
</script>

<template>
  <div class="grid gap-y-6">
    <section>
      <h2 class="text-sm font-bold text-slate-900">Informações pessoais</h2>
      <p class="mt-0.5 text-xs text-slate-500">
        Mantenha seus dados sempre atualizados.
      </p>
      <!-- Filete verde da marca separando o cabeçalho dos campos -->
      <div class="mt-3 h-px bg-brand-accent" aria-hidden="true" />
      <div class="mt-4 grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
        <UiInput
          v-model="rascunho.nome"
          data-campo="nome"
          label="Nome completo"
          placeholder="Nome completo"
          :error="erros.nome"
          @update:model-value="aoEditar"
        />
        <UiInput
          v-model="rascunho.telefone"
          data-campo="telefone"
          label="Telefone"
          mask="(99) 99999-9999"
          placeholder="(00) 00000-0000"
          @update:model-value="aoEditar"
        />
      </div>
    </section>

    <section>
      <h2 class="text-sm font-bold text-slate-900">Informações adicionais</h2>
      <p class="mt-0.5 text-xs text-slate-500">
        Dados complementares que podem ser utilizados pelo sistema.
      </p>
      <!-- Filete verde da marca separando o cabeçalho dos campos -->
      <div class="mt-3 h-px bg-brand-accent" aria-hidden="true" />
      <div class="mt-4 grid gap-x-4 gap-y-[11px] sm:grid-cols-2">
        <UiInput label="Cargo" :model-value="funcao || '—'" disabled placeholder="Não informado" />
        <UiInput label="Setor" :model-value="departamento || '—'" disabled placeholder="Não informado" />
      </div>
      <div class="mt-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info class="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
        <p class="text-xs leading-snug text-blue-900">
          As alterações serão aplicadas em todo o sistema e podem exigir um novo login
          para alguns serviços.
        </p>
      </div>
    </section>
  </div>
</template>
