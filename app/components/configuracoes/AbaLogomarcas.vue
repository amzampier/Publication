<script setup lang="ts">
import { nextTick, ref, watch, type Ref } from 'vue'
import { Building, Image as ImageIcon } from '@lucide/vue'
import { useLogomarcaHeader } from '../../composables/useLogomarcaHeader'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useApiFetch } from '../../composables/useApiFetch'
import { useToast } from '../../composables/useToast'

// Avisa a página quando qualquer logo muda por ação do usuário (habilita o "Salvar")
const emit = defineEmits<{
  (e: 'change'): void
}>()

const { toast } = useToast()

// Logo do header vive também no shell (AppHeader) via estado compartilhado
const { caminho: caminhoHeaderGlobal, preview: previewHeaderGlobal } = useLogomarcaHeader()
const { caminho: caminhoLoginGlobal, preview: previewLoginGlobal } = useLogomarcaLogin()

// Estado hidratado pela página/layout (GET /api/configuracoes) via os composables.
// `preview*` alimenta a prévia da caixa de upload (URL servida ou dataURL local);
// `logo*` é o CAMINHO gravado no banco. `veioUpload*` marca que o valor atual veio
// do servidor (seleção de arquivo ou hidratação) — o campo de caminho fica
// desabilitado nesse caso; editável apenas quando vazio ou digitado à mão.
const logoHeader = ref(caminhoHeaderGlobal.value)
const previewHeader = ref(previewHeaderGlobal.value)
const veioUploadHeader = ref(!!caminhoHeaderGlobal.value)
const uploadKeyHeader = ref(0)

const logoLogin = ref(caminhoLoginGlobal.value)
const previewLogin = ref(previewLoginGlobal.value)
const veioUploadLogin = ref(!!caminhoLoginGlobal.value)
const uploadKeyLogin = ref(0)

// Evita que a sincronização servidor→aba dispare o `change` (hidratação não é
// alteração do usuário — o botão Salvar deve permanecer desabilitado no load).
const sincronizandoDoServidor = ref(false)

const lerDataUrl = (arquivo: File, destino: Ref<string>) => {
  const leitor = new FileReader()
  leitor.onload = () => {
    destino.value = String(leitor.result ?? '')
  }
  leitor.readAsDataURL(arquivo)
}

// Upload → POST /api/uploads (grava em uploads/logomarcas/) + prévia local
const enviarParaServidor = async (
  arquivo: File,
  destino: Ref<string>,
  preview: Ref<string>,
  veioUpload: Ref<boolean>,
  uploadKey: Ref<number>
) => {
  const form = new FormData()
  form.append('pasta', 'logomarcas')
  form.append('file', arquivo)
  try {
    const { url } = await useApiFetch<{ url: string }>('/api/uploads', { method: 'POST', body: form })
    destino.value = url
    veioUpload.value = true
    lerDataUrl(arquivo, preview)
  } catch (erro: any) {
    destino.value = ''
    preview.value = ''
    veioUpload.value = false
    uploadKey.value++
    toast.danger('Logomarcas', erro?.data?.statusMessage ?? 'Falha no upload da imagem. Tente novamente.')
  }
}

const aoChangeHeader = (arquivos: File[] | null) => {
  if (!arquivos?.length) {
    logoHeader.value = ''
    previewHeader.value = ''
    veioUploadHeader.value = false
    uploadKeyHeader.value++
    return
  }
  void enviarParaServidor(arquivos[0], logoHeader, previewHeader, veioUploadHeader, uploadKeyHeader)
}

const aoChangeLogin = (arquivos: File[] | null) => {
  if (!arquivos?.length) {
    logoLogin.value = ''
    previewLogin.value = ''
    veioUploadLogin.value = false
    uploadKeyLogin.value++
    return
  }
  void enviarParaServidor(arquivos[0], logoLogin, previewLogin, veioUploadLogin, uploadKeyLogin)
}

// Edição manual do caminho (permitida apenas quando o valor não veio do servidor)
const aoEditHeader = (valor: string) => {
  const tinhaPrevia = !!previewHeader.value
  logoHeader.value = valor
  previewHeader.value = valor
  veioUploadHeader.value = false
  if (!valor && tinhaPrevia) uploadKeyHeader.value++
}

const aoEditLogin = (valor: string) => {
  const tinhaPrevia = !!previewLogin.value
  logoLogin.value = valor
  previewLogin.value = valor
  veioUploadLogin.value = false
  if (!valor && tinhaPrevia) uploadKeyLogin.value++
}

// Local → shell (AppHeader) + avisa a página sobre alterações do USUÁRIO
watch([logoHeader, previewHeader], () => {
  caminhoHeaderGlobal.value = logoHeader.value
  previewHeaderGlobal.value = previewHeader.value
  if (!sincronizandoDoServidor.value) emit('change')
})

