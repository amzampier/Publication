# Tasks

## 1. Dependência e modelo oficial

- [x] 1.1 Instalar `exceljs` (`npm i exceljs`) mantendo o restante intacto · **verificação:**
      `npm run build` segue verde e `package.json`/`package-lock.json` listam a dependência.
- [x] 1.2 Gerar `docs/modelos/modelo-importacao-usuarios.xlsx` (pasta nova) com script temporário
      one-off (não versionado) usando o `exceljs`: planilha única "Usuários", linha de cabeçalho
      `Nome | E-mail | Perfil | Status` e nenhuma linha de exemplo · **verificação:** o arquivo
      existe, é `.xlsx` legível e contém somente o cabeçalho com as 4 colunas.

## 2. Domínio: parser e gravação

- [x] 2.1 Criar `app/components/usuarios/lerPlanilhaUsuarios.ts` (import explícito, padrão
      `gerarPdf*.ts`) com `import('exceljs')` dinâmico: valida cabeçalho (trim,
      sem distinção de maiúsculas), ignora linhas totalmente vazias, aplica `trim` nas células,
      valida formato de e-mail, `PERFIS`/`STATUSES` e duplicidade case-insensitive (arquivo e
      base), classificando cada linha em `pronto`/`ja-cadastrado`/`repetido`/`invalido` + motivo
      (regra: inválida → repetida → já cadastrada → pronta) · **verificação:** `npm run build`
      compila e as regras conferem com design D4/D5 (comportamento observado no grupo 4).
- [x] 2.2 Criar `importarUsuarios(registros)` em `useUsuariosDemo.ts` espelhando o salvar do
      `Formulario`: `id` no padrão da base, `ultimoAcesso: null`, campos cadastrais vazios
      (`enderecoVazio()`, `smtpVazio()`, `avatar: ''`), `dataCadastro`/`atualizadoEm` = instante
      da gravação, Status conforme a planilha e **sem senha** · **verificação:** `npm run build`
      compila e o dev server mostra KPIs recalculados após a gravação (grupo 4).

## 3. Modal de importação e coordenação

- [x] 3.1 Criar `app/components/usuarios/Importar.vue` (auto-import `UsuariosImportar`):
      `UiModal` "Importar Usuários" com `UiModalSection` de upload (`UiUploadFiles`:
      `aceitar=".xlsx"`, `multiple=false`, `mostrarCamera=false`, rótulo/dica do modelo) +
      alerta em `rose-700` para arquivo fora do modelo/ilegível (sem montar tabela) e seção de
      pré-visualização com `UiDataTable` (`showFilters=false`) — coluna `selecao`
      (slot `cell(selecao)` com `UiCheckbox` habilitado só em `pronto`), Nome, E-mail, Perfil,
      Status e Situação (slot `cell(situacao)` com `UiBadge` done/pending/neutral/blocked e
      motivo em texto `rose-700` abaixo do badge), "Selecionar todos os prontos" no slot
      `filtersLeft`, rodapé `Cancelar` (outline) + `Importar (n)` (primary, desabilitado em 0)
      · **verificação:** `npm run build` compila e o dev server renderiza o modal com todos os
      estados (grupo 4).
- [x] 3.2 Wire na página: `Tabela.vue` — `emit('importar')` no lugar de
      `avisoProximaEtapa('Importar novos usuários')` (tooltip permanece);
      `gestao-usuarios.vue` — `importarAberto = ref(false)` + `<UsuariosImportar v-model>` e
      `@importar="importarAberto = true"` (espelho do Filtros) · **verificação:** no dev
      server o clique no ícone abre o modal **sem toast** de próxima etapa e Cancelar/`Escape`/`X`
      fecham descartando o parse.
