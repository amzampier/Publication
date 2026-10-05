# Design

## Context

O modal de importação é o terceiro modal de domínio da tela (após cadastro e filtros) e reutiliza o padrão já estabelecido: gatilho na `Tabela` (slot `#filtersLeft`), coordenação na página com um `ref` + `v-model`, rascunho descartado no fechamento. A base continua 100% em memória (`useUsuariosDemo.ts`), sem `server/` — a "verificação de banco" é a comparação contra o conjunto vigente. Motivação completa em `proposal.md`; requisitos observáveis no delta `specs/gestao-usuarios/spec.md`.

## Goals / Non-Goals

**Goals:**
- Parse `.xlsx` no cliente, sem requisição de rede, com import dinâmico do `exceljs` (não infla o bundle inicial).
- Pré-visualização fiel com semântica de Situação e seleção explícita antes de qualquer gravação.
- Compor o kit existente — nenhum componente novo de design system; extensão **opt-in** do
  `UiUploadFiles` (D10) sem quebrar consumidores atuais.

**Non-Goals:**
- Envio de convite (próxima etapa; importados nascem sem senha justamente para ele).
- Download do modelo pelo modal (modelo é só documental em `docs/modelos/`).
- `.xls` legado (exceljs não lê o formato binário antigo).
- Deduplicação/validação em servidor (fase 1 não tem `server/`).
- Colunas opcionais no modelo (Telefone/Função/Departamento/endereço ficam para edição manual).

## Decisions

**D1 — Lib: `exceljs` com `import()` dinâmico.** `docs/02` já o prescreve para planilhas; alternativas descartadas: SheetJS/`xlsx` (versão npm estagnada e fora do stack declarado) e CSV (contraria o "modelo do excel" pedido; zero deps, mas o formato é o requisito). O import é dinâmico dentro do parser para que o pacote (~pesado) só carregue quando o modal for usado.

**D2 — Modelo: 4 colunas obrigatórias, cabeçalho só.** `docs/modelos/modelo-importacao-usuarios.xlsx` — planilha única "Usuários", linha de cabeçalho `Nome | E-mail | Perfil | Status` e **nenhuma linha de exemplo** (evita importação acidental do exemplo). Gerada one-off com um script temporário (não versionado) usando o próprio `exceljs`. Cabeçalho comparado com `trim` e sem distinção de maiúsculas.

**D3 — Tabela temporária: `UiDataTable` + slots, sem componente novo.** Colunas: `sel` (checkbox via slot `cell(sel)`), Nome, E-mail, Perfil, Status, Situação (slot `cell(situacao)` com `UiBadge`). "Selecionar todos os prontos" vai no slot `filtersLeft` da toolbar (o `UiDataTable` tem `showFilters=false` por default, então a toolbar serve só de apoio). Alternativa descartada: estender `UiDataTable` com seleção nativa — seria mudança de design system (delta `design-system/*`, docs/01, vitrine `/design`) para um uso de um único consumidor; a composição em domínio entrega o mesmo comportamento. A busca interna da tabela é aproveitada para filtrar a pré-visualização.

**D4 — Parser isolado em `lerPlanilhaUsuarios.ts`** (import explícito, padrão `gerarPdf*.ts`): recebe `File`, devolve `{ linhas, erro? }`. Regras: linhas 100% vazias ignoradas; `trim` nas células; e-mail com validação de formato e comparação **case-insensitive** (arquivo e base); enums reutilizados de `PERFIS`/`STATUSES` (`useUsuariosDemo.ts`); ordem de classificação por linha: inválida → repetida no arquivo → já cadastrada → pronta. Detecção de repetição no arquivo na primeira passagem (mapa de e-mails vistos), **alimentado apenas por linhas válidas** — uma segunda ocorrência de e-mail cuja primeira aparição era uma linha inválida é classificada pelo próprio mérito da segunda linha, não como "repetido" (a spec refere "segunda ocorrência … entre as linhas válidas do arquivo").

**D5 — Estados de Situação como valores fechados** (`'pronto' | 'ja-cadastrado' | 'repetido' | 'invalido'` + `motivo`), com badges do kit: emerald ("Pronto para importar"), amber ("E-mail já cadastrado"), slate ("Repetido no arquivo"), rose-700 ("Linha inválida", motivo exibido em texto `rose-700` abaixo do badge — o spec exige o motivo exibido, sem depender de hover). Só `'pronto'` tem checkbox habilitado; a pré-seleção é aplicada no parse (todos os `'pronto'`).

