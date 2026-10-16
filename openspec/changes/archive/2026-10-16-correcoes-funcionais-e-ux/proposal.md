# Proposal

## Why

A auditoria RL02 (Etapa 4) reuniu divergências funcionais e de UX/consistência ainda abertas: o avatar do modal de usuário é descartado (`M-01`), o `rate_limit.ativo` não desliga o limitador (`M-02`), a retenção de auditoria não expurga nada (`M-03`), o convite promete exibir uma senha existente que o modelo não guarda (`M-04`), a situação Inativo/Bloqueado do perfil não tem efeito (`M-05`), o filtro de data final perde o último segundo (`M-06`), o `PUT` de perfil apaga a descrição omitida (`M-21`), e há desvios de acessibilidade, responsividade, tokens e textos (`B-01…B-09`). Fechá-los elimina perda de dado, configuração sem efeito e ruído visual/operacional.

## What Changes

- **M-01:** o modal de usuário persiste o avatar de fato (o `POST`/`PUT /api/usuarios` passa a repassar `avatar`).
- **M-02:** o limitador passa a respeitar `rate_limit.ativo` (desligar realmente desliga).
- **M-03:** a retenção de auditoria passa a ser aplicada por um **evento agendado no MariaDB** (Event Scheduler, diário às 03:00), apagando registros mais antigos que `dias_retencao_auditoria`.
- **M-04:** o convite nunca expõe a senha vigente (só há hash); sempre se (re)define uma nova provisória antes do envio — o requisito impossível é removido da spec.
- **M-05:** um perfil **não-Ativo** impede o login dos usuários vinculados e não pode ser atribuído em criação/edição/convite.
- **M-06:** o filtro de data final da auditoria passa a incluir todo o dia (até `23:59:59.999999`).
- **M-21:** o `PUT /api/perfis/:id` preserva campos omitidos (atualização parcial).
- **B-01…B-05 (acessibilidade/responsividade):** nome acessível nos botões de fechar do toast e limpar do `DatePicker`, gatilho do Account; toast não estoura a viewport em telas estreitas; seletor "Linhas por página" da `DataTable` com rótulo/foco.
- **B-06…B-08 (design system):** `Checkbox` com foco/erro canônicos (`brand-focus`/`rose-700`); hex fora dos tokens substituídos por tokens (`#2161ef`, `#070d22`); resíduos `lime-500` alinhados ao accent `#4ed813`.
- **B-09 (comportamento/textos):** 429 exibido como erro; fallback de conta sem "Super Admin"/valores fixos; central de notificações sem conteúdo de demonstração (estado vazio); classificação correta na trilha (recurso por destino de upload; reenvio de convite como Alteração); KPIs de usuários contando "Bloqueado"; importação não gravando "Geral" automático.

## Capabilities

### New Capabilities
Nenhuma.

### Modified Capabilities
- `gestao-usuarios`: o convite deixa de prometer exibir a senha existente (impossível — só há hash) e sempre (re)define a provisória.
- `perfis-acesso`: efeito da situação Inativo/Bloqueado do perfil; edição que preserva campos omitidos.
- `login`: autenticação recusa usuário cujo perfil está Inativo/Bloqueado.
- `configuracoes-globais`: a política de retenção de auditoria é aplicada automaticamente (evento diário).
- `design-system/toasts`: botão de fechar com nome acessível; toasts sem estouro em telas estreitas.
- `design-system/calendario`: botão de limpar do `DatePicker` com nome acessível.
- `design-system/layout-navigation`: gatilho do Account com nome acessível; central de notificações sem dados de demonstração.
- `design-system/form-control-states`: `Checkbox` com foco/erro canônicos.
- `design-system/brand-tokens`: superfícies sem hex fixado e accent sem resíduos `lime-500`.

## Impact

- **Backend:** rotas `usuarios` (avatar), `perfis` (parcial + efeito da situação), `login` (perfil não-Ativo), `rateLimit.ts` (`ativo`), `audit.ts` (janela inclusiva), migration nova (Event Scheduler), `seguranca.ts` (consulta de perfil na resolução de login), uploads (recurso na trilha), convite (classificação).
- **Frontend:** `usuarios/CamposSmtp`, `Convite`; `design-system` (Toast/DatePicker/DataTable/AppHeader/Checkbox/Button/Kpi); `navigation.ts` (notificações); `useAuth` (429).
- **Banco:** migration `10_*.sql` criando o `EVENT` de expurgo (requer Event Scheduler; documentar).
- **Dependências:** nenhuma nova.
- **Invariantes:** sem mudança de autenticação além do bloqueio por perfil; auditoria e RBAC preservados.
