# 15 - Módulo Lançar Chamadas - Área Administrativa

**Versão:** 2.0.0 - **Data:** 2026-10-21 - **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela e backend do módulo **Lançar as Chamadas** — listagem, KPIs, busca, filtros,
cadastro/edição em wizard, detalhes, aprovação, recusa, exclusão condicionada, importação XLSX,
upload de imagens e relatórios PDF/CSV sobre `entregas_itens`, com persistência no MariaDB.
**Arquivos-fonte:** `app/pages/admin/lancar-chamadas.vue`,
`app/components/lancar-chamadas/`, `server/utils/lancar-chamadas.ts`,
`server/api/lancar-chamadas/`, `shared/lancar-chamadas.ts`.
**Design system:** `app/pages/design.vue` — `UiDataTable`, `UiModal`, `UiModalSection`, `UiInput`,
`UiSelect`, `UiDatePicker`, `UiSegmented`, `UiTextarea`, `UiTagInput`, `UiBadge`, `UiActionMenu`,
`UiKpi`, `UiButton`, `UiTooltip`, `UiUploadFiles` e `UiLoading`.
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md)
**Autoridade de comportamento:** `openspec/specs/lancar-chamadas`, `openspec/specs/uploads`,
`openspec/specs/perfis-acesso` e `openspec/specs/autorizacao-rbac`.

> Em caso de divergência com a spec, a spec prevalece.

---

## 1. Visão geral e rota

- **Rota:** `/admin/lancar-chamadas` → `app/pages/admin/lancar-chamadas.vue` com
  `definePageMeta({ layout: 'admin' })`.
- **Navegação:** item **Lançar as Chamadas** na sessão **Movimentos**, com `aria-current="page"`.
- **Persistência:** tabela `entregas_itens` (itens de Release Week, Escopo de Projetos e Manuais),
  com FKs para `release_week`, `projetos_escopo`, `manuais_mensal`, `softwares(codigo)`,
  `parceiros(id)` e `usuarios(id)`.
- **Status:** `Revisar` (novo), `Aprovado` (aprovação), `Recusado` (recusa) e `Publicar` (legado).
  A tela cria em `Revisar`; aprovar/recusar exige esse status. Uma chamada `Aprovado` ou `Recusado`
  pode ser desaprovada e voltar para `Revisar`. A **Esteira de Revisão** é a dona do fluxo
  (`docs/16`); as ações rápidas desta tela usam a mesma transição de domínio e também gravam
  `historico_esteira_revisao` com parecer e critérios.
- **Esteira de Revisão:** o board de homologação, o painel de progresso e o histórico completo estão
  em [`16 - Módulo Esteira de Revisão.md`](16%20-%20Módulo%20Esteira%20de%20Revisão.md). As ações de
  **Publicar Item** (Aprovado → Publicar) e **Suspender** (Publicar → Aprovado) pertencem à Esteira;
  esta tela mantém apenas aprovar, recusar e desaprovar.
- **Vínculos permitidos:** o formulário só oferece **Release Week** em `Aberta`/`Em Revisão`,
  **Manuais** em `Rascunho`/`Em Revisão` e **Escopo de Projetos** em `Em Andamento`/`Homologação`.
  A importação XLSX rejeita linhas com pai fora desses status; na edição, o vínculo atual é preservado.
- **Status do pai:** ao criar, importar ou trocar vínculos, o conteúdo pai vinculado passa
  automaticamente para `Em Revisão` (Release/Manual) ou `Homologação` (Escopo), inclusive se estava
  `Aprovado`/`Publicado`; o pai é reaberto para revisão.
- **Visibilidade no portal:** uma chamada em `Publicar` só aparece na Área Pública quando ao menos um
  vínculo aponta para conteúdo pai com status `Publicado`. A Esteira mostra **Aguardando pai** e
  desabilita "No Portal" enquanto o pai não estiver publicado.
- **Situação:** `Desenvolvimento`, `Homologação` ou `Implantado`; novas chamadas usam
  `Desenvolvimento` e o formulário não expõe o campo.
