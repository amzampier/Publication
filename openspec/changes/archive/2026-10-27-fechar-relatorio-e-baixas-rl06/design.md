# Design

## Context

Ver `proposal.md`. O `UiInput` usa `placeholder:text-slate-400`; a spec `login` lista apenas login e esqueci-senha na identidade das telas de autenticação, embora `primeiro-acesso` use o mesmo layout `auth`; `docs/qa/05` ficou em 25 componentes; o RL06 preserva o snapshot de 23/10 e ainda abre como REPROVADO.

## Goals / Non-Goals

**Goals:**

- Fechar B-09 e B-19 sem alterar comportamento funcional.
- Deixar RL06 e `docs/qa/05` coerentes com o estado atual.
- Adicionar testes de regressão para os fluxos já implementados.

**Non-Goals:**

- Área Pública.
- Alterar banco, autenticação ou layout `auth`.
- Reescrever o snapshot histórico do RL06.

## Decisions

### 1. Placeholder AA

Trocar `placeholder:text-slate-400` por `placeholder:text-slate-500` no `UiInput`. O placeholder deve atender ao contraste mínimo sem competir com o valor digitado; o token `slate-500` já é usado em textos de apoio.

### 2. Identidade das telas de autenticação

Atualizar o requisito de identidade em `login/spec.md` para incluir `/admin/primeiro-acesso`. Não é necessário alterar `layout-navigation`, que já lista as três rotas sem shell, nem `docs/08`, que já lista as três.

### 3. Relatório vivo separado do snapshot

No RL06:

- manter o snapshot de 23/10 e o placar histórico;
- adicionar uma seção de estado atual com 46 specs, 42 migrations e 39 componentes;
- marcar P0, M-02/M-03/M-10/M-11/B-03/B-07/B-09/B-19 como fechados;
- declarar M-07/I-01 como risco operacional aceito;
- veredito atual: **Aprovado com ressalvas (M-07)** para a Área Administrativa.

### 4. Testes sem browser

Adicionar testes unitários/API para os caminhos que não dependem de browser:

- `listarChamadasParaEsteira` com status antes de paginação;
- transformação/roteamento de mídia por URL exata (helpers);
- hierarquia com perfil atual;
- validação de data herdada;
- opções remotas do formulário por API.

E2E de navegador/axe/Lighthouse continua como limitação declarada, sem bloquear o fechamento documental.

## Risks / Trade-offs

- **Veredito “Aprovado com ressalvas”** → M-07 permanece explícito como risco operacional.
- **Placeholder mais escuro** → pequena mudança visual; validar `/design`.
- **Testes de browser ausentes** → declarados como limitação; não mascaram os testes de API/unitários.
- **Relatório histórico** → snapshot preservado para rastreabilidade.

## Migration Plan

Sem migration. Deploy é documental/UI/testes; rollback por reversão dos arquivos.

## Open Questions

Nenhuma.
