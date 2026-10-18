# Tasks

## 1. Alterar o e-mail do administrador inicial

- [x] 1.1 Trocar `ADMIN_EMAIL` para `admin@empresa.com.br` em `server/utils/bootstrap-admin.ts`; verificar que o boot provisiona o admin com o novo e-mail (banco zerado) e que a idempotÃªncia segue (nÃ£o sobrescreve existente).
- [x] 1.2 Atualizar as referÃªncias de credenciais em `docs/08 - Login de AutenticaÃ§Ã£o.md` e `docs/09 - Meu Perfil.md`, e os comentÃ¡rios em `docs/bd/02_seed.sql` e `server/migration/02_seed.sql`; verificar que nÃ£o restam menÃ§Ãµes a `ana.carolina@empresa.com.br` nesses arquivos.

## 2. VerificaÃ§Ã£o

- [x] 2.1 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e verificar que todos passam.
