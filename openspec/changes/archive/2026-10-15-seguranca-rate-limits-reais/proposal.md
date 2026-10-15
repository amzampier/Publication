# Proposal

## Why

A aba "Segurança & Rate Limits" de Configurações Globais ainda opera em fase 1: indicadores fixos escritos à mão, uma lista de registros fictícia em memória (tabela `seguranca_rate_limits` que não existe no banco) e botões que só exibem toasts de demonstração — enquanto o sistema real já tem lockout de login (5 falhas → 15 minutos, em `usuarios`) e rate limit por IP (120/min, em `configuracoes_limite_requisicao`) completamente invisíveis e inajustáveis pela tela. O texto da aba também promete "30 Minutos", contradizendo o código e a spec `login` (que já exigem 15). Além disso, a página não mostra estado de carregamento no F5: ela renderiza os defaults por um instante até o `GET /api/configuracoes` do `onMounted` voltar, diferente do padrão do Meu Perfil.

## What Changes

- **Aba Segurança passa a mostrar o real** (quatro blocos):
  1. **Indicadores com constantes do servidor** — 5 tentativas, 15 minutos e a taxa de rate limit vigente (ex.: 120/min), vindas do `GET`; card de chave reformulado para o real: bloqueio por conta (e-mail) e rate limit por IP.
  2. **Contas em estado de segurança** — tabela real (`tentativas_falhas > 0` ou bloqueio vigente) com e-mail, tentativas e status ("Bloqueado até HH:mm (restam X min)" / "Monitorando"); ação **Liberar** imediata (POST que zera falhas/bloqueio de verdade, com toast) — é ação, não configuração, então não participa do "Salvar Alterações Globais".
  3. **Eventos de login (log novo)** — tabela append-only dos últimos eventos: senha inválida, e-mail inexistente, bloqueio aplicado e tentativa com conta bloqueada, com data/hora, e-mail, IP e tipo; somente leitura, com "Atualizar" recarregando os blocos.
  4. **Rate limit editável** — limite por minuto e flag ativo como rascunho na página, persistidos pelo "Salvar Alterações Globais" (o cache de 60s do limitador é invalidado na gravação).
- **Backend novo**: migration da tabela de eventos; utilitário de segurança (registrar evento, listar estado, liberar bloqueio); hooks nos 4 pontos de falha do login; rotas `GET /api/seguranca/estado` e `POST /api/seguranca/liberar` (sessão exigida); `GET/PUT /api/configuracoes` com bloco `rate_limit`.
- **Rótulo da aba**: "(30 Min)" → "(15 Min)" em toda parte (aba, spec, docs) — alinhando à spec `login` e ao código.
- **Loading no F5**: a página de Configurações Globais exibe `UiLoading` enquanto o `GET` resolve, sem flash de defaults (mesmo padrão do Meu Perfil).

## Capabilities

### New Capabilities

_Nenhuma — o log de eventos e o estado são comportamento da própria tela de Configurações Globais._

### Modified Capabilities

- `configuracoes-globais`: o requirement das quatro abas passa a nomear "Segurança & Rate Limits (15 Min)"; o requirement do painel de segurança deixa de exigir lista em memória e passa a descrever os blocos reais (indicadores do servidor, contas bloqueadas com Liberação imediata, log de eventos somente leitura e rate limit editável); o requirement do Salvar ganha o bloco `rate_limit` no payload e perde o cenário que tratava "remover registro de rate limit" como alteração de rascunho; o requirement de hidratação ganha o cenário de estado de carregamento no F5.

## Impact

- **Código (front)**: `app/components/configuracoes/AbaSeguranca.vue` (reescrita), `app/pages/admin/configuracoes-globais.vue` (loading, rascunho do rate limit, payload do PUT).
- **Código (server)**: nova `server/migration/05_seguranca_eventos_login.sql`; novo `server/utils/seguranca.ts`; hooks em `server/utils/auth.ts` e `server/api/auth/login/index.post.ts`; `server/utils/rateLimit.ts` (invalidação de cache); `server/utils/configuracoes.ts` + `server/api/configuracoes/index.get.ts|index.put.ts` (bloco `rate_limit`); novas rotas `server/api/seguranca/estado|liberar`.
- **Specs**: delta apenas em `openspec/specs/configuracoes-globais/spec.md`; spec `login` intacta (lockout 15 min já é o comportamento lá especificado).
- **Docs**: `docs/04 - Configurações Gerais.md` (§1 nome da aba, §3.6 blocos reais, nota de fase 1 removida).
- **Banco**: tabela nova de eventos (append-only; FK `usuarios` com `ON DELETE SET NULL` para o log sobreviver à exclusão da conta). Nenhuma mudança nas tabelas existentes.
- **Fora de escopo**: retenção/purge dos eventos, RBAC por perfil nas novas rotas (pendência conhecida), eventos dos demais endpoints de auth (`esqueci-senha`, `refresh`) e histórico do rate limit por IP (janela segue em memória).