- **Fora de escopo:** Arquivar, Área Pública, `anexos_midias`, importação de imagens pela planilha e
  limpeza de uploads órfãos de writes cancelados.

## 2. Estrutura da página

```
admin/lancar-chamadas.vue                         (page - layout admin + coordenação)
├── <UiLoading v-if="carregando" />               → primeiro acesso/F5
├── <LancarChamadasCabecalho @novo />             → Relatórios + Nova Chamada
├── <LancarChamadasKpis />                        → 4 UiKpi por status
├── <LancarChamadasTabela ... />                  → busca + filtros + UiDataTable + ações
├── <LancarChamadasFiltros v-model />             → filtros e períodos
├── <LancarChamadasImportar v-model />            → pré-visualização e importação XLSX
├── <LancarChamadasFormulario v-model />          → wizard de cadastro/edição
├── <LancarChamadasDetalhes v-model />            → detalhes somente leitura
├── <LancarChamadasAprovar v-model />             → confirmação
├── <LancarChamadasDesaprovar v-model />          → confirmação
├── <LancarChamadasRecusar v-model />             → confirmação
└── <LancarChamadasExclusao v-model />            → confirmação
```

- **Estado de coordenação:** `carregando`, `filtrosAbertos`, `importarAberto`, `formAberto`/`modo`/
  `chamadaEditar`, `detalhesAberto`, `aprovarAberto`, `desaprovarAberto`, `recusarAberto` e
  `exclusaoAberta`.
- **Estado de domínio:** `useLancarChamadasModelo` mantém `chamadas`, `catalogo`, `busca`, `filtros`
  e derivados. As ações de escrita são assíncronas e atualizam o estado apenas com a resposta da API.
- **Loading/erro:** no F5 a tela exibe `UiLoading`; falha de carga mostra toast e encerra o loading
  sem simular dados. Falha de escrita mantém o modal aberto e exibe a mensagem do backend.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<LancarChamadasCabecalho>`

- Tile `bg-brand-primary` com `Megaphone` em `#f59e0b`, título e subtítulo do módulo.
- **Relatórios** (`download`): PDF e CSV do conjunto vigente; antes de gerar, chama
  `GET /api/lancar-chamadas?download=1` para validar a permissão no servidor.
- **Nova Chamada** (`criar`): abre o wizard.

### 3.2 `Kpis.vue` → `<LancarChamadasKpis>`

- Quatro `UiKpi` do conjunto filtrado: **Total**, **Revisar**, **Aprovado** e **Recusado**.
- Recalculam com busca, filtros e mutações.

### 3.3 `Tabela.vue` → `<LancarChamadasTabela>`

- `UiDataTable` com Chamada, Título, Softwares, Módulo, Tipo, Impacto, Status, Lançamento e Liberação;
  página padrão de 10, ordenação/paginação no cliente.
- Busca gated por `buscar`, filtros por `filtrar`; badge soma busca + filtros.
- **Importar** (`importar`): ícone somente, imediatamente à esquerda do botão "Filtros".
- Ações: Detalhes; Editar (`alterar`); Excluir (`excluir`, desabilitado com motivo); Aprovar
  (`publicar`); Desaprovar (`alterar`, apenas em `Aprovado`); Recusar (`alterar`, apenas em
  `Revisar`).
- Status em `UiBadge`: `Revisar` → `pending`, `Aprovado` → `reconciled`, `Recusado` → `blocked`,
  `Publicar` → `done`.

### 3.4 `Filtros.vue` → `<LancarChamadasFiltros>`

- Status, Situação, Tipo, Impacto, Softwares (um ou mais), Parceiro, Origem, período de lançamento e de liberação.
- Rascunho isolado; “Aplicar” reflete em tabela/KPIs; “Limpar Filtros” zera; “Cancelar” descarta.

### 3.5 `Formulario.vue` → `<LancarChamadasFormulario>`

- Wizard de quatro etapas: Vínculos e origem; Identificação; Classificação; Conteúdo e mídias.
- **Novo:** status `Revisar`, tipo `Correção`, impacto `Médio`, data de lançamento no dia atual.
- **Softwares:** o campo da etapa Classificação usa o `UiMultiSelect` (busca + chips) e exige ao menos
  um software; o primeiro selecionado é o software principal gravado em `software_id`/`software`.
