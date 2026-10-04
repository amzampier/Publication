# 06 — Gestão de Usuários · Área Administrativa

**Versão:** 2.0.0 · **Data:** 2026-10-04 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal de Gestão de Usuários — listagem (base em memória) com cabeçalho
(Relatórios + Novo Usuário), KPIs, tabela e **modal único de cadastro/edição com os cinco blocos**
**Arquivos-fonte:** [`app/pages/admin/gestao-usuarios.vue`](../app/pages/admin/gestao-usuarios.vue) ·
[`app/components/usuarios/`](../app/components/usuarios) ·
[`app/config/brasil.ts`](../app/config/brasil.ts) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — seção 5 (máscara) e seção 15 (modal filho)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) — componentes do kit usados
(`UiModal`, `UiModalSection`, `UiInput`, `UiSelect`, `UiButton`, `UiBadge`, `UiKpi`,
`UiDataTable`, `UiTooltip`, `UiUploadFiles`, `UiCameraWeb`)
**Autoridade de comportamento:** specs da change `openspec/changes/gestao-usuarios-modal-cadastro`
(`gestao-usuarios` + `design-system/modais`)

> Este documento é a referência da tela `/admin/gestao-usuarios` e de tudo o que foi criado para
> ela: componentes de domínio, o modal de usuário, a gravação em memória e os gatilhos remanescentes
> com toast. Toda alteração aqui deve manter as specs da change e a implementação coerentes.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (alterados)](#4-componentes-de-kit-alterados)
5. [Comportamento: modal, validação, SMTP e gravação](#5-comportamento-modal-validação-smtp-e-gravação)
6. [Dados de demonstração](#6-dados-de-demonstração)
7. [Navegação até a tela](#7-navegação-até-a-tela)
8. [Estilo e CSS dedicado](#8-estilo-e-css-dedicado)
9. [Vitrine `/design`](#9-vitrine-design)
10. [Especificações OpenSpec](#10-especificações-openspec)
11. [Verificação](#11-verificação)
12. [Pendências e próximos passos](#12-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A Gestão de Usuários é a tela de administração de usuários da Área Administrativa:

- **Rota:** `/admin/gestao-usuarios` → `app/pages/admin/gestao-usuarios.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de dados:** núcleo conforme o `docs/02` §3.5 (tabelas `usuarios`/`perfis`) — nome,
  e-mail, perfil, status, último acesso —, **estendido no modal** por telefone, função,
  departamento, endereço, configurações de e-mail, avatar e datas (`docs/02` permanece intocado;
  a extensão vive só no `UsuarioDemo`, ver §3.5).
- **Fase 2:** CRUD **inteiramente em memória** — sem `server/`, sem chamadas de rede. A base vive
  em `useState('usuarios-base')`: as alterações sobrevivem à navegação interna e são descartadas
  na recarga.
- **Modal único:** "Novo Usuário" e o lápis da linha abrem o **mesmo** `UsuariosFormulario`, em
  modo de criação ou de edição (§3.4). Os demais gatilhos (Importar, Filtros, Convite, Bloquear,
  Excluir e o ícone do CEP) seguem com toast de transição (§5).

## 2. Estrutura da página (componentização)

A página é fina e é **dona do estado de coordenação do modal** (decisão D1 do `design.md` da
change). Cada parte é um componente em `app/components/usuarios/` (auto-import com prefixo
`Usuarios*`):

```
admin/gestao-usuarios.vue            (page — definePageMeta + composição + estado do modal)
├── <UsuariosCabecalho @novo />       ← título + menu "Relatórios" + "Novo Usuário"
├── <UsuariosKpis class="mt-6" />     ← 4 UiKpi do conjunto VIGENTE
├── <UsuariosTabela class="mt-5" @editar />  ← UiDataTable (busca + badges + ações)
└── <UsuariosFormulario v-model :modo :usuario />  ← modal único (5 blocos)
```

- **Estado de coordenação na página:** `modalAberto: ref(false)`, `modo: ref<'novo' | 'editar'>`
  e `usuarioAlvo: ref<UsuarioDemo | null>`; `abrirNovo()` preenche `modo`/`usuarioAlvo` e abre,
  `abrirEdicao(usuario)` idem com o registro da linha. Nada fora da página abre o diálogo.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo padrão
  da Auditoria).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<UsuariosCabecalho>`

- Cabeçalho sem container (padrão `AuditoriaCabecalho`): tile `bg-brand-primary` com `Users` em
  `#b070ef`, título "Gestão de Usuários" e subtítulo.
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, `aria-haspopup="menu"`
  + `aria-expanded`), à esquerda do "Novo Usuário": mini-menu `role="menu"` "Opções de relatórios"
  com **Ficha Cadastral**, **Relação Completa**, **divisor** e **Exportar em CSV** — itens em
  `text-xs font-light text-slate-700`, fecha por `Escape` e clique fora (markup de domínio,
  **não** é componente de kit).
- **Botão "Novo Usuário"** (`UiButton` primary + `Plus`): **emite `@novo`** para a página, que
  abre o modal em modo de criação (não há mais toast aqui).
- **Exportar em CSV:** monta o CSV de `usuariosFiltrados` com `Blob` + **BOM UTF-8** (`'\uFEFF'`),
  cabeçalho escapado e linhas entre aspas separadas por `;`, baixado como `usuarios.csv` com as
  colunas **Nome, E-mail, Perfil, Status, Último acesso**.
- **Relação Completa:** `gerarPdfUsuarios` (`./gerarPdfUsuarios.ts`) — `usuarios.pdf` em **A4
  paisagem** (`jspdf` + `jspdf-autotable`), cabeçalho com a logo de login rasterizada via canvas,
  título + "Gerado em …", linha "`N` usuário(s)", cabeçalho repetido a cada página e rodapé
  "Página X de Y"; **`window.print()` não é usado**.
- **Ficha Cadastral:** `gerarPdfFichaCadastral` (`./gerarPdfFichaCadastral.ts`) —
  `ficha-cadastral.pdf` em **A4 retrato**, **1 página por usuário** com faixas navy "Dados
  Cadastrais" e "Acesso ao Sistema".

### 3.2 `Kpis.vue` → `<UsuariosKpis>`

4 `UiKpi` em `grid sm:grid-cols-2 lg:grid-cols-4`, todos derivados de `usuariosFiltrados`
(conjunto vigente — recalculam quando o conjunto muda, inclusive após criar/editar):

| KPI | Valor | Cor (`cor` do `UiKpi`) | Ícone |
| :--- | :--- | :--- | :--- |
| Total de usuários | contagem de `usuariosFiltrados` | `#112051` (navy) | `Users` |
| Ativos | contagem de `status === 'Ativo'` | `#047857` (esmeralda) | `UserCheck` |
| Inativos | contagem de `status === 'Inativo'` | `#64748b` (slate) | `UserX` |
| Perfis distintos | `Set` de perfis do conjunto | `#f5b302` (cor RBAC) | `ShieldCheck` |

### 3.3 `Tabela.vue` → `<UsuariosTabela>`

- `UiDataTable` com `show-header-top` (busca), `show-filters` + `:filters-count="filtrosAtivosCount"`
  + `@open-filters` → toast, e slot **`#filtersLeft`** com o **ícone `Import` solto** (plain
  `<button>`) + `UiTooltip` **"Importar Novos Usuários"** → toast.
- **Colunas** (`minWidth`): Nome (170), E-mail (220), Perfil (110), Status (95), Último acesso
  (135, `format` → `formatarUltimoAcesso`, `null` vira `-`) + coluna Ações. **Sem rolagem
  horizontal** ≥ ~1280px (soma ≈ 830px dentro do `max-w-7xl`).
- **Badges via slot `#cell`:** perfil → `reconciled`/`inReview`/`pending`/`neutral`
  (`VARIANTE_POR_PERFIL`); status → `done`/`neutral` (`VARIANTE_POR_STATUS`), ambos `size="sm"`.
- **Coluna Ações:** slot `#actions` com `UiTooltip` + `aria-label` por ícone e cor semântica
  permanente:

  | Ação | Ícone | Cor | Comportamento |
  | :--- | :--- | :--- | :--- |
  | Enviar o Convite | `MailCheck` | `text-sky-600` | toast de transição (§5) |
  | Bloquear usuário | `Lock` | `text-amber-600` | toast de transição (§5) |
  | Editar usuário | `Pencil` | `text-brand-focus` | **emite `@editar(usuario)` → abre o modal** |
  | Excluir usuário | `Trash2` | `text-rose-700` | toast de transição (§5) |

### 3.4 `Formulario.vue` → `<UsuariosFormulario>` (modal único)

Recebe `v-model` (aberto), `modo: 'novo' | 'editar'` e `usuario: UsuarioDemo | null`; mantém um
**rascunho** (`Rascunho` = `UsuarioDemo` sem perfil/situação obrigatórios + `senha` +
`confirmarSenha`) e devolve a gravação para o composable.

- **`UiModal size="lg"`** com título `Novo Usuário` / `Editar Usuário`, subtítulo "Dados, acesso
  ao sistema e preferências do usuário", ícone `User`, `X` do cabeçalho e rodapé
  **Cancelar** (`outline`) + **Salvar** (`primary`).
- **Quatro `UiModalSection`** (a seção 4 só é renderizada em modo de edição):

  | # | Seção (ícone) | Campos |
  | :--- | :--- | :--- |
  | 1 | Dados do Usuário (`User`) | avatar (`UiUploadFiles forma="circular" compacto` em coluna de 200px + `UiCameraWeb`), Nome\|E-mail na mesma linha; Telefone\|Função\|Departamento na mesma linha; **linha seguinte de largura total começando abaixo do avatar** (`sm:grid-cols-4`): **Status** em `UiSegmented` (controle segmentado Ativo\|Inativo, sem dropdown; rótulo trocado de "Situação"), Perfil, Senha, Confirmar Senha (olho `Eye`/`EyeOff` no `rightIcon`) — **sem seção/cabeçalho próprio "Acesso ao Sistema"** (removido) |
  | 2 | Endereço (`MapPin`) | `grid-cols-12` em 2 linhas — **1ª:** CEP (3, com ícone de busca **fora do input**, à direita), Endereço (**5**, maior), Número (**2**, menor), Complemento (2) · **2ª:** Bairro (3), Cidade (**4**, maior), Estado (**2**, menor, 27 `UFS`), Região (3, 5 `REGIOES`) |
  | 3 | Configurações de E-mail (`Mail`) | E-mail SMTP, Senha SMTP (1ª linha, 6+6); Provedor (3), Servidor SMTP (3), **Segurança (4, antes da Porta)**, Porta (**2**, menor) + ações de teste + badge de Status |
  | 4 | Informações de Cadastro (`Clock`) | **somente na edição** — Data Cadastro e Última Atualização (`UiInput disabled`) |

- **Máscaras (`UiInput mask`, §4):** CEP `99999-999`, Telefone `(99) 99999-9999` e Porta `9999` —
  o valor gravado é a **string formatada**.
- **Ícone do CEP:** **somente o ícone** `MapPinCheck` (sem caixa de botão) logo à direita do input,
  com `role="button"` + `tabindex="0"` + `aria-label` e `UiTooltip` "Buscar CEP (ViaCEP)" → clique
  ou `Enter` dispara `toast.info` de transição, **nenhum campo de endereço é preenchido**.
- **Navegação por teclado:** `Enter` em qualquer `UiInput` move o foco para o próximo campo focável
  (mesma ordem do `Tab`: gatilhos dos `UiSelect`, ícone do CEP, botões do avatar), com a **caret
  reposicionada no fim** — o cursor fica dentro do próximo input. A busca interna do `UiSelect`
  (`data-busca`) fica de fora: lá `Enter` continua escolhendo a opção destacada.
- **Avatar:** `UiUploadFiles forma="circular" compacto` — **foto redonda 96px centralizada** em
  caixa larga de 200px (borda tracejada só no vazio; ações `size-6` no canto inferior direito);
  converte a imagem em dataURL no `change`; o botão de câmera emite `@camera` e abre `UiCameraWeb` —
  captura atualiza a pré-visualização e fecha só a câmera (empilhamento, §4).
- **Informações de Cadastro:** exibida **apenas ao editar**; criação exibe `-` com `helperText`
  "Preenchidos ao salvar"; edição exibe `dd/mm/aaaa HH:mm` (`formatarDataHora`).

### 3.5 `useUsuariosDemo.ts` — composable de estado (base reativa)

- Tipos: `UsuarioDemo` (**núcleo** id, nome, email, perfil, status, ultimoAcesso + **estendido**
  telefone, funcao, departamento, `endereco: EnderecoUsuario`, `smtp: ConfigSmtpUsuario`, avatar,
  dataCadastro, atualizadoEm), `PerfilUsuario`, `StatusUsuario`, `ModoUsuario`
  (`'novo' | 'editar'`), `StatusSmtp` (`'nao-testado' | 'testando' | 'conectado' | 'falha'`) e
  `FiltrosUsuarios`.
- Constantes e helpers: `PERFIS`, `STATUSES`, `VARIANTE_POR_PERFIL`, `VARIANTE_POR_STATUS`,
  `enderecoVazio()`, `smtpVazio()`.
- **Semente:** `USUARIOS` — os 16 usuários (2 Administradores, 5 Editores, 4 Revisores, 5
  Leitores; 13 Ativos, 3 Inativos, 1 sem acesso) com os campos estendidos vazios/`null`.
- **Base reativa:** `useState('usuarios-base')` semeada com **clone profundo** da semente (a
  constante nunca é mutada); `usuariosFiltrados` lê desse estado, junto com
  `useState('usuarios-filtros')`, `filtrosAtivosCount` e `limparFiltros`.
- **Gravação pura:** `salvarUsuario(base, rascunho, modo)` devolve `{ base, usuario }` — cria com
  id novo, `ultimoAcesso: null` e `dataCadastro`/`atualizadoEm` iguais ao instante; edita
  preservando `dataCadastro` e `ultimoAcesso`, atualizando `atualizadoEm`.
- **Formatadores:** `formatarUltimoAcesso(iso)` e `formatarDataHora(iso)` (`dd/mm/aaaa HH:mm`;
  `null` → `-`).
- Arquivo em `components/usuarios/` (não é auto-importado): consumidores importam explicitamente.

### 3.6 `gerarPdfUsuarios.ts` e `gerarPdfFichaCadastral.ts` — geradores de relatório

Espelho do `gerarPdfAuditoria.ts` (mesmo helper `rasterizarLogo`, estilos navy da `UiDataTable`,
rodapé "Página X de Y"): `gerarPdfUsuarios.ts` (A4 paisagem, autotable) e
`gerarPdfFichaCadastral.ts` (A4 retrato, 1 página por usuário). **Nenhuma dependência nova**
(`jspdf` + `jspdf-autotable` já existiam).

## 4. Componentes de kit (alterados)

Nenhum componente novo; **dois itens de kit alterados** nesta change:

| Kit | Alteração | Contrato |
| :--- | :--- | :--- |
| `UiInput` | **prop `mask`** (sintaxe `9` dígito, `A` alfanumérico, demais literais) | formata no `@input`, `update:modelValue` emite a **string formatada**, `maxlength` segue o tamanho da máscara, `backspace` apaga o literal junto; recorte de erro continua `rose-700` — ver `docs/01` §5.3 |
| `UiModal` | **pilha de modais** (`pilhaModais` no escopo do módulo) | `Escape`/`Tab` só processados quando a instância é o **topo** da pilha; fechar o topo restaura o foco no subjacente — ver `docs/01` §5.12 |

- Continua valendo o registro da fase anterior: `UiDataTable` ganhou o slot opt-in `#filtersLeft`.
- Os demais `Ui*` (`UiSelect`, `UiButton`, `UiBadge`, `UiKpi`, `UiTooltip`, `UiUploadFiles`,
  `UiCameraWeb`, `UiModalSection`) são apenas compostos — o único componente de kit novo criado
  para esta tela é o **`UiSegmented`** (campo Status, docs/01 §5.15).

## 5. Comportamento: modal, validação, SMTP e gravação

### 5.1 Abertura do modal (dois modos)

- **Criação:** "Novo Usuário" (`Cabecalho` emite `@novo`) → modal vazio, Perfil e Situação sem
  seleção, datas `-` + "Preenchidos ao salvar", Status da Configuração "Não testado" e senhas
  vazias.
- **Edição:** lápis da linha (`Tabela` emite `@editar(usuario)`) → modal preenchido com o
  registro (datas formatadas, `smtp.status` reiniciado para "Não testado") e **campos de senha
  vazios**.
- Fechar por `Cancelar`, `Escape` ou `X` descarta o rascunho sem tocar na base e **sem toast de
  sucesso**.

### 5.2 Validação antes de gravar

`validar(rascunho, modo, base)` é função pura e devolve `Record<campo, string>`; o componente
pinta `:error` (label e recorte em `rose-700` + `AlertCircle` interno à direita + borda vermelha —
**sem mensagem visível abaixo**, que fica no DOM oculta com `role="alert"`), limpa o
erro quando a regra volta a passar e, na tentativa inválida, **foca o primeiro campo** via
`data-campo` no wrapper (fallthrough attrs). Ordem de foco: Nome → E-mail →
Status → Perfil → Senha → Confirmar Senha.

| Regra | Quando |
| :--- | :--- |
| Nome, E-mail, Perfil, Situação obrigatórios | sempre |
| E-mail em formato válido e **único** na base | sempre |
| Senha obrigatória, **mín. 8 caracteres** e confirmação igual | **criação** |
| Senha e confirmação **ou ambas vazias ou ambas preenchidas e iguais** | **edição** |

Os cenários da spec: e-mail duplicado (erro no E-mail + foco), senha curta/divergente na criação
(erros nos dois campos + foco no 1º) e senha parcial na edição (erro no campo **vazio**), com o
modal permanecendo aberto e os demais dados preservados.

### 5.3 Configurações de E-mail (simulada, sem rede)

- Status da Configuração inicia em **"Não testado"**; badge `UiBadge` com
  `neutral`/`pending`/`done`/`blocked` → Não testado / Testando / Conectado / Falha.
- **Testar conexão** habilitado só com Servidor + Porta + E-mail SMTP preenchidos; percorre
  **"Testando" por ~1.200 ms** (botões desabilitados) e termina em **"Conectado"** com porta
  `25`/`465`/`587` (`PORTAS_SMTP_VALIDAS`) ou **"Falha"** nos demais (ex.: `250`).
- **Enviar teste** habilitado só com Status "Conectado" → `toast.info` de envio em simulação.
- **Trocar a Segurança** sugere a Porta (`Nenhuma`→25, `STARTTLS`→587, `SSL/TLS`→465), a menos
  que a porta tenha sido digitada à mão depois da sugestão (flag simples); a porta continua
  editável.
- **Editar qualquer campo do bloco** devolve o Status a "Não testado" e cancela um teste em
  andamento; o timer também é limpo no fechamento do modal e no unmount.
- `Salvar` **não** exige o teste; nenhuma requisição de rede é emitida.

### 5.4 Gravação em memória

- **Criar:** `salvarUsuario` adiciona o registro (id novo `u-00N`, `ultimoAcesso: null`,
  `dataCadastro`/`atualizadoEm` = instante) → modal fecha + `toast.success('Gestão de Usuários',
  'Usuário criado com sucesso.')`; a linha nova aparece com `-` no Último acesso e os KPIs
  recalculam (Total 17).
- **Editar:** atualiza o registro preservando `dataCadastro` e `ultimoAcesso`, com
  `atualizadoEm` = instante → modal fecha + `toast.success` de atualização.
- As alterações sobrevivem à navegação interna (`useState`) e **são descartadas na recarga**.

### 5.5 Gatilhos remanescentes com toast (contrato de transição)

Cinco controles da tela + o ícone do CEP continuam exibindo
`toast.info('Gestão de Usuários', '<ação>: funcionalidade disponível na próxima etapa.')` com
**nenhum `UiModal`** aberto:

| Gatilho | Onde |
| :--- | :--- |
| Importar novos usuários (`Import`) | toolbar da `Tabela` (slot `#filtersLeft`, tooltip "Importar Novos Usuários") |
| Filtros | toolbar da `Tabela` (botão do `UiDataTable`) |
| Enviar o Convite (`MailCheck`) | coluna Ações da `Tabela` |
| Bloquear usuário (`Lock`) | coluna Ações da `Tabela` |
| Excluir usuário (`Trash2`) | coluna Ações da `Tabela` |
| Buscar CEP (ViaCEP) | `rightIcon` do campo CEP no modal |

**Superfícies complementares:** a busca da `UiDataTable` é texto livre instantâneo e filtra só
as linhas da tabela; KPIs e exportação usam `usuariosFiltrados` do composable. **Filtros
estruturais** (perfil/status) já existem no composable, mas a UI ainda não chegou — o badge do
botão reflete `filtrosAtivosCount`. **Exportação** opera sempre sobre o conjunto vigente, pelo
menu "Relatórios".

## 6. Dados de demonstração

- Base de **16 usuários**: 2 Administradores, 5 Editores, 4 Revisores e 5 Leitores;
  **13 Ativos** e **3 Inativos**; 1 usuário nunca acessou (`null` → `-`).
  KPIs da base completa: **Total 16 · Ativos 13 · Inativos 3 · Perfis distintos 4**.
- A semente traz endereço/SMTP/avatar/datas vazios (`null`/`''`) — **editar um usuário antigo
  mostra os blocos vazios**, que é o comportamento esperado (sem fake pre-fill).
- **Nenhuma persistência:** a recarga restaura a semente; a base reativa e os filtros vivem em
  `useState` (perdem-se ao fechar a aba/sessão).
- **Escopo do modelo:** `senha` (hash bcrypt), `tentativas_falhas`/`bloqueado_ate` e os demais
  campos do `docs/02` §3.5 seguem para o backend (fora de escopo).

## 7. Navegação até a tela

- **Sidebar:** sessão "Administração" → item "Gestão de Usuários" com
  `to: '/admin/gestao-usuarios'` (`app/config/navigation.ts`) — fica ativo na rota
  (spec `design-system/layout-navigation`).
- **Menu da conta:** item "Gestão de Usuários" com o mesmo `to`.
- Os itens de Administração com rota são Configurações Globais, Gestão de Auditoria e Gestão de
  Usuários; permanecem sem rota **Perfis de Acesso (RBAC)** e os itens das demais sessões (MEL-03
  do `RL01`).

## 8. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#b070ef]`, `brand-focus` nos focos, `rose-700` nos erros, variantes do `UiBadge`).
- **Nenhuma dependência nova:** `jspdf` + `jspdf-autotable` já eram usados pela Auditoria.
- Layout do modal: corpo em `UiModalSection` (cards brancos) com grids `sm:grid-cols-2` e coluna
  fixa de avatar `md:grid-cols-[140px_1fr]`; altura controlada pelo `max-h-[75vh]` com rolagem
  interna do `UiModal`.

## 9. Vitrine `/design`

Duas demonstrações novas acompanham o kit alterado:

- **Seção 5 (Input):** card "MÁSCARA DE DIGITAÇÃO (MASK)" com campo CEP (`99999-999`) e telefone
  `((99) 99999-9999)`.
- **Seção 15 (Modal):** botão "Abrir modal filho" dentro do modal de cadastro → `UiModal xs` filho
  — `Escape` fecha só o filho, `Tab` circula só no filho e o pai mantém os campos intactos.

A seção **13. DataTable** continua sendo a referência da toolbar (busca + Filtros).

## 10. Especificações OpenSpec

Change `openspec/changes/gestao-usuarios-modal-cadastro` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `gestao-usuarios` | **MODIFIED** — gatilhos que antes avisavam por toast (Novo Usuário e Editar agora abrem o modal) e KPIs recalculando ao criar/editar; **ADDED** — os cinco blocos do modal, validação antes de gravar, gravação em memória/cancelar descarta e SMTP simulado |
| `design-system/modais` | **ADDED** — `Escape` fecha só o topo, armadilha de `Tab` restrita ao topo, fechar o topo restaura o foco no subjacente |

`design-system/layout-navigation` **não sofre delta** — declarar a rota desta tela é uso do
requisito existente. Após o archive, as deltas são sincronizadas para `openspec/specs/`.

## 11. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório).
- Smoke SSR da rota: `/admin/gestao-usuarios` responde 200 com shell, título "Gestão de Usuários",
  KPIs, coluna "Último acesso" e **sem** marcação de modal (ele só existe com `v-model` aberto).
- Checagem visual/CDP no dev server (`http://localhost:3000`):
  - **`/admin/gestao-usuarios`:** KPIs 16/13/3/4; "Relatórios" antes de "Novo Usuário"; 4 ações
    de linha; **"Novo Usuário" abre o modal vazio sem toast**, o **lápis abre preenchido**;
    validação (e-mail duplicado, senha curta, confirmação divergente, senha parcial na edição);
    estados do SMTP com porta `250` (Falha) e `587` (Conectado) + "Enviar teste" com toast;
    avatar com câmera empilhada (`Escape` fecha só a câmera); CEP com ícone → toast sem preencher;
    criar → Total 17, `Último acesso` `-`, toast de sucesso; editar → linha e "Última
    Atualização" novos; recarga → base de 16 restaurada; **6 toasts remanescentes** (Importar,
    Filtros, Convite, Bloquear, Excluir, CEP) sem modal; sem rolagem horizontal ≥1280px.
  - **`/design`:** máscara na seção 5 e modal filho na seção 15 (`Escape`/`Tab` só no filho).
  - **Regressão do kit empilhado:** Auditoria com Filtros e Detalhe intactos (modais de 1 nível).

## 12. Pendências e próximos passos

- **Importar em lote** (ícone `Import` da tabela) e **Filtros de perfil/status** (botão
  "Filtros") — hoje toast; a estrutura de filtros já existe no composable.
- **Ações de linha:** excluir, bloquear e enviar o convite seguem com toast (confirmação/modal
  próprio); reativar usuário e redefinir senha ainda não existem.
- **ViaCEP:** busca real de CEP no modal (hoje toast + preenchimento manual).
- **SMTP real:** trocar a simulação por conexão efetiva (hoje `setTimeout` + portas fixas).
- **Backend:** `server/` com endpoints de CRUD de `usuarios`, autenticação JWT e RBAC real
  (`requirePermission`, `docs/02` §3.5/§7) — a página troca o composable por dados reais sem
  mudar o contrato visual; modelar em `docs/02` os campos hoje só no `UsuarioDemo`.
- **Módulo Perfis (RBAC):** tela própria (item de navegação já reservado, ainda sem rota).
- **`UiMenu` no kit:** o mini-menu dos Relatórios duplica a mecânica Esc/clique-fora do menu da
  conta (mesma pendência do [`docs/05`](05%20-%20Gestão%20de%20Auditoria.md) §12).
