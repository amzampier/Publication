# Tasks

> Não há runner de testes no repositório; as verificações usam `npm run build`, inspeção do HTML
> renderizado (nomes acessíveis/`aria-*`) e a conferência visual em `/design` (gate do projeto).

## 1. Nomes acessíveis (M-19/M-20/M-18)

- [x] 1.1 Em `app/components/ui/Select.vue`, quando não houver `label`, expor um nome acessível (`aria-label` — nova prop opcional com fallback ao placeholder/contexto) e só usar `aria-labelledby` quando o `label` existir. Verificar por inspeção do HTML que o combobox dos modais de Filtros tem nome acessível.
- [x] 1.2 Em `app/components/ui/CheckCard.vue`, repassar o nome do cartão ao `Checkbox` interno (label/`aria-label`). Verificar que o checkbox é anunciado com o nome do cartão.
- [x] 1.3 Em `app/components/usuarios/Importar.vue`, dar `aria-label` (nome/e-mail da linha) a cada `UiCheckbox` da pré-visualização. Verificar por inspeção.

## 2. Foco visível em controles secundários (B-03)

- [x] 2.1 Substituir `focus:outline-none` por indicador `focus-visible` em `ToastContainer.vue` (fechar), `Calendar.vue` (navegação/"Hoje"/alternador), `Select.vue` (limpar) e `DatePicker.vue` (limpar). Verificar que o clique de mouse não desenha contorno e o teclado sim.
- [x] 2.2 Em `app/pages/design.vue`, adicionar indicador de foco `focus-visible` ao botão "Copiar HEX". Verificar por inspeção.

## 3. Contraste e paleta (B-05/B-07)

- [x] 3.1 Trocar o texto de apoio de `slate-400` para `slate-500` nas ocorrências apontadas (estados vazios/legendas de Configurações › Segurança, Meu Perfil, 404, KPIs de auditoria, etc.). Verificar contraste ≥ 4,5:1 (inspeção/cálculo).
- [x] 3.2 Em `app/components/ui/Badge.vue`, usar as cores documentadas nos dots de status (sem `*-500` crus); em `app/components/layout/AppHeader.vue`, tokenizar o sino (`bg-rose-500` → cor documentada). Verificar por inspeção.

## 4. UiDataTable (B-04/B-29)

- [x] 4.1 Em `app/components/ui/DataTable.vue`, não tornar focável/ordenável a coluna sem `header` (ou `sortable === false`): sem `tabindex`, sem `aria-sort`, sem rótulo de ordenação vazio. Verificar por inspeção (coluna de seleção da importação).
- [x] 4.2 Em `app/components/ui/DataTable.vue`, distinguir o estado vazio: "base vazia" × "filtro sem resultado" conforme busca/filtros ativos. Verificar com uma listagem sem filtro e com filtro sem resultado.

## 5. Menus do header por teclado (B-06)

- [x] 5.1 Em `app/components/layout/AppHeader.vue`, adicionar navegação por setas (`↑`/`↓`), `Home`/`End`, `Escape` (fecha e devolve o foco ao gatilho) e fechamento no `focusout` para fora do painel, nos painéis de notificações e do Account. Verificar por teclado.

## 6. Vitrine fiel (B-08)

- [x] 6.1 Em `app/pages/design.vue`, alinhar as demos de toast ao `ToastContainer` real (warning laranja, sem "Sucess", sem `rose-400`) e ajustar a dica de upload (sem SVG). Verificar visualmente em `/design`.

## 7. Meu Perfil e Avatar (M-17/B-30)

- [x] 7.1 Em `app/pages/admin/meu-perfil.vue`, exibir estado de erro com ação "Tentar novamente" quando a carga falhar (sem tela em branco). Verificar simulando falha (ex.: sessão/DB) e recuperando.
- [x] 7.2 Em `app/components/perfil/Avatar.vue`, corrigir o comentário: a foto é gravada como arquivo (`avatar_url`); `dataURL` é apenas rascunho.

## 8. Integração, regressão e documentação

- [x] 8.1 Rodar `npm run build` e confirmar sucesso; conferir a vitrine `/design`.
- [x] 8.2 Regressão: `Select`/`DatePicker` com `label` seguem inalterados; foco de mouse sem contorno; menus continuam fechando por clique fora; DataTable ordena e pagina normalmente.
- [x] 8.3 Atualizar `docs/01 - design_system.md` (se necessário — ex.: §5.20 Avatar, foco de controles secundários) e `docs/RL04 - Relatório de Qualidade Completo.md` marcando RL04-M-17, M-18, M-19, M-20, B-03…B-08, B-28, B-29 e B-30 como **CORRIGIDO**.
- [x] 8.4 Confirmar que os deltas refletem o comportamento implementado e que `openspec validate polir-acessibilidade-e-design-system` passa.