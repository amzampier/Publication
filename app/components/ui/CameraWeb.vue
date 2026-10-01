<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Camera, LogOut, AlertTriangle, RefreshCw, FlipHorizontal2 } from '@lucide/vue'
import Tooltip from './Tooltip.vue'

interface Props {
  autoIniciar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoIniciar: true
})

const emit = defineEmits<{
  (e: 'foto', dataUrl: string): void
  (e: 'fechar'): void
}>()

type Estado = 'ocioso' | 'carregando' | 'pronto' | 'erro'

const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const estado = ref<Estado>('ocioso')
const erro = ref('')
const cameras = ref<MediaDeviceInfo[]>([])
const deviceIdAtivo = ref('')
const aberto = ref(true)
const espelhado = ref(true)

const opcoesCamera = computed(() =>
  cameras.value.map((c, i) => ({ value: c.deviceId, label: c.label || `Câmera ${i + 1}` }))
)

async function solicitar(deviceId: string) {
  stream.value = await navigator.mediaDevices.getUserMedia(
    deviceId
      ? { video: { deviceId: { exact: deviceId } }, audio: false }
      : { video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false }
  )
  if (videoRef.value) {
    videoRef.value.srcObject = stream.value
    await videoRef.value.play()
  }
  estado.value = 'pronto'
}

async function listarCameras() {
  try {
    const dispositivos = await navigator.mediaDevices.enumerateDevices()
    cameras.value = dispositivos.filter(d => d.kind === 'videoinput')
    const atual = stream.value?.getVideoTracks()[0]?.getSettings().deviceId
    if (atual && !deviceIdAtivo.value) {
      deviceIdAtivo.value = atual
    }
  } catch {
    // enumerate indisponível: segue sem seletor
  }
}

async function iniciar() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    estado.value = 'erro'
    erro.value = 'Câmera indisponível neste navegador ou contexto (requer HTTPS).'
    return
  }
  estado.value = 'carregando'
  erro.value = ''
  parar()
  try {
    await solicitar(deviceIdAtivo.value)
  } catch {
    if (deviceIdAtivo.value) {
      // dispositivo escolhido indisponível: recua para qualquer câmera
      deviceIdAtivo.value = ''
      try {
        await solicitar('')
      } catch {
        estado.value = 'erro'
        erro.value = 'Permissão de câmera negada ou dispositivo indisponível.'
      }
    } else {
      estado.value = 'erro'
      erro.value = 'Permissão de câmera negada ou dispositivo indisponível.'
    }
  }
  const estadoAtual: string = estado.value
  if (estadoAtual === 'pronto') {
    await listarCameras()
  }
}

function trocarCamera(valor: string | number) {
  deviceIdAtivo.value = String(valor)
  iniciar()
}

function capturar() {
  const video = videoRef.value
  if (!video || estado.value !== 'pronto') return
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (espelhado.value) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  emit('foto', canvas.toDataURL('image/jpeg', 0.9))
}

function parar() {
  stream.value?.getTracks().forEach(track => track.stop())
  if (videoRef.value) videoRef.value.srcObject = null
  stream.value = null
}

function fechar() {
  aberto.value = false
}

watch(aberto, (visivel) => {
  if (!visivel) {
    parar()
    emit('fechar')
  }
})

onMounted(() => {
  if (props.autoIniciar) iniciar()
})

onBeforeUnmount(parar)
</script>

<template>
  <UiModal
    v-model="aberto"
    title="Câmera Web"
    subtitle="Captura de imagem"
    :icon="Camera"
    size="xs"
  >
    <UiModalSection title="Pré-visualização" :icon="Camera">
      <!-- Seletor de dispositivo de câmera -->
      <UiSelect
        v-if="cameras.length > 1"
        v-model="deviceIdAtivo"
        label="Câmera"
        placeholder="Selecione a câmera"
        :options="opcoesCamera"
        :clearable="false"
        @change="trocarCamera"
      />

      <!-- Visor -->
      <div class="relative aspect-video min-w-0 max-w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <video
          v-show="estado === 'pronto'"
          ref="videoRef"
          autoplay
          playsinline
          muted
          :class="['w-full h-full object-cover', espelhado ? 'scale-x-[-1]' : '']"
        />

        <div
          v-if="estado === 'carregando'"
          class="flex items-center gap-2 text-xs text-slate-300"
        >
          <RefreshCw class="h-4 w-4 animate-spin" />
          Solicitando acesso à câmera...
        </div>

        <div
          v-else-if="estado === 'ocioso'"
          class="flex flex-col items-center gap-3"
        >
          <Camera class="h-8 w-8 text-slate-600" />
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-brand-accent text-slate-950 text-xs font-semibold hover:bg-lime-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="iniciar"
          >
            Iniciar câmera
          </button>
        </div>

        <div
          v-else-if="estado === 'erro'"
          role="alert"
          class="flex flex-col items-center gap-3 px-6 text-center"
        >
          <span class="flex items-center gap-2 text-xs font-semibold text-rose-400">
            <AlertTriangle class="h-4 w-4" />
            {{ erro }}
          </span>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-brand-accent text-slate-950 text-xs font-semibold hover:bg-lime-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
            @click="iniciar"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </UiModalSection>

    <!-- Rodapé: ações com tooltip do sistema; Espelhar à esquerda, Capturar/Sair à direita -->
    <template #footer>
      <div class="flex w-full items-center justify-between gap-2.5">
        <Tooltip content="Espelhar imagem" position="top">
          <button
            type="button"
            aria-label="Espelhar imagem"
            :aria-pressed="espelhado"
            :class="[
              'p-1.5 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus',
              espelhado
                ? 'text-lime-700 bg-lime-100'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            ]"
            @click="espelhado = !espelhado"
          >
            <FlipHorizontal2 class="h-4 w-4" />
          </button>
        </Tooltip>

        <div class="flex items-center gap-2.5">
          <Tooltip content="Capturar foto" position="top">
            <button
              type="button"
              aria-label="Capturar foto"
              class="p-1.5 rounded-lg text-slate-700 hover:text-lime-700 hover:bg-lime-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              :disabled="estado !== 'pronto'"
              @click="capturar"
            >
              <Camera class="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="Sair" position="top">
            <button
              type="button"
              aria-label="Sair da câmera"
              class="p-1.5 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus"
              @click="fechar"
            >
              <LogOut class="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    </template>
  </UiModal>
</template>
