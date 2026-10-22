# Tasks

## 1. Dependências e base compartilhada

- [x] 1.1 Adicionar as dependências do editor e do sanitizador (`@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-text-style`, `@tiptap/pm` se o peer não resolver, `sanitize-html`) e a dev `@types/sanitize-html`; verificar com `npm install` que a instalação conclui e o `package.json`/`package-lock.json` registram as versões
- [x] 1.2 Criar `shared/rich-text.ts` com a allowlist de cores de conteúdo (sem cor, `#112051`, `#0364f7`, `#0f7a06`, `#047857`, `#dc2626`, `#be123c`, `#92400e`, `#334155`), a escala de tamanhos (`0.9em`, `1em`, `1.15em`, `1.3em`) e o helper puro de texto→HTML (escape + `<br>`), verificando com `tests/rich-text.test.ts` que o escape e as quebras são preservados e que os valores da allowlist são os esperados

## 2. Banco e backend

- [x] 2.1 Criar `server/migration/25_lancar-chamadas_texto_rico_e_solucao.sql` adicionando `descricao_html`, `solucao` e `solucao_html` em `entregas_itens` (idempotente, sem `USE`, com bloco de rollback comentado); verificar subindo o dev contra o banco e conferindo as três colunas via `SHOW COLUMNS FROM entregas_itens`
- [x] 2.2 Criar `server/utils/richText.ts` com `sanitizarRichText` (allowlist de tags `p`/`br`/`strong`/`span` e, em `span`, só `color`/`font-size` dos valores da allowlist) e `richTextParaTexto` (quebras preservadas, entidades decodificadas); verificar com `tests/lancar-chamadas-richtext.test.ts` que `script`/evento/estilo proibido são removidos, cor/tamanho fora da allowlist não sobrevivem e o texto puro preserva as quebras
- [x] 2.3 Atualizar `shared/lancar-chamadas.ts` (tipos `ChamadaModelo`/`EntradaChamada`, campo `solucao`, teto de 20.000 caracteres em texto puro, `solucao` na busca e na prioridade de validação) e `tests/lancar-chamadas-validadores.test.ts`; verificar com `npm run test` que a busca encontra por Solução, que a Descrição vazia após formatação é recusada e que a Solução vazia é aceita
- [x] 2.4 Atualizar `server/utils/lancar-chamadas.ts` (`COLUNAS`, `montarChamada`, `montarEntrada`, `validarEntrada` com sanitização/derivação, `ChamadaPreparada`/`prepararChamada`, `SQL_INSERT`/`valoresInsert`, `UPDATE` e a importação gravando `solucao=''`/html `NULL`); verificar com `npm run typecheck` e com a persistência E2E descrita em 6.2

## 3. Componentes de texto rico

- [x] 3.1 Criar `app/components/ui/RichText.client.vue` (`UiRichText`, client-only) com o DNA visual do `UiTextarea`, `v-model` em HTML, emissão do texto puro, `StarterKit` restrito a negrito/parágrafo/quebra/undo, `TextStyle`+`Color`+`FontSize`, toolbar no hover/foco e `BubbleMenu` na seleção (ancorada dentro do painel do modal) com nomes acessíveis, `aria-pressed` e `Ctrl+B`; verificar com `npm run typecheck` e `npm run lint`
- [x] 3.2 Criar `app/components/ui/RichTextViewer.vue` (`UiRichTextViewer`) renderizando o HTML sanitizado e adicionar o bloco `.ds-rich-text` em `app/assets/css/main.css` (parágrafos, quebras, cores/tamanhos da allowlist); verificar com `npm run typecheck` e a exibição no modal de Detalhes em 4.2
- [x] 3.3 Incluir `[contenteditable="true"]` no `FOCUSABLE_SELECTOR` de `app/components/ui/Modal.vue`; verificar com `npm run lint` e percorrendo os campos do formulário por `Tab` sem o foco escapar do modal

## 4. Integração no módulo Lançar as Chamadas

- [x] 4.1 Em `app/components/lancar-chamadas/Formulario.vue`, adicionar `descricaoHtml`/`solucao`/`solucaoHtml` ao rascunho e às conversões, trocar a Descrição por `UiRichText` e incluir o campo Solução na etapa Conteúdo e mídias, ajustar `camposPorEtapa`, o payload de `salvar` e o seletor de `focarCampo`; verificar criando e editando uma chamada com negrito, cor e tamanho e recarregando a página
- [x] 4.2 Em `app/components/lancar-chamadas/Detalhes.vue`, adicionar a seção Solução e renderizar Descrição e Solução com `UiRichTextViewer` (fallback de texto puro); verificar abrindo os detalhes de uma chamada formatada e de um registro sem HTML

## 5. Vitrine e documentação

- [x] 5.1 Adicionar a seção 25 "Texto Rico (UiRichText)" e a entrada no índice de `app/pages/design.vue`, com demonstração (normal, erro, desabilitado) e o viewer; verificar em `http://localhost:3000/design` que a seção renderiza sem overflow horizontal e que a formatação aparece
- [x] 5.2 Atualizar `docs/01 - design_system.md` (novo §5.25, paleta de texto rico na §2 com o vermelho de conteúdo `#dc2626` distinto do erro `#be123c` e nota no §5.18) e `docs/15 - Módulo Lançar Chamadas.md` (Descrição rica + Solução); verificar que os valores documentados coincidem com `shared/rich-text.ts`

## 6. Verificação final

- [x] 6.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar que os quatro passam
- [x] 6.2 Verificar ponta a ponta: criar e editar chamada com Descrição e Solução formatadas, recarregar (persistência), abrir Detalhes (formatação) e confirmar que a busca encontra pelo texto da Solução e ignora a marcação HTML
