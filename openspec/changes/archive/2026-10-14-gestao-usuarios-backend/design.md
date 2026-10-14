# Design

## Context

A página de Gestão de Usuários ainda opera sobre `useUsuariosDemo` (16 linhas em memória,
perdidas na recarga), enquanto o sistema real já vive no banco desde as changes anteriores:
o login valida em `usuarios` (bcrypt, lockout), o convite materializa contas por
find-or-create (`POST /api/convite`), a página de perfis conta vínculos do banco e a aba
Segurança do Meu Perfil troca senhas via API. O schema `usuarios` cobre todos os campos do
modal (endereço, SMTP, `avatar_url`, `senha_provisoria`, `tentativas_falhas`) e
`server/utils/uploads.ts` já suporta o destino `'avatares'`. O achado crítico do QA da change
de auth (`/api/perfis` e `/api/configuracoes` respondendo sem sessão) permanece aberto e
cresceria com `/api/usuarios` (PII). Ver proposal.md para o porquê e a spec delta para o
contrato.

## Goals / Non-Goals

**Goals:**
- Listagem/CRUD/importação/exclusão/bloqueio 100% via `/api/usuarios/**`, com a lista nascendo
  do banco (sem seed: admin provisionado + contas convidadas).
- Middleware global de sessão em `/api/**` (allowlist `/api/auth/*`) fechando o achado
  crítico em usuários, perfis, configurações e uploads.
- Meu Perfil lendo e gravando o registro real (dados, endereço, SMTP, foto como arquivo).
- Frontend com o mesmo contrato visual (filtros/KPIs/exportações locais sobre o conjunto
  carregado — padrão das changes de perfis).

**Non-Goals:**
- Seed dos 16 usuários demo (decisão registrada) e `requirePermission`/`.can()` (RBAC fica
  para a change de permissões client), auditoria de CRUD (`server/utils/audit.ts`), rate
  limit fora das rotas de auth, ViaCEP real, criptografar `senha_smtp`, e-mail de teste real
  (teste SMTP segue simulado por spec).

## Decisions

**D1 — Middleware global de sessão (`server/middleware/auth-api.ts`).** Todo request cujo
caminho começa com `/api/` passa por `getSessionUser(event)`; sem sessão → `401`. Allowlist:
prefixo `/api/auth/` (login/refresh/logout/seguro/esqueci-senha/trocar-senha são a porta de
entrada). Custo: para access JWT válido o `getSessionUser` só verifica o token (sem banco);
com access expirado ele rotaciona o refresh (como já faz em `/seguro`) — aceitável nas
raras chamadas pós-expiração. Alternativa: proteger rota a rota manualmente — rejeitada
(esquecível; o middleware centraliza e nasce cobrindo perfis/config/uploads de brinde).

**D2 — `server/utils/usuarios.ts` como camada de acesso.** Funções `listarUsuarios()`,
`buscarUsuarioPorId()`, `criarUsuario()`, `atualizarUsuario()`, `excluirUsuario()`,
`alterarSituacao()`, `importarUsuarios(linhas)` e `atualizarProprioRegistro(id, dados)`
usando `query`/`getTransaction`. Listagem devolve o shape da tela (`UsuarioDemo` sem senha):
`{ id, nome, email, perfil, status, ultimoAcesso, telefone, funcao, departamento, endereco,
smtp, avatar, dataCadastro, atualizadoEm }` com joins/normatização (perfil por
`nome_perfil`; `avatar` = `avatar_url`; `ultimoAcesso` = `ultimo_login`; SMTP objeto como no
demo; endereço colunas planas → objeto). Senhas NUNCA saem do servidor.

**D3 — bcrypt e flags.** Criação: senha obrigatória (≥8) → `hash` cost 12 +
`senha_provisoria = 1`. Edição: par de senhas completo substitui o hash (`senha_provisoria =
1`); campos vazios mantêm; par parcial é rejeitado pelo cliente (espelho do form). O modal de
edição do usuário não zera `senha_provisoria` quando não mexe na senha. `trocar-senha` do
Meu Perfil continua zerando (já entregue). **Importados**: `hash_senha` recebe um **sentinel**
(`!importado-sem-senha`) — `bcrypt.compare` contra ele falha (ou lança, capturado no login
como credencial inválida), então importados nunca autenticam até o convite gravar um hash
real; `senha_provisoria = 1`.

**D4 — Importação em dois tempos.** O parse do `.xlsx` continua no cliente
(`lerPlanilhaUsuarios` + pré-visualização atuais, exceljs lazy-load); "Importar (n)" envia
apenas as linhas selecionadas (`POST /api/usuarios/importar` com
`{ linhas: [{ nome, email, perfil, situacao }] }`) e o **servidor revalida** (unicidade de
e-mail case-insensitive contra o banco, perfil existente em `perfis_acesso`, campos
obrigatórios) e grava em **transação** (somente as linhas válidas; inválidas → `400` com a
lista de motivos — o cliente não deveria enviar inválidas, mas a API não confia no
cliente). Contagem gravada volta no response (toast). Alternativa: multipart com o arquivo
para o servidor parsear — rejeitada (exceljs já está no bundle do cliente; o preview é
inteiramente client-side; mover o parse duplicaria regras).

