<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Image } from '@lucide/vue'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'
import { useAvatarUsuario } from '../../composables/useAvatarUsuario'
import { enviarAvatar } from '../../components/usuarios/useUsuarios'
import {
  formatarDataHora,
  formatarUltimoAcesso,
  enderecoVazio,
  smtpVazio,
  type ConfigSmtpUsuario,
  type EnderecoUsuario,
  type UsuarioModelo
} from '../../components/usuarios/useUsuariosModelo'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
// Mantém o avatar do bloco Account (header) em sincronia ao salvar o perfil.
const { definir: definirAvatarHeader } = useAvatarUsuario()

// Registro REAL do logado (change gestao-usuarios-backend, design D7): lido de
// GET /api/usuarios/eu — sem espelho por e-mail na base demo; a aba Segurança
// continua autônoma (POST /api/auth/trocar-senha, change de auth).
const registro = ref<UsuarioModelo | null>(null)
const carregando = ref(true)
// Falha de carga (RL04 M-17): estado de erro com ação de tentar novamente.
const erroCarga = ref(false)

const carregarEu = async (): Promise<boolean> => {
  try {
    const eu = await useApiFetch<UsuarioModelo>('/api/usuarios/eu')
    registro.value = eu
    return true
  } catch {
    registro.value = null
    erroCarga.value = true
    return false
  }
}

const recarregar = async () => {
  carregando.value = true
  erroCarga.value = false
  const ok = await carregarEu()
  if (ok && registro.value) rascunho.value = clonar(registro.value)
  carregando.value = false
}

onMounted(async () => {
  carregando.value = true
  const ok = await carregarEu()
  if (ok && registro.value) rascunho.value = clonar(registro.value)
  carregando.value = false
  if (!ok) {
    toast.danger(
      'Meu Perfil',
      'Não foi possível carregar seu registro. Verifique a conexão e recarregue a página.'
    )
  }
})

// O e-mail não é editável aqui: fica só na leitura do resumo lateral
interface Rascunho {
  nome: string
  telefone: string
  avatar: string
  endereco: EnderecoUsuario
  smtp: ConfigSmtpUsuario
}

const clonar = (u: UsuarioModelo): Rascunho => ({
  nome: u.nome,
  telefone: u.telefone,
  avatar: u.avatar,
  endereco: { ...u.endereco },
  smtp: { ...u.smtp }
})

const rascunho = ref<Rascunho>({
  nome: '',
  telefone: '',
  avatar: '',
  endereco: enderecoVazio(),
  smtp: smtpVazio()
})

// Aba padrão: Dados Pessoais
const aba = ref('dados')
// Botão "Salvar alterações" fica desabilitado até qualquer painel alterar o rascunho
const alterado = ref(false)
const salvando = ref(false)

const abaDadosRef = ref<{ validar: () => boolean } | null>(null)

const aoAlterar = () => {
  alterado.value = true
}

const salvar = async () => {
  if (!registro.value || salvando.value) return
  // Validação de dados pessoais acontece na aba dela — volta para lá se preciso
  if (aba.value !== 'dados') {
    aba.value = 'dados'
    await nextTick()
  }
  if (!abaDadosRef.value?.validar()) return

  salvando.value = true
  try {
    // Avatar: dataURL nova vira ARQUIVO (upload em 'avatares') antes do PATCH;
    // '' remove a foto; caminho existente é enviado igual (sem re-upload — D6).
    let avatar: string = rascunho.value.avatar
    if (avatar.startsWith('data:')) {
      avatar = await enviarAvatar(avatar)
    }

    const atualizado = await useApiFetch<UsuarioModelo>('/api/usuarios/eu', {
      method: 'PATCH',
      body: {
        nome: rascunho.value.nome.trim(),
        telefone: rascunho.value.telefone,
        endereco: rascunho.value.endereco,
        smtp: rascunho.value.smtp,
        avatar
      }
    })
    registro.value = atualizado
    rascunho.value = clonar(atualizado)
    definirAvatarHeader(atualizado.avatar)
    toast.success('Meu Perfil', 'As alterações foram salvas com sucesso.')
    alterado.value = false
  } catch (erro) {
    const mensagem = (erro as { data?: { statusMessage?: string } }).data?.statusMessage
    toast.danger(
      'Meu Perfil',
      mensagem ?? 'Não foi possível salvar as alterações. Tente novamente.'
    )
  } finally {
    salvando.value = false
  }
}

