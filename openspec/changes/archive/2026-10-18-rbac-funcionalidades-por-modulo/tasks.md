# Tasks

## 1. Catálogo de funcionalidades por módulo

- [x] 1.1 Declarar `FUNCIONALIDADES_POR_MODULO` em `server/utils/perfis.ts` (fixas + extras por módulo, incluindo `filtrar`, `buscar`, `permissoes`) e ajustar `ACOES_IDS`/`EXTRAS_IDS`/`validarMatriz` para validar **por catálogo**; verificar com testes que `publicar` em Perfis e módulo desconhecido retornam `400` e que as funcionalidades válidas passam.
- [x] 1.2 Espelhar o mesmo catálogo em `app/components/perfis/usePerfisModelo.ts` (`FUNCIONALIDADES_POR_MODULO`, `PERMISSOES_POR_PERFIL` = 85) e adicionar teste de sincronia entre os dois lados; verificar `npm run test`.
- [x] 1.3 Ajustar `salvarMatriz`/`copiarMatriz` para gravar as funcionalidades específicas no `extras` (vivas por catálogo) e as 4 fixas nas colunas; verificar gravação/leitura de uma matriz com `permissoes`, `filtrar` e `buscar`.

## 2. Modal da matriz (frontend)

- [x] 2.1 `app/components/perfis/Permissoes.vue`: renderizar apenas as funcionalidades do módulo (fixas aplicáveis em interruptor + específicas em chips) e trocar o contador para `n/85`; verificar visualmente que Perfis mostra `permissoes`/`exportar`/`filtrar` e Auditoria mostra `exportar`/`filtrar`.

## 3. Guardas no servidor

- [x] 3.1 `server/api/softwares/index.get.ts`, `server/api/parceiros/index.get.ts` e `server/api/perfis/index.get.ts`: exigir `<modulo>/exportar` quando vier `?exportar=1` (senão `visualizar`); verificar `403` sem a permissão e `200` com ela.
- [x] 3.2 `server/api/perfis/[id]/permissoes/index.put.ts` e `.../copiar/index.post.ts`: trocar a exigência de `perfis-acesso/alterar` para `perfis-acesso/permissoes`; verificar `403` para perfil com `alterar` mas sem `permissoes`.
- [x] 3.3 `server/api/usuarios/index.get.ts` e `server/api/auditoria/index.get.ts`: exigir `filtrar`/`buscar` quando os respectivos parâmetros vierem; verificar que os filtros/busca server-side são recusados sem a funcionalidade.
- [x] 3.4 Testes unitários das guardas (mapas de parâmetro → funcionalidade) e ajuste de `tests/*` que referenciem `PERMISSOES_POR_PERFIL`/9 ações; verificar `npm run test`.

## 4. Gating de interface

- [x] 4.1 Aplicar `.can(modulo, funcionalidade)` para esconder/desabilitar: botão "Filtros" (`filtrar`), campo de busca (`buscar`), exportações (`exportar`), importação (`importar`) e ação "Permissões" (`permissoes`) nos módulos construídos; verificar que um perfil sem a funcionalidade não vê o controle.

## 5. Seed e documentação

- [x] 5.1 Reescrever as matrizes em `server/migration/02_seed.sql` conforme o catálogo (Administrador 85, Editor 61, Revisor 37, Leitor 12) e espelhar em `docs/bd/02_seed.sql`; verificar a soma gravada contra o catálogo.
- [x] 5.2 Reescrever `docs/07 §7` (tabelas e totais sobre o catálogo, 85), `docs/02 §3.5` (funcionalidades por módulo + `extras`) e o KPI/contadores citados; verificar consistência documento ↔ matriz (`195/340`).
- [x] 5.3 Criar a migration `16_reconciliar_matriz_funcionalidades.sql` que reseta `permissoes_perfil` para o catálogo (reconcilia bases com a matriz antiga, devolvendo `permissoes` ao Administrador); verificar que, após o boot, o perfil Administrador recupera a ação "Permissões".

## 6. Verificação

- [x] 6.1 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e corrigir falhas; verificar que todos passam.
- [x] 6.2 Conferência manual em `/admin/perfis-acesso`: abrir Permissões e verificar que cada módulo exibe só as suas funcionalidades, o contador reflete `n/85`, e que conceder/negar `filtrar`/`buscar`/`exportar`/`permissoes` altera o comportamento nas telas correspondentes.
