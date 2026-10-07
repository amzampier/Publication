# Tasks

## 1. Template do convite (utilitário)

- [x] 1.1 Criar `app/utils/conviteTemplate.ts` com `DadosConvite`, `ASSUNTO_CONVITE`
      ("Convite de acesso ao Publications") e `montarLinkAcesso()` =
      `${window.location.origin}/admin/login` — verificar: `npm run build` compila e os
      exports auto-importam sem erro de resolução
- [x] 1.2 Implementar `renderHtmlConvite()` (documento HTML autossuficiente com CSS inline
      contendo nome, e-mail, link de acesso e senha provisória) e `renderTextoConvite()` com
      os mesmos dados — verificar: `npm run build` passa e os dois renders produzem texto
      contendo nome, e-mail, link e senha
- [x] 1.3 Implementar `gerarSenhaProvisoria()` (≥8 caracteres com maiúscula, minúscula,
      número e símbolo) e `normalizarTelefoneWhats()` (remove a máscara `(99) 99999-9999` e
      prefixa `55`, sem duplicar DDI) — verificar: `npm run build` passa e a conferência do
      gerador/normalizador é feita na pré-visualização e no envio (tarefas 4.3/4.5)

## 2. Modelo de dados — senha e telefone

- [x] 2.1 Em `app/components/usuarios/useUsuariosDemo.ts`: adicionar `senha: string` a
      `UsuarioDemo`, preencher a semente com senha provisória `Public@2026` e telefone em 14
      dos 16 usuários (2 sem telefone para exercitar o card desabilitado), e manter
      `importarUsuarios` gravando `senha: ''` — verificar: `npm run build` e
      `/admin/gestao-usuarios` lista os 16 usuários com os quatro KPIs inalterados
- [x] 2.2 Em `app/components/usuarios/Formulario.vue`: deixar de descartar a senha no
      `salvar()` passando `senha: r.senha || usuario.senha` no registro (edição com campos
      vazios mantém a senha vigente), sem alterar a validação nem a abertura com campos vazios
      — verificar: `npm run build` e os cenários de validação de senha da spec do formulário
      (criação vazia/curta/divergente, edição parcial) continuam se comportando igual

## 3. Componente UiChoiceCard (design system)

- [x] 3.1 Criar `app/components/ui/ChoiceCard.vue`: `v-model` por valor único, props
      `value`, `title`, `description`, `icon`, `badge`, `badgeVariant`, `tone`
      (sky/emerald/lime/indigo/slate), `disabled`, `disabledHint`; contêiner
      `role="radiogroup"` e cartão `role="radio"` com `aria-checked`, roving tabindex com
      setas/Home/End/Enter/Space (padrão do `UiSegmented`), tom tingindo borda+anel+fundo e o
      tile do ícone no selecionado, foco `brand-focus`, desabilitado atenuado com dica —
      verificar: `npm run build` e estados conferidos na vitrine (tarefa 3.2)
- [x] 3.2 Em `app/pages/design.vue`: adicionar "Cards de Escolha (UiChoiceCard)" no array de
      navegação e criar a seção 17 com cartões nos estados neutro, selecionado (tons sky e
      emerald) e desabilitado com dica — verificar: `/design#choice-card` renderiza, cliques
      e setas trocam a seleção e o cartão desabilitado não seleciona
- [x] 3.3 Em `docs/01 - design_system.md`: incluir a linha da seção 17 no Sumário e criar o
      §5.16 UiChoiceCard (props, eventos, ARIA, estados, foco, espelhamento da seção 17) —
      verificar: as props/eventos documentados coincidem com `ChoiceCard.vue` e o Sumário
      aponta para a seção correta

- [x] 3.4 Corrigir o recorte de foco do `UiChoiceCard` (bug do QA: `has-[:focus-visible]` nunca
      casa o próprio cartão — trocar por `focus-visible:outline-2 focus-visible:outline-offset-2
      focus-visible:outline-brand-focus`, mesmo padrão dos demais controles) e atualizar a linha
      de foco do §5.16 em `docs/01` — verificar: Tab até o cartão exibe o anel verde `brand-focus`

## 4. Modal de convite

- [x] 4.1 Criar `app/components/usuarios/Convite.vue` (`UsuariosConvite`): `UiModal size="xl"`
      com ícone `Send`, título "Enviar Convite" e **subtítulo que descreve o propósito do modal**;
      quatro `UiModalSection` (Destinatário, Canal de Envio, Credenciais de Acesso,
      Pré-visualização); rascunho local zerado a cada abertura (`watch(modelValue)`, canal
      inicia em "E-mail"); rodapé com **"Copiar mensagem" à esquerda**, "Cancelar" e
      `UiButton primary` "Enviar Convite" (sem callout) — verificar: `npm run build` e o
      modal abre com as quatro seções em `/admin/gestao-usuarios`
- [x] 4.2 Na seção Destinatário: avatar ou iniciais, nome, e-mail, telefone e badges de
      Perfil/Status; na seção Canal: dois `UiChoiceCard` em grid (E-mail `sky`, WhatsApp
      `emerald`), com o WhatsApp desabilitado + dica quando o telefone estiver vazio —
      verificar: usuário sem telefone → card atenuado com dica e seleção permanece em
      "E-mail"; com telefone → os dois trocam de seleção
