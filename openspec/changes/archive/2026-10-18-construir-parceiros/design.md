# Design

## Context

Ver `proposal.md` â€” Why. O molde Ã© o mÃ³dulo **Softwares** (tela fina + componentes de domÃ­nio +
`server/utils` + `server/api/**`, RBAC por mÃ³dulo e auditoria por recurso). A diferenÃ§a central Ã© a
**listagem em cards** no lugar do `UiDataTable`, o que exige um card de entidade novo no kit.

Estado atual relevante:

- `parceiros` jÃ¡ existe (`server/migration/01_create_tables.sql`), com `id` UUID como PK e FK
  `entregas_itens.parceiro_id` (`ON DELETE RESTRICT`). A tabela estÃ¡ **vazia**.
- O mÃ³dulo RBAC `parceiros` jÃ¡ estÃ¡ na matriz (11 mÃ³dulos Ã— 9 aÃ§Ãµes); a sidebar jÃ¡ tem o item
  **Parceiros**, hoje sem rota.
- `usuarios.regiao` (`VARCHAR(20)`) e `app/config/brasil.ts` (`UFS`, `REGIOES`) jÃ¡ estabelecem o
  padrÃ£o de RegiÃ£o do Brasil; a tela de UsuÃ¡rios jÃ¡ usa `UiSelect` de RegiÃ£o.
- Uploads: `POST /api/uploads` grava em `uploads/<destino>/` via `nitro.publicAssets`, com
  whitelist fechada `UPLOAD_DESTINOS = ['logomarcas', 'avatares']`; o padrÃ£o dataURLâ†’arquivo estÃ¡ em
  `app/components/usuarios/useUsuarios.ts` (`enviarAvatar`).
- PadrÃ£o de aÃ§Ã£o "aparece no hover/focus": `app/components/perfil/Avatar.vue` (grupo + `opacity`).

## Goals / Non-Goals

**Goals:**

- Entregar a tela `/admin/parceiros` completa (cards, KPIs, filtros, exportaÃ§Ãµes, cadastro/ediÃ§Ã£o,
  exclusÃ£o e importaÃ§Ã£o), com backend real e RBAC/auditoria, alinhada a spec e design system.
- Introduzir `UiEntityCard` e `UiPagination` no kit, documentados e visÃ­veis em `/design`, antes da
  montagem do mÃ³dulo.
- Adicionar `codigo` (`PAR-XXX`), `regiao` e `logo_url` Ã  tabela, sem tocar na PK nem na FK.

**Non-Goals:**

- Migrar `parceiros` para `codigo` como PK (a FK jÃ¡ aponta para `id`).
- Refatorar o `UiDataTable` para usar o novo `UiPagination` (o kit da tabela fica como estÃ¡).
- Modelar campos da imagem de referÃªncia que nÃ£o existem (CNPJ, endereÃ§o completo, segmento,
  operadores, tipo Matriz/Filial). A imagem Ã© referÃªncia **visual** apenas.
- Importar logo/segmento por planilha (logo sÃ³ no cadastro/ediÃ§Ã£o).
- Gate de permissÃ£o no cliente (o RBAC permanece server-side, como nos demais mÃ³dulos).

## Decisions

### D1 â€” `regiao` denormalizada, derivada da UF

`parceiros.regiao VARCHAR(20) NOT NULL DEFAULT ''`, posicionada apÃ³s `estado`. Um mapa
`REGIAO_POR_UF` Ã© adicionado em `app/config/brasil.ts`; ao escolher o Estado no formulÃ¡rio, a RegiÃ£o
Ã© preenchida automaticamente. O servidor **revalida** a coerÃªncia UFâ†’RegiÃ£o na escrita.

- *Por que guardar*: a RegiÃ£o Ã© exibida no card e filtrÃ¡vel; gravar mantÃ©m o filtro e a exportaÃ§Ã£o
  simples (sem derivar em tempo de leitura).
- *Alternativas*: derivar sempre da UF (nÃ£o permite regiÃ£o divergente, mas elimina o campo â€” o
  usuÃ¡rio pediu o campo) ou `ENUM` (menos flexÃ­vel que o padrÃ£o `VARCHAR` de `usuarios.regiao`).

### D2 â€” `codigo` `PAR-XXX` como identificador secundÃ¡rio

Nova coluna `parceiros.codigo VARCHAR(20) NOT NULL` com **Ã­ndice Ãºnico**, gerada no servidor por
`MAX + retry` (molde `server/utils/softwares.ts`). **NÃ£o** Ã© PK â€” `id` (UUID) permanece PK e alvo da
FK.

- *Por que nÃ£o PK*: `entregas_itens.parceiro_id` referencia `id`; trocar a PK exigiria reapontar a FK
  (migraÃ§Ã£o de risco, como a 14 fez em softwares) sem ganho â€” a decisÃ£o do usuÃ¡rio foi explÃ­cita.
- *Corrida*: a unicidade do Ã­ndice barra inserÃ§Ãµes simultÃ¢neas; a inserÃ§Ã£o Ã© repetida uma vez.

### D3 â€” Componentes de kit novos antes do mÃ³dulo (gate visual)

`UiEntityCard` (props `codigo?`, `badge?`, `titulo`, `subtitulo?`, `linhas?` + slot `acoes`) e
`UiPagination` (paginaÃ§Ã£o client-side reutilizÃ¡vel) entram em `app/components/ui/`, viram Â§5.21/Â§5.22
de `docs/01` e ganham seÃ§Ãµes na vitrine `/design` (21 e 22) para avaliaÃ§Ã£o **antes** de montar a
grade.

