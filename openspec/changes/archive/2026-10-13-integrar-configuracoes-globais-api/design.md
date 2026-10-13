# Design

## Context

O frontend de Configurações Globais está completo mas em memória (fase 1): `salvar()` só mostra toast, logos/sidebar/retenção vivem em `useState` composables e o banco `configuracoes_globais` (linha `config_default`, seedada pela change `criar-migration-nitro`) está ocioso. Não existe `server/api/` no projeto — esta change cria a primeira API e a infra compartilhada (`useApiFetch`, uploads). Ver proposal.md para motivação e specs/ para os requisitos.

## Goals / Non-Goals

**Goals:**
- Persistência real de Configurações Globais (retenção, logos, sessões da sidebar) via `GET`/`PUT /api/configuracoes`.
- Serviço de uploads reutilizável (`POST /api/uploads` → `uploads/<pasta>/`, servido em runtime) — pronto para avatares na change de Meu Perfil/Usuários.
- Camada de chamada de API no frontend (`useApiFetch`) que os próximos módulos reutilizam.

**Non-Goals:**
- Auth/RBAC no server (guard real, JWT, sessões) — change de auth; nesta fase os endpoints ficam abertos e a proteção é o middleware do frontend.
- Auto-refresh de token no `useApiFetch` (401 → `/api/auth/refresh`) — depende do JWT.
- Painéis novos na tela (banner, nome_empresa, exigir_revisao) — campos expostos pela API, UI futura.
- Wire real da aba Segurança (rate limit / `ips_bloqueados`) — permanece demo.
- Validação com Zod — adiado para a change de auth/validation (uma mudança de dependência não vale para 2 endpoints).

## Decisions

1. **`useApiFetch` em versão mínima.** Wrapper do `$fetch` com `credentials: 'include'` + headers `x-usuario-id`/`x-usuario-nome` lidos de `useState('auth-usuario')` (docs/02 §5.2). Sem o catch de 401/refresh — trecho documentado no docs/02 mas morto até o JWT existir. Alternativa descartada: chamar `$fetch` cru nos componentes (os headers de auditoria e o ponto único de evolução se perderiam).

2. **Serving de uploads via `nitro.publicAssets`.** `uploads/` na raiz do projeto (gitignored) registrada em `nuxt.config.ts` como `nitro.publicAssets: [{ baseURL: '/uploads', dir: '<rootDir>/uploads' }]` — o Nitro lê do disco em runtime, funcionando igual em dev e produção. Alternativa descartada: `public/uploads/` — `public/` é copiada no build; uploads em runtime não aparecem em `.output/` sem cópia manual. Cache: sem `maxAge` longo (logo substituída deve aparecer sem hard refresh agressivo).