- [x] 3.3 Semântica de seleção e gravação: parse pré-marca todas as linhas `pronto`;
      marcar/desmarcar atualiza `Importar (n)` (desabilitado em 0); confirmar grava só os
      selecionados via `importarUsuarios`, fecha o modal e emite `toast.success` com a contagem;
      reabrir zera o estado · **verificação:** no dev server, com um `.xlsx` de teste: linhas
      "Já cadastrado"/"Repetido"/"Inválida" com checkbox desabilitado, contagem correta e
      registros importados aparecendo na tabela (base completa) com datas do instante.
- [x] 3.4 Atualizar `docs/06 - Gestão de Usuários.md` no mesmo change do código: §1 (o ícone
      "Importar" abre modal, não toast), §2 (árvore de componentes com `Importar.vue` + coordenação
      `importarAberto`) e §3.3 (o `#filtersLeft` emite `@importar`) · **verificação:** nenhum
      trecho de §1/§2/§3.3 contradiz o código observado no dev server.

## 4. Integração e documentação final

- [x] 4.1 Concluir `docs/06 - Gestão de Usuários.md`: nova seção do modal de importação
      (modelo oficial em `docs/modelos/`, 4 colunas, estados de Situação com badges, seleção
      pré-marcada, gravação sem senha/datas do instante, filtros preservados, descarte), §10
      (linha da change na tabela OpenSpec), §11 (cenários do delta) e §12 (remover "Importar em
      lote" das pendências; **4 toasts remanescentes → 3**: Convite, Bloquear, CEP) ·
      **verificação:** contagens e cenários de §10/§11/§12 batem com o comportamento observado e
      nenhuma menção a "Importar com toast" permanece no documento.
- [x] 4.2 `npm run build` final sem erros + checklist dos cenários do delta
      `specs/gestao-usuarios/spec.md` no dev server (abertura sem toast, arquivo válido com
      pré-marcação, quatro estados de Situação, arquivo fora do modelo, importar grava/fecha/
      recalcula, seleção zero desabilita, reimportar marca tudo como já cadastrado, Cancelar
      descarta, filtros preservados, recarga restaura), dos cenários do delta
      `specs/design-system/upload/spec.md` (card acima + caixa some, remover devolve a caixa,
      modo clássico inalterado) e regressão dos demais modais
      (cadastro, filtros, exclusão) · **verificação:** build verde e checklist observado; o
      **QA completo da tela fica para a liberação do usuário**.

## 5. Upload do kit em lista separada (ajuste de UX pedido na revisão)

- [x] 5.1 `app/components/ui/UploadFiles.vue`: prop opt-in `listaSeparada` (default `false` —
      modo clássico intacto) + `rotuloLista` (default "Novos arquivos (serão enviados ao
      salvar)"): com a prop, a raiz vira `grid gap-3` **sem borda**, os arquivos selecionados
      aparecem em **cards `emerald` acima** (ícone `FileText`, nome truncado, tamanho em pt-BR e
      remover à direita) e a caixa tracejada (ícone `Upload` + `rotulo`/`dica`) **some quando
      há arquivo selecionado no single-file** — fica só o card —, **voltando** quando o arquivo
      é removido; no `multiple` a caixa permanece para acrescentar mais; **sem** nome de arquivo
      dentro e **sem** ações de canto · **verificação:** `npm run build` e demos clássicas da
      seção 6 do `/design` inalteradas.
- [x] 5.2 `Importar.vue` usa `lista-separada`: `rotulo="Clique para selecionar arquivos"`,
      `dica="Formatos aceitos: .xlsx"`, `rotuloLista="Arquivo selecionado"` · **verificação:**
      no dev server o arquivo escolhido aparece no card verde e **a caixa some**; ao remover no
      ícone de lixeira a caixa **volta** e o parse é limpo.
- [x] 5.3 Docs e artifacts da change: `docs/01` §5.4 (novas props e estados do modo lista),
      `docs/06` §3.8 (seção 1), demo do modo lista na seção 6 do `/design`, `proposal.md`
      (capability `design-system/upload` ADDED + escopo), delta
      `specs/design-system/upload/spec.md`, `design.md` (D10) · **verificação:**
      `openspec validate modal-importacao-usuarios --type change` válido e docs coerentes com o
      código.
