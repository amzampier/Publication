# Tasks

## 1. Contenção de mídias de chamadas (C-01 / A-05)

- [x] 1.1 Criar `server/utils/visibilidade-publica.ts` com a expressão SQL de vínculo público (chamada `Publicado` + ao menos um pai `Publicado` e `arquivada = 0`) e uma função pura equivalente; verificar com testes unitários os casos: pai ativo publicado, pai arquivado, múltiplos vínculos e nenhum vínculo.
- [x] 1.2 Remover a publicação estática de `uploads/` inteiro em `nuxt.config.ts` e declarar `publicAssets` apenas para `logomarcas`, `avatares` e `logos`; verificar que `npm run typecheck` e o boot do dev server não acusam erro de asset e que `/uploads/logomarcas/<arquivo>` continua `200`.
- [x] 1.3 Criar `server/routes/uploads/chamadas/[...arquivo].get.ts` com validação `AAAA/MM/arquivo`, resolução segura do caminho (sem traversal), sessão + `lancar-chamadas/visualizar` para leitura administrativa e gate de visibilidade para anônimo; verificar com requisições HTTP: revisão anônima → 404, publicada anônima → 200, admin em revisão → 200, `../fora` → 404, com `nosniff` e CSP.
- [x] 1.4 Remover a URL pública incondicional do fluxo de upload de chamadas (a URL persiste em `anexos_midias`, mas o servimento passa pela rota autorizada); verificar que o upload continua retornando a URL e que a galeria administrativa abre a mídia com sessão.
- [x] 1.5 Adicionar testes de regressão do gate com pai arquivado e com múltiplos vínculos; verificar que uma chamada `Publicado` com pai arquivado não é servida anonimamente e que, com outro pai publicado, é servida.
- [x] 1.6 Atualizar `docs/02 - Guia de Arquitetura e Migrations.md` (§3.7 e servimento de uploads) e `docs/15 - Módulo Lançar Chamadas.md` para registrar que mídias de chamadas exigem autorização/visibilidade, mantendo logomarcas/avatares/logos públicos; verificar que os trechos citam a rota e o gate.

## 2. Permissão de publicação em qualquer caminho (C-02)

- [x] 2.1 Nos `POST`/`PUT` de `release-week`, `manuais` e `escopo-projetos`, exigir `publicar` quando a transição solicitar `Publicado` (comparando com o status atual; criação sem status atual conta como transição); verificar com perfil `alterar` sem `publicar` → 403 e com `publicar` → 200.
- [x] 2.2 Ajustar `atualizarReleaseWeek`/`criarReleaseWeek` para gravar `data_aprovacao` ao entrar em `Publicado` e limpá-la ao sair; verificar no banco após edição autorizada e após reabertura.
- [x] 2.3 Ajustar a auditoria das rotas de Release/Manual/Escopo para registrar **“Homologação”** na transição para `Publicado` (inclusive na criação já publicada) e **“Alteração”** nos demais casos; verificar a trilha após cada caminho.
- [x] 2.4 Ocultar a opção `Publicado` nos três formulários quando o perfil não tiver `publicar`, mantendo o valor atual visível/somente leitura quando o registro já estiver publicado; verificar por inspeção do componente e por teste de UI/SSR quando viável.
- [x] 2.5 Adicionar testes de autorização e de transição para os três módulos (edição e criação, com e sem `publicar`, com e sem cascata) e verificar que a suíte passa.
- [x] 2.6 Atualizar `docs/12 - Módulo das Releases Week.md`, `docs/13 - Módulo de Manuais Mensais.md`, `docs/14 - Módulo do Escopo de Projetos.md` e `docs/02` para registrar a exigência de `publicar` na edição/criação, o carimbo de aprovação e a auditoria “Homologação”; verificar que os contratos de API documentados refletem o comportamento.

## 3. Revogação de sessões na recuperação de senha (A-01)

- [x] 3.1 Alterar `POST /api/auth/esqueci-senha` para, após o envio bem-sucedido, gravar `hash_senha`/`senha_provisoria` e chamar `revogarSessoesDoUsuario` na mesma transação; verificar que falha de envio não abre transação e mantém senha/sessões.
- [x] 3.2 Adicionar testes de revogação no reset (access e refresh capturados antes → 401; login com a provisória funciona; falha de envio preserva a senha anterior e a sessão); verificar a suíte.
- [x] 3.3 Atualizar `docs/08 - Login de Autenticação.md` para registrar que a recuperação revoga as sessões anteriores; verificar o trecho e o cenário correspondente na spec.

