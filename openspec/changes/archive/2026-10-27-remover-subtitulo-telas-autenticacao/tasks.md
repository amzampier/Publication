# Tasks

## 1. Código das telas de autenticação

- [x] 1.1 Remover a passagem `subtitulo="Área Administrativa"` do `AuthLoginHeader` em `app/layouts/auth.vue`, preservando `class="mb-4"` e `:logo="logo"`; verificar com busca por `subtitulo` em `app/layouts/` que não há mais ocorrências
- [x] 1.2 Remover a prop `subtitulo` (declaração e default) e o parágrafo `v-if="subtitulo"` de `app/components/auth/LoginHeader.vue`; verificar com busca por `subtitulo` em `app/` que o componente e os chamadores ficaram sem referências e que o arquivo compila no `npm run typecheck`

## 2. Documentação

- [x] 2.1 Atualizar `docs/08 - Login de Autenticação.md` (§1 "Identidade" e a linha `Cabeçalho` da tabela do §2) para descrever o cabeçalho sem o subtítulo "Área Administrativa"; verificar relendo as duas seções e confirmando que não mencionam mais o texto

## 3. Verificação integrada

- [x] 3.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar que todos passam
- [x] 3.2 Conferir visualmente `/admin/login`, `/admin/esqueci-senha` e `/admin/primeiro-acesso` em desktop e em 375px, confirmando a identidade sem subtítulo e o espaçamento logo → divisor verde → formulário
- [x] 3.3 Validar o change com `openspec validate "remover-subtitulo-telas-autenticacao" --type change` e confirmar que o delta de `login` está válido antes do `/opsx-sync`