- *Por que `UiEntityCard` genÃ©rico*: o usuÃ¡rio pediu um componente de kit avaliÃ¡vel; o
  `ParceirosCard` apenas o compÃµe. *Alternativa*: card direto no domÃ­nio (nÃ£o reutilizÃ¡vel, sem
  avaliaÃ§Ã£o no DS).
- *AÃ§Ãµes do card (opÃ§Ã£o B)*: topo direito, `group` + `opacity` com `group-hover`/`group-focus-within`
  (padrÃ£o `perfil/Avatar.vue`); os botÃµes permanecem focÃ¡veis por teclado mesmo "ocultos".

### D4 â€” Logo como arquivo, exibida sÃ³ no cadastro/ediÃ§Ã£o

`parceiros.logo_url VARCHAR(500) NULL` (espelha `usuarios.avatar_url`). Novo destino `'logos'` em
`UPLOAD_DESTINOS`, gated por `parceiros/alterar` (diferente de `avatares`, hoje aberto). No salvar do
formulÃ¡rio, uma dataURL nova vira arquivo via `POST /api/uploads` (molde `enviarAvatar`).

- *Alternativa*: reusar `logomarcas` â€” rejeitado: exige permissÃ£o de `configuracoes-globais` e mistura
  semÃ¢nticas.

### D5 â€” Listagem em grade de cards

`ParceirosGrade` renderiza N `ParceirosCard` em grid responsivo com busca client-side e
`UiPagination`. Sem `UiDataTable` na listagem (o `UiDataTable` continua em uso no modal de importaÃ§Ã£o,
como nos demais mÃ³dulos).

- *Por que client-side*: o volume inicial Ã© pequeno e as demais telas usam o mesmo critÃ©rio; migrar
  para server-side Ã© evoluÃ§Ã£o futura.

### D6 â€” KPIs apenas por situaÃ§Ã£o

Total, Ativos/Inativos/Bloqueados **nÃ£o** inclui Total nem quebra por regiÃ£o (decisÃ£o do usuÃ¡rio):
apenas **Ativos**, **Inativos** e **Bloqueados**, derivados do conjunto vigente (filtrado).

### D7 â€” ImportaÃ§Ã£o por planilha com dedup por razÃ£o social

Colunas **RazÃ£o Social, Nome Fantasia, Cidade, Estado, RegiÃ£o e SituaÃ§Ã£o**; `POST
/api/parceiros/importar` revalida, deduplica por **razÃ£o social** (case-insensitive), recusa tudo
quando hÃ¡ invÃ¡lida/conflito e grava em transaÃ§Ã£o com cÃ³digos sequenciais; logo nÃ£o entra. Modelo em
`docs/modelos/modelo-importacao-parceiros.xlsx`.

### D8 â€” RBAC e auditoria no padrÃ£o do projeto

Rotas exigem `requirePermission(event, 'parceiros', aÃ§Ã£o)`; escritas registram auditoria com recurso
**"Parceiros"`** (InclusÃ£o/AlteraÃ§Ã£o/ExclusÃ£o/importaÃ§Ã£o). CabeÃ§alho/KPIs/toolbar seguem o molde
`SoftwaresCabecalho` (menu RelatÃ³rios PDF/CSV).

### D9 â€” Migration nova, nÃ£o destrutiva

`15_parceiros_codigo_regiao_logo.sql` com `ALTER TABLE` (novas colunas + Ã­ndice Ãºnico), bloco
REVERTER comentado, sem `USE`/`DROP`; espelho em `docs/bd/01`. Como a tabela estÃ¡ vazia, `NOT NULL` e
`UNIQUE` entram sem perda.

## Risks / Trade-offs

- **RegiÃ£o divergente da UF** (denormalizaÃ§Ã£o) â†’ servidor revalida a coerÃªncia UFâ†’RegiÃ£o na escrita;
  UF e RegiÃ£o preenchidas juntas no formulÃ¡rio.
- **Corrida na geraÃ§Ã£o do `codigo`** â†’ Ã­ndice Ãºnico + retry de uma tentativa (molde softwares).
- **Upload aberto** â†’ destino `logos` gated por `parceiros/alterar`; validaÃ§Ã£o de magic bytes e
  whitelist de MIME jÃ¡ existentes.
- **AÃ§Ãµes sÃ³ no hover** â†’ `group-focus-within` mantÃ©m as aÃ§Ãµes visÃ­veis no foco de teclado e os
  botÃµes seguem focÃ¡veis (sem armadilha de acessibilidade).
- **`UiPagination` nÃ£o reusado pelo `UiDataTable`** â†’ duplicaÃ§Ã£o temporÃ¡ria de padrÃ£o de paginaÃ§Ã£o;
  aceitÃ¡vel para evitar risco de regressÃ£o na tabela; evoluÃ§Ã£o futura.

## Migration Plan

1. Aplicar a migration no boot (`runMigrations`); rollback manual pelo bloco REVERTER do arquivo +
   `DELETE FROM _migrations`.
2. Sem backfill (tabela vazia). Escrita de `codigo`/`regiao`/`logo_url` sÃ³ a partir da nova tela.
3. Rollback: remover colunas e Ã­ndice; a FK `entregas_itens` nÃ£o Ã© afetada.

## Open Questions

- Nenhuma pendente. O reuso do `UiPagination` pelo `UiDataTable` fica como evoluÃ§Ã£o futura (nÃ£o
  afeta spec, abordagem nem tasks).
