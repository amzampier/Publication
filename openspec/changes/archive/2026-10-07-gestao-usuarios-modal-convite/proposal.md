# Proposal — Modal de Envio de Convite (Gestão de Usuários)

## Why

A ação "Enviar o Convite" da tabela de Gestão de Usuários é o último gatilho da fase 1 ainda
preso ao toast de "próxima etapa", embora a spec de importação já dependa dela: registros
importados nascem sem senha "a ser atribuída pelo envio manual de convite numa próxima etapa".
Além disso, o modelo `UsuarioDemo` não guarda a senha digitada no cadastro (o `salvar()` a
descarta), então hoje não existe nenhuma forma de levar credenciais ao usuário convidado.

## What Changes

- Novo modal de convite (`UiModal` **`xl` — 1120px, largura nova do kit**) aberto pelo ícone
  `MailCheck` da linha, com subtítulo que **descreve o propósito da tela** (não o nome — o
  destinatário já aparece na seção própria), corpo em **duas colunas** (a partir de `xl`:
  Destinatário, Canal de Envio — com os dois cartões **lado a lado** — e Credenciais à esquerda
  em coluna de ~420px; Pré-visualização à direita, **sem tarja de cabeçalho** — só o template)
  e rodapé com a ação **"Copiar mensagem"** à esquerda e os botões **Cancelar** e **Enviar
  Convite**. Quatro seções: **Destinatário** (dados + badges), **Canal de Envio** (escolha
  única entre E-mail e WhatsApp), **Credenciais de Acesso** (login e senha provisória **na
  mesma linha**, com o botão de gerar/redefinir abaixo) e **Pré-visualização** do template
  renderizado conforme o canal.
- A mensagem vem de um **template pré-definido em arquivo interno do sistema**
  (`app/utils/conviteTemplate.ts`): modelo TS com render HTML (pré-visualização do e-mail) e
  render texto (versão texto da mensagem e do WhatsApp), contendo nome, e-mail, link de acesso
  (`<origin>/admin/login`) e senha provisória. A mensagem não é editada na tela.
- Envio **frontend-only nesta fase**: E-mail **não abre cliente de e-mail** — o envio é
  **simulado** (grava a senha, exibe toast informando a simulação e fecha o modal, mesmo
  padrão do "Enviar teste" do SMTP em Configurações Globais); a integração real será pela API
  do Resend quando existir camada `server/`. WhatsApp abre o **app desktop** via protocolo
  `whatsapp://send` (fallback `https://wa.me/` se o app não responder), com a mensagem já
  preenchida. Nenhuma requisição HTTP em nenhum dos canais.
- **Senha provisória passa a ser gravada em memória** no registro do usuário (hoje é descartada);
  no modal de convite ela é exibida — com ação **"Redefinir senha"** que troca a vigente antes
  do envio — e, quando vazia (importados), pode ser definida/gerada ali mesmo — é o desfecho
  que a spec de importação já antecipava.
- Novo componente de design system **`UiChoiceCard`** (seleção única com semântica de radiogroup,
  tom por card, estado desabilitado com dica), com espelhamento na vitrine `/design` (seção 17)
  e em `docs/01`.
- Documentação ajustada no mesmo change: `docs/01 - design_system.md` (§5.16) e
  `docs/06 - Gestão de Usuários.md` (§3.9, §5.5, novo §5.7, §10, §12).
- A ação de linha "Enviar o Convite" deixa de exibir toast e passa a abrir o modal; "Bloquear
  usuário" permanece com toast de transição.

## Capabilities

### New Capabilities

- `design-system/choice-card`: componente `UiChoiceCard` — cartão de escolha única com
  semântica ARIA de radiogroup, tom de cor por card, estados selecionado/desabilitado com dica,
  foco canônico e espelhamento na vitrine e na documentação.

### Modified Capabilities

- `gestao-usuarios`: (1) a ação de linha "enviar o convite" sai da regra de toast de fase 1 e
  passa a abrir o modal de convite; (2) novo requirement descrevendo o modal de convite —
  subtítulo descritivo, layout em duas colunas, seções, escolha de canal, senha provisória
  (exibição/geração/redefinição), template interno, envio simulado por e-mail e via
  `whatsapp://` com fallback, e descarte; (3) o requirement de gravação em memória
  passa a incluir a senha provisória no registro (mantida na edição quando os campos ficam vazios).

## Impact

- **Componentes**: `app/components/usuarios/Convite.vue` (novo), `app/components/ui/ChoiceCard.vue`
  (novo), `app/components/ui/Modal.vue` (novo `size="xl"` de 1120px), 
  `app/components/usuarios/Tabela.vue` (emit do `MailCheck`), 
  `app/components/usuarios/Formulario.vue` (deixar de descartar a senha),
  `app/pages/admin/gestao-usuarios.vue` (estado + montagem do modal).
- **Estado/dados**: `app/components/usuarios/useUsuariosDemo.ts` — `senha` e `telefone` na
  semente (senha provisória fixa nos demo, telefones em ~14/16 para exercitar os dois estados do
  card), importados nascem com `senha: ''`.
- **Utilitário**: `app/utils/conviteTemplate.ts` (novo) — template, gerador de senha e
  normalização de telefone.
- **Vitrine/docs**: `app/pages/design.vue` (seção 17), `docs/01 - design_system.md` (§5.12 e
  §5.16), `docs/06 - Gestão de Usuários.md`.
- **Specs**: delta em `openspec/specs/gestao-usuarios/spec.md`; nova capability
  `openspec/specs/design-system/choice-card/spec.md`.
- Sem camada `server/`, sem chamadas de rede (o envio de e-mail é simulado no cliente) e sem
  persistência além do `useState` em memória (regra da fase 1); descartado na recarga.
