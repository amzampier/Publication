<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Import, AlertTriangle, BetweenHorizontalEnd, LoaderCircle } from '@lucide/vue'
import { type ColumnDef } from '../../utils/dataGrid'
import {
  lerPlanilhaUsuarios,
  type LinhaImportacao,
  type SituacaoImportacao
} from './lerPlanilhaUsuarios'
import {
  variantePerfil,
  VARIANTE_POR_STATUS,
  type PerfilUsuario,
  type StatusUsuario,
  type RegistroImportacao
} from './useUsuariosModelo'
import { importarUsuarios, buscarEmailsBase, useUsuarios } from './useUsuarios'
import { useToast } from '../../composables/useToast'

// Modal de importação de usuários — aberto pelo botão "Importar" da toolbar da
// tabela (spec gestao-usuarios: upload do modelo docs/modelos, pré-visualização
// em tabela temporária com Situação, seleção de linhas prontas; o COMMIT vai à
// API — parse local + revalidação server-side + gravação persistente, design D4).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { toast } = useToast()
const { usuarios, carregarUsuarios, opcoes } = useUsuarios()

type LinhaSel = LinhaImportacao & { selecionada: boolean }

const linhas = ref<LinhaSel[]>([])
const erro = ref<string | null>(null)
/** Leitura/parsing da planilha (fase de arquivo). */
const processando = ref(false)
/** POST de importação em voo — mostra o painel de progresso dos registros. */
const importando = ref(false)

// Abertura sempre começa do zero (rascunho descartado no Cancelar/Escape/X)
watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      linhas.value = []
      erro.value = null
      processando.value = false
      importando.value = false
    }
  }
)

const aoSelecionar = async (arquivos: File[] | null) => {
  linhas.value = []
  erro.value = null
  if (!arquivos?.length) return
  processando.value = true
  try {
    const emailsBase = await buscarEmailsBase()
    const resultado = await lerPlanilhaUsuarios(arquivos[0]!, emailsBase, opcoes.value.perfis)
    if (resultado.erro) {
      erro.value = resultado.erro
      return
    }
    linhas.value = resultado.linhas.map((l) => ({
      ...l,
      selecionada: l.situacao === 'pronto'
    }))
  } catch {
    erro.value = 'Não foi possível validar a planilha. Tente novamente.'
  } finally {
    processando.value = false
  }
}

const contar = (s: SituacaoImportacao) => linhas.value.filter((l) => l.situacao === s).length

const prontas = computed(() => contar('pronto'))
const selecionadas = computed(() => linhas.value.filter((l) => l.selecionada))

const todosProntos = computed(
  () =>
    prontas.value > 0 &&
    linhas.value.filter((l) => l.situacao === 'pronto').every((l) => l.selecionada)
)
const algunsProntos = computed(() => selecionadas.value.length > 0 && !todosProntos.value)

const definirSelecao = (linha: LinhaSel, marcada: boolean) => {
  linha.selecionada = marcada
}

const alternarTodos = (marcado: boolean) => {
  for (const l of linhas.value) if (l.situacao === 'pronto') l.selecionada = marcado
}

const importar = async () => {
  const registros: RegistroImportacao[] = selecionadas.value.map((l) => ({
    nome: l.nome,
    email: l.email,
    perfil: l.perfil as PerfilUsuario,
    status: l.status as StatusUsuario
  }))
  if (!registros.length || processando.value || importando.value) return
  importando.value = true
  erro.value = null
  try {
    // Commit via API (D4): o servidor revalida contra o banco e grava em
    // transação (sentinel — importados não autenticam até o convite).
    const { importados } = await importarUsuarios(usuarios.value, registros)
    await carregarUsuarios(true)
    toast.success(
      'Gestão de Usuários',
      `${importados} usuário${importados === 1 ? '' : 's'} importado${importados === 1 ? '' : 's'} com sucesso.`
    )
    emit('update:modelValue', false)
  } catch (erroApi) {
    const e = erroApi as {
      statusMessage?: string
      data?: { statusMessage?: string; motivos?: string[]; conflitos?: string[] }
    }
    const conflitos = e?.data?.conflitos ?? []
    if (conflitos.length) {
      const mapa = new Set(conflitos.map((c) => c.trim().toLowerCase()))
      for (const l of linhas.value) {
        if (mapa.has(l.email.toLowerCase())) {
          l.situacao = 'ja-cadastrado'
          l.selecionada = false
          l.motivo = ''
        }
      }
      const restamSelecionadas = linhas.value.some((l) => l.selecionada)
      erro.value = restamSelecionadas
        ? null
        : e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível importar.'
    } else {
      const motivos = e?.data?.motivos
      const mensagem = e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível importar.'
      erro.value = motivos?.length ? [mensagem, ...motivos].join(' ') : mensagem
    }
  } finally {
    importando.value = false
  }
}

const fechar = () => emit('update:modelValue', false)

const VARIANTE_SITUACAO: Record<SituacaoImportacao, 'done' | 'pending' | 'neutral' | 'blocked'> = {
  pronto: 'done',
  'ja-cadastrado': 'pending',
  repetido: 'neutral',
  invalido: 'blocked'
}

