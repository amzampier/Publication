<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'
import { Building, Image as ImageIcon } from '@lucide/vue'
import { useLogomarcaHeader } from '../../composables/useLogomarcaHeader'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'

// Avisa a página quando qualquer logo muda (habilita o botão "Salvar")
const emit = defineEmits<{
  (e: 'change'): void
}>()

// Logo do header vive também no shell (AppHeader) via estado compartilhado
const { caminho: caminhoHeaderGlobal, preview: previewHeaderGlobal } = useLogomarcaHeader()
const { caminho: caminhoLoginGlobal, preview: previewLoginGlobal } = useLogomarcaLogin()

// Estado em memória (fase 1 — sem persistência, sem chamada de rede)
// `preview*` alimenta a prévia da caixa de upload (dataURL — sobrevive à troca de aba);
// `logo*` é o CAMINHO gravado no banco.
const logoHeader = ref(caminhoHeaderGlobal.value)
const previewHeader = ref(previewHeaderGlobal.value)
const uploadKeyHeader = ref(0)

const logoLogin = ref(caminhoLoginGlobal.value)
const previewLogin = ref(previewLoginGlobal.value)
const uploadKeyLogin = ref(0)

const caminhoDe = (arquivo: File) =>
  `/uploads/logomarcas/${arquivo.name.replace(/\s+/g, '-')}`

const lerDataUrl = (arquivo: File, destino: Ref<string>) => {
  const leitor = new FileReader()
  leitor.onload = () => {
    destino.value = String(leitor.result ?? '')
  }
  leitor.readAsDataURL(arquivo)
}

// Upload → prévia local (dataURL) + caminho armazenado
const aoChangeHeader = (arquivos: File[] | null) => {
  if (!arquivos?.length) {
    logoHeader.value = ''
    previewHeader.value = ''
    uploadKeyHeader.value++
    return
  }
  logoHeader.value = caminhoDe(arquivos[0])
  lerDataUrl(arquivos[0], previewHeader)
}

const aoChangeLogin = (arquivos: File[] | null) => {
  if (!arquivos?.length) {
    logoLogin.value = ''
    previewLogin.value = ''
    uploadKeyLogin.value++
    return
  }
  logoLogin.value = caminhoDe(arquivos[0])
  lerDataUrl(arquivos[0], previewLogin)
}

// Edição manual do caminho
const aoEditHeader = (valor: string) => {
  const tinhaPrevia = !!previewHeader.value
  logoHeader.value = valor
  previewHeader.value = valor
  if (!valor && tinhaPrevia) uploadKeyHeader.value++
}

const aoEditLogin = (valor: string) => {
  const tinhaPrevia = !!previewLogin.value
  logoLogin.value = valor
  previewLogin.value = valor
  if (!valor && tinhaPrevia) uploadKeyLogin.value++
}

// Sincroniza o shell (AppHeader) e avisa a página sobre alterações
watch([logoHeader, previewHeader], () => {
  caminhoHeaderGlobal.value = logoHeader.value
  previewHeaderGlobal.value = previewHeader.value
  emit('change')
})

// Sincroniza o estado global (relatório de Auditoria) e avisa a página sobre alterações
watch([logoLogin, previewLogin], () => {
  caminhoLoginGlobal.value = logoLogin.value
  previewLoginGlobal.value = previewLogin.value
  emit('change')
})
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
          :disabled="previewHeader.startsWith('data:')"
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
          :disabled="previewLogin.startsWith('data:')"
          mono
          label="Caminho da imagem"
          placeholder="/uploads/logomarcas/logo-login.png"
          @update:model-value="aoEditLogin"
        />
      </section>
    </div>
  </div>
</template>
