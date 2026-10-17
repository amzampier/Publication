# Proposal

## Why

A auditoria RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, Etapa 6 — achados
`RL03-B-02` a `RL03-B-11`) encontrou um conjunto de defeitos **funcionais/UX de baixa severidade** e
lacunas de acessibilidade no design system e nas telas: a dica de upload promete `SVG` que o servidor
rejeita; o campo de rate limit aceita `0` e só falha no `PUT`; o `409` de nome de perfil duplicado cai
em toast genérico sem marcar o campo; o accent `#4ed813` é usado como texto/ícone sobre fundo claro na
`UiDataTable`; o hover do login usa hex fora da paleta; os rótulos de formulário têm peso divergente
do padrão; a ordenação da `UiDataTable` não é acessível por teclado (sem `aria-sort`); o botão de busca
de CEP não responde a `Space`; e a vitrine mantém resíduos de `lime-500`/`rose-500`/`rose-600`.

## What Changes

- **Tokens/contraste (B-06/B-07):** trocar o accent `#4ed813` por `#1a9e07`/`#0f7a06` onde aparece
  como texto/ícone sobre fundo claro na `UiDataTable`, e substituir o hover `#183b8c` do login por
  token da paleta.
- **Tipografia (B-08):** rótulos de `Input`/`Textarea`/`Select`/`DatePicker`/`Segmented` passam a
  `font-medium` (padrão do design system), sem `font-bold`/`font-semibold`.
- **Acessibilidade (B-09/B-10):** o cabeçalho ordenável da `UiDataTable` torna-se focoável e acionável
  por teclado com `aria-sort`; o gatilho de busca de CEP passa a responder a `Space`.
- **Funcional (B-02/B-03/B-04/B-05):** remover "SVG" da dica de logomarca; impedir `0` no campo de
  rate limit (validação no cliente); apontar o `409` de nome de perfil no campo Nome; corrigir o
  comentário obsoleto do modal de permissões.
- **Vitrine (B-11):** remover resíduos `lime-500`/`rose-500`/`rose-600` e hex fora da paleta das
  demonstrações de `/design`.
- **Sem `BREAKING`:** apenas ajustes visuais, de validação e de acessibilidade.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `design-system/data-table`: novo requisito — a ordenação de colunas da `UiDataTable` é acessível por
  teclado (foco + `Enter`/`Space`) e expõe o estado via `aria-sort`.

## Impact

- **Frontend (kit):** `app/components/ui/DataTable.vue`, `Input.vue`, `Textarea.vue`, `Select.vue`,
  `DatePicker.vue`, `Segmented.vue`.
- **Frontend (telas):** `app/components/configuracoes/AbaLogomarcas.vue`, `AbaSeguranca.vue`,
  `app/components/perfis/Formulario.vue`, `Permissoes.vue`, `app/components/auth/LoginForm.vue`,
  `ForgotForm.vue`, `app/components/usuarios/Formulario.vue`, `app/components/perfil/AbaEndereco.vue`,
  `app/pages/design.vue`.
- **Backend:** nenhuma mudança funcional (o `409` já vem da API; ajusta-se só a apresentação no cliente).
- **Banco:** nenhuma migration.
- **Fora de escopo:** Etapa 7 (dados/ambiente) do RL03.