## 4. RBAC do Painel Executivo (A-02)

- [x] 4.1 No handler de `GET /api/painel-executivo`, resolver as permissões `visualizar` de `release-week`, `manuais`, `escopo-projetos`, `lancar-chamadas`, `softwares` e `parceiros`; responder `403` quando nenhuma estiver concedida; verificar com perfis Leitor, Editor, Revisor e Administrador.
- [x] 4.2 Passar os flags para `obterPainelExecutivo` e filtrar cada bloco: KPIs/séries/dimensões de chamadas exigem `lancar-chamadas`, abas de `porPublicacao` exigem o módulo correspondente e `porSoftware` exige `softwares`; verificar que o shape da resposta é preservado com blocos vazios/zerados.
- [x] 4.3 Ajustar `anosDisponiveis` para não expor dados de chamadas a quem não tem a permissão (usar anos das publicações permitidas, com fallback para o ano corrente); verificar o seletor com perfil sem chamadas.
- [x] 4.4 Adicionar testes de contrato do Painel por perfil (Administrador recebe todos os blocos; Leitor sem chamadas/softwares recebe publicações permitidas e blocos de chamadas/softwares vazios; perfil sem nenhum módulo → 403); verificar a suíte.
- [x] 4.5 Atualizar `docs/17 - Painel Executivo.md` e `docs/07 - Perfis de Acesso (RBAC).md` para registrar o RBAC por bloco e o `403` sem módulo; verificar que a documentação não afirma mais “qualquer sessão autenticada”.

## 5. Atomicidade da criação de escopo (A-03)

- [x] 5.1 Refatorar `criarEscopo` para abrir a transação antes do `INSERT`, executar insert + código + reconciliação na mesma transação e fazer rollback integral em falha; verificar com teste de falha induzida na reconciliação (nenhum escopo e nenhuma filha alterada).
- [x] 5.2 Adicionar teste de concorrência/colisão de código garantindo que a nova tentativa ocorre dentro de uma transação limpa e que não sobra registro parcial; verificar a suíte.
- [x] 5.3 Atualizar `docs/14 - Módulo do Escopo de Projetos.md` e `docs/02` para registrar a atomicidade da criação com cascata; verificar o trecho.

## 6. Resiliência do pool do Painel e da Esteira (A-04)

- [x] 6.1 Consolidar as consultas do Painel: séries mensais de lançadas/liberadas em um `UNION ALL`, `porPublicacao` em um `UNION ALL` normalizado, `tipo`/`impacto` em uma consulta agrupada e `itensFluxo` com projeção mínima; verificar que os números do painel permanecem iguais aos atuais em uma base de teste.
- [x] 6.2 Limitar o paralelismo por request (execução em grupos) e cachear as opções da Esteira com invalidação nas escritas; verificar a contagem de queries por request com `Questions` antes/depois.
- [x] 6.3 Criar `server/utils/pool-error.ts` com detecção de saturação (`Queue limit reached`/`ER_CON_COUNT_ERROR`) e resposta `503` com `Retry-After`; aplicar nos handlers do Painel e da Esteira, mantendo `500` para erros não relacionados; verificar com carga N=10 e N=20 que não há `500` de fila.
- [x] 6.4 Elevar os defaults de `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT` para 20/100 (mantendo as envs) e documentar as variáveis em `.env.example` e `docs/02`; verificar boot e configuração efetiva.
- [x] 6.5 Adicionar teste/script de carga reproduzível para o Painel e a Esteira (N=10/20) e registrar os resultados; verificar que a falha de fila é `503` e que o caminho normal continua `200`.

## 7. Integração final e gates

- [x] 7.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar que todos passam (registrar o número de testes).
- [x] 7.2 Executar `openspec validate "corrigir-bloqueadores-rl06-1" --type change --strict`; verificar que o change está válido.
- [x] 7.3 Executar o roteiro E2E dos cinco bloqueadores: mídia anônima (revisão/publicada/pai arquivado), bypass `publicar` nos três módulos, reset com sessão antiga, Painel por perfil e criação de escopo com falha induzida; verificar PASS em todos e limpar os dados de teste.
- [x] 7.4 Revisar o diff final para confirmar que nenhuma migration foi criada, que as URLs públicas de identidade continuam funcionando e que nenhum segredo/dado de teste ficou no repositório; verificar `git status` e `git diff --stat`.