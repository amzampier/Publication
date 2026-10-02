# Tasks

## 1. Implementação do container global

- [x] 1.1 Adicionar `<UiToastContainer />` em `app/app.vue`, como irmão de `<NuxtLayout>` (fora do layout), e verificar que a página raiz continua renderizando normalmente — verificação: `npm run dev` → `GET /` retorna 200 e o HTML contém o elemento de notificação com `aria-live`
- [x] 1.2 Confirmar que o componente montado resolve para o módulo canônico de toast (auto-import `UiToastContainer` → `app/components/ui/ToastContainer.vue`, que importa `app/composables/useToast.ts`) e que nenhum consumidor aponta para a duplicata `app/components/composables/useToast.ts` — verificação: grep por `composables/useToast` em `app/` mostra apenas caminhos `../../composables/useToast` (canônico) e nenhum import de `components/composables/useToast`

## 2. Verificação funcional nas rotas

- [x] 2.1 Verificar a região viva em todas as rotas por SSR — verificação: script PowerShell percorre `/`, `/admin`, `/admin/configuracoes-globais` e `/design` e reporta `aria-live >= 1` em todas (hoje: 0)
- [x] 2.2 Validar o feedback de "Salvar Alterações Globais" — verificação: em `/admin/configuracoes-globais`, alterar um painel, clicar em "Salvar Alterações Globais" e observar toast `success` "Configurações Globais …" no canto superior direito, sem mudança de rota e com o botão voltando a desabilitar
- [x] 2.3 Validar o feedback de "Atualizar" na aba Segurança — verificação: clicar em "Atualizar" e observar toast `info` "Segurança & Rate Limits …"
- [x] 2.4 Validar a demonstração da vitrine — verificação: em `/design` seção 8, acionar os quatro botões "Disparar Success/Warning/Danger/Info" e observar um toast com a identidade visual de cada variante no canto superior direito
- [x] 2.5 Validar auto-dismiss e fechamento manual — verificação: um toast sem `duration` desaparece após ~5000 ms exibindo a barra de progresso; o botão de fechar remove o toast antes do fim sem reprocessamento (comportamento do componente, que permanece inalterado)
- [x] 2.6 Validar a rota pública — verificação: disparar um toast com `/` aberta (ex. pela aba do navegador após ação em qualquer rota) e confirmar que o container existe e o toast é exibido mesmo sem shell administrativo

## 3. Documentação e gate da mudança

- [x] 3.1 Rodar `npm run build` e verificar conclusão sem erro (única verificação estrutural do repositório — não há lint/test)
- [x] 3.2 Conferir que `docs/01 - design_system.md` §4.5/§4.6 descreve exatamente o comportamento agora implementado (container global em `app/app.vue`, `role="status"`/`aria-live="polite"`, 5000 ms, persistente com `duration <= 0`) — verificação: leitura comparativa; nenhuma edição esperada
- [x] 3.3 Atualizar `docs/RL01 - Relatório de Responsividade.md` marcando BUG-01 como corrigido, com data e evidência (região viva presente nas 4 rotas) — verificação: campo "Status" do BUG-01 lido como corrigido e a contagem de bugs abertos do resumo diminuída em 1
- [x] 3.4 Rodar `openspec validate "montar-toast-container-global" --strict` e verificar `valid: true` sem issues
