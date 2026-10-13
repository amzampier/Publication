<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { PlugZap, Send } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { PROVEDORES_SMTP, SEGURANCAS_SMTP, PORTAS_SMTP_VALIDAS } from '../../config/brasil'
import { type ConfigSmtpUsuario, type StatusSmtp } from './useUsuariosDemo'

// Bloco de configuração SMTP extraído do Formulario.vue (modal de Gestão de
// Usuários) para reuso na aba E-mail do Meu Perfil — mesma máquina de estados:
// segurança sugere a porta (flag impede sobrescrever porta digitada à mão),
// editar qualquer campo zera o Status e o teste é simulado (1.200 ms, sem rede).

interface Props {
  modelValue: ConfigSmtpUsuario
}

const props = defineProps<Props>()
const { toast } = useToast()

const enviarTeste = () => {
  if (!podeEnviar.value) return
  toast.info(
    'Configurações de E-mail',
    'E-mail de teste enviado em simulação - nenhuma requisição foi feita.'
  )
}

const emit = defineEmits<{
  (e: 'update:modelValue', valor: ConfigSmtpUsuario): void
  (e: 'change'): void
}>()

// Espelho local do objeto pai: edições mutam aqui e só então emitem
// update:modelValue — evita loop e permite guardar flags de edição à mão.
const interno = ref<ConfigSmtpUsuario>({ ...props.modelValue })

// Evita que os watchers de abertura (porta sugerida/reset do SMTP) rodem no
// bootstrap ou quando o dono substitui o objeto inteiro (abertura do modal,
// restauração do rascunho)
let inicializando = true
// Porta editada à mão depois da sugestão: segurança deixa de sobrescrever
let portaManual = false

// Timer do teste de SMTP (cancelado em substituição externa real e no unmount;
// NÃO é cancelado pelo eco do próprio v-model — ver ultimoEmitido)
let timer: ReturnType<typeof setTimeout> | null = null

const limparTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

// Último objeto emitido ao dono: permite ignorar no watcher de props o eco do
// próprio v-model (o dono grava a referência emitida em rascunho.smtp), que,
// sem essa guarda, chamava limparTimer a cada mutação e travava o teste em
// "Testando" (BUG-1)
let ultimoEmitido: ConfigSmtpUsuario | null = null

watch(
  () => props.modelValue,
  (novo) => {
    if (novo === ultimoEmitido) return
    inicializando = true
    limparTimer()
    portaManual = false
    interno.value = { ...novo }
    nextTick(() => {
      inicializando = false
    })
  },
  { immediate: true, deep: true }
)

// Segurança do SMTP sugere a porta (flag impede sobrescrever a porta digitada à mão)
watch(
  () => interno.value.seguranca,
  (seguranca) => {
    if (inicializando || portaManual) return
    const opcao = SEGURANCAS_SMTP.find((s) => s.value === seguranca)
    if (opcao) interno.value.porta = opcao.porta
  }
)

// Editar qualquer campo do bloco zera o Status e cancela um teste em andamento
watch(
  () => [
    interno.value.email,
    interno.value.senha,
    interno.value.provedor,
    interno.value.servidor,
    interno.value.porta,
    interno.value.seguranca
  ],
  () => {
    if (inicializando) return
    limparTimer()
    if (interno.value.status !== 'nao-testado') {
      interno.value.status = 'nao-testado'
    }
  }
)

// Qualquer mutação interna vira um novo objeto para o dono do rascunho
watch(
  interno,
  () => {
    if (inicializando) return
    ultimoEmitido = { ...interno.value }
    emit('update:modelValue', ultimoEmitido)
    emit('change')
  },
  { deep: true }
)

// --- Máquina de estados do SMTP (simulada, 1.200 ms, sem rede) ---
onBeforeUnmount(limparTimer)

const testando = computed(() => interno.value.status === 'testando')

const podeTestar = computed(() => {
  const s = interno.value
  return Boolean(s.servidor.trim() && s.porta.trim() && s.email.trim())
})

const podeEnviar = computed(() => interno.value.status === 'conectado')

const testarConexao = () => {
  if (!podeTestar.value || testando.value) return
  interno.value.status = 'testando'
  timer = setTimeout(() => {
    timer = null
    interno.value.status = PORTAS_SMTP_VALIDAS.includes(interno.value.porta.trim())
      ? 'conectado'
      : 'falha'
  }, 1200)
}

const SMTP_POR_STATUS: Record<
  StatusSmtp,
  { variant: 'neutral' | 'pending' | 'done' | 'blocked'; rotulo: string }
> = {
  'nao-testado': { variant: 'neutral', rotulo: 'Não testado' },
  testando: { variant: 'pending', rotulo: 'Testando' },
  conectado: { variant: 'done', rotulo: 'Conectado' },
  falha: { variant: 'blocked', rotulo: 'Falha' }
}

const statusSmtp = computed(() => SMTP_POR_STATUS[interno.value.status])
</script>

<template>
  <div class="grid gap-x-4 gap-y-[11px] sm:grid-cols-12">
    <UiInput
      v-model="interno.email"
      data-campo="smtp-email"
      class="sm:col-span-6"
      label="E-mail SMTP"
      type="email"
      placeholder="smtp@empresa.com.br"
    />
    <UiInput
      v-model="interno.senha"
      data-campo="smtp-senha"
      class="sm:col-span-6"
      label="Senha SMTP"
      type="password"
      placeholder="Senha da conta SMTP"
    />
    <UiSelect
      v-model="interno.provedor"
      data-campo="smtp-provedor"
      class="sm:col-span-3"
      label="Provedor"
      placeholder="Selecione o provedor..."
      :options="PROVEDORES_SMTP"
    />
    <UiInput
      v-model="interno.servidor"
      data-campo="smtp-servidor"
      class="sm:col-span-3"
      label="Servidor SMTP"
      placeholder="smtp.empresa.com.br"
    />
    <UiSelect
      v-model="interno.seguranca"
      data-campo="smtp-seguranca"
      class="sm:col-span-4"
      label="Segurança"
      placeholder="Selecione a segurança..."
      :options="SEGURANCAS_SMTP"
    />
    <UiInput
      v-model="interno.porta"
      data-campo="smtp-porta"
      class="sm:col-span-2"
      label="Porta"
      mask="9999"
      placeholder="587"
      @update:model-value="portaManual = true"
    />
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <UiButton
        variant="outline"
        size="sm"
        :disabled="!podeTestar || testando"
        @click="testarConexao"
      >
        <template #leftIcon><PlugZap class="h-3.5 w-3.5" /></template>
        Testar conexão
      </UiButton>
      <UiButton
        variant="outline"
        size="sm"
        :disabled="!podeEnviar || testando"
        @click="enviarTeste"
      >
        <template #leftIcon><Send class="h-3.5 w-3.5" /></template>
        Enviar teste
      </UiButton>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-[11px] font-medium text-slate-500">
        Status da Configuração
      </span>
      <UiBadge :variant="statusSmtp.variant" size="sm">
        {{ statusSmtp.rotulo }}
      </UiBadge>
    </div>
  </div>
</template>