**D6 — Gravação via `importarUsuarios(registros)` em `useUsuariosDemo.ts`**, espelhando o que o `Formulario` faz no salvar: `id` gerado no padrão da base, `ultimoAcesso: null`, campos cadastrais vazios (`enderecoVazio()`, `smtpVazio()`, `avatar: ''`), `dataCadastro`/`atualizadoEm` = instante da gravação, `senha` nem existe no modelo (o `Formulario` já descarta a senha no salvar — `Formulario.vue` desestrutura `{ senha, confirmarSenha, ... }`). KPIs recalculam pelo caminho reativo existente. Alternativa descartada: reaproveitar o `salvar` do modal de cadastro — ele exige validações de formulário (senha) que não cabem aqui.

**D7 — Coordenação na página, espelho do Filtros.** `Tabela.vue` ganha `emit('importar')` no lugar de `avisoProximaEtapa('Importar novos usuários')`; `gestao-usuarios.vue` mantém `importarAberto = ref(false)` e renderiza `<UsuariosImportar v-model="importarAberto" />`. O modal zera o parse ao abrir (rascunho), fecha com `Cancelar`/`Escape`/`X` descartando, e o `Importar (n)` só dispara com `n > 0` — mesmo contrato de descarte dos demais modais.

**D8 — Interação com filtros: não tocar.** A importação grava na base, não na visão; com filtro ativo os novos registros podem ficar "invisíveis" até `Limpar Filtros` — comportamento documentado no cenário "Filtros preservados na importação" em vez de tratado com efeito especial (que quebraria a regra "rascunho/filtro só muda por ação explícita").

**D9 — Erros de arquivo: alerta inline no modal (não toast).** Cabeçalho divergente/ilegível mostra mensagem em `rose-700` na seção de upload e a pré-visualização não monta (ou é limpa se um arquivo bom anterior existia). `UiUploadFiles` com `aceitar=".xlsx"`, `multiple=false`, `mostrarCamera=false`, rótulo/dica customizados (o default dele fala de PNG/JPG).

**D10 — Upload em lista separada: modo opt-in no `UiUploadFiles` (`listaSeparada`).** A revisão
pediu que o arquivo escolhido apareça num card próprio **acima** e que a caixa de upload
**some** enquanto houver arquivo (volta ao remover) — em vez do layout atual do kit (nome por
dentro da mesma caixa). Decisão: prop opt-in `listaSeparada` (default `false`, modo clássico
intacto — avatar do formulário, logos e demos da vitrine não mudam) + `rotuloLista`; no modo
lista, cards `emerald` com ícone/nome/tamanho/remover e caixa de prompt com ícone `Upload`
(sumida no single-file enquanto houver arquivo; visível no `multiple` para acrescentar).
Alternativas descartadas: markup de domínio só no modal (duplicaria o dropzone e conviveria
com o nome por dentro da caixa do kit) e trocar o default do kit (quebraria os consumidores
existentes). Como é extensão de comportamento do kit, a change carrega delta **ADDED** da
capability nova `design-system/upload` + docs/01 §5.4 e demo na seção 6 da vitrine.

## Risks / Trade-offs

- [Bundle do exceljs mesmo com import dinâmico] → só carrega no clique do usuário; se pesar em rede, mitigação futura é worker — fora do escopo da fase 1 (sem observabilidade de rede ainda).
- [Planilha com milhares de linhas trava a UI no parse] → parse em passagem única + tabela paginada (5/10/20/50); sem limite artificial de linhas nesta fase (risco aceito e documentado).
- [Comparação case-insensitive de e-mail pode divergir do comportamento do modal de cadastro (que usa igualdade simples na duplicidade)] → aceito: e-mail é normalmente normalizado em minúsculas no dominio; se o QA apontar, alinhar os dois num change futuro.
- [Modelo versionado em `docs/modelos/` pode sair de sincronia com o parser] → cabeçalho e enums vivem num único ponto no código (`lerPlanilhaUsuarios.ts`); o arquivo é gerado a partir desse cabeçalho e o cenário "Arquivo fora do modelo" protege a divergência.
- [Importados sem senha não têm marcador "convite pendente"] → não há estado de convite na fase 1; o campo simplesmente não existe no modelo e a futura change de convite define como identificá-los.

## Migration Plan

Deploy contínuo (sem migração de dados — fase 1 em memória). Rollback = reverter o código; a pasta `docs/modelos/` e a dependência `exceljs` são aditivas e inofensivas isoladamente.

## Open Questions

*(nenhuma — decisões fechadas na exploração: 4 colunas, Status importado como está, "Pronto" pré-marcados, sem download do modelo.)*