watch([logoLogin, previewLogin], () => {
  caminhoLoginGlobal.value = logoLogin.value
  previewLoginGlobal.value = previewLogin.value
  if (!sincronizandoDoServidor.value) emit('change')
})

// Shell → local (immediate): a aba monta antes do GET completar; sem este
// watch as refs locais ficariam vazias e as logos hidratadas nunca apareceriam
// no card. Valores vindos do servidor desabilitam o campo de caminho.
watch([caminhoHeaderGlobal, previewHeaderGlobal], ([caminho, preview]) => {
  if (caminho === logoHeader.value && preview === previewHeader.value) return
  sincronizandoDoServidor.value = true
  logoHeader.value = caminho
  previewHeader.value = preview
  veioUploadHeader.value = !!caminho
  nextTick(() => {
    sincronizandoDoServidor.value = false
  })
}, { immediate: true })

watch([caminhoLoginGlobal, previewLoginGlobal], ([caminho, preview]) => {
  if (caminho === logoLogin.value && preview === previewLogin.value) return
  sincronizandoDoServidor.value = true
  logoLogin.value = caminho
  previewLogin.value = preview
  veioUploadLogin.value = !!caminho
  nextTick(() => {
    sincronizandoDoServidor.value = false
  })
}, { immediate: true })
</script>

<template>
  <div>
    <!-- Cabeçalho do painel: ícone + título (mesmo padrão da aba Segurança) -->
    <div class="flex items-center gap-2.5">
      <ImageIcon class="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
      <h2 class="text-base font-bold text-slate-900 tracking-tight">
        Identidade Visual &amp; Logomarcas do Sistema
      </h2>
    </div>
    <p class="text-xs text-slate-500 mt-0.5">
      Busque a imagem ou informe o caminho que aparece no cabeçalho superior (header)
      e na tela de login.
    </p>

    <div class="border-b border-slate-100 mt-4 mb-5"></div>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Card: Logo do Header -->
      <section class="rounded-xl border border-slate-200 p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span
              class="rounded-lg bg-brand-structure/10 p-2 text-brand-structure shrink-0"
              aria-hidden="true"
            >
              <ImageIcon class="h-4 w-4" />
            </span>
            <h3 class="text-sm font-bold text-slate-900">
              Logo do Header / Barra Superior
            </h3>
          </div>
          <UiBadge
            :variant="logoHeader ? 'done' : 'neutral'"
            size="sm"
            class="shrink-0"
          >
            {{ logoHeader ? 'Personalizada' : 'Marca padrão' }}
          </UiBadge>
        </div>

        <UiUploadFiles
          :key="uploadKeyHeader"
          class="mt-4"
          rotulo="Buscar logomarca do header"
          dica="PNG, JPG ou SVG · arraste ou clique"
          sugestao="Proporção sugerida: 180 × 40 px"
          forma="retangular"
          aceitar="image/*"
          :mostrar-camera="false"
          :preview="previewHeader"
          alt="Logomarca do header"
          @change="aoChangeHeader"
        />

        <UiInput
          class="mt-3"
          :model-value="logoHeader"
          :disabled="veioUploadHeader"
          mono
          label="Caminho da imagem"
          placeholder="/uploads/logomarcas/logo-header.png"
          @update:model-value="aoEditHeader"
        />
      </section>

      <!-- Card: Logo da Tela de Login -->
      <section class="rounded-xl border border-slate-200 p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span
              class="rounded-lg bg-brand-structure/10 p-2 text-brand-structure shrink-0"
              aria-hidden="true"
            >
              <Building class="h-4 w-4" />
            </span>
            <h3 class="text-sm font-bold text-slate-900">
              Logo da Tela de Login / Autenticação
            </h3>
          </div>
          <UiBadge
            :variant="logoLogin ? 'done' : 'neutral'"
            size="sm"
            class="shrink-0"
          >
            {{ logoLogin ? 'Personalizada' : 'Marca padrão' }}
          </UiBadge>
        </div>

        <UiUploadFiles
          :key="uploadKeyLogin"
          class="mt-4"
          rotulo="Buscar logomarca do login"
          dica="PNG, JPG ou SVG · arraste ou clique"
          sugestao="Proporção sugerida: 240 × 80 px"
          forma="retangular"
          aceitar="image/*"
          :mostrar-camera="false"
          :preview="previewLogin"
          alt="Logomarca da tela de login"
          @change="aoChangeLogin"
        />

        <UiInput
          class="mt-3"
          :model-value="logoLogin"
          :disabled="veioUploadLogin"
          mono
          label="Caminho da imagem"
          placeholder="/uploads/logomarcas/logo-login.png"
          @update:model-value="aoEditLogin"
        />
      </section>
    </div>
  </div>
</template>
