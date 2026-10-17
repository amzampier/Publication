# RL05 — Varredura de UX / Responsividade

| Campo | Valor |
| :--- | :--- |
| **ID** | RL05-UX |
| **Especialista** | QA UX / Responsividade (`docs/qa/05-qa-ux.md`) |
| **Tipo** | Etapa 8 (testes de UX) — reauditoria do working tree atual |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md`, `docs/qa/05-qa-ux.md`, `openspec/specs/design-system/**`, `openspec/specs/vitrine/spec.md`, `docs/01 - design_system.md`, `docs/06` |
| **Data** | 17/10/2026 |
| **Escopo** | Área Pública (`/`) + Área Administrativa (shell, login/recuperação, primeiro acesso, gestão de usuários, perfis/RBAC, auditoria, configurações globais, segurança, meu perfil) + vitrine `/design` + UI kit `app/components/ui/` + página 404 |
| **Método** | Análise estática do código do working tree + leitura do SSR do dev server (`http://localhost:3000`) + comparação com a fonte da verdade |
| **Alterações de código** | **Nenhuma** — auditoria somente-leitura |
| **Veredito** | **APROVADO COM RESSALVAS** — 0 Críticos, 0 Altos; apenas Baixas e Melhorias |
| **Risco** | **Baixo** |

---

## 1. Resumo executivo

- **Status: APROVADO COM RESSALVAS.** A varredura de UX do working tree atual confirma que o núcleo de experiência está aderente à fonte da verdade: o **UI kit próprio** (`app/components/ui/`, 26 componentes, incluindo `UiModal`/`UiModalSection`) é o usado nas telas; os **toasts** operam via `useToast()` com as quatro variantes (`success | warning | danger | info`) e container global (`role="status"` + `aria-live="polite"` em `app/app.vue`); a **disciplina zero-pill** (badges `rounded-md`) é mantida; numéricos/códigos usam `JetBrains Mono` + `tabular-nums`; e a **distinção Área Pública × Área Administrativa** é evidente (layouts distintos).
- **Ressalvas (nenhuma Crítica/Alta):** resíduos de edição e divergências de fidelidade na **vitrine `/design`** (referência viva do sistema) e **artefato de texto técnico em telas do usuário**. São defeitos de polimento visual/clareza, sem impacto funcional, de segurança ou de fronteira de áreas.
- **Itens conhecidos confirmados e detalhados:** (a) lixo `7 x [Sucess]` na 1ª linha de `app/pages/design.vue`; (b) **2 divergências residuais na vitrine** — grafia "Successo" e ícone do gatilho *Warning* em verde; (c) **artefato de texto em outra tela** — rodapé de stack ("Nuxt 4 + Tailwind CSS") na página de erro/404, somado a textos de implementação expostos nas listagens.

### 1.1 Placar

| Severidade | Qtd | IDs |
| :--- | ---: | :--- |
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 0 | — |
| Baixa | 6 | RL05-UX-01 … RL05-UX-06 |
| Melhoria | 1 | RL05-UX-07 |

---

## 2. Cobertura executada

| Eixo | Situação |
| :--- | :--- |
| Clareza / consistência | Executado — texto de telas, rótulos e legendas |
| Feedback visual | Executado — toasts, loading, estados de erro/sucesso |
| Mensagens | Executado — erros, avisos e notas informativas |
| Loading | Executado — `UiLoading` e `:loading` de `UiButton` |
| Estados vazios | Executado — `UiDataTable`, `UiSelect`, notificações, upload |
| Erros | Executado — telas com estado de erro recuperável |
| Responsividade | Executado — tabelas `overflow-x-auto`, modal `max-h`, drawer `< lg`, cabeçalhos `flex-wrap` |
| Acessibilidade | Executado — foco visível, labels, ARIA, teclado |
| Navegação | Executado — shell, menu da conta, abas, âncoras |
| Uso do UI kit | Executado — `app/components/ui/*` nas telas e na vitrine |
| Tokens do design system | Executado — `docs/01` §2/§4 e specs `brand-tokens`/`form-control-states` |
| Área Pública × Área Administrativa | Executado — `/` (default) × `/admin/**` (admin) × `/design` (`layout:false`) |
| Verificação visual em navegador | Parcial — SSR do dev server; medições CDP pertencem ao RL01 |

---

## 3. Achados

### 3.1 Itens conhecidos (confirmados e detalhados)

#### RL05-UX-01 · Lixo `7 x [Sucess]` na 1ª linha da vitrine
- **Severidade:** Baixa · **Módulo:** Vitrine `/design`
- **Cenário:** abrir/inspecionar `app/pages/design.vue`.
- **Esperado:** arquivo SFC começando por `<script setup lang="ts">`.
- **Obtido:** `app/pages/design.vue:1` = `7 x [Sucess] <script setup lang="ts">` — resíduo de edição antes do bloco de script.
- **Evidências:** `app/pages/design.vue:1`; bytes `37 20 78 20 5B 53 75 63 65 73 73 5D 20`; `GET /design` → 200 (o Vue SFC ignora o texto solto — a string **não** é renderizada no HTML: busca por `[Sucess]` no SSR = 0).
- **Impacto:** poluição do código-fonte da vitrine (referência viva); risco de quebra de ferramentas de parse/format e de diffs ruidosos. Sem impacto visual.
- **Correção recomendada:** remover o prefixo, deixando a linha 1 como `<script setup lang="ts">`.

#### RL05-UX-02 · Grafia incorreta "Successo" na vitrine (divergência residual 1/2)
- **Severidade:** Baixa · **Módulo:** Vitrine `/design` (seção 8 — Toasts)
- **Cenário:** exibir a demo de toast de sucesso / acionar o botão "Disparar Success".
- **Esperado:** rótulo em português correto — "Sucesso" (spec `vitrine`: rótulos grafados corretamente).
- **Obtido:** "Operação Concluída com **Successo**" (grafia errada) no cartão-demo e no título do toast disparado.
- **Evidências:** `app/pages/design.vue:1320` e `app/pages/design.vue:1422`; SSR de `/design` renderiza "Opera\u00e7\u00e3o Conclu\u00edda com Successo".
- **Impacto:** a vitrine é a referência viva do sistema; ensina um rótulo errado. `git diff` indica regressão introduzida por substituição `Sucesso` → `Successo` (junto do ajuste `Sucess` → `Success`).
- **Correção recomendada:** trocar "Successo" por "Sucesso" nas duas ocorrências.

#### RL05-UX-03 · Gatilho *Warning* em verde na vitrine (divergência residual 2/2)
- **Severidade:** Baixa · **Módulo:** Vitrine `/design` (seção 8 — Toasts)
- **Cenário:** comparar a demo de *warning* com o `ToastContainer` real.
- **Esperado:** mesma identidade visual da variante `warning` do componente real (laranja — `orange-700`).
- **Obtido:** o cartão-demo foi corrigido para laranja, mas o ícone do botão **"Disparar Warning"** continua verde: `text-lime-700`.
- **Evidências:** `app/pages/design.vue:1432` (`<AlertTriangle class="h-3.5 w-3.5 text-lime-700" />`) × `app/components/ui/ToastContainer.vue:23-29` (warning = `orange-*`).
- **Impacto:** divergência residual da demo frente ao componente real; a spec `vitrine` exige que as demos espelhem o componente ("sem variações de cor indevidas").
- **Correção recomendada:** usar `text-orange-700` no ícone do gatilho, alinhado ao cartão e ao componente.

#### RL05-UX-04 · Artefato de texto em outra tela — rodapé de stack na página de erro/404
- **Severidade:** Baixa · **Módulo:** Página de erro (404) / clareza
- **Cenário:** abrir uma rota inexistente (`/rota-inexistente`) e observar o rodapé do card.
- **Esperado:** página de erro em pt-BR com identidade institucional, sem detalhes de implementação.
- **Obtido:** rodapé exibe "**Publications Design System · Nuxt 4 + Tailwind CSS**" — texto de desenvolvedor/framework em tela do usuário final.
- **Evidências:** `app/error.vue:53` (renderizado na 404).
- **Impacto:** exposição de stack tecnológica ao usuário final; fere clareza e a regra de não expor detalhes técnicos (`docs/qa/05`).
- **Correção recomendada:** substituir por texto institucional (ex.: "Publications · Dicas Teorema") ou remover o rodapé.

### 3.2 Achados adicionais

#### RL05-UX-05 · Default do `UiUploadFiles` ainda anuncia SVG
- **Severidade:** Baixa · **Módulo:** UI kit / Uploads
- **Cenário:** consumir `UiUploadFiles` sem passar `dica`.
- **Esperado:** formatos realmente aceitos (o servidor rejeita SVG).
- **Obtido:** default `dica: 'PNG, JPG ou SVG'` (resíduo do RL04-B-01, corrigido apenas na vitrine e em `AbaLogomarcas`).
- **Evidências:** `app/components/ui/UploadFiles.vue:25`; todas as chamadas atuais passam `dica`, então o defeito é latente (não aparece hoje).
- **Impacto:** futura tela que usar o default anunciará um formato inválido.
- **Correção recomendada:** default `'PNG, JPG, WebP ou GIF'`, igual ao adotado nas telas.

#### RL05-UX-06 · Textos técnicos/de implementação expostos em telas reais
- **Severidade:** Baixa · **Módulo:** Gestão de Usuários / Perfis / Auditoria / Segurança / Meu Perfil
- **Cenário:** abrir as listagens administrativas e a aba E-mail.
- **Esperado:** linguagem de negócio; sem jargão de implementação (`docs/qa/05`: mensagens não expõem detalhes técnicos).
- **Obtido:** subtítulos e notas técnicas visíveis — "Dados persistidos via API (MariaDB)" (Usuários e Perfis), "registros persistidos no banco" (Auditoria), "RATE LIMIT DA API" (Configurações › Segurança) e nota "são simulados nesta fase — nenhuma requisição é feita..." (Meu Perfil › E-mail).
- **Evidências:** `app/components/usuarios/Tabela.vue:50`; `app/components/perfis/Tabela.vue:36`; `app/components/auditoria/Tabela.vue:43`; `app/components/configuracoes/AbaSeguranca.vue:353`; `app/components/perfil/AbaEmail.vue:51`.
- **Impacto:** ruído de implementação na leitura do operador; baixo, mas destoa da clareza esperada.
- **Correção recomendada:** reescrever em linguagem de negócio (ex.: "Dados atualizados em tempo real", "Ordem: mais recentes primeiro").

#### RL05-UX-07 · Tons residuais divergentes nas demos de toast da vitrine
- **Severidade:** Melhoria · **Módulo:** Vitrine `/design` (seção 8 — Toasts)
- **Cenário:** comparar cartão-demo de sucesso/info com o `ToastContainer` real.
- **Esperado:** mesmos tokens do componente (barra `*-500`, texto do badge `*-700`).
- **Obtido:** `border-b-emerald-400`/`text-emerald-600` (sucesso) e `border-b-sky-400`/`text-sky-600` (info), enquanto o componente real usa `emerald-500`/`emerald-700` e `sky-500`/`sky-700`.
- **Evidências:** `app/pages/design.vue:1313,1317,1388,1392` × `app/components/ui/ToastContainer.vue:16-44`.
- **Impacto:** diferença sutil de tom na vitrine; sem impacto funcional.
- **Correção recomendada:** alinhar os tons aos do `ToastContainer`.

---

## 4. Pontos conformes (não exigem ação)

- **UI kit próprio:** 26 componentes em `app/components/ui/` (inclui `UiModal`/`UiModalSection`); telas usam o kit; a seção 8 da vitrine não usa `<input>/<select>/<button>` nativos (0 ocorrências no intervalo analisado).
- **Toasts:** `useToast()` com `success | warning | danger | info` (`app/composables/useToast.ts:3`); container global em `app/app.vue:7` com `role="status"`/`aria-live="polite"` (`ToastContainer.vue:92-93`).
- **Zero-pill:** `UiBadge` usa `rounded-md`; `rounded-full` aparece apenas em dots/avatares/previews circulares.
- **Numéricos e códigos:** `tabular-nums` presente (26 ocorrências) e `Kpi`/colunas numéricas em `font-mono`.
- **Foco e erro canônicos:** `focus-visible:outline-brand-focus` nos controles secundários (toast, calendário, limpar de Select/DatePicker, "Copiar HEX"); erro em `rose-700` com recorte `.ds-bottom-clip`.
- **Acessibilidade:** nomes acessíveis em `UiSelect` sem label, `CheckCard` e checkboxes da importação; menus do header com `role="menu"`, setas/Home/End e fechamento por `focusout`; drawer com backdrop abaixo de `lg`.
- **Estados vazios e de erro:** `UiDataTable` distingue "base vazia" de "filtro sem resultado"; Meu Perfil tem estado de erro com "Tentar novamente"; exportações (CSV/PDF) têm toast e loading.
- **Distinção de áreas:** `/` (layout default, "Área Pública"), `/admin/**` (layout admin, shell header+sidebar) e `/design` (`layout:false`).
- **Responsividade:** `UiDataTable` com `overflow-x-auto`, `UiModal` com `max-h-[calc(100vh-2rem)]` e larguras por `size`, cabeçalhos de tela com `flex-wrap`.

---

## 5. Escopos não aplicáveis

| Escopo | Motivo |
| :--- | :--- |
| Status de publicação → variante `Badge` (listagem × detalhe × Área Pública) | Módulos de publicação (Release Week, Manuais, Escopo) ainda não construídos |
| Conteúdo público | Apenas placeholder `app/pages/index.vue` (roadmap) |
| Soft delete / confirmação de operações destrutivas de publicação | Não previsto no domínio |
| Envio real de e-mail (Resend) | Validado por código, não exercido |
| Medições de contraste/overflow em navegador (CDP) | Pertencem ao RL01; aqui a verificação foi estática + SSR |

---

## 6. Matriz de aprovação

| Critério | Situação |
| :--- | :--- |
| Sem bugs críticos | OK |
| Sem bugs altos | OK |
| Regressão | Sem regressão de UX confirmada (apenas resíduos de polimento) |
| Permissões/fronteira de áreas | OK (fora do escopo de UX; nenhuma exposição visual indevida) |
| Consistência visual / kit / tokens | OK com ressalvas da vitrine (RL05-UX-02/03/07) |

### VEREDITO: APROVADO COM RESSALVAS — Risco Baixo

Nenhum arquivo de código foi alterado por esta auditoria; nenhuma escrita de dados foi executada.