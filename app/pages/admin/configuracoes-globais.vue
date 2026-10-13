<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import { useApiFetch } from '../../composables/useApiFetch'
import {
  carregarConfiguracoesGlobais,
  type ConfiguracoesGlobaisApi
} from '../../composables/useConfiguracoesGlobais'
import { useLogomarcaHeader } from '../../composables/useLogomarcaHeader'
import { useLogomarcaLogin } from '../../composables/useLogomarcaLogin'
import { useSidebarExpandida } from '../../composables/useSidebarExpandida'
import { useSessoesAbertas } from '../../composables/useSessoesAbertas'
import { CHAVES_SIDEBAR, labelPorChave } from '../../config/sidebar-keys'

definePageMeta({ layout: 'admin' })

const { toast } = useToast()

// Retenção: v-model do slider (a hidratação substitui o default por GET)
const diasRetencao = ref(180)

// Aba padrão: Logomarcas & Identidade (pedido do usuário)
const aba = ref('logomarcas')

// Botão "Salvar" fica desabilitado até qualquer painel alterar seu estado
const alterado = ref(false)

// Estados compartilhados hidratados pelo composable (logos, sidebar, sessões)
const { caminho: caminhoHeader } = useLogomarcaHeader()
const { caminho: caminhoLogin } = useLogomarcaLogin()
const { expandida: sidebarExpandida } = useSidebarExpandida()
const { abertas: sessoesAbertas } = useSessoesAbertas()

onMounted(async () => {
  // Mesma carga do layout admin (idempotente) — a página também precisa dos
  // valores para montar o payload do Salvar.
  const cfg = await carregarConfiguracoesGlobais()
  if (cfg) diasRetencao.value = cfg.dias_retencao_auditoria
  // Hidratação não é alteração do usuário — o Salvar permanece desabilitado.
  alterado.value = false
})

const salvar = async () => {
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
        sidebar_expandida: sidebarExpandida.value
      }
    })
    // Sincroniza com a resposta (URLs finais do servidor, ex.: sufixo de colisão)
    caminhoHeader.value = atualizada.logo_header_url ?? ''
    caminhoLogin.value = atualizada.logo_login_url ?? ''
    toast.success('Configurações Globais', 'As alterações foram salvas com sucesso.')
    alterado.value = false
  } catch {
    toast.danger(
      'Configurações Globais',
      'Não foi possível salvar as alterações. Verifique a conexão com o banco e tente novamente.'
    )
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-5xl">
      <ConfiguracoesCabecalho :desabilitado="!alterado" @salvar="salvar" />

      <ConfiguracoesAbas v-model="aba" class="mt-10">
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
        <ConfiguracoesAbaSeguranca v-else @change="alterado = true" />
      </ConfiguracoesAbas>
    </div>
  </div>
</template>