3. **Subpastas por finalidade com whitelist.** Destinos aceitos: `logomarcas` e `avatares` (constante no handler). Qualquer outro destino → 400. Nome do arquivo: sanitizado (espaços → `-`, removidos `/`, `\`, `..`); colisão de nome ganha sufixo `-1`, `-2` (loop com `existsSync`). Sem timestamp no nome — o caminho no campo continua legível e coerente com o formato `/uploads/<pasta>/<nome>` da spec. Diretórios criados no boot (plugin ou no primeiro upload, `mkdir recursive`).

4. **PUT parcial por colunas editadas.** `PUT /api/configuracoes` aceita JSON `{ dias_retencao_auditoria, logo_header_url, logo_login_url, sidebar_grupos, sidebar_expandida }` e atualiza **só essas 5 colunas** de `config_default`; `GET` devolve a linha inteira (todos os campos, inclusive `nome_empresa`/`banner_*` sem UI). A coluna `sidebar_expandida` (TINYINT 1/0, default 1) foi criada pela migration `03_add_sidebar_expandida.sql` — a persistência do expandir/recolher a sidebar do shell é requisito do usuário (fix pós-implantação). Validação manual no handler: retenção inteiro 30–730, URLs string ≤ 500, `sidebar_grupos` objeto booleano com as 4 chaves canônicas, `sidebar_expandida` booleano.

5. **Mapeamento sidebar labels ↔ chaves do banco.** `app/config/sidebar-keys.ts` com os pares `publicacoes↔Publicações`, `movimentos↔Movimentos`, `cadastros↔Cadastros`, `administracao↔Administração`. UI continua com labels (nada muda visualmente); hidratação converte chaves do JSON do banco em estado por label; save converte de volta. Alternativa descartada: migrar a UI para chaves snake_case (quebra os labels visíveis e o `useSessoesAbertas` consumido pelo shell).

6. **Hidratação no nível do shell + página, compartilhada.** `carregarConfiguracoesGlobais()` (novo composable) faz o `GET /api/configuracoes` e aplica tudo no estado compartilhado: logos, `useSidebarExpandida` (+ `preferenciaManual` para a viewport não sobrescrever), `useSessoesAbertas`. O **layout admin** chama no `onMounted` — assim as preferências valem em qualquer rota da Área Administrativa (fix: antes só valiam na página de Configurações, e o shell reabria expandida a cada F5/rota). A página reusa o mesmo composable (idempotente) e zera `alterado` após hidratar. `AbaLogomarcas` mantém refs locais espelhando os composables — watch `immediate` global→local sincroniza quando o GET completar; um flag `sincronizandoDoServidor` suprime o `change` durante a sincronização (hidratação não habilita o Salvar). Falha do GET → defaults do seed, tela utilizável (spec).

7. **Upload acontece no momento da seleção do arquivo, não no Salvar.** `AbaLogomarcas` envia `FormData` (`file` + `pasta=logomarcas`) ao `POST /api/uploads` quando o usuário escolhe a imagem; a URL retornada alimenta o campo de caminho. O campo fica **desabilitado sempre que o valor veio do servidor** (upload ou hidratação — pedido do usuário pós-implantação) e editável apenas quando vazio (digitação manual). O `PUT` do Salvar grava apenas os caminhos. Rationale: erros de upload aparecem no momento certo; o Salvar fica leve. Trade-off aceito: arquivo enviado e nunca salvo (ou logo substituída) fica órfão em `uploads/` — limpeza futura, sem impacto funcional.

8. **Limites de upload no handler.** 5 MB, MIME whitelist (png/jpeg/webp/gif) checados no server (`readMultipartFormData` do Nitro traz o buffer inteiro — suficiente para logos/avatars; uploads grandes de manuais no futuro exigirão streaming, fora do escopo).

## Risks / Trade-offs

- **Endpoints abertos sem autenticação** → qualquer cliente que alcance o servidor lê/escreve config e sobe arquivos. Mitigação: middleware do frontend protege as rotas `/admin/**`; dev em localhost; a change de auth deve entrar antes de qualquer exposição em produção (registrado aqui como pré-condição de deploy).
- **Arquivos órfãos em `uploads/`** (upload feito e descartado, logo substituída) → disco cresce. Mitigação: aceito nesta fase; limpeza/agendamento futuro.
- **Buffer inteiro na memória por upload** (5 MB) → ok para o caso de uso; se o limite subir muito, reconsiderar streaming.
- **`sidebar_grupos` pode vir malformado do banco** (JSON inválido/parcial) → hidratação valida as 4 chaves e cai para o default individual da chave faltante.
- **Nome de arquivo colidindo** → sufixo incremental; sem sobrescrita silenciosa.

## Migration Plan

1. Deploy = subir o código; `uploads/` e subpastas são criadas no boot/primeiro uso. Nenhuma migration de banco (colunas já existem).
2. Verificação: carregar a página (hidrata), alterar retenção/logo/sidebar, Salvar, recarregar (persiste), subir uma imagem e acessar a URL `/uploads/logomarcas/<nome>`.
3. Rollback = reverter o commit; colunas do banco ficam simplesmente sem consumo (nenhum dado é perdido; arquivos em `uploads/` são ignorados).