- **Descrição do Resumo e Solução:** usam o `UiRichText` (negrito, cor e tamanho de fonte) na etapa
  Conteúdo e mídias; a Solução é opcional e é o texto exibido na Área Pública. O HTML é sanitizado no
  servidor e o texto puro é derivado para busca/validação.
- **Data de liberação:** fica vazia e desabilitada no formulário; é preenchida apenas na aprovação
  com a `data_publicacao` do conteúdo pai (Release Week, Manual ou Escopo, nesta ordem).
- **Editar:** carrega os dados persistidos; status/autor/timestamps originais são preservados.
- **Salvar:** valida tudo, envia as imagens data URL ao upload, substitui pelas URLs públicas e só
  então chama `POST`/`PUT`. O botão fica em loading e o modal só fecha no sucesso.
- Erros `400/403/404/409` exibem a mensagem do servidor sem perder o rascunho.

### 3.6 `Midias.vue` → `<LancarChamadasMidias>`

- Título do manual, link do manual e link do vídeo.
- Galeria com remoção; `UiUploadFiles` (PNG/JPG/WebP, 5 MB), colagem `Ctrl+V` e **arrastar e soltar**.
- O drop funciona em toda a área do componente (galeria, campos e caixa de upload) e mostra o overlay
  “Solte as imagens aqui”; as imagens são validadas e incorporadas à galeria.
- As imagens ficam como data URL apenas no rascunho; o upload real ocorre no salvar.

### 3.7 `Importar.vue` → `<LancarChamadasImportar>`

- Upload `.xlsx` por clique ou **arrastar e soltar** sobre o `UiUploadFiles`, com leitura via `exceljs`
  (import dinâmico) e pré-visualização.
- Classificação por linha: `pronto`, `já cadastrado`, `repetido` ou `inválido`, com motivo.
- A confirmação fica bloqueada se qualquer linha não estiver pronta; o backend revalida tudo e grava
  em uma única transação.

### 3.8 `Detalhes.vue`, `Aprovar.vue`, `Desaprovar.vue`, `Recusar.vue` e `Exclusao.vue`

- Detalhes em modo somente leitura. A **Identificação** reúne os vínculos (Release, Manual e Escopo de
  Projetos) acima da linha da Chamada; o **Conteúdo** exibe a Descrição do Resumo e a Solução com a
  formatação salva (negrito, cor e tamanho), caindo para o texto puro quando não há HTML.
- Aprovar/Desaprovar/Recusar/Excluir são modais de confirmação; a página só fecha o modal após o
  sucesso da API. **Aprovar** e **Recusar** agora coletam parecer (opcional no aprovar, obrigatório
  na recusa) e o aprovar exige o checkbox de critérios de aceite atendidos; **Desaprovar** aceita
  parecer opcional.
- **Aprovar** preserva a `data_liberacao` existente e herda a `data_publicacao` do conteúdo pai
  (Release Week, Manual ou Escopo, nesta ordem) somente quando ela estiver vazia. **Recusar** não
  altera a data.
- **Desaprovar** volta `Aprovado` **ou** `Recusado` para `Revisar`, limpa a data de liberação e grava
  a transição (com `criterios_aceite_atendidos = 0`).
- Toda transição grava `historico_esteira_revisao` (status anterior/novo, responsável, perfil,
  parecer, critérios, tempo no estágio e data/hora) e auditoria no recurso "Lançar as Chamadas".
- Exclusão só é permitida em `Revisar` e sem histórico.

### 3.9 `gerarPdfLancarChamadas.ts`

- PDF A4 paisagem com logo opcional, título, data, contagem, colunas e paginação.
- CSV com `;`, BOM UTF-8 e neutralização de fórmulas.
- Ambos usam o conjunto vigente (filtros + busca) e exigem `download`.

### 3.10 `useLancarChamadasModelo.ts`

- `useState` para lista, catálogo, loading, busca e filtros.
- `carregarChamadas()` busca `GET /api/lancar-chamadas` e `GET /api/lancar-chamadas/opcoes`.
- Ações: `adicionar`, `atualizar`, `aprovar`, `desaprovar`, `recusar`, `excluir` e `importar`, todas
  assíncronas.
