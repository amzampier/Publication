# Tasks

## 1. Contrato do cliente ViaCEP (`useViaCep`)

- [x] 1.1 Refinar `app/composables/useViaCep.ts`: renomear `Endereco` → `EnderecoViaCep` acrescentando `regiao`, retornar o resultado discriminado `ResultadoCep` (`ok` / `incompleto` / `nao-encontrado` / `erro`), validar 8 dígitos antes de qualquer fetch, checar `response.ok` antes do `.json()`, tratar `data.erro` por truthiness (boolean ou `"true"`) e mapear exceção/abort para `erro` — verificar com `npm run build` (sem consumadores antigos quebrados; o tipo antigo não era usado)

## 2. Orquestrador compartilhado `useBuscaCep`

- [x] 2.1 Criar `app/composables/useBuscaCep.ts` com `carregando`, `AbortController` + timeout de 10.000 ms (abort no `finally`), bloqueio de acionamento enquanto em voo, mapeamento dos campos **somente quando não vazios** (`logradouro`, `bairro`, `localidade→cidade`, `uf→estado`, `regiao→regiao`; preserva `numero`, `complemento`, `cep`), toasts por status (`warning` "Informe um CEP com 8 dígitos." sem requisição; `danger` "CEP não encontrado. Verifique o número digitado."; `danger` "Não foi possível consultar o CEP. Tente novamente."; sucesso sem toast) com título parametrizado, e retorno indicando se algo mudou — verificar com `npm run build` e releitura do contrato contra o requirement homônimo da spec `busca-cep`

## 3. Integração — Meu Perfil

- [x] 3.1 Substituir o stub de `app/components/perfil/AbaEndereco.vue` pela chamada ao `useBuscaCep` (título "Meu Perfil"): ícone em carregamento (`LoaderCircle` + `animate-spin`, `aria-busy="true"`, `pointer-events-none`, clique/Enter ignorados em voo), emissão de `change` somente quando o preenchedor alterou algo — verificar com `npm run build` e, em `http://localhost:3000/admin/meu-perfil` (aba Endereço): `01001-000` preenche os 5 campos sem toast e habilita "Salvar alterações"; Número/Complemento digitados intactos; CEP incompleto → toast de aviso sem requisição; CEP inexistente e falha de rede → toasts de erro sem alterar campos; clique duplo dispara uma única consulta

## 4. Integração — Gestão de Usuários

- [x] 4.1 Substituir o stub de `app/components/usuarios/Formulario.vue` pela chamada ao `useBuscaCep` (título "Gestão de Usuários"), com o mesmo estado de carregamento do ícone — verificar com `npm run build` e, no modal de usuário (criação e edição) de `http://localhost:3000/admin/gestao-usuarios`: os mesmos cenários do task 3.1, com título "Gestão de Usuários" nos toasts de erro e nenhum toast de "próxima etapa"

## 5. Documentação

- [x] 5.1 Atualizar `docs/09 - Meu Perfil.md`: descrever a busca ViaCEP real na aba Endereço (preenchimento, estados do ícone, toasts) e remover ViaCEP das pendências (restando RBAC) — verificar por releitura: nenhuma menção a stub/próxima etapa e a seção de pendências sem ViaCEP
- [x] 5.2 Conferir `docs/01 - design_system.md` quanto ao ícone de busca de CEP: o controle e seu estado de carregamento NÃO estão documentados (0 ocorrências de CEP/ViaCEP/MapPinCheck — o documento cobre só os 21 componentes do kit `ui/`), então nenhuma atualização foi necessária — verificado por releitura/contagem no documento

## 6. Verificação final

- [x] 6.1 `npm run build` limpo e conferência visual dos cenários das specs `busca-cep`, `meu-perfil` (delta) e `gestao-usuarios` (delta) nas duas telas, incluindo o estado reduzido de movimento (spinner estático, conteúdo idêntico) — verificado: build sem erros nesta change; conferência E2E delegada ao agente qa-execucao (Chrome headless + interceptação de rede): 12/12 cenários PASS + cenário extra de resposta parcial (preenchimento, preservação de Número/Complemento, toasts com título/tipo/mensagens exatas, sem requisição em CEP incompleto, clique duplo com requisição única, timeout medido em 10.264 ms, `aria-busy`/`motion-reduce:animate-none` no DOM, salvar persiste, regressões dos dois formulários)

## 7. Número do endereço nasce vazio (migration)

- [x] 7.1 Criar `server/migration/04_numero_vazio_sem_endereco.sql` seguindo as convenções (sem `USE`, `;` como delimitador, bloco `REVERTER (ROLLBACK)` comentado ao final): `ALTER TABLE usuarios ALTER numero SET DEFAULT ''` + `UPDATE usuarios SET numero='' WHERE numero='S/N' AND cep='' AND endereco='' AND bairro='' AND cidade=''` — verificado: migration registrada em `_migrations` no boot do dev server; `ana` e `fabiola` (endereço vazio) passaram a `numero=''`; registro com endereço preenchido intocado
- [x] 7.2 Espelhar o novo default em `docs/bd/01 - banco_dados_mariadb.sql` (`numero ... DEFAULT ''`) sem tocar nas migrations `01`–`03` aplicadas — verificado por releitura: nenhuma ocorrência de `DEFAULT 'S/N'` no dump de referência; migrations 01–03 inalteradas

## 8. Loading da importação por planilha

- [x] 8.1 Em `app/components/usuarios/Importar.vue`: criar estado `importando` (distinto de `processando`, que é a leitura da planilha), guard de reentrada no `importar()`, e durante o POST trocar a pré-visualização por um `UiModalSection` de progresso com contagem "Importando N registro(s)" e a lista dos registros selecionados (nome + e-mail) com `LoaderCircle` girando; botão "Importar" com `:loading="importando"` — código implementado e build limpa; a conferência manual/E2E está no task 9.1

## 9. Verificação final dos ajustes

- [x] 9.1 `npm run build` limpo + verificação E2E dos dois ajustes — verificado: build limpa; conferência E2E delegada ao qa-execucao com 10/10 PASS (A1 importação grava `numero=''`; A2 legados `ana`/`fabiola` vazios; A3 registro com endereço real (`238`) intacto; B1 painel "Importando N registro(s)" com lista e spinners durante o POST segurado via CDP, zero marcadores de conclusão antes da resposta; B2 sucesso fecha com toast + KPIs; B3 falha devolve a pré-visualização com `role="alert"`; B4 leitura da planilha não regrediu; B5 Cancelar/Escape/X e busca de CEP íntegros) — base de dados restaurada nos 3 usuários originais
