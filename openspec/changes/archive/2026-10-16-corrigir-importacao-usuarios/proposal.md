# Proposal

## Why

A auditoria RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, achado `RL03-A-02`)
encontrou uma divergência funcional na importação de usuários: a pré-visualização classifica
"E-mail já cadastrado" comparando o arquivo apenas com a **página corrente** da listagem — não com
a base inteira. Como a Gestão de Usuários pagina no servidor (20 por página,
`app/components/usuarios/useUsuarios.ts:196`), um e-mail que existe fora da página carregada é
marcado incorretamente como "Pronto para importar" e pré-selecionado; ao confirmar, a API rejeita
**todo** o lote com `400` ("e-mails já cadastrados"), e a pré-visualização não é corrigida. O
resultado é um fluxo de importação frustrado em bases com mais de uma página.

## What Changes

- **Classificação contra a base completa:** a pré-visualização da importação SHALL avaliar a
  situação "E-mail já cadastrado" contra **todos** os e-mails da base (todas as páginas), e não
  apenas contra o conjunto atualmente carregado na tabela.
- **Correção refletida após erro da API:** se a API ainda reportar conflito de e-mail no commit
  (ex.: cadastro concorrente entre a pré-visualização e a gravação), as linhas conflitantes SHALL
  passar a "E-mail já cadastrado" e ser desmarcadas na própria pré-visualização, permitindo
  reenviar as demais sem descartar o arquivo.
- **Sem `BREAKING`:** os demais comportamentos da importação (estados, seleção, painel de
  progresso, gravação atômica e revalidação server-side) permanecem inalterados.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `gestao-usuarios`: o requisito "A importação grava os registros selecionados via API" passa a
  explicitar que a situação **"E-mail já cadastrado"** é avaliada contra a **base completa** (todas
  as páginas), e que um conflito reportado no commit é refletido na pré-visualização — com cenários
  para e-mail existente fora da página carregada e para a correção após erro da API.

## Impact

- **Frontend:** `app/components/usuarios/Importar.vue` (obtenção do conjunto completo de e-mails e
  re-classificação após erro), `app/components/usuarios/lerPlanilhaUsuarios.ts` (já aceita a lista
  de e-mails da base) e `app/components/usuarios/useUsuarios.ts` (busca do conjunto completo).
- **Backend:** `server/utils/usuarios.ts` e `server/api/usuarios/*` — expor/consumir a lista
  completa de e-mails (reuso do modo `exportar=1` já existente ou consulta dedicada), sob a
  permissão `gestao-usuarios`/`visualizar`.
- **Banco:** nenhuma migration; usa a coluna `usuarios.email_corporativo` já indexada (única).
- **Fora de escopo:** os demais achados do RL03 (RBAC dinâmico na UI, índices/expurgo,
  documentação e UX) pertencem a outras etapas.
