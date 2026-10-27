# Proposal

## Why

A reauditoria do RL06 no HEAD `b100039` encontrou três resíduos de segurança que ainda permitem exposição ou elevação indevida:

1. a autorização do thumbnail de mídia de chamada usa `LIKE base.%`, permitindo que um thumbnail de imagem não publicada seja servido quando existe uma imagem publicada de mesmo radical; a rota também aceita sessão revogada ou provisória;
2. as importações de Release/Manual/Escopo aceitam `status=Publicado` apenas com a permissão `importar`, publicando sem `publicar` e, no caso de Release, sem `data_aprovacao`;
3. `PUT /api/usuarios/:id` e `POST /api/convite` validam a hierarquia apenas do perfil enviado; um perfil inferior com `gestao-usuarios/alterar` pode resetar a senha de um Administrador mantendo o perfil real do alvo.

## What Changes

- **Mídia:** miniaturas passam a ter nome único derivado do arquivo original (`<arquivo-completo>-320.webp`); a rota autoriza a miniatura pela URL exata do original e usa `obterSessaoValida`, bloqueando sessão provisória. Miniaturas antigas caem no fallback do cliente para o original.
- **Importação:** nenhuma importação pode criar registro `Publicado`. O preview marca a linha como inválida e o servidor responde `400` sem gravar nenhuma linha. A publicação continua exclusivamente pelos fluxos explícitos, com `publicar`, `data_aprovacao` e auditoria de homologação.
- **Hierarquia:** reset de senha e convite de conta existente validam o perfil **atual do alvo**; alteração de perfil valida também o novo perfil.
- Nenhuma alteração de schema, migration ou dados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `uploads`: autorização exata da miniatura e exigência de sessão server-side válida/não provisória.
- `release-week`: importação não cria Release Week `Publicado`.
- `manuais-mensais`: importação não cria catálogo `Publicado`.
- `escopo-projetos`: importação não cria escopo `Publicado`.
- `gestao-usuarios`: reset/convite validam a hierarquia do perfil atual do alvo.

## Impact

- Servidor: `server/utils/uploads.ts`, `server/routes/uploads/chamadas/[...arquivo].get.ts`, `server/utils/{release-week,manuais,escopo-projetos}.ts`, `server/utils/hierarquia.ts`, `server/api/usuarios/[id]/index.put.ts`, `server/api/convite/index.post.ts`.
- Compartilhado: `shared/lancar-chamadas.ts`.
- Cliente: parsers de importação de Release/Manual/Escopo.
- Testes: `tests/uploads.test.ts`, `tests/lancar-chamadas-validadores.test.ts`, `tests/hierarquia.test.ts`, testes de importação e E2E.
- Documentação: `docs/12`, `docs/13`, `docs/14`.
- Sem mudança de schema/migrations; não há backfill de miniaturas.
