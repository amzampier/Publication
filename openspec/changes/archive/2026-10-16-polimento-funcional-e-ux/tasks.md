# Tasks

## 1. Tokens e tipografia (B-06, B-07, B-08)

- [x] 1.1 Em `app/components/ui/DataTable.vue`, trocar o accent `#4ed813` usado como texto/ícone sobre fundo claro (tile do título e ícone de agrupamento) por `#1a9e07`/`#0f7a06`. Verificação: `npm run build` OK e nenhum `text-brand-accent` sobre superfície clara nesses pontos.
- [x] 1.2 Em `app/components/auth/LoginForm.vue` e `ForgotForm.vue`, trocar o hover `#183b8c` por token da paleta (ex.: `hover:text-brand-structure`). Verificação: build OK e sem `#183b8c`.
- [x] 1.3 Nos rótulos de `Input.vue`, `Textarea.vue`, `Select.vue`, `DatePicker.vue` e `Segmented.vue`, usar `font-medium` (remover `font-bold`/`font-semibold`). Verificação: build OK; rótulos em `font-medium`.

## 2. Acessibilidade (B-09, B-10)

- [x] 2.1 Em `app/components/ui/DataTable.vue`, tornar o `th` ordenável focoável (`tabindex="0"`), acionável por `Enter`/`Space` e expor `aria-sort` (ascending/descending/none) + rótulo acessível. Verificação: build OK; o cabeçalho ordenável responde a teclado e expõe `aria-sort`.
- [x] 2.2 Em `app/components/usuarios/Formulario.vue` e `app/components/perfil/AbaEndereco.vue`, tratar `Space` (além de `Enter`) no gatilho de busca de CEP (`role="button"`). Verificação: build OK.

## 3. Funcional e vitrine (B-02, B-03, B-04, B-05, B-11)

- [x] 3.1 Em `app/components/configuracoes/AbaLogomarcas.vue`, remover "SVG" da dica de upload (PNG, JPG/JPEG, WebP, GIF). Verificação: build OK; dica sem "SVG".
- [x] 3.2 Em `app/components/configuracoes/AbaSeguranca.vue`, validar mínimo `1` no campo de requisições por minuto (não aceitar `0`/vazio no rascunho). Verificação: build OK; campo vazio/0 não habilita salvar.
- [x] 3.3 Em `app/components/perfis/Formulario.vue`, ao capturar `409` de nome duplicado, marcar o campo Nome (em vez de só toast genérico). Verificação: build OK; `409` aponta o erro no campo Nome.
- [x] 3.4 Em `app/components/perfis/Permissoes.vue`, remover o comentário obsoleto ("sem interruptor nesta etapa"). Verificação: build OK.
- [x] 3.5 Em `app/pages/design.vue`, substituir `lime-500`/`rose-500`/`rose-600` e hex fora da paleta das demonstrações por tokens. Verificação: build OK; grep sem `lime-500`/`rose-500`/`rose-600` nos trechos decorativos.

## 4. Verificação integrada e documentação

- [x] 4.1 Rodar `npm run build`. Verificação: conclui sem erro.
- [x] 4.2 Executar `openspec validate --specs` e revisar o `/design`. Verificação: 30/30 specs válidas; sem resíduos de `#183b8c`/`lime-500`/`rose-500`/`rose-600` nos locais corrigidos.
- [x] 4.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, marcando `RL03-B-02` a `RL03-B-11` como corrigidos (com a data e a change) na Etapa 6. Verificação: as linhas da Etapa 6 constam como corrigidas.