- `importar()` envia as linhas e recarrega a lista após o commit.

## 4. Modelo de dados e mapa de `entregas_itens`

```ts
interface ChamadaModelo {
  id: string
  origem: 'Release' | 'Projeto' | 'Manual' | 'Ambos'
  releaseId: string
  projetoId: string
  manualId: string
  softwareIds: string[]
  parceiroId: string
  autorId: string
  autorNome: string
  chamada: string
  dataLancamento: string
  dataLiberacao: string
  release: string
  titulo: string
  parceiro: string
  softwares: string[]
  modulo: string
  menuFuncionalidade: string
  tipo: 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
  impacto: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  situacao: 'Desenvolvimento' | 'Homologação' | 'Implantado'
  descricaoCompleta: string
  descricaoHtml: string
  solucao: string
  solucaoHtml: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  imagens: string[]
  status: 'Revisar' | 'Aprovado' | 'Recusado' | 'Publicar'
  tags: string[]
  temHistorico: boolean
  criadoEm: string
  atualizadoEm: string
}
```

| Coluna em `entregas_itens` | Uso |
|---|---|
| `id` | UUID gerado no servidor |
| `origem` | Derivada dos vínculos (`Release`/`Projeto`/`Manual`/`Ambos`) |
| `release_id` / `projeto_id` / `manual_id` | Vínculos; ao menos um obrigatório |
| `software_id` / `parceiro_id` | Vínculos validados no servidor (`software_id` = software principal) |
| `release` / `software` / `parceiro` | Snapshots textuais gravados na escrita (`software` = principal) |
| `entregas_itens_softwares` (tabela) | Junção N:N com todos os softwares da chamada (código, nome snapshot e ordem) |
| `autor_id` / `autor_nome` | Sessão do operador |
| `chamada` | Obrigatória, ≤60 e única (`uk_entregas_chamada`) |
| `titulo` | Obrigatório, ≤255 |
| `data_lancamento` / `data_liberacao` | Lançamento no dia; liberação vazia até a aprovação, quando herda a publicação da release **somente se estiver vazia** (a data existente é preservada); a recusa não altera e a desaprovação limpa |
| `modulo` / `menu_funcionalidade` | Texto livre |
| `tipo` / `impacto` / `situacao` | Enums do banco |
| `descricao_completa` | Obrigatória (texto puro derivado do HTML) |
| `descricao_html` | HTML sanitizado da Descrição (allowlist do design system) |
| `solucao` / `solucao_html` | Solução opcional: texto puro + HTML sanitizado |
| `manual_titulo` | Texto opcional, ≤255 |
| `link_manual` / `link_video` | URL http(s) opcional |
| `tags` / `imagens` | JSON arrays |
| `status` | `Revisar` na criação; `Aprovado`/`Recusado` nas ações |
| `criado_em` / `atualizado_em` | Timestamps do banco |

## 5. API

| Ação | Método e rota | Permissão |
|---|---|---|
| Listar | `GET /api/lancar-chamadas` | `visualizar` |
| Relatórios | `GET /api/lancar-chamadas?download=1` | `download` |
| Catálogos | `GET /api/lancar-chamadas/opcoes` | `visualizar` |
| Criar | `POST /api/lancar-chamadas` | `criar` |
| Editar | `PUT /api/lancar-chamadas/:id` | `alterar` |
| Aprovar | `PUT /api/lancar-chamadas/:id/aprovar` | `publicar` |
| Desaprovar | `PUT /api/lancar-chamadas/:id/desaprovar` | `alterar` |
| Recusar | `PUT /api/lancar-chamadas/:id/recusar` | `alterar` |
| Excluir | `DELETE /api/lancar-chamadas/:id` | `excluir` |
| Importar | `POST /api/lancar-chamadas/importar` | `importar` |

