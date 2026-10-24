# Tasks

## 1. Performance de bundle e SSR

- [x] 1.1 Criar um wrapper lazy para `UiRichText` com `defineAsyncComponent`/fallback de carregamento e usá-lo no formulário de Lançar as Chamadas; verificar que o editor abre, o fallback aparece durante o download e o chunk do editor não entra no bundle inicial da rota.
- [x] 1.2 Medir o tamanho do chunk da rota e do chunk do editor antes/depois e registrar os números em `docs/02`; verificar que a rota de consulta não baixa o chunk do editor até abrir o modal.
- [x] 1.3 Implementar cache em memória com TTL curto e single-flight para shell/configurações/opções; verificar chamadas concorrentes com uma única consulta ao banco e invalidação após salvar configurações.
- [x] 1.4 Carregar shell e permissões em paralelo no layout admin (`Promise.all`) e reutilizar `event.context.sessaoUsuario` nos handlers que hoje revalidam a sessão; verificar que a página abre com uma única rodada de consultas e mantém o RBAC.
- [x] 1.5 Adicionar testes de cache/single-flight e de reutilização da sessão; verificar que a invalidação em escrita não deixa dado velho.
- [x] 1.6 Atualizar `docs/02` com a estratégia de cache, invalidação e paralelismo de SSR; verificar que o texto corresponde ao código.

## 2. Importações e mídias em lote

- [x] 2.1 Trocar os inserts em loop das importações de Chamadas, Manuais, Release Week e Escopo por inserções em blocos de 100–200 registros, preparando os dados antes da transação; verificar que os testes de importação existentes continuam passando.
- [x] 2.2 Manter a atomicidade do conjunto importado e o rollback em falha de qualquer bloco; adicionar teste de falha induzida no meio da importação e verificar que nada é gravado.
- [x] 2.3 Substituir o `INSERT` por URL de mídia por upsert multi-row, preservando `ordem_exibicao`, capa e remoção das URLs ausentes; verificar com teste de criação/edição de chamada com várias mídias.
- [x] 2.4 Adicionar teste de volume (ex.: 500 linhas/100 mídias) com limite de tempo e verificar que a conexão é liberada ao final.
- [x] 2.5 Atualizar `docs/02`/`docs/15` com o modelo de gravação em lote e os limites; verificar que não há promessa de transação por linha.

## 3. Acessibilidade e UI kit

- [x] 3.1 Transformar a ação de ícone à direita do `UiInput` em botão focável com `aria-label`, `type="button"` e acionamento por `Enter`/`Space`; verificar por teste de teclado e inspeção de DOM.
- [x] 3.2 Aplicar o mesmo padrão aos demais consumidores do ícone direito (`UiDataTable`, busca de Parceiros e formulário de Login); verificar que nenhum `<div @click>` de ação permanece nesses pontos.
- [x] 3.3 Trocar textos de apoio em `text-slate-400` por `slate-500/600` em `UploadFiles`, `DataTable`, `esteira/Board`, `parceiros/Grade` e `Kpi`; verificar contraste e que ícones decorativos podem continuar em 400.
- [x] 3.4 Marcar o parecer como obrigatório e validar no clique em `lancar-chamadas/Recusar.vue` e `esteira/Decisao.vue`, com foco e mensagem persistente; verificar que o clique vazio revela o erro e que o parecer preenchido confirma.
- [x] 3.5 Explicar por tooltip/`aria-describedby` qualquer indisponibilidade restante do botão de recusa; verificar por leitor de tela/inspeção que o motivo é anunciado.
- [x] 3.6 Migrar os menus de Relatórios/Exportar de Softwares, Parceiros, Auditoria e demais telas afetadas para o contrato do `UiActionMenu`; verificar abertura, setas, Home/End, Escape, clique fora e retorno de foco.
- [x] 3.7 Corrigir os textos “Enviar link” (recuperação), “parceiros exibidas” (paginação) e o `title` nativo do convite; verificar que a recuperação fala em senha provisória e que a paginação usa rótulo neutro/configurável.
- [x] 3.8 Atualizar os testes de UI/validadores afetados e `docs/01` com os estados de foco/erro e os rótulos corrigidos; verificar que os testes e a documentação não contradizem o kit.

