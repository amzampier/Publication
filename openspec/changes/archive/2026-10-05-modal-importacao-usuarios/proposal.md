# Proposal

## Why

A Gestão de Usuários ainda não permite cadastro em lote: o único caminho é um a um pelo modal de cadastro, e o ícone "Importar" da toolbar só exibe um toast de "próxima etapa". A carga de novos usuários (onboarding de equipes) precisa de importação por planilha, com conferência prévia do que será gravado — e de um modelo oficial versionado no repositório para não se perder.

## What Changes

- **Novo modal de importação** aberto pelo ícone "Importar" da toolbar (que sai da lista de toasts de próxima etapa): recebe um `.xlsx`, valida as colunas do modelo oficial, exibe os registros numa tabela temporária de pré-visualização com **Situação por linha** e deixa **selecionar quais importar** (linhas "Pronto" já pré-marcadas).
- **Modelo oficial do Excel** versionado em `docs/modelos/` (pasta nova) — colunas obrigatórias: **Nome, E-mail, Perfil, Status**.
- **Verificação de duplicidade** por e-mail contra a base vigente: linhas com e-mail já cadastrado aparecem com badge próprio e ficam **não selecionáveis**; o mesmo vale para repetições dentro do arquivo e para linhas inválidas (com motivo).
- **Gravação em memória** dos registros selecionados: nascem **sem senha** (o convite será enviado manualmente numa próxima etapa), com Data Cadastro/Última Atualização no instante da gravação; KPIs recalculam; toast de sucesso com a contagem; recarga restaura a base (regra da fase 1).
- **Dependência nova:** `exceljs` (já prescrito em `docs/02`), carregada por `import()` dinâmico.
- **Upload do kit em lista separada** (ajuste de UX da revisão): nova prop opt-in
  `UiUploadFiles listaSeparada` — card `emerald` com ícone/nome/tamanho/remover **acima** e a
  caixa de prompt **sumindo** enquanto houver arquivo (volta ao remover); o modo clássico
  (default) permanece intacto.
- `docs/06` atualizado (árvore de componentes, fluxo, cenários, OpenSpec table, pendências);
  `docs/01` §5.4 e a vitrine `/design` (seção 6) atualizados para o novo modo do `UiUploadFiles`
  — nenhum componente novo de design system (a tabela temporária compõe `UiDataTable` + slots +
  `UiCheckbox`).

## Capabilities

### New Capabilities

- `openspec/specs/design-system/upload/spec.md` (nova):
  - **ADDED** — modo lista separada do `UiUploadFiles`: cards dos arquivos acima, caixa de
    prompt sumindo no single-file enquanto houver arquivo e comportamento clássico (default)
    inalterado.

### Modified Capabilities

- `openspec/specs/gestao-usuarios/spec.md`:
  - **MODIFIED** — "As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa": o "Importar" sai da lista de controles com toast e passa a abrir o novo modal (cenário "Importar na toolbar" reescrito); Convite, Bloquear e CEP seguem com toast.
  - **ADDED** — requirement do modal de importação: upload `.xlsx` do modelo oficial, validação de cabeçalho, estados de Situação (Pronto / Já cadastrado / Repetido no arquivo / Linha inválida), seleção pré-marcada, gravação em memória com KPIs/toast/fechamento, descarte por Cancelar/`Escape`/`X`, filtros ativos preservados, operação sem HTTP e descarte na recarga.

## Impact

- **Código:** novos `app/components/usuarios/Importar.vue` (auto-import `UsuariosImportar`) e `app/components/usuarios/lerPlanilhaUsuarios.ts` (import explícito, padrão `gerarPdf*.ts`); alterados `useUsuariosDemo.ts` (função de importação), `usuarios/Tabela.vue` (`emit('importar')` no lugar do toast), `app/pages/admin/gestao-usuarios.vue` (coordenação `importarAberto`, espelho do modal de Filtros) e `app/components/ui/UploadFiles.vue` (modo opt-in `listaSeparada`, consumido pelo modal).
- **Dependências:** `exceljs` (npm), usada só no cliente via import dinâmico.
- **Documentação:** `docs/modelos/modelo-importacao-usuarios.xlsx` (pasta nova, gerada one-off); `docs/06 - Gestão de Usuários.md` (§1, §2, §3.3, nova seção do modal, §10, §11, §12; "4 toasts remanescentes" → **3**: Convite, Bloquear, CEP); `docs/01 - design_system.md` §5.4 (props `listaSeparada`/`rotuloLista` e estados do modo lista); demo "Lista separada" na seção 6 do `/design`.
- **Spec delta:** `gestao-usuarios` (1 MODIFIED + 1 ADDED) + `design-system/upload` (**nova capability**, 1 ADDED) — nenhuma capability `design-system/*` existente muda.
- **Fora de escopo (fase 1):** envio automático de convite, verificação de duplicidade em servidor/banco (hoje é a base em memória), download do modelo pelo modal, leitura de `.xls` legado.