- [x] 4.3 Na seção Credenciais: **login e senha na mesma linha** (`grid grid-cols-2`); senha
      existente em somente-leitura com alternar visibilidade (olho) e copiar; senha vazia com
      `UiInput` editável; **botão "Redefinir senha" (senha existente) ou "Gerar senha" (vazia,
      ≥8 caracteres) abaixo dos campos**, alinhado à direita, com "Enviar Convite" desabilitado
      enquanto não houver senha — verificar: usuário importado (senha vazia) → botão
      desabilitado; gerar → senha válida preenchida e botão habilitado; usuário da semente →
      senha `Public@2026` visível ao revelar e "Redefinir senha" troca o valor exibido sem
      gravar até o envio
- [x] 4.4 Na seção Pré-visualização: **sem tarja de cabeçalho** (badge "Template padrão" e
      rótulo da versão removidos) — só o `iframe` com `srcdoc` (versão HTML) no canal E-mail e
      o `<pre>` (versão texto) no canal WhatsApp, esticando até a altura da coluna esquerda; a
      ação **"Copiar mensagem"** migra para a esquerda do rodapé; o conteúdo acompanha a troca
      de canal e a senha do rascunho — verificar: alternar o canal alterna HTML ↔ texto com os
      mesmos dados e copiar leva o texto do canal vigente
- [x] 4.5 Implementar o envio em `Convite.vue`: E-mail → **simulação** (nenhum `mailto:`,
      grava a senha, `toast.success` informando ser simulação — Resend na fase de backend — e
      fecha); WhatsApp → `whatsapp://send?phone=55…&text=…` com
      `normalizarTelefoneWhats` e fallback `https://wa.me/` após ~2 s sem perder o foco;
      ambos gravam a senha do rascunho no registro em memória e fecham com toast;
      "Cancelar"/`Escape`/`X` descartam o rascunho sem gravar — verificar: ao acionar
      "Enviar" no e-mail nenhum aplicativo abre e o toast diz "simulação", no WhatsApp o app
      abre com a mensagem, o modal reaberto mostra a senha gravada, e com o fallback o
      WhatsApp Web abre; cancelar após gerar senha deixa a base sem a senha
- [x] 4.6 Fazer o wiring: `Tabela.vue` emite `convite(usuario)` no `MailCheck` (removendo só
      essa ação do toast de transição; "Bloquear usuário" permanece) e
      `app/pages/admin/gestao-usuarios.vue` declara `conviteAberto`/`usuarioConvite` e monta
      `<UsuariosConvite>` — verificar: clicar no `MailCheck` abre o modal sem nenhum toast de
      "próxima etapa" e o ícone de bloquear continua exibindo o toast
- [x] 4.7 Layout em duas colunas no corpo do modal (D8): coluna esquerda
      `xl:grid-cols-[420px_minmax(0,1fr)]` (viewport ≥1280) com Destinatário + Canal +
      Credenciais à esquerda — **dois cartões de canal lado a lado** (`grid sm:grid-cols-2`,
      ~186px cada) — e Pré-visualização à direita esticando até a
      altura da coluna esquerda (`flex` + `grid-rows-[minmax(0,1fr)]`, iframe/pre com
      `h-full min-h-[280px]`); abaixo de `xl` tudo em uma coluna — verificar: em viewport
      ≥1280 as três seções ficam à esquerda com os cards lado a lado e a pré-visualização
      ocupa toda a altura à direita; em viewport estreito as seções voltam a empilhar
- [x] 4.8 Adicionar o `size="xl"` (1120px) ao `app/components/ui/Modal.vue` (novo caso em
      `ModalSize`/`sizeClass`), documentar em `docs/01` §5.12 e registrar na tabela de kit
      alterado de `docs/06` §4 — verificar: o modal de convite abre com 1120px de largura
      máxima e os demais modais (sm/md/lg) não mudam

## 5. Documentação do módulo e verificação final

- [x] 5.1 Em `docs/06 - Gestão de Usuários.md`: criar o §3.9 `Convite.vue` →
      `<UsuariosConvite>`, ajustar o §5.5 (gatilhos com toast passam a ser só Bloquear e CEP),
      criar o §5.7 com o comportamento do modal (subtítulo descritivo, layout em duas colunas,
      seções, canal, credenciais com "Redefinir senha", template, envio — e-mail simulado e
      WhatsApp com fallback), atualizar os dados de demonstração no §6 (senha e telefones), as
      linhas MODIFIED/ADDED da tabela §10 e as pendências do §12 (senha em texto e envio real
      de e-mail via Resend na fase de backend) — verificar: não resta nenhum texto afirmando
      que "enviar convite" exibe toast nem que o e-mail abre cliente de e-mail, e o Sumário
      referencia as seções novas
- [x] 5.2 Rodar `openspec validate "gestao-usuarios-modal-convite"` — verificar: exit 0 sem
      erros nos deltas de `gestao-usuarios` e `design-system/choice-card`
- [x] 5.3 Rodar `npm run build` completo — verificar: build finaliza sem erro
- [x] 5.4 Conferência visual: `/design` seção 17 (estados do UiChoiceCard + foco `brand-focus`
      ao Tab) e `/admin/gestao-usuarios` com o modal nos três estados (com telefone e senha,
      sem telefone, sem senha), layout em duas colunas, rodapé só com botões, "Redefinir
      senha", subtítulo descritivo + envio pelos dois canais (e-mail → toast de simulação,
      WhatsApp → app/fallback) e descarte por Cancelar — verificar: checklist observado no
      navegador, sem erros no console
