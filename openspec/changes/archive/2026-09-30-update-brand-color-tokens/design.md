# Design

## Context

`tailwind.config.js` está com `theme.extend: {}` vazio, enquanto o código usa `bg-brand-primary`, `bg-brand-structure`, `bg-brand-primary-raised` e `bg-brand-primary-sunk` em 44 pontos de 12 arquivos. A compilação atual gera **zero** regras para essas classes (busca por `brand` no CSS gerado = 0), então botão primário, cabeçalho de modal, cabeçalho da `DataTable`, item ativo da sidebar, tooltip, checkbox marcado, dia selecionado do calendário e chips aparecem **sem cor de fundo**. Ver motivação em `proposal.md`.

Stack relevante: Tailwind **3.4.19** via `@nuxtjs/tailwindcss` **6.14.0**, que lê `tailwind.config.js` — não há outro arquivo CSS no projeto além de `app/assets/css/main.css` (que só contém `@tailwind` directives, utilitários próprios e a folha de impressão).

## Goals / Non-Goals

**Goals:**
- Tornar os tokens `brand.*` reais (CSS gerado > 0) e já com os novos valores da paleta.
- Aplicar o degradê `#112051 → #0364f7` exatamente em duas superfícies: botão primário e cabeçalho de modal.
- Alinhar o accent renderizado (`lime-400` = `#a3e635`) com o hex divulgado, criando `brand.accent = #4ed813`.
- Manter vitrine `/design`, componentes e `docs/01 - design_system.md` dizendo o mesmo valor.

**Non-Goals:**
- Corrigir acessibilidade/contraste do accent sobre fundo claro (mantém-se o comportamento atual, apenas com outro hex).
- Alterar os acompanhantes `lime-300`, `lime-500`, `lime-50`, `lime-200` usados em hover e fundos.
- Mudar o default `cor: '#2161ef'` do `Kpi`, que já é declarado fora da paleta oficial.
- Pendências da fase shell (`app/config/navigation.ts` FinancePro, warning `NUXT_E4007`), testes automatizados e lint.

## Decisions

**D1 — Tokens em `tailwind.config.js` (`theme.extend.colors`).**
Alternativa considerada: definir via variáveis CSS + `@apply` em `main.css`. Rejeitada porque o código depende de variantes com opacidade (`bg-brand-structure/10`, `/60`) e de `hover:`/`active:`, que só funcionam de graça com cores registradas no tema. Reforço: `docs/01` já documenta esses tokens como vindos de `tailwind.config.js`, então a correção alinha código e documentação em vez de criar uma terceira fonte.

```js
colors: {
  brand: {
    primary: '#112051',
    structure: '#0364f7',
    accent: '#4ed813',
    'primary-raised': '#1b2e6b',
  },
}
```

**D2 — Degradê explícito em 2 componentes, não em token.**
`Button.vue` (variante `primary`) e `Modal.vue` (cabeçalho) recebem `bg-gradient-to-r from-brand-primary to-brand-structure`. Alternativa: criar um utilitário customizado (ex.: `.bg-brand-gradient`). Rejeitada — só há dois consumidores, e classes explícitas deixam visível no template que aquela superfície é exceção à regra de cor sólida.

**D3 — Hover/active por brilho, não par de hexes.**
`hover:brightness-110` / `active:brightness-95` sobre o degradê. Alternativa considerada: pares de degradê próprios para raised/sunk, exige derivar 4 hexes novos sem referência de design. O filtro preserva o degradê (é a regra visual nova) e custa duas classes.

**D4 — `primary-raised` continua; `primary-sunk` é removido.**
O botão deixa de usar ambos ao migrar para brilho (D3), mas `CheckChip.vue:95` (`bg-brand-primary-raised`), `design.vue:532`, `design.vue:1036` e `design.vue:1297` ainda usam `raised` como fundo/hover fora do botão — ele permanece, com valor `#1b2e6b` (derivado de `#112051`). `primary-sunk` (`#0a1539`) tinha exatamente uma referência no projeto inteiro, justamente o `active:` do botão removido em D3; sem consumo, o JIT do Tailwind não gera a classe e o token passaria a ser código morto. Decidido com o usuário: **remover `primary-sunk`** do config, da spec e desta tabela, em vez de mantê-lo como par documental.