const ROTULO_SITUACAO: Record<SituacaoImportacao, string> = {
  pronto: 'Pronto para importar',
  'ja-cadastrado': 'E-mail já cadastrado',
  repetido: 'Repetido no arquivo',
  invalido: 'Linha inválida'
}

const colunas: ColumnDef[] = [
  { id: 'selecao', header: '', accessorKey: 'situacao', width: 34, align: 'center' },
  { id: 'nome', header: 'Nome', accessorKey: 'nome', minWidth: 150 },
  { id: 'email', header: 'E-mail', accessorKey: 'email', minWidth: 195 },
  { id: 'perfil', header: 'Perfil', accessorKey: 'perfil', minWidth: 105 },
  { id: 'status', header: 'Status', accessorKey: 'status', minWidth: 90 },
  { id: 'situacao', header: 'Situação', accessorKey: 'situacao', minWidth: 155 }
]
</script>

<template>
  <UiModal
    :model-value="modelValue"
    size="lg"
    title="Importar Usuários"
    subtitle="Planilha modelo (.xlsx)"
    :icon="Import"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-4">
      <UiModalSection title="Planilha modelo" :icon="Import">
        <UiUploadFiles
          lista-separada
          rotulo="Arraste o arquivo aqui ou clique para selecionar"
          dica="Formatos aceitos: .xlsx"
          rotulo-lista="Arquivo selecionado"
          aceitar=".xlsx"
          :multiple="false"
          :mostrar-camera="false"
          @change="aoSelecionar"
        />
        <p v-if="processando" class="text-xs italic text-slate-500">Lendo planilha…</p>
        <div
          v-if="erro"
          role="alert"
          class="flex items-start gap-2 rounded-lg border border-rose-700 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700"
        >
          <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
          <span>{{ erro }}</span>
        </div>
      </UiModalSection>

      <!-- Durante o POST: painel de progresso lista os registros em voo
           (nenhum marcado como concluído antes da resposta da API) -->
      <UiModalSection
        v-if="importando && selecionadas.length"
        title="Importando registros"
        :icon="BetweenHorizontalEnd"
      >
        <div class="flex items-center gap-2 text-xs font-medium text-slate-700">
          <LoaderCircle
            class="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none text-brand-structure"
            aria-hidden="true"
          />
          Importando {{ selecionadas.length }} registro(s)…
        </div>
        <ul
          class="max-h-[240px] grid gap-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <li
            v-for="r in selecionadas"
            :key="r.email"
            class="flex items-center justify-between gap-3 text-xs"
          >
            <span class="min-w-0">
              <span class="font-medium text-slate-800">{{ r.nome }}</span>
              <span class="text-slate-500"> — {{ r.email }}</span>
            </span>
            <LoaderCircle
              class="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none text-brand-structure"
              aria-hidden="true"
            />
          </li>
        </ul>
        <p class="text-[11px] text-slate-500">
          Os registros são gravados em lote; nenhum é marcado como concluído até a confirmação
          do servidor.
        </p>
      </UiModalSection>

      <UiModalSection
        v-if="linhas.length && !importando"
        title="Pré-visualização da importação"
        :icon="BetweenHorizontalEnd"
      >
        <UiDataTable
          title="Linhas do arquivo"
          subtitle="Marque as linhas prontas para importar"
          :data="linhas"
          :columns="colunas"
          :default-page-size="10"
          show-header-top
        >
          <template #filtersLeft>
            <UiCheckbox
              size="sm"
              label="Selecionar todos os prontos"
              :model-value="todosProntos"
              :indeterminate="algunsProntos"
              :disabled="prontas === 0"
              @update:model-value="alternarTodos(Boolean($event))"
            />
          </template>

          <template #cell(selecao)="{ row }">
            <UiCheckbox
              size="sm"
              :aria-label="`Selecionar ${row.nome || row.email}`"
              :model-value="row.selecionada"
              :disabled="row.situacao !== 'pronto'"
              @update:model-value="definirSelecao(row, Boolean($event))"
            />
          </template>

          <template #cell(perfil)="{ value }">
            <UiBadge :variant="variantePerfil(value)" size="sm">
              {{ value }}
            </UiBadge>
          </template>

          <template #cell(status)="{ value }">
            <UiBadge :variant="VARIANTE_POR_STATUS[value as StatusUsuario]" size="sm">
              {{ value }}
            </UiBadge>
          </template>

          <template #cell(situacao)="{ row }">
            <div class="flex flex-col items-start gap-0.5">
              <UiBadge :variant="VARIANTE_SITUACAO[row.situacao as SituacaoImportacao]" size="sm">
                {{ ROTULO_SITUACAO[row.situacao as SituacaoImportacao] }}
              </UiBadge>
              <span v-if="row.motivo" class="text-[10px] font-medium text-rose-700">
                {{ row.motivo }}
              </span>
            </div>
          </template>
        </UiDataTable>
      </UiModalSection>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2.5">
        <span v-if="linhas.length" class="text-xs text-slate-500">
          {{ selecionadas.length }} de {{ linhas.length }} linha(s) selecionada(s)
        </span>
        <span v-else />
        <div class="flex items-center gap-2.5">
          <UiButton variant="outline" @click="fechar">Cancelar</UiButton>
          <UiButton
            variant="primary"
            :disabled="selecionadas.length === 0 || importando"
            :loading="importando"
            @click="importar"
          >
            Importar ({{ selecionadas.length }})
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
