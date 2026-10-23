<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'
import {
  carregarConfiguracoesGlobais,
  atualizarCachesAposSalvar,
  type ConfiguracoesGlobaisApi
} from '../../composables/useConfiguracoesGlobais'
import { useLogomarcaHeader } from '../../composables/useLogomarcaHeader'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useSidebarExpandida } from '../../composables/useSidebarExpandida'
import { useSessoesAbertas } from '../../composables/useSessoesAbertas'
import { CHAVES_SIDEBAR, labelPorChave } from '../../config/sidebar-keys'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()
const { mensagem, limpar } = useErroCarga()
const erroCarga = ref('')

// Retenção: v-model do slider (a hidratação substitui o default por GET)
const diasRetencao = ref(180)

// Rate limit: rascunho da aba Segurança (hidratado pelo GET; salvo no PUT)
const rateLimite = ref(120)
const rateAtivo = ref(true)

// Aba padrão: Logomarcas & Identidade (pedido do usuário)
const aba = ref('logomarcas')

// Botão "Salvar" fica desabilitado até qualquer painel alterar seu estado
const alterado = ref(false)
const salvando = ref(false)

// Loading no F5 (padrão Meu Perfil): sem flash dos defaults enquanto o GET voa
const carregando = ref(true)

// Estados compartilhados hidratados pelo composable (logos, sidebar, sessões)
const { caminho: caminhoHeader } = useLogomarcaHeader()
const { caminho: caminhoLogin } = useLogomarcaLogin()
const { expandida: sidebarExpandida } = useSidebarExpandida()
const { abertas: sessoesAbertas } = useSessoesAbertas()

const carregar = async () => {
  carregando.value = true
  erroCarga.value = ''
  try {
    const cfg = await carregarConfiguracoesGlobais()
    if (!cfg) {
      erroCarga.value = mensagem('as configurações')
      return
    }
    diasRetencao.value = cfg.dias_retencao_auditoria
    rateLimite.value = cfg.rate_limit.limite_requisicoes_minuto
    rateAtivo.value = cfg.rate_limit.ativo
    alterado.value = false
    limpar()
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const salvar = async () => {
  if (salvando.value) return
  salvando.value = true
  try {
    const sidebarGrupos = Object.fromEntries(
      CHAVES_SIDEBAR.map((chave) => [chave, sessoesAbertas.value[labelPorChave(chave)] ?? true])
    )
    const atualizada = await useApiFetch<ConfiguracoesGlobaisApi>('/api/configuracoes', {
      method: 'PUT',
      body: {
        dias_retencao_auditoria: diasRetencao.value,
        logo_header_url: caminhoHeader.value || null,
        logo_login_url: caminhoLogin.value || null,
        sidebar_grupos: sidebarGrupos,
        sidebar_expandida: sidebarExpandida.value,
        rate_limit: {
          ativo: rateAtivo.value,
          limite_requisicoes_minuto: rateLimite.value
        }
      }
    })
    // Sincroniza com a resposta (URLs finais do servidor, ex.: sufixo de colisão)
    caminhoHeader.value = atualizada.logo_header_url ?? ''
    caminhoLogin.value = atualizada.logo_login_url ?? ''
    // RL04-M-04: atualiza os caches (completo + shell) para refletir o que foi salvo.
    atualizarCachesAposSalvar(atualizada)
    toast.success('Configurações Globais', 'As alterações foram salvas com sucesso.')
    alterado.value = false
  } catch {
    toast.danger(
      'Configurações Globais',
      'Não foi possível salvar as alterações. Tente novamente.'
    )
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Loading no F5: enquanto o GET resolve, só o estado de espera (sem defaults) -->
    <UiLoading v-if="carregando" message="Carregando configurações…" />

    <div v-else class="mx-auto max-w-5xl">
      <ConfiguracoesCabecalho :desabilitado="!alterado" :salvando="salvando" @salvar="salvar" />

      <UiErrorState
        v-if="erroCarga"
        class="mt-10"
        :message="erroCarga"
        :retrying="carregando"
        @retry="carregar"
      />

      <ConfiguracoesAbas v-else v-model="aba" class="mt-10">
        <ConfiguracoesAbaLogomarcas
          v-if="aba === 'logomarcas'"
          @change="alterado = true"
        />
        <ConfiguracoesAbaSidebar
          v-else-if="aba === 'sidebar'"
          @change="alterado = true"
        />
        <ConfiguracoesAbaRetencaoAuditoria
          v-else-if="aba === 'retencao'"
          v-model="diasRetencao"
          @change="alterado = true"
        />
        <ConfiguracoesAbaSeguranca
          v-else
          v-model:limite-requisicoes-minuto="rateLimite"
          v-model:rate-limit-ativo="rateAtivo"
          @change="alterado = true"
        />
      </ConfiguracoesAbas>
    </div>
  </div>
</template>
