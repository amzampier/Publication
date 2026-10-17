# 09 — Meu Perfil · Área Administrativa

**Versão:** 1.2.0 — **Data:** 2026-10-14 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela de Meu Perfil do usuário logado — estrutura componentizada, as 4 abas
(dados pessoais, segurança, endereço, e-mail/SMTP), avatar em destaque, troca de senha,
fluxo de foto, salvar/cancelar e navegação pelo menu da conta
**Arquivos-fonte:** [`app/pages/admin/meu-perfil.vue`](../app/pages/admin/meu-perfil.vue) ·
[`app/components/perfil/`](../app/components/perfil) ·
[`app/components/usuarios/CamposSmtp.vue`](../app/components/usuarios/CamposSmtp.vue) ·
[`app/components/ui/Tabs.vue`](../app/components/ui/Tabs.vue)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) §5.20 (avatar) ·
**Autoridade de comportamento:** spec `openspec/specs/meu-perfil` (capability desta change)

> Este documento é a referência da tela `/admin/meu-perfil` e de tudo o que foi criado para ela:
> componentes de domínio, comportamento das abas, integração com a sessão e a navegação do item
> "Meu Perfil" do menu da conta. Toda alteração aqui deve atualizar também `01 - design_system.md`
> (§5.20) e `03 - Header e Sidebar.md` (menu da conta) quando envolver avatar ou navegação.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componente compartilhado (extraído)](#4-componente-compartilhado-extraído)
5. [Comportamento das abas](#5-comportamento-das-abas)
6. [Avatar e fluxo de foto](#6-avatar-e-fluxo-de-foto)
7. [Salvar e cancelar](#7-salvar-e-cancelar)
8. [Navegação até a tela](#8-navegação-até-a-tela)
9. [Verificação](#9-verificação)
10. [Pendências e próximos passos](#10-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

Meu Perfil é a tela do próprio usuário logado — complementa a Gestão de Usuários (modal do
administrador) com o mesmo modelo de dados:

- **Rota:** `/admin/meu-perfil` → `app/pages/admin/meu-perfil.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**` e é
  protegida pela guarda global (sem sessão redireciona ao login com `?redirect=`).
- **Dados:** registro REAL do usuário logado, servido por `GET /api/usuarios/eu`
  (change `gestao-usuarios-backend`) — sem espelho por e-mail; o rascunho em memória é
  clonado desse registro e gravado de volta via `PATCH /api/usuarios/eu`.
- **Aba padrão:** "Dados Pessoais" ao carregar.

## 2. Estrutura da página (componentização)

A página é fina: estado (rascunho, aba ativa, flag `alterado`) e composição. Cada parte é um
componente em `app/components/perfil/` (auto-import com prefixo `Perfil*`):

```
meu-perfil.vue                              (aba='dados', rascunho clonado, flag `alterado`)
├── <PerfilCabecalho />                     header sem container (tile + User + título)
├── grid lg:grid-cols-[320px_1fr]
│   ├── <PerfilResumo>                      card lateral — fundo em degradê vertical
│   │   └── #avatar → <PerfilAvatar>        navy diluído no topo → branco na base
│   │   (nome, badges status/perfil, linhas E-mail · Último acesso · Conta criada em;
│   │    sem botão de foto — o lápis do Avatar é o único ponto de entrada)
│   └── <PerfilAbas v-model="aba">          card único: UiTabs + painel + rodapé
│         ├── <PerfilAbaDadosPessoais>      v-if aba='dados' (ref expõe validar())
│         ├── <PerfilAbaSeguranca>          v-if aba='seguranca' (botão próprio)
│         ├── <PerfilAbaEndereco>           v-if aba='endereco'
│         └── <PerfilAbaEmail v-model>      v-if aba='email' (CamposSmtp)
├── <UiModal fotoAberta>                    troca de foto: <UiUploadFiles circular>
└── <UiCameraWeb>                           captura (emite foto → rascunho.avatar)
```

- **Layout:** `grid gap-6 lg:grid-cols-[320px_1fr]` — abaixo de `lg` empilha (resumo primeiro);
  o rodapé do card de abas usa `flex-wrap` e botões `w-full sm:w-auto` (sem overflow a 375px).
- **Rodapé das ações:** dentro do card de abas (`border-t`), "Cancelar" (outline) +
  "Salvar alterações" (primary, `:disabled="!alterado"`).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<PerfilCabecalho>`

Header sem container, padrão das demais telas: tile `rounded-lg bg-brand-primary p-2` com
ícone `User` (`text-[#50a1ff]`), título "Meu Perfil" (`text-lg font-bold`) e subtítulo
"Gerencie suas informações e preferências" (`text-xs text-slate-500`). Sem props nem eventos.

### 3.2 `Resumo.vue` → `<PerfilResumo>`

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `nome` | `string` | Nome exibido sob o avatar |
| `email` | `string` | E-mail exibido na linha informativa (somente leitura — não é editável nesta tela) |
| `status` | `StatusUsuario` | Alimenta o badge (`VARIANTE_POR_STATUS`) |
| `perfil` | `PerfilUsuario` | Alimenta o badge (`VARIANTE_POR_PERFIL`) |
| `ultimoAcessoTexto` | `string` | `formatarUltimoAcesso(registro.ultimoAcesso)` |
| `criadoEmTexto` | `string` | `formatarDataHora(registro.dataCadastro)` |

- **Fundo:** degradê vertical **`bg-gradient-to-b from-brand-structure/15 to-white`** — azul bem
  clarinho no topo esmaecendo até o branco (registro em `docs/01` §2.1/§5.20 e na spec
  `design-system/brand-tokens`; único degradê sobre superfície clara do DS).
- **Slot `avatar`** — recebe o `<PerfilAvatar>` com a pré-visualização do rascunho.
- **Sem eventos:** a troca de foto é feita apenas pelo lápis do Avatar (não há botão
  "Alterar foto" nem o mini-card "Sua conta está segura" — este pertence à aba Segurança).
- Linhas informativas com ícones em tile `bg-slate-100`: E-mail (`Mail`), Último acesso
  (`Clock`), Conta criada em (`CalendarDays`).

### 3.3 `Avatar.vue` → `<PerfilAvatar>` — o destaque da tela

Registro visual completo em `docs/01` §5.20: sem anel/borda de destaque, iniciais (primeiro +
último nome) sobre fundo cinza neutro `bg-slate-600` (texto branco) ou foto (`object-cover`),
lápis flutuante **`h-7 w-7`** com `border-2 border-white` — **único ponto de entrada da troca de
foto**. Sem foto o lápis fica sempre visível; **com foto**, o lápis some (`opacity-0`) e aparece
só no hover sobre o Avatar (`group-hover` + `group-focus-within` para teclado).

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `nome` | `string` | Base das iniciais e do `alt` da foto |
| `preview` | `string` | dataURL da foto; `''` = iniciais |

- **Emite:** `alterar-foto()`.

### 3.4 `Abas.vue` → `<PerfilAbas>`

Casca no padrão de `ConfiguracoesAbas`: card único (`rounded-xl border border-slate-200
bg-white shadow-xs`), barra `UiTabs id-prefix="perfil"` (`border-b`), painel
`role="tabpanel"` (`id="perfil-panel-<aba>"`, `aria-labelledby="perfil-tab-<aba>"`) e slot do
painel ativo. **Rodapé próprio:** Cancelar + Salvar alterações (`border-t`, alinhados à
direita, `flex-wrap`).

| Prop | Tipo | Descrição |
| :--- | :--- | :--- |
| `modelValue` | `string` | Aba ativa (`dados` \| `seguranca` \| `endereco` \| `email`) |
| `desabilitado` | `boolean` | Passa `disabled` ao "Salvar alterações" |

- **Emits:** `update:modelValue`, `change` (troca de aba), `salvar()`, `cancelar()`.

Abas (ordem fixa): Dados Pessoais (`User`, `#0364f7`) · Segurança (`ShieldCheck`, `#be123c`)
· Endereço (`MapPin`, `#f59e0b`) · E-mail (`Mail`, `#8b5cf6`).

### 3.5 `AbaDadosPessoais.vue` → `<PerfilAbaDadosPessoais>`

Edita `rascunho.nome` (obrigatório) e `rascunho.telefone` (máscara `(99) 99999-9999`).
**Não há campo de e-mail:** o e-mail do usuário é exibido somente em leitura no resumo lateral
e não é editável nesta tela (a regra de unicidade de e-mail vive apenas no modal de Gestão de
Usuários). Seção "Informações adicionais": **Cargo** e **Setor** (`funcao`/`departamento`) em
`UiInput disabled` — somente leitura, fora da validação e do salvamento (preenchidos pelo
administrador no cadastro). Alerta informativo azul (`border-blue-200 bg-blue-50`):
"As alterações serão aplicadas em todo o sistema…".

- **Emite:** `change()` em qualquer edição.
- **Expõe `validar(): boolean`** — a página chama no Salvar (apenas a regra do nome); erros no
  padrão do kit (`rose-700`, tooltip + `role="alert"`) e limpos ao digitar.

### 3.6 `AbaSeguranca.vue` → `<PerfilAbaSeguranca>` — troca de senha atômica (API)

Senha atual, nova senha (mín. 8) e confirmação, com olho `Eye`/`EyeOff` por campo e botão
próprio **"Alterar senha"** (`:loading` durante a chamada) — fora do Salvar global (troca de
senha não exige salvar abas não tocadas).

- **Layout em duas colunas** (quando a largura permite): Senha atual sozinha na primeira linha
  (largura de metade) e **Nova senha ao lado da Confirmação** na segunda; em telas estreitas os
  campos empilham.
- **Mini-card "Sua conta está segura"** (movido do resumo lateral) ao final da aba.
- **Processamento via API (change `auth-backend-resend`):** o cliente valida apenas a forma
  (presença, ≥8, confirmação idêntica) e chama `POST /api/auth/trocar-senha` com a sessão
  real — o **servidor** confere a senha atual com bcrypt contra o `hash_senha` vigente e
  grava o novo hash (`senha_provisoria = 0`). Erro `400` do servidor volta no campo
  correspondente (ex.: "Senha atual incorreta." em Senha atual); a nova senha passa a
   autenticar no login imediatamente. Sem props de senha e sem gravação local —
   a aba é autônoma.

### 3.7 `AbaEndereco.vue` → `<PerfilAbaEndereco>`

Os mesmos 8 campos do modal de usuários (CEP com máscara + botão ViaCEP, Endereço, Número,
Complemento, Bairro, Cidade, Estado (`UFS`), Região (`REGIOES`)), com os mesmos `grid-cols`.

- **Busca de CEP real (capability `busca-cep`, change `integrar-via-cep`):** o botão ao lado
  do CEP consulta a API ViaCEP via `useBuscaCep` (com título de toast "Meu Perfil") e
  preenche **Endereço, Bairro, Cidade, Estado e Região** — Número e Complemento digitados
  são preservados, campos vazios na resposta mantêm o valor atual e o sucesso **não** gera
  toast (o preenchimento é o feedback). Falhas têm toast próprio: CEP incompleto
  (aviso, sem requisição), CEP não encontrado e falha de rede/timeout (10 s de limite, com
  requisição abortada). Enquanto a consulta está em voo o ícone vira `LoaderCircle`
  girando (`aria-busy`, cliques bloqueados — clique duplo não duplica a requisição) e o
  preenchimento bem-sucedido emite `change`, habilitando "Salvar alterações".
- **Prop:** `endereco` (objeto `EnderecoUsuario` do rascunho — edição direta; lido por
  getter no composable porque a página troca a referência ao cancelar/salvar).
- **Emite:** `change()`.

### 3.8 `AbaEmail.vue` → `<PerfilAbaEmail>`

Consome o bloco compartilhado `<UsuariosCamposSmtp v-model>` (§4) dentro de um wrapper
`grid gap-4` com `mt-4` — como o `CamposSmtp` tem dois nós-raiz (campos + ações), o
espaçamento entre o título/subtítulo e os campos (e entre campos e botões) é garantido pelo
wrapper (mesmo efeito do `UiModalSection` no modal), e um alerta informativo azul lembra que
o teste é simulado na fase 1.

- **Prop/Emit:** `v-model` (`ConfigSmtpUsuario`) + `change`.

## 4. Componente compartilhado (extraído)

### `usuarios/CamposSmtp.vue` → `<UsuariosCamposSmtp>`

Bloco SMTP **extraído do `Formulario.vue`** (Gestão de Usuários) para reuso — uma única
máquina de estados para os dois consumidores:

- **Interface:** `v-model` (`modelValue: ConfigSmtpUsuario`) + emit `change`.
- **Comportamento:** segurança SMTP sugere a porta (flag `portaManual` impede sobrescrever a
  porta digitada à mão); editar qualquer campo zera o status para "Não testado"; "Testar
  conexão" simula 1.200 ms (portas em `PORTAS_SMTP_VALIDAS` conectam); "Enviar teste" só
  habilita com status "Conectado"; badge de status (`UiBadge`).
- **Constantes:** `PROVEDORES_SMTP`, `SEGURANCAS_SMTP`, `PORTAS_SMTP_VALIDAS` em
  [`app/config/brasil.ts`](../app/config/brasil.ts).
- **Consumidores:** modal de edição de usuário (seção "Configurações de E-mail") e aba E-mail
  do Meu Perfil — comportamento idêntico nos dois lugares.

## 5. Comportamento das abas

| Aba | Conteúdo | Grava no |
| :--- | :--- | :--- |
| Dados Pessoais | Nome (validado), telefone; Cargo/Setor leitura (sem campo de e-mail) | Salvar global |
| Segurança | Troca de senha (botão próprio) + mini-card "Sua conta está segura" | Imediato |
| Endereço | 8 campos + busca ViaCEP (preenche e habilita o salvar) | Salvar global |
| E-mail | SMTP (`CamposSmtp`) | Salvar global |

Mudar de aba (`UiTabs`) não altera dados nem a flag `alterado`; a aba Dados Pessoais é a
única com validação de salvamento — se o Salvar for acionado de outra aba com dados pessoais
inválidos, a página volta para a aba e foca o primeiro erro. **Em todas as abas**, cada
cabeçalho de seção (título + subtítulo) é separado dos campos por um **filete verde da marca**
(`mt-3 h-px bg-brand-accent`) — padrão aplicado nas seções "Informações pessoais" e
"Informações adicionais" (Dados Pessoais), "Alterar senha" (Segurança), "Endereço" e
"Configurações de E-mail" (E-mail).

## 6. Avatar e fluxo de foto

1. O **lápis do avatar** (único ponto de entrada — não existe botão "Alterar foto") abre
   `UiModal` com `UiUploadFiles` (`forma="circular"`, `compacto`, `aceitar="image/*"`, preview
   do rascunho).
2. Arquivo → `FileReader` → dataURL no `rascunho.avatar` (habilita o Salvar); ícone de
   câmera → `UiCameraWeb` (emulada) → captura → dataURL e fecha os dois modais.
3. Remover o arquivo limpa `rascunho.avatar` (volta às iniciais).
4. A foto só é gravada ao **Salvar alterações** (Cancelar restaura a anterior): no salvar,
   uma dataURL nova é enviada como ARQUIVO ao destino `avatares` (`POST /api/uploads`) e o
   registro passa a referenciar o caminho do arquivo (`avatar_url` — o banco não guarda
   dataURL); remover a foto grava `avatar_url` nulo.

## 7. Salvar e cancelar

- **`alterado`** nasce `false` e liga com qualquer `change` de painel (inclusive troca de
  foto); "Salvar alterações" fica `disabled` enquanto `false`.
- **`salvar()`:** valida a aba Dados Pessoais (troca para ela se preciso — regra apenas do
  nome), envia `PATCH /api/usuarios/eu` com nome/telefone/endereço/SMTP (e `avatar`:
  dataURL nova → upload em `avatares` → caminho; caminho existente → enviado igual; `''` →
  remove a foto; o e-mail **não** faz parte do rascunho: é somente leitura), substitui o
  registro pela resposta da API, restaura o rascunho a partir dela, toast de sucesso e
  `alterado = false`.
- **`cancelar()`:** `rascunho = clonar(registro)` (restaura tudo), erros somem quando os
  campos voltam a passar nas regras e `alterado = false` — sem nenhuma requisição.

## 8. Navegação até a tela

Item **Meu Perfil** do menu da conta (`accountMeuPerfil` em
[`app/config/navigation.ts`](../app/config/navigation.ts)) declara
`to: '/admin/meu-perfil'` e navega pelo mesmo `clicarItemMenu` dos demais itens com rota
(`AppHeader.vue`); o menu fecha ao clicar. Spec `design-system/layout-navigation` atualizado
(delta da change): Meu Perfil deixa de ser item sem navegação. A sidebar não tem item novo —
o acesso é exclusivamente pelo menu da conta (`docs/03` §3).

## 9. Verificação

- `npm run build` (único gate automatizado — não existe lint/test no projeto).
- Percurso manual em `http://localhost:3000` (credenciais demo: `ana.carolina@empresa.com.br`
  / `Public@2026`):
  1. Login → menu da conta → "Meu Perfil" navega e fecha o menu; URL `/admin/meu-perfil`.
  2. Resumo: fundo em degradê suave (navy no topo → branco na base), iniciais no avatar (sem
     foto), badges Ativo + perfil, linhas com último acesso.
  3. Dados Pessoais: nome vazio → erro "Informe o nome."; **não há campo de e-mail** (aparece
     só em leitura no resumo); Cargo/Setor desabilitados.
  4. Segurança: layout em duas colunas; senha atual errada → erro; confirmação divergente →
     erro; senha curta → erro; troca válida → toast e novo login com a senha nova; mini-card
     "Sua conta está segura" presente ao final.
  5. Endereço: campos editam; CEP `01001-000` + botão → preenche Endereço, Bairro, Cidade,
     Estado e Região sem toast e habilita "Salvar alterações" (Número/Complemento intactos);
     CEP com menos de 8 dígitos → toast de aviso sem requisição; CEP inexistente ou falha de
     rede → toast de erro sem alterar campos; clique duplo dispara uma única consulta (ícone
     vira spinner durante o voo).
  6. E-mail: título/subtítulo com espaçamento confortável sobre os campos; segurança sugere
     porta; editar zera status; "Testar conexão" com porta 587 → "Conectado"; "Enviar teste"
     habilita.
  7. Alterar telefone + bairro + servidor e Salvar → um toast só, tudo gravado; Cancelar
     descarta.
  8. Foto: alterar → Salvar grava; Cancelar restaura.
  9. Regressão: modal de edição em Gestão de Usuários com o `CamposSmtp` extraído — mesmo
     comportamento do antes.
 10. 375px: sem overflow horizontal (resumo empilha, rodapé em wrap).

## 10. Pendências e próximos passos

- ~~Backend do perfil~~ — **entregue** (change `gestao-usuarios-backend`): registro lido de
  `GET /api/usuarios/eu` e gravado via `PATCH /api/usuarios/eu` (dados, endereço, SMTP e
  foto como arquivo em `avatares`); a troca de senha já era real (`POST /api/auth/trocar-senha`).
- **RBAC no cliente:** `usePermissions` (docs/02 §5.3) — hoje qualquer sessão acessa a tela.
- **Nome de usuário:** não existe no modelo (`UsuarioModelo`); se virar campo de login, esta
  tela ganha o rótulo e a validação de unicidade correspondentes.