## 4. Vitrine, tokens e textos

- [x] 4.1 Adicionar a seção 27 “Gráficos” ao índice de `app/pages/design.vue`, corrigir os caracteres corrompidos e os `aria-label`; verificar que o índice lista 1–27 e que a página renderiza sem `?` de substituição.
- [x] 4.2 Substituir os hex de marca em classes arbitrárias dos cabeçalhos de Softwares, Parceiros, Lançar, Auditoria e Esteira por classes de token; verificar por inspeção que nenhum hex de marca permanece fora de exceção documentada.
- [x] 4.3 Atualizar `docs/01`, `AGENTS.md` e a vitrine para a faixa de 27 seções, a dica de upload sem SVG e o bloqueio de 15 minutos; verificar contagens e textos.
- [x] 4.4 Corrigir o encoding/mojibake da seção 5.28 de `docs/01`; verificar que títulos e exemplos estão legíveis.

## 5. Retenção, upload e documentação

- [x] 5.1 Trocar o texto “marcados para expurgo” por “removidos pela rotina de expurgo” e apresentar um resumo em linguagem natural com a query técnica em detalhe expansível/recolhido; verificar que o SQL não é o texto principal e que `INTERVAL N DAY` acompanha o slider.
- [x] 5.2 Corrigir a dica padrão do `UiUploadFiles` para os formatos aceitos (sem SVG) e atualizar a demo da vitrine; verificar por teste/inspeção que a dica customizada prevalece.
- [x] 5.3 Atualizar `docs/15` para “Desaprovar em `Aprovado` ou `Recusado`”; verificar contra `server/utils/lancar-chamadas.ts`.
- [x] 5.4 Atualizar `docs/03` e `docs/05` removendo referências a módulos “sem spec”, itens “sem rota” e o Painel sem rota; verificar contra `config/navigation.ts`.
- [x] 5.5 Adicionar `# DB_TIMEZONE=` ao `.env.example` e conferir a documentação em `docs/02`; verificar que a variável é lida por `server/utils/db.ts`.
- [x] 5.6 Atualizar `docs/08` para listar `primeiro-acesso` entre as telas sem shell e verificar o layout usado pela página.

## 6. Imutabilidade no banco

- [x] 6.1 Criar a migration `32_rl06_3_imutabilidade.sql` com gatilhos que rejeitam `UPDATE`/`DELETE` em `auditoria` e `historico_esteira_revisao`, com rollback documentado; verificar aplicação idempotente em banco de teste.
- [x] 6.2 Atualizar `scripts/db-least-privilege.sql` para retirar `UPDATE`/`DELETE` dessas tabelas do usuário da aplicação, mantendo `INSERT` e o caminho de expurgo; verificar `SHOW GRANTS`.
- [x] 6.3 Adicionar testes/consultas que comprovem rejeição de `UPDATE`/`DELETE`, inserção normal e expurgo controlado; verificar que as transições da esteira continuam gravando histórico.
- [x] 6.4 Atualizar `docs/02`/`AGENTS.md` com a política de imutabilidade e o rollback; verificar que o operador consegue reverter sem perder dados.

## 7. Regressão e integração

- [x] 7.1 Verificar que B-10 (Limpar Filtros apenas no rascunho) e B-12 (mono/tabular em códigos/datas) continuam corrigidos nos 10 módulos e nas tabelas principais; corrigir qualquer regressão.
- [x] 7.2 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; registrar o número de testes e corrigir falhas.
- [x] 7.3 Executar E2E dos fluxos afetados (abrir editor, importar lote, recusar sem parecer, menu de relatórios, retenção, upload, primeiro acesso) e limpar dados de teste.
- [x] 7.4 Executar `openspec validate "corrigir-pendencias-rl06-3" --type change --strict` e `openspec validate --specs`; verificar ambos válidos.
- [x] 7.5 Revisar `git status`/`git diff --stat` e confirmar que nenhum segredo, artefato de teste ou migration extra ficou no repositório.