**D5 — Migração integral dos 24 usos de `lime-400` (decidido com o usuário).**
Escolha entre isso, migrar só os usos sobre chrome escuro, ou criar o token sem migrar. A opção escolhida elimina a divergência em que a seção 2 anuncia `#49de10` enquanto a app renderiza `#a3e635`. Acompanhantes `lime-300/500/50/200` permanecem — são estados e fundos derivados da escala, não o accent em si.

**D6 — Hex inline vira classe tokenizada.**
`AppHeader.vue:93` e `design.vue:1878` hoje usam `style="background-color:#00259c"`. Passar a `bg-brand-primary` remove uma fonte de cor paralela. A vitrine continua podendo exibir hex literal (`bg-[#…]`) — ela *é* a amostragem da paleta e precisa mostrar o valor cru para o botão "Copiar HEX".

**D7 — Ordem de verificação.**
A prova de que a mudança funcionou não é visual, e sim estrutural: greps de regressão para `#00259c|#087df9|#49de10|lime-400` → 0, e `brand` no CSS gerado → > 0 (hoje é 0). Só então `npm run build` + inspeção de `/design`.

**D8 — O rótulo humano do token 7 é "Azul Estrutural (Estrutura Dark)".**
Decidido com o usuário: o rótulo segue a cor real do token. A primeira implementação usou `structure = #046417` (verde) e por isso o rótulo virou "Verde Estrutural"; após a revisão de D9 para `#0364f7` (azul) o rótulo volta a **"Azul Estrutural (Estrutura Dark)"** na vitrine (`design.vue`) e na tabela §2 do `docs/01`, mantendo a classe `bg-brand-structure` (o nome do token não muda, só o rótulo humano). Alternativa descartada: deixar o nome sem matiz ("Estrutural") — mais genérico e perde a informação de matiz que a tabela §2 usa nas demais linhas.

**D9 — Revisão pós-implementação: `brand.structure` passa de `#046417` para `#0364f7`.**
Aberto pelo usuário ao revisar a vitrine: o padrão oficial de cores é Navy `#112051` + Estrutural `#0364f7`, não o valor da primeira proposta. Alcance: `tailwind.config.js`, swatch 7 da vitrine, tabela §2 do `docs/01`, item ativo da sidebar (`bg-brand-structure/10`) e as duas superfícies de degradê — que voltam a ler o token (`to-brand-structure`) em vez de hex solto, já que agora coincidem. `bg-brand-accent` (`#4ed813`) e os demais tokens não mudam. Verificado: `.bg-brand-structure` = `rgb(3 100 247)`, `.to-brand-structure` = `#0364f7`, greps de `#046417` → 0, `npm run build` e `openspec validate --specs` verdes.

## Risks / Trade-offs

- **App ganha cor onde antes não havia** → é o comportamento correto, mas é uma mudança visual grande em um único commit. Mitigação: `npm run build` + inspeção de `/design`, do cabeçalho do app e de um modal antes de encerrar.
- **`#4ed813` sobre fundo claro continua com contraste baixo** (borda do `CheckCard`, hover do `Checkbox`, botões da `CameraWeb`, handle de resize da grid) → aceito e registrado como Non-Goal; a mitigação é documental, em `docs/01`.
- **Variantes com opacidade podem não gerar se o token estiver mal aninhado** → coberto pelo cenário `bg-brand-structure/10` na spec e pelo grep no CSS gerado.
- **Divergência futura entre vitrine, componentes e docs** → as três passam a ler do mesmo token; a tarefa de verificação cobre as três superfícies.
- **`docs/01` é a fonte da verdade e tem 21 menções aos hexes/`lime-400`** → atualização é task dedicada, não incidental, para não deixar documentação óbsoleta.

## Migration Plan

1. Criar os tokens (a partir daqui as classes passam a existir, ainda com valor velho ou novo conforme a ordem das tasks).
2. Aplicar degradê + brilho nos dois componentes.
3. Migrar accent e hexes avulsos.
4. Atualizar vitrine e docs.
5. Verificação: greps de regressão, `npm run build`, inspeção de `/design` e de um modal.

Rollback: mudança puramente de apresentação, sem dados nem API — basta reverter o commit.

## Open Questions

Nenhuma. As decisões de escopo (sistema real, criação dos tokens, token de accent, degradê com fim em `brand.structure`, atualização dos docs, brilho em hover/active e migração dos 24 usos) foram resolvidas com o usuário durante o explore mode. A revisão D9 (valor de `brand.structure`) também foi resolvida com o usuário.