- Todas as rotas exigem sessão e aplicam RBAC no servidor.
- A lista devolve `{ chamadas: ChamadaModelo[] }`; as escritas devolvem a chamada no mesmo shape.
- `?download=1` retorna o mesmo conjunto sob a permissão `download`; o PDF/CSV é gerado no cliente.
- Erros: `400` validação/vínculo, `403` RBAC, `404` id, `409` duplicidade/transição inválida.
- Escritas geram auditoria no recurso **Lançar as Chamadas** (`Inclusão`, `Alteração`, `Exclusão`,
  `Homologação`); importação registra a contagem.

## 6. Importação XLSX

- Modelo: `docs/modelos/modelo-importacao-lancar-chamadas.xlsx`.
- Aba **Chamadas**, cabeçalho exato com 18 colunas:
  `Chamada | Título | Data de Lançamento | Data de Liberação | Release | Projeto | Manual |
  Softwares | Parceiro | Módulo | Menu/Funcionalidade | Tipo | Impacto | Descrição Completa |
  Título do Manual | Link do Manual | Link do Vídeo | Tags`.
- Datas aceitam `dd/mm/aaaa`, `AAAA-MM-DD` e data do Excel; não há exigência de segunda-feira.
- Vínculos por código: release/projeto/manual por `codigo`; softwares por `codigo` (um ou mais
  separados por `;`); parceiro por `codigo` (`RW-...`, `PE-...`, `MAN-...`, `SFT-...`, `PAR-...`).
- Tags separadas por `;`, com os mesmos limites do formulário.
- Novas chamadas entram com status `Revisar`, situação `Desenvolvimento` e origem derivada.
- Limite de 500 linhas; qualquer linha inválida, repetida ou já cadastrada bloqueia a importação
  inteira (rollback total).
- Não importa imagens, status ou situação.

## 7. Upload e imagens

- As imagens são enviadas no **salvar**, via `POST /api/uploads` com `pasta=chamadas`, `ano` e `mes`
  derivados de `data_lancamento`.
- Destino físico: `uploads/chamadas/<ano>/<mes>/`; URL pública:
  `/uploads/chamadas/<ano>/<mes>/<arquivo>`.
- Formatos PNG/JPEG/WebP/GIF, até 5 MB; o servidor valida magic bytes e deriva a extensão segura.
- As URLs são persistidas em `entregas_itens.imagens` (JSON) e permanecem após o F5.
- Na edição, imagens retiradas do array têm o arquivo removido após o commit; na exclusão, as
  imagens da chamada são removidas após o commit.
- A limpeza é best-effort, só atua em `/uploads/chamadas/`, preserva arquivos referenciados por outra
  chamada e não remove nada quando a exclusão é bloqueada.
- Uploads cancelados/falhos podem deixar arquivos órfãos; a limpeza não faz parte desta change.

## 8. Fluxos

- **Listagem:** `onMounted` chama `carregarChamadas()`; a API devolve as chamadas persistidas.
- **Busca/filtros:** refletem na tabela e nos KPIs no cliente.
- **Nova:** abre na etapa Vínculos com a data de lançamento do dia; a Data de liberação fica vazia e
  desabilitada até a aprovação.
- **Editar:** resolve por id, abre preenchido; o status/autoria são preservados.
- **Detalhes:** modal somente leitura.
- **Colar imagem:** `Ctrl+V` incorpora imagens ao rascunho; o envio ocorre no salvar.
- **Aprovar/Desaprovar/Recusar:** confirmam a transição e recarregam a linha/KPIs.
- **Excluir:** só em `Revisar` e sem histórico; remove arquivos de imagem após o banco.
- **Importar:** seleciona o `.xlsx`, revisa o preview e confirma; a lista é recarregada após o commit.
- **Relatórios:** validam `download` no servidor e geram PDF/CSV do conjunto vigente.
- **F5:** os dados permanecem (persistência real).

## 9. Navegação, RBAC e auditoria

- Item **Lançar as Chamadas** na sessão **Movimentos**.
- Gates da UI via `.can('lancar-chamadas', ação)`:
  - `criar` → Nova Chamada
  - `alterar` → Editar, Desaprovar e Recusar
  - `excluir` → Excluir
  - `publicar` → Aprovar
  - `download` → Relatórios
  - `importar` → Importar
  - `filtrar` → Filtros
  - `buscar` → campo de busca
  - `visualizar` → acesso à tela e item da sidebar
- O servidor valida as mesmas permissões em todas as rotas, inclusive `importar` e `download`.
- A matriz tem 91 funcionalidades: Administrador 91/91, Editor 66/91, Revisor 39/91 e Leitor 14/91.

## 10. Validações e regras de negócio

- `chamada`: obrigatória, ≤60 e única (case-insensitive).
- `titulo`: obrigatório, ≤255.
- `softwareIds` (ao menos um), `parceiroId`, `modulo` e `descricaoCompleta`: obrigatórios; `modulo` ≤100.
- `manualTitulo`: opcional, ≤255.
- Ao menos um vínculo (Release, Projeto ou Manual).
- `dataLancamento`: obrigatória, qualquer data civil válida (o formulário inicia com a data do dia).
  `dataLiberacao`: vazia e desabilitada no formulário; a aprovação preserva a data existente e herda
  a `data_publicacao` da release vinculada somente quando estiver vazia. A recusa não altera a data
  e a desaprovação a limpa.
- Links: `http(s)` quando informados.
- Tags: até 12, cada uma até 30 caracteres, sem duplicatas.
- Imagens: até 20 URLs, PNG/JPG/WebP/GIF até 5 MB cada.
- `situacao`: não editável; default `Desenvolvimento`.
- Novo status `Revisar`; status não editável no formulário.
- Exclusão bloqueada quando `status !== 'Revisar'` ou houver histórico na esteira.
- Aprovação/recusa bloqueadas quando o status não é `Revisar`; desaprovação permitida em `Aprovado`
  ou `Recusado`.
- Recusa sem parecer é bloqueada no cliente e na API (`400` com erro no campo `parecer`).
- Aprovação exige o checkbox de critérios de aceite atendidos no modal; o histórico grava
  `criterios_aceite_atendidos = 1` no aprovar e `0` na recusa/desaprovação.

### Ordenação

A ordenação é sempre por `chamada ASC` (comparação numérica natural). `ordem_apresentacao` permanece
como legado e não é usada pela UI.

## 11. Relatórios PDF/CSV

- PDF A4 paisagem, logo opcional, título, data, contagem, colunas e paginação.
- CSV com `;`, BOM UTF-8 e neutralização de fórmulas.
- Ambos usam o conjunto vigente (filtros + busca) e exigem `download`; conjunto vazio não gera
  arquivo e exibe aviso.

## 12. Documentação relacionada

- Design system: [`docs/01`](01%20-%20design_system.md) §5.23 (ActionMenu) e §5.24 (TagInput).
- Arquitetura/migrations: [`docs/02`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md).
- Header/Sidebar: [`docs/03`](03%20-%20Header%20e%20Sidebar.md).
- Perfis/RBAC: [`docs/07`](07%20-%20Perfis%20de%20Acesso%20(RBAC).md).
- Auditoria: [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md).
- Banco: [`docs/bd/01`](bd/01%20-%20banco_dados_mariadb.sql) e
  [`docs/bd/02`](bd/02_seed.sql).

## 13. Verificação

- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- Testes: `tests/lancar-chamadas-validadores.test.ts`,
  `tests/lancar-chamadas-import-parser.test.ts`, `tests/uploads.test.ts` e
  `tests/perfis-funcionalidades.test.ts`.
- Manual: F5, busca/filtros, criar/editar/detalhar, upload no salvar (clique, colagem e arrastar/soltar),
  aprovar/desaprovar/recusar, exclusão com remoção de arquivo, importação válida/inválida (clique ou drop),
  403 sem `importar` e PDF/CSV.
- Vitrine: `http://localhost:3000/design` — seções do UI kit.

## 14. Pendências e próximos passos

- Ação **Arquivar** e coluna correspondente (decisão de schema).
- **Área Pública** e exposição das chamadas.
- **`anexos_midias`** e galeria rica (a tabela existe, mas o módulo usa `imagens` JSON).
- Limpeza de uploads órfãos de chamadas canceladas/falhas após o upload.
- Evolução para filtros/paginação server-side se o volume crescer.
