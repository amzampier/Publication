# Design — Modal de Envio de Convite

## Context

A página `/admin/gestao-usuarios` é dona do estado de todos os modais (`gestao-usuarios.vue:16-29`
seguindo docs/06 §2) e a ação `MailCheck` da linha (`Tabela.vue:88-99`) ainda dispara o toast de
transição da fase 1. O modelo `UsuarioDemo` (`useUsuariosDemo.ts:37-55`) não tem campo `senha` e o
`salvar()` do formulário descarta explicitamente a senha digitada
(`const { senha, confirmarSenha, ... } = rascunho` — `Formulario.vue:211`). A spec de importação
manda os registros nascerem sem senha "a ser atribuída pelo envio manual de convite numa próxima
etapa" — esta change é essa etapa. Antes desta change não existia nenhum
`mailto:`/`whatsapp://`/`window.open` no repositório. Ver proposal.md para a motivação e os
deltas de spec para o contrato comportamental.

## Goals / Non-Goals

**Goals:**

- Modal de convite com 4 seções (Destinatário, Canal, Credenciais, Pré-visualização), `UiModal`
  `xl` (1120px), subtítulo descritivo, corpo em duas colunas (`xl`+, cartões de canal lado a
  lado) e rodapé só com botões; envio **simulado** por e-mail (frontend-only) e pelo protocolo
  do WhatsApp Desktop com fallback web.
- Template de mensagem em arquivo interno com render HTML e render texto a partir do mesmo dado.
- Senha provisória gravada em memória no registro, com geração no modal quando ausente.
- Componente `UiChoiceCard` novo no design system, com spec, vitrine §17 e docs/01 §5.16.

**Non-Goals:**

- Envio real de e-mail por API (Resend) ou SMTP — **escopo de backend**: esta change é
  frontend-only, não cria `server/` nem faz requisições (o envio por e-mail é simulado no
  cliente; a integração real entra em change futura quando existir camada de servidor).
- Editar o texto do convite na tela ou configurar o template em Configurações Globais.
- Estado de "convite enviado" (badge/coluna/marcação) — a identificação de importados pendentes
  fica para change futura (design da importação já deixou isso registrado).
- `UiCallout` como componente novo — o modal não ganha banner próprio (o callout do rodapé foi
  removido junto com a revisão do D8); se um banner voltar, segue o padrão inline já usado em
  Configurações Globais.
- Criar a rota `/admin/login` — o link aponta para ela como previsto em docs/02; a rota é escopo
  de outra change.

## Decisions

### D1 — Coordenação: página dona do estado (mesmo contrato dos demais modais)

`gestao-usuarios.vue` ganha `conviteAberto` + `usuarioConvite` e monta `<UsuariosConvite
v-model :usuario>`; `Tabela.vue` emite `convite(usuario)` no `MailCheck`.
*Alternativa considerada:* modal autossuficiente aberto pela própria tabela — rejeitada por
quebrar o contrato de docs/06 §2 e o padrão dos quatro modais existentes.

### D2 — Template em `app/utils/conviteTemplate.ts`

Auto-import do Nuxt (precedente: `app/utils/dataGrid.ts`), exportando:

- `DadosConvite` (nome, email, perfil, senha, telefone) e `ASSUNTO_CONVITE`
  ("Convite de acesso ao Publications");
- `montarLinkAcesso()` → `${window.location.origin}/admin/login` (absoluto: a mensagem sai do
  navegador);
- `renderHtmlConvite(dados): string` — documento HTML autossuficiente (CSS inline) para a
  pré-visualização de e-mail e, no futuro, para envio real;
- `renderTextoConvite(dados): string` — versão texto usada na ação "Copiar mensagem", na
  pré-visualização de WhatsApp e, no futuro, no corpo do e-mail real;
- `gerarSenhaProvisoria()` — ≥8 caracteres com maiúscula, minúscula, número e símbolo (mesma
  régua da validação do formulário);
- `normalizarTelefoneWhats(telefone)` — remove a máscara `(99) 99999-9999` e prefixa `55`
  (sem duplicar se já vier com DDI).

*Alternativa:* template dentro de `components/usuarios/` — rejeitada porque não teria
auto-import e é utilitário puro, sem dependência de componente.

### D3 — Pré-visualização em `<iframe :srcdoc sandbox>`

O HTML do template roda isolado (sem vazamento de CSS para a página, sem `script`), trocando de
canal junto com o `UiChoiceCard`; a versão WhatsApp renderiza em `<pre>` com o mesmo texto que
irá no `whatsapp://`. *Alternativa:* `v-html` num `<div>` — rejeitada por vazar estilos do
template (ou do tailwind) entre si e quebrar o layout do modal.

### D4 — Mecanismo de envio (frontend-only)

| Canal | Ação | Detecção/fallback |
|---|---|---|
| E-mail | **Simulado no cliente**: grava a senha, exibe `toast.success` informando ser uma simulação (Resend fica para a fase de backend) e fecha o modal — nenhum cliente de e-mail é aberto | não há falha de transporte nesta fase; "Copiar mensagem" como saída de segurança |
| WhatsApp | `location.href = whatsapp://send?phone=55…&text=<texto>` | `window.open('https://wa.me/…')` após ~2 s quando a janela segue com foco (app não abriu) **ou** quando o foco é perdido de forma síncrona (≤300 ms — handler do protocolo falhou sem exibir janela); blur tardio = app aberto → fallback suprimido; toast de sucesso nos dois caminhos |

*Alternativas descartadas:* `mailto:` (decisão do usuário: não abrir cliente de e-mail);
Resend agora (escopo de backend — a change é frontend-only); `navigator.share` (mobile-only);
`navigator.registerProtocolHandler` (não existe no Windows).

Ambos os fluxos gravam a senha provisória no registro (em memória) **no ato do envio** e fecham
com toast. Nenhuma requisição HTTP.

### D5 — `UiChoiceCard` novo em vez de reaproveitar `UiCheckCard`

O `UiCheckCard` (usado em seleção única booleana no `AbaSidebar.vue:99-117`) tem semântica de
checkbox, não tem sistema de tom nem slot de dica. O novo cartão usa `role="radiogroup"`/`role=
"radio"` com roving tabindex **copiado do padrão do `UiSegmented`** (spec `design-system/
segmented`), tom por prop (`sky`/`emerald`/…) tingindo borda+anel+fundo e o tile do ícone, e
`disabledHint` exibido dentro do cartão atenuado. O modal usa os dois cartões **lado a lado** na coluna da
esquerda (~420px — D8) com `sky` para E-mail e `emerald` para WhatsApp.

### D6 — Senha provisória: modelo, formulário e modal

- `UsuarioDemo` ganha `senha: string`; semente recebe senha fixa `Public@2026` e telefone em
  **14 dos 16** usuários (2 ficam sem para a vitrine do card desabilitado); importados nascem
  com `senha: ''`.
- `Formulario.vue` passa a persistir: `senha: r.senha || usuario.senha` no registro (edição com
  os campos vazios mantém a vigente — a validação do form não muda e a spec do form continua
  dizendo que os campos abrem vazios).
- No modal de convite: senha existente aparece em **somente-leitura** com olho (alternar
  visibilidade), copiar e o botão **"Redefinir senha"** (gera nova provisória no rascunho —
  pode ser acionada antes do envio, quantas vezes for preciso); senha vazia mostra `UiInput` +
  "Gerar senha" e o botão **"Enviar Convite" fica desabilitado** até haver senha (mínimo 8).
  A senha digitada/gerada/redefinida vive no **rascunho do modal** e só é gravada no registro ao
  enviar — Cancelar/`Escape`/`X` descartam.

*Alternativa:* gravar a senha no "Gerar" imediatamente — rejeitada porque violaria o contrato de
descarte dos demais modais (cancelar não pode alterar a base).

### D7 — Reset do rascunho na abertura

`watch(modelValue)` zera o estado local a cada abertura (mesmo padrão de `Filtros.vue:30-35` e
`Importar.vue:38-47`): canal volta a `email`, senha de rascunho volta à do registro, foco cai no
modal via `UiModal`. O gatilho permanece no DOM (a linha não some), então o restore de foco padrão
do `UiModal` basta — sem o truque `nextTick` da exclusão.

### D8 — Cabeçalho, rodapé e layout em duas colunas

- **Largura:** o modal passa a usar o novo **`UiModal size="xl"` (1120px)** — `lg` (880px)
  ficava apertado para a pré-visualização ao lado das três seções (decisão do usuário).
