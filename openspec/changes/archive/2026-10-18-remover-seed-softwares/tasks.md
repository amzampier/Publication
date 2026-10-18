# Tasks

## 1. Remover o seed de softwares

- [x] 1.1 Excluir `server/migration/15_seed_softwares.sql` e verificar que o diretÃ³rio `server/migration/` nÃ£o contÃ©m mais o arquivo e que o runner apenas registra as migrations restantes.
- [x] 1.2 Remover o bloco "Espelho da migration 15_seed_softwares.sql" de `docs/bd/02_seed.sql` e verificar que o arquivo nÃ£o contÃ©m mais registros `SFT-`.

## 2. Alinhar a documentaÃ§Ã£o

- [x] 2.1 Atualizar `docs/10 - MÃ³dulo dos Softwares.md` removendo a menÃ§Ã£o ao seed e registrando que o catÃ¡logo nasce vazio; verificar que a expressÃ£o "semeado por 15_seed_softwares" nÃ£o aparece mais.

## 3. VerificaÃ§Ã£o

- [x] 3.1 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e verificar que todos passam.
