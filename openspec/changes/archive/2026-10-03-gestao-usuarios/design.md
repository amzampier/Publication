# Design

## Context

Ver `proposal.md` (Why). O repositório já consolidou dois módulos admin com o mesmo desenho — Configurações Globais (`configuracoes/`) e Gestão de Auditoria (`auditoria/`): page fina em `app/pages/admin/*.vue` com `definePageMeta({ layout: 'admin' })`, componentes de domínio em `app/components/<modulo>/` (auto-import pelo prefixo da pasta), dados demo em composable com `useState` e exportação CSV inline + PDF via `jspdf`. O item "Gestão de Usuários" já existe em `app/config/navigation.ts` (sidebar l.96 e menu da conta l.118) com cor `#b070ef`, mas sem `to`. O kit `Ui*` cobre tudo que a página precisa (`UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`, `UiTooltip`); `UiModal` existe mas fica excluído nesta fase.

## Goals / Non-Goals

**Goals:**
- Entregar a página principal `/admin/gestao-usuarios` com cabeçalho, KPIs, tabela e exportação, 100% frontend em memória.
- Manter a página "fina": a page só coordena estado e compõe componentes de domínio.
- Deixar a fase 2 (modais) com ponto de encaixe claro: um único lugar por ação (emit/toast → futuro modal).

**Non-Goals:**
- Criar qualquer `UiModal` (cadastro/edição, filtros).
- Criar novos componentes de kit ou mudar a vitrine `/design` — a única extensão de kit é o slot opt-in `filtersLeft` do `UiDataTable`, que não altera o render padrão (consumidores sem o slot continuam idênticos).
- Persistência, `server/`, autenticação/RBAC de verdade.
- Página de Perfis (RBAC) — módulo separado, ainda sem rota.

## Decisions

### D1 — Rota `/admin/gestao-usuarios` (não `/admin/usuarios`)
O id do item de navegação é `gestao-usuarios` e o padrão do repo é id == rota sem o prefixo `/admin` (`configuracoes-globais` → `/admin/configuracoes-globais`). Manter o par id/rota iguais evita duas fontes de verdade para o mesmo conceito. Alternativa descartada: `/admin/usuarios` (mais curto, mas quebra o par com o id já existente).

### D2 — Espelhar a estrutura da Auditoria em vez de uma página monolítica
`Cabecalho`, `Kpis`, `Tabela` + `useUsuariosDemo` + `gerarPdfUsuarios`, com a page orquestrando. Racional: é o padrão dos últimos 2 módulos, o auto-import `Usuarios*` já funciona por convenção de pasta, e a doc `docs/06` pode reaproveitar o gabarito do `docs/05`. Alternativa descartada: page única com tudo inline (menos arquivos, mas concentra lógica e foge do padrão que os próximos módulos herdam).

### D3 — Ações sem modal na fase 1 → toast "em breve" (decidido com o usuário)
`Novo Usuário`, `Importar` (toolbar, com tooltip), `Filtros` e as 4 ações de linha (enviar o convite, bloquear, editar, excluir) clicáveis disparam toast via `useToast` (mesmo composable global usado por Configurações). Alternativas consideradas: botões `disabled` + tooltip (esconde a intenção) e esconder os controles até a fase 2 (a página parece incompleta). O toast mantém a tela "pronta" e o texto do toast é o contrato de transição: na fase 2, cada toast vira a abertura do modal correspondente.

### D4 — PDF via `jspdf` + `jspdf-autotable`, copiando o modelo de `gerarPdfAuditoria`
A Auditoria já saiu de `window.print()` para `jspdf` (change `relatorio-pdf-auditoria`); reusar a mesma abordagem mantém os dois relatórios com visual consistente (A4 paisagem, logo de login à esquerda, título, colunas, rodapé "Página X de Y") sem tocar em `main.css`. Alternativa descartada: `window.print()` (diálogo do navegador, estilos de impressão compartilhados, divergente do padrão já adotado). A função fica em `gerarPdfUsuarios.ts` (arquivo utilitário, não componente) como espelho de `gerarPdfAuditoria.ts`. A **Ficha Cadastral** (opção do menu Relatórios, decidida com o usuário) reusa o mesmo modelo visual num arquivo irmão, `gerarPdfFichaCadastral.ts`: `jspdf` puro (sem autotable), A4 **retrato**, 1 página por usuário com faixas navy de seção.

### D5 — Dados demo no composable `useUsuariosDemo` com `useState`
Tipos (`UsuarioDemo`, `PerfilUsuario`), listas de perfis/usuários, `filtros` em `useState('usuarios-filtros')` e `usuariosFiltrados` derivado — espelho exato do `useAuditoriaDemo`. Racional: KPIs, tabela e exportação leem o mesmo conjunto; o estado sobrevive à navegação interna do ciclo e a recarga restaura a base. Alternativa descartada: mock fixo na page (quebra composição e exportação em outros componentes).

### D6 — KPIs e exportação derivam do conjunto do composable; a busca da tabela é interna ao `UiDataTable`
Mesmo desacoplamento da Auditoria: a busca na toolbar filtra só as linhas da tabela, enquanto KPIs e exportação usam `usuariosFiltrados`. Evita reacender KPIs a cada tecla e mantém o `UiDataTable` como dono único do estado de busca. Se a fase 2 quiser busca que afete KPIs, é mudança de requisito consciente (spec atual não exige).

### D7 — Nenhum componente de kit novo; slot opt-in `filtersLeft` no `UiDataTable` → vitrine e specs existentes intocadas
Tudo compõe `Ui*`. O cabeçalho precisa exibir um botão "Importar" imediatamente à esquerda do "Filtros", que vive dentro da toolbar do `UiDataTable` — em vez de recriar a toolbar fora do kit (paralelo proibido pelo AGENTS), o `UiDataTable` ganha o slot opt-in `filtersLeft`, vazio por padrão: nenhum consumidor existente (Auditoria, vitrine `/design`) passa o slot, então o render padrão não muda. Consequências verificadas: `app/pages/design.vue` não muda e `design-system/layout-navigation` já prevê `to` opcional nos itens (requirement "Itens de navegação podem declarar rota..."), então declarar a rota não é delta de spec — só uso do requisito.

## Risks / Trade-offs

- **Controles que não executam a ação prometida** → mitigado pelo toast explícito "disponível na próxima etapa" (decisão D3) e por `docs/06` listar as pendências da fase 2.
- **`gerarPdfUsuarios` duplica lógica do `gerarPdfAuditoria`** → cópia pode divergir se um dos dois evoluir; aceito nesta fase (2 arquivos pequenos); se um terceiro relatório surgir, fatorar um gerador comum.
- **Dados demo desalinhados com o schema real de `usuarios` do `docs/02`** → mitigado modelando os campos que o `docs/02` já descreve (nome, e-mail, perfil, status, último acesso) e deixando o restante (senha hash, bloqueio, tentativas) explícito como fora de escopo na fase 1.
- **Spec exige ausência de rolagem horizontal com 6 colunas** → risco baixo: a Auditoria já cabe com 7 na mesma barra de larguras; validar na checagem visual.