**D5 — Bloquear real.** `PUT /api/usuarios/:id/situacao` com `{ situacao }` (Ativo/Inativo).
O cadeado da linha abre modal de confirmação `sm` ("Bloquear Usuário" p/ Ativo; "Desbloquear
Usuário" p/ Inativa ou Bloqueada → grava Ativo). Toast de sucesso + linha/badges/KPIs
atualizados a partir da resposta. Interage com o lockout de login sem conflito
(`situacao` × `tentativas_falhas`/`bloqueado_ate` são colunas distintas).

**D6 — Avatar como arquivo (forçado pelo schema).** `avatar_url VARCHAR(500)` não cabe
dataURL; no salvar do modal ou do Meu Perfil, se o rascunho tiver foto nova (dataURL de
upload ou câmera), o cliente chama `POST /api/uploads` (destino `avatares` — util já
pronto) e grava a URL devolvida no registro via API. Sem troca de foto, nenhuma chamada de
upload. A remoção da foto grava `avatar_url = NULL`. Até existir deleção de arquivos, a foto
antiga permanece em `uploads/avatares/` (aceito — mesma política das logomarcas).

**D7 — Meu Perfil: `PATCH /api/usuarios/eu`.** Identificado pela sessão (cookie), grava nome,
telefone, campos de endereço, campos SMTP e `avatar_url` de uma vez (mesmo rascunho das
abas). Não aceita e-mail, perfil, situação nem senha (a senha vive em
`/api/auth/trocar-senha`). A página troca a resolução por e-mail da base demo por um `GET`
da própria conta (o `/api/auth/seguro` já devolve `{ id, nome, email, perfil }`; os demais
campos vêm de `GET /api/usuarios/:id` com a própria sessão — restrito ao próprio id no
servidor, ou endpoint `/api/usuarios/eu` em GET+PATCH; **decisão: `/api/usuarios/eu` com GET
e PATCH** — evita que qualquer sessão leia terceiros).

**D8 — KPIs/tabela/filtros/exportações seguem client-side.** A listagem carregada alimenta
tudo localmente (como perfis); "Perfis distintos" deriva dos perfis presentes; "Último
acesso" formata `ultimoAcesso` ou "-". Exportações e filtros não emitem rede (spec).

**D9 — Convite convive com a lista real.** O modal de convite já chama
`POST /api/convite`; com a lista vinda do banco, find-or-create raramente cria (linhas já
são contas), mas permanece como blindagem (exclusão externa + reenvio). O "espelho demo" de
senha do `Convite.vue` deixa de ser necessário (a linha real não tem campo de senha —
`senhaExistente` passa a ser false e o modal oferece "Gerar senha" como já faz para
importados; o rascunho de senha vive só no modal até o envio).

**D10 — Formulário de usuário: um `useUsuarios` sobre a API.** Novo composable
(`app/components/usuarios/useUsuarios.ts`) no lugar das escritas de `useUsuariosDemo`:
`carregarUsuarios()` (idempotente, estado `carregando/erro`), `salvarUsuario(registro, modo)`
(POST/PUT + upload de avatar quando houver), `excluirUsuario(id)`,
`alterarSituacaoUsuario(id, situacao)`, `importarUsuarios(linhas)`. `useUsuariosDemo` vira
apenas provedor de tipos/constantes (`PERFIS`, `STATUSES`, helpers de máscara) ou é
renomeado — decisão de implementação: manter o arquivo como fonte de tipos/constantes
(sem `useState` de base) para não quebrar os 10+ imports, e mover o estado para o novo
composable. Filtros continuam em `useState('usuarios-filtros')`.

## Risks / Trade-offs

- [Lista nasce com 1 linha (admin)] → Decisão registrada (sem seed); convite/KPIs/Tabela
  trabalham com dados reais; QA usa contas convidadas.
- [Middleware quebra chamadas esquecidas] → Allowlist mínima (`/api/auth/`); pages usam
  `useApiFetch` com cookies; regressão verificada no E2E (perfis/config/uploads com sessão).
- [Sentinel de senha de importados] → bcrypt.compare com hash inválido cai no catch do login
  como credencial errada (já tratado); convite substitui por hash real.
- [`senha_smtp` em texto plano no banco] → Pré-existente do schema; não escopo desta change
  (risco documentado; futuro: criptografar com o segredo do auth).
- [Foto antiga órfã em uploads/] → Sem deleção de arquivo (mesma política das logomarcas);
  deleção fica para o cleanup futuro.
- [Meu Perfil e modal de usuário compartilham regras de endereço/SMTP] → Contratos iguais no
  cliente; o servidor valida o mínimo (tipos/tamanhos) — divergências de UX não são bloqueio.
- [Exclusão remove sessões (CASCADE)] → Comportamento desejado (especificado); usuário
  excluído cai para o login na próxima chamada.

## Migration Plan

Nenhuma migration de banco. Entrega: middleware + utils/rotas → composable + páginas →
docs (`docs/09`, `docs/08` §11). Rollback = reverter o código; dados gravados permanecem
compatíveis (bcrypt, `avatar_url` como caminho de arquivo). Risco de rollout: sessões em
andamento continuam válidas (cookies e `sessoes` não mudam).

## Open Questions

- Nenhuma que afete specs, abordagem ou tasks — constantes (bcrypt cost 12, limites de
  upload) já definidas em utils existentes.