const cancelar = () => {
  if (!registro.value) return
  rascunho.value = clonar(registro.value)
  alterado.value = false
}


// --- Fluxo de foto (lápis / "Alterar foto") ---
const fotoAberta = ref(false)
const cameraAberta = ref(false)

const abrirFoto = () => {
  fotoAberta.value = true
}

const aoTrocarAvatar = (arquivos: File[] | null) => {
  if (!arquivos || !arquivos.length) {
    rascunho.value.avatar = ''
    aoAlterar()
    return
  }
  const imagem = arquivos[0]
  if (!imagem || !imagem.type.startsWith('image/')) return
  const leitor = new FileReader()
  leitor.onload = () => {
    rascunho.value.avatar = String(leitor.result)
    aoAlterar()
  }
  leitor.readAsDataURL(imagem)
}

const aoFotoCapturada = (dataUrl: string) => {
  rascunho.value.avatar = dataUrl
  cameraAberta.value = false
  fotoAberta.value = false
  aoAlterar()
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Carregamento do registro: overlay do kit enquanto GET /api/usuarios/eu está em voo -->
    <UiLoading v-if="carregando" message="Carregando seu perfil…" />

    <div v-if="!carregando && !registro && erroCarga" class="mx-auto max-w-2xl">
      <div class="rounded-xl border border-rose-200 bg-rose-50/60 p-6 text-center">
        <p class="text-sm font-semibold text-rose-700">Não foi possível carregar seu perfil.</p>
        <p class="mt-1 text-xs text-rose-700/80">Verifique sua conexão e tente novamente.</p>
        <UiButton class="mt-4" variant="primary" @click="recarregar">Tentar novamente</UiButton>
      </div>
    </div>

    <div v-if="registro" class="mx-auto max-w-6xl">
      <PerfilCabecalho class="mb-6" />

      <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
        <PerfilResumo
          :nome="rascunho.nome || registro.nome"
          :email="registro.email"
          :status="registro.status"
          :perfil="registro.perfil"
          :ultimo-acesso-texto="formatarUltimoAcesso(registro.ultimoAcesso)"
          :criado-em-texto="formatarDataHora(registro.dataCadastro)"
        >
          <template #avatar>
            <PerfilAvatar
              :nome="rascunho.nome || registro.nome"
              :preview="rascunho.avatar"
              @alterar-foto="abrirFoto"
            />
          </template>
        </PerfilResumo>

        <PerfilAbas
          v-model="aba"
          :desabilitado="!alterado"
          :salvando="salvando"
          @salvar="salvar"
          @cancelar="cancelar"
        >
          <PerfilAbaDadosPessoais
            v-if="aba === 'dados'"
            ref="abaDadosRef"
            :rascunho="rascunho"
            :funcao="registro.funcao"
            :departamento="registro.departamento"
            @change="aoAlterar"
          />
          <PerfilAbaSeguranca
            v-else-if="aba === 'seguranca'"
          />
          <PerfilAbaEndereco
            v-else-if="aba === 'endereco'"
            :endereco="rascunho.endereco"
            @change="aoAlterar"
          />
          <PerfilAbaEmail
            v-else
            v-model="rascunho.smtp"
            @change="aoAlterar"
          />
        </PerfilAbas>
      </div>

      <!-- Modal da troca de foto: UploadFiles circular + câmera web -->
      <UiModal
        v-model="fotoAberta"
        title="Alterar foto do perfil"
        subtitle="Envie um arquivo ou tire uma foto com a câmera"
        :icon="Image"
        size="sm"
      >
        <UiUploadFiles
          forma="circular"
          compacto
          rotulo="Foto do perfil"
          dica="PNG ou JPG"
          aceitar="image/*"
          :preview="rascunho.avatar"
          alt="Foto do perfil"
          @change="aoTrocarAvatar"
          @camera="cameraAberta = true"
        />
      </UiModal>

      <UiCameraWeb
        v-if="cameraAberta"
        @foto="aoFotoCapturada"
        @fechar="cameraAberta = false"
      />
    </div>
  </div>
</template>