- **Subtítulo**: descreve o propósito da tela ("Envie as credenciais de acesso pelo canal
  escolhido com o template padrão.") em vez do nome do usuário — o destinatário já aparece na
  seção própria, e o nome era informação repetida (decisão do usuário).
- **Rodapé**: "Copiar mensagem" à esquerda (`mr-auto`) + "Cancelar" + "Enviar Convite" — o
  callout "Abre o aplicativo com a mensagem pronta…" foi removido (com o e-mail simulado e o
  WhatsApp abrindo o app o texto já não representava os dois canais) e a ação de copiar saiu da
  tarja da Pré-visualização para o rodapé junto com a remoção do cabeçalho da seção (decisões
  do usuário — ver abaixo).
- **Credenciais numa linha só**: login e senha lado a lado (`grid grid-cols-2`) e o botão
  **"Redefinir senha"/"Gerar senha" abaixo**, alinhado à direita — o layout empilhado anterior
  consumia ~65px extras de altura (decisão do usuário).
- **Pré-visualização sem tarja**: a linha de cabeçalho (badge "Template padrão", rótulo da versão
  e botão copiar) foi removida — a seção é só o `iframe`/`<pre>`, que estica até a altura da
  coluna esquerda (decisão do usuário, para encurtar o modal).
- **Corpo em duas colunas** a partir de `xl` (viewport ≥1280 — abaixo disso a coluna direita
  ficaria estreita demais):
  `grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]`, com Destinatário + Canal de Envio +
  Credenciais à esquerda e Pré-visualização à direita esticando até a altura da coluna esquerda
  (`flex` + `grid-rows-[auto_minmax(0,1fr)]`, fazendo o `iframe` crescer junto).
- **Coluna esquerda de ~420px**: os dois cartões de Canal de Envio ficam **lado a lado**
  (`grid sm:grid-cols-2` — ~186px cada, legíveis); os campos de credenciais seguem empilhados.
  Abaixo de `xl` tudo volta a uma coluna (e os cartões continuam lado a lado quando a
  viewport tem ≥640px).
- *Alternativas descartadas:* coluna de 300px (cards lado a lado ficariam com ~130px e ilegíveis);
  quebra em `lg` (a coluna direita cairia para ~270px com o modal de 1120px); manter uma coluna
  com a pré-visualização no fim — esconde a mensagem que o botão principal envia.

## Risks / Trade-offs

- [`whatsapp://` falha silencioso quando o app não está instalado] → fallback automático para
  `wa.me` após ~2 s + toast informativo; "Copiar mensagem" cobre os dois canais.
- [Toast de simulação do e-mail pode dar a impressão de envio real] → a mensagem do toast
  diz explicitamente "simulação — envio real na fase de backend"; ação "Copiar mensagem" no
  modal é a rede de segurança enquanto o envio real não existe.
- [Exibir senha em texto no cliente] → aceitável na fase 1 100% em memória (nada persiste além
  do `useState`); a change de backend deve hashear — anotado como pendência futura em docs/06 §12.
- [Semente ganha telefone/senha] → não afeta KPIs, tabela nem filtros (campos não exibidos);
  risco de divergência com docs/06 §6 (dados de demonstração) — atualizar no mesmo change.
- [Fallback por timeout pode abrir duas abas se o app demorar >2 s] → blur **tardio** (app em
  primeiro plano) cancela o fallback; timeout curto (2 s) na prática não duplica. Um blur
  síncrono (≤300 ms), porém, indica handler falho (desktop que rouba o foco sem aparecer —
  repro do QA, blur medido entre 66 e 149 ms nesta máquina) e **dispara** o fallback mesmo
  assim; residual aceito: app que foregrounda em <300 ms ganha uma aba `wa.me` extra (nada é
  enviado automaticamente, o usuário fecha uma).

## Migration Plan

Fase 1 em memória: sem migrations, sem deploy diferenciado; rollback = reverter os arquivos da
change. A spec principal só muda após `/opsx-sync` + archive.

## Open Questions

Nenhuma material — destino do link (`<origin>/admin/login`), assunto do e-mail, senha da semente
(`Public@2026`) e a divisão 14/16 de telefones foram confirmados com o usuário na exploração.
