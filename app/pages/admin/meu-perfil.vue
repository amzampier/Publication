<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Image } from '@lucide/vue'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import {
  useUsuariosDemo,
  formatarDataHora,
  formatarUltimoAcesso,
  type ConfigSmtpUsuario,
  type EnderecoUsuario,
  type UsuarioDemo
} from '../../components/usuarios/useUsuariosDemo'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { usuario } = useAuth()
const { usuarios } = useUsuariosDemo()

// Registro da tela: a sessão real traz id/nome/email/perfil do banco; o
// espelho de tela (telefone/SMTP/endereço/datas) continua na base demo e é
// resolvido por E-MAIL — os ids da sessão (UUID) não são os ids demo u-00x.
const registro = computed<UsuarioDemo | null>(() => {
  const u = usuario.value
  if (!u) return null
  return usuarios.value.find((reg) => reg.email.toLowerCase() === u.email.toLowerCase()) ?? null
})

// Rascunho em memória clonado do registro (fase 1 - sem backend)
// O e-mail não é editável aqui: fica só na leitura do resumo lateral
interface Rascunho {
  nome: string
  telefone: string
  avatar: string
  endereco: EnderecoUsuario
  smtp: ConfigSmtpUsuario
}

const clonar = (u: UsuarioDemo): Rascunho => ({
  nome: u.nome,
  telefone: u.telefone,
  avatar: u.avatar,
  endereco: { ...u.endereco },
  smtp: { ...u.smtp }
})

const rascunho = ref<Rascunho>(registro.value ? clonar(registro.value) : {
  nome: '',
  telefone: '',
  avatar: '',
  endereco: {} as EnderecoUsuario,
  smtp: {} as ConfigSmtpUsuario
})

// Aba padrão: Dados Pessoais
const aba = ref('dados')
// Botão "Salvar alterações" fica desabilitado até qualquer painel alterar o rascunho
const alterado = ref(false)

const abaDadosRef = ref<{ validar: () => boolean } | null>(null)

const aoAlterar = () => {
  alterado.value = true
}

const salvar = async () => {
  if (!registro.value) return
  // Validação de dados pessoais acontece na aba dela — volta para lá se preciso
  if (aba.value !== 'dados') {
    aba.value = 'dados'
    await nextTick()
  }
  if (!abaDadosRef.value?.validar()) return

  const r = registro.value
  r.nome = rascunho.value.nome.trim()
  r.telefone = rascunho.value.telefone
  r.avatar = rascunho.value.avatar
  r.endereco = { ...rascunho.value.endereco }
  r.smtp = { ...rascunho.value.smtp }
  r.atualizadoEm = new Date().toISOString()

  toast.success('Meu Perfil', 'As alterações foram salvas com sucesso.')
  alterado.value = false
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
  if (!imagem.type.startsWith('image/')) return
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
