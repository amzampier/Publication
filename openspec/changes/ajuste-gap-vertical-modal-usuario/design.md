# Design

## Context

O modal Novo/Editar Usuário (`app/components/usuarios/Formulario.vue`) monta seu corpo com três níveis de grid, todos hoje em `gap-4` (16px) na vertical:

```
A. grid raiz (Formulario.vue:393)          -> entre os cards UiModalSection
B. grid interno do UiModalSection (:27)    -> entre blocos dentro de uma seção
   (só seções 1 e 3 têm mais de 1 bloco)
C. grids de campos (Formulario :396, :407, :447, :488, :559, :643)
                                            -> entre linhas quebradas dos campos
```

Restrições: `ModalSection.vue` é compartilhado por Filtros (Usuários/Auditoria), Importar, Exclusão, Detalhe da Auditoria, Câmera e pela vitrine §15 do `/design` — não pode mudar de comportamento. A verdade visual vive em `docs/01`/`docs/06`; specs OpenSpec não fixam valores de gap (ver proposal.md — Capabilities). Sem lint/test no repo: o gate é `npm run build` + conferência visual (AGENTS.md).

Ver proposal.md para o motivation (usuário pediu -5px na vertical).

## Goals / Non-Goals

**Goals:**
- Todos os gaps **verticais** do modal Novo/Editar: 16px → **11px** (uniforme, "-5px sempre").
- Preservar o gap **horizontal** entre colunas em 16px (`gap-x-4`).
- Zero efeito nos demais modais e nos defaults do kit `UiModalSection`.

**Non-Goals:**
- Alterar `ModalSection.vue`, `Modal.vue` ou qualquer outro componente do kit.
- Mexer em validação, foco/teclado (`aoEnter`), layout de colunas (`col-span`) ou conteúdo dos blocos.
- Atualizar specs OpenSpec (`skip_specs: true` — nenhum requisito de comportamento muda).
- Reduzir paddings (header, `p-5` do corpo, `p-4` das seções) — só o gap entre linhas.

## Decisions

**D1 — `-5px` uniforme (16 → 11px) em vez de cascata.**
"Sempre diminuindo 5px" interpretado como *cada* gap vertical perde 5px. Alternativa descartada: cascata progressiva (11, 6, 1px...) — fica irregular visualmente e não foi o que o usuário escolheu (confirmado na conversa de explore).

**D2 — Override do nível B por `class` com seletor descendente, não mexendo no kit.**
`<UiModalSection class="[&>div.grid]:gap-y-[11px]">` nas quatro seções do `Formulario.vue`. O `class` cai por fallthrough de attrs no `<section>` raiz (raiz única, sem `inheritAttrs: false`) e o seletor atinge **só** o wrapper do slot (`div.grid`), único filho direto com essa classe — os demais filhos são `div.flex` (título) e `div.h-px` (divisória).

| Alternativa | Por que descartada |
| :--- | :--- |
| Prop nova em `ModalSection` (`denso`/`gap`) | Amplia a API do kit para 1 consumidor; exige doc em `docs/01` §5.12; mais superfície para manter |
| Editar `ModalSection.vue:27` direto | Muda todos os modais do sistema — fora do escopo decidido |
| `<style scoped>` + `:deep()` no `Formulario` | Escopo do pai não alcança o DOM teletransportado do modal de forma confiável; seletor opaco |

**D3 — Valor arbitrário `gap-y-[11px]`, mantendo `gap-x-4`.**
11px não existe na escala Tailwind padrão (`gap-2.5`=10px, `gap-3`=12px) e o `tailwind.config.js` não define spacing custom — usar classe arbitrária, já prática recorrente no repo (`mb-[1px]`, `h-[34px]`, `p-4.5`). Onde o grid é de 1 coluna (nível A, `Formulario:393`) usa-se só `gap-y-[11px]` (gap-x nunca renderiza); nos grids com colunas, `gap-x-4 gap-y-[11px]` preserva os 16px horizontais.

**D4 — Documentar em `docs/06` §3.4, não em `docs/01` §5.12.**
O override é particular do modal de usuários; `docs/01` documenta os defaults do kit, que continuam corretos. Um bullet novo em `docs/06` §3.4 registra o ritmo 11px/16px e a mecânica do override (incluindo a dependência do seletor `>div.grid`).

## Risks / Trade-offs

- [Seletor `[&>div.grid]` quebra se o template de `ModalSection` mudar (novo filho `div.grid` ou renomear a classe do wrapper)] → Seletor escolhido por classe, não por posição (`last-child` descartado por ser mais frágil); revisar se `ModalSection.vue` for tocado; a verificação visual pega regressão.
- [Tailwind não gera a classe se o texto for construído dinamicamente] → Classes escritas literalmente no template; o módulo `@nuxtjs/tailwindcss` varre os `.vue` normalmente.
- [Em telas estreitas os grids colapsam para 1 coluna e todo gap vira vertical de 11px — sensação de "espremido"?] → 11px ainda separa rótulo/erro claramente (mensagens de erro ficam dentro da célula do campo, não no gap); conferir 320–768px na verificação.
- [Outros modais (Filtros, Importar) continuam em 16px — possível inconsistência percebida] → Aceito e explícito: escopo decidido como "só Novo/Editar Usuário"; se o usuário pedir depois, é mudança pontual em `ModalSection` ou replicando o override.

## Migration Plan

Não aplicável — mudança de estilo pura, sem dados, API ou migração; deploy/rollback = commit único.

## Open Questions

Nenhuma. Todas as decisões de escopo (uniforme, escopo só do formulário de usuário, sem delta de spec) foram confirmadas na conversa de explore.
