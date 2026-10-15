# Design

## Context

- `ConfigSmtpUsuario` (`app/components/usuarios/useUsuariosDemo.ts:25-33`) carrega `status: StatusSmtp` junto dos dados; o comentário do tipo `StatusSmtp` (linha 10-11) já declara o campo "efêmero, não persiste".
- A API (`montarUsuario`, `server/utils/usuarios.ts:106-113`) devolve `smtp` **sem** `status`; `normalizarSmtp` (escrita) só lê `email/senha/provedor/servidor/porta/seguranca` — o campo nunca existiu no contrato de rede.
- Donos do bloco `UsuariosCamposSmtp`: o modal (`Formulario.vue:510`) e a aba E-mail do perfil (`AbaEmail.vue:42`). O modal clona com workaround `smtp: { ...u.smtp, status: 'nao-testado' }` (`Formulario.vue:81`); o perfil clona sem (`meu-perfil.vue:65`).
- O crash: `CamposSmtp.vue:150` `SMTP_POR_STATUS[interno.status]` com `status === undefined` → `undefined` → template `statusSmtp.variant` (linha 230) → `TypeError` no render → painel em branco; o erro não tratado deixa o vdom do slot fora de sincronia, explicando o segundo sintoma (voltar de aba também fica vazio).
- `CamposSmtp` já é o dono de facto da máquina de estados (watchers de porta sugerida, reset e teste simulado de 1.200 ms); o `status` no objeto do pai é hoje apenas um espelho que o componente lê e escreve.
- Conforme proposal.md: nenhuma spec muda — specs `meu-perfil` e `gestao-usuarios` já descrevem o comportamento visível alvo.

## Goals / Non-Goals

**Goals:**
- `ConfigSmtpUsuario` como modelo de dados puro (persistíveis), sem campos de UI.
- `CamposSmtp` como dono único e exclusivo do `status` efêmero — imune a donos que esqueçam de injetá-lo.
- Fechar o bug da aba E-mail do Meu Perfil por construção (não por workaround).
- Preservar 100% do comportamento visível especificado (reset, porta sugerida, teste simulado, badge, "Enviar teste" só com "Conectado").

**Non-Goals:**
- Alterar specs, servidor, migrations, tokens ou o contrato de rede (PATCH/PUT/POST já ignoravam o campo).
- Redesenhar a máquina de estados do SMTP (timer, portas válidas, variantes do badge permanecem).
- Mexer em outros campos do perfil ou do modal (endereço, dados pessoais, segurança).

## Decisions

### D1 — Extração do estado: `status` como `ref` interno do `CamposSmtp`

- `const status = ref<StatusSmtp>('nao-testado')` no componente; `statusSmtp = computed(() => SMTP_POR_STATUS[status.value])` — índice sobre valor **sempre definido**, o `undefined` torna-se impossível.
- Escritas no ref: (a) watcher de troca externa do objeto (`props.modelValue`, com a guarda `novo === ultimoEmitido` já existente) reseta para `'nao-testado'` — antes esse reset dependia do objeto de fora carregar o campo, que era exatamente a fonte do bug; (b) watcher de edição de campos zera o status (mesma lógica de hoje); (c) `testarConexao`/timeout escrevem `'testando'`/`'conectado'`/`'falha'`.
- O `watch(interno, { deep })` de emissão passa a emitir **só dados** — mutações de status não disparam mais `update:modelValue` (hoje um teste em andamento vazava `'testando'` para o rascunho do pai).
- **Alternativa descartada — fallback defensivo (`?? SMTP_POR_STATUS['nao-testado']`):** trata o sintoma mantendo o modelo ambíguo; com D1 o dono não precisa conhecer o campo.

### D2 — Tipo e factory de dados limpos

- `ConfigSmtpUsuario` perde `status`; `smtpVazio()` perde a inicialização do campo. `StatusSmtp` permanece exportado (é o domínio do ref de D1).
- `Formulario.vue:81`: `smtp: { ...u.smtp, status: 'nao-testado' }` → `smtp: { ...u.smtp }` — workaround removido; o rascunho do modal deixa de carregar um campo que a API nunca devolve.
- `meu-perfil.vue` e `AbaEmail.vue`: **nenhuma edição de código** — `clonar()` com `{ ...u.smtp }` fica correto por construção (D2 é o que faz o fix ser estrutural e não uma cópia de workaround).

### D3 — Compatibilidade de rede e de estado intermediário

- Corpo do PATCH `/api/usuarios/eu` e do POST/PUT `/api/usuarios`: o `smtp` enviado deixa de conter `status` (que antes podia viajar após um teste/editação). O servidor já ignorava o campo — zero mudança de contrato efetiva; o corpo só fica limpo.
- Troca de aba no perfil desmonta o `CamposSmtp` (v-if) e o status efêmero morre com ele — ao reabrir a aba, `'nao-testado'` de novo: mesmo comportamento de hoje (o objeto clonado do registro também trazia sempre reset).
- Modal: abrir para edição de usuário existente inicia "Não testado" (hoje por injeção manual, depois por estado interno) — mesmo resultado observável.

### D4 — Conformidade sem delta de spec; docs só se mencionarem o modelo

- Specs `meu-perfil` ("Alterar campo zera o status", "Teste simulado com porta válida conecta", badge) e `gestao-usuarios` (mesmos cenários no modal) descrevem comportamento **visível**, preservado integralmente. `skip_specs: true`.
- `docs/06`/`docs/09`: verificar menções; o comportamento documentado (reset, teste simulado) não muda — só mexer se algum texto tratar `status` como parte do objeto de dados persistido.

## Risks / Trade-offs

- **[R1] Sutileza do eco v-model:** a guarda `novo === ultimoEmitido` continua necessária e permanece válida — o pai grava a referência emitida (agora sem status) e o watcher externo a ignora. Verificar em dev que iniciar um teste **não** habilita o "Salvar alterações" do perfil/modal (comportamento novo correto; antes o eco podia setar `alterado`).
- **[R2] Regressão no modal (outro consumidor):** bateria manual dedica task ao bloco SMTP do modal (abrir edição, testar conexão, salvar) — o modal é o consumidor maduro; qualquer divergência aparece rápido.
- **[R3] Esquecimento de future field de UI no mesmo tipo:** risco aceito e reduzido — o comentário em `StatusSmtp`/no ref orienta donos; se um dia outro campo efêmero surgir, o padrão estabelecido é estado interno do componente (D1).
- **[R4] Typecheck opcional (`npx nuxt typecheck`):** não há checker instalado no repo; a build (`npm run build`) não valida tipos de template. Mitigação: a bateria manual + cuidado nas edições; instalar `vue-tsc` é decisão futura, fora do escopo.

## Migration Plan

Front puro, sem migrations, flags ou mudança de API. Entrega em commit único, revertível por `git revert`. Rollback = revert + redeploy.

## Open Questions

_Nenhuma — o caminho está fechado pela exploração (causa-raiz confirmada no código, donos mapeados, workaround identificado); nenhum ponto aberto muda escopo, specs ou o breakdown._
