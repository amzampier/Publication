# Design

## Context

O projeto é Nuxt 4 + Vue 3 + Nitro, com Tailwind, MariaDB via `mysql2/promise` e kit próprio em
`app/components/ui`. A trilha de auditoria é gravada por `registrarAuditoria`; o histórico da esteira
por `historico_esteira_revisao`. As importações de chamadas/manuais/release/escopo abrem transação e
fazem inserts em loop, e as mídias usam um `INSERT` por URL. O editor rico é um componente
`.client.vue` importado diretamente por formulários de Chamadas. O layout admin carrega shell e
permissões em série.

Ver `proposal.md` para motivação. As regras de comportamento estão nos delta specs desta change.

## Goals / Non-Goals

**Goals:**

- Reduzir o custo do bundle inicial e o tempo de transação sem alterar contratos HTTP.
- Corrigir os achados Baixos de acessibilidade, contraste, textos, tokens e documentação.
- Tornar a trilha de auditoria e o histórico da esteira imutáveis no banco para DML comum.
- Manter a mudança reversível por migration e sem alteração de dados existentes.

**Non-Goals:**

- Novas features do roadmap (FULLTEXT, export streaming, headers/CSRF, rate limit persistente, CDN).
- Alterar o modelo de dados ou o contrato público das APIs.
- Refatorar o kit inteiro; apenas os pontos apontados no RL06.

## Decisions

### 1. TipTap sob demanda no ponto de uso

Usar `defineAsyncComponent`/componente `Lazy*` para o editor rico, mantendo o arquivo `.client.vue`
como fronteira de DOM. O formulário importa o wrapper lazy; o bundle do editor só é baixado quando o
modal de Chamadas é aberto. Alternativa descartada: mover o editor para outra rota, o que quebraria o
wizard.

### 2. Importações em lote com transação curta

Preparar os registros fora da transação, agrupar inserts em blocos (ex.: 100–200 linhas) e abrir a
transação apenas para a gravação. Para mídias, trocar `INSERT` por URL por um upsert multi-row
(`INSERT ... ON DUPLICATE KEY UPDATE` ou `VALUES` em lote), preservando a ordem de exibição. A
transação continua cobrindo o conjunto para manter atomicidade; o ganho vem de menos round-trips.
Alternativa descartada: uma transação por linha, que perde atomicidade.

### 3. Cache de SSR com TTL curto e single-flight

Criar cache em memória por processo para shell/configurações/opções, com TTL curto, chave por
tenant/config e single-flight para evitar fanout concorrente. Invalidar no `PUT /api/configuracoes`
e nas escritas que alteram opções (chamadas/release/manual/escopo). No layout, carregar shell e
permissões em paralelo. Nos handlers, reutilizar `event.context.sessaoUsuario` em vez de revalidar a
sessão em `/api/usuarios/eu`. Alternativa descartada: cache persistente compartilhado, que exigiria
nova infraestrutura e invalidação distribuída.

### 4. Acessibilidade e consistência pelo kit

A ação de ícone do `UiInput` passa a ser um botão nativo com `type="button"`, `aria-label`, foco
visível e teclado. Textos de apoio usam `slate-500/600` (nunca `slate-400` em conteúdo). Menus de
relatórios passam a consumir o `UiActionMenu` ou o mesmo contrato de teclado/foco. Cores de marca
usam classes de token; hex só permanece quando documentado como exceção.

### 5. Retenção explicada sem SQL como texto principal

O painel mantém o slider e a query dinâmica, mas o banner passa a exibir um resumo em linguagem
natural (“remove registros com mais de N dias”) e um detalhe técnico expansível/recolhido com o SQL.
A palavra “marcados” é substituída por “removidos”, alinhando UI, docs e comportamento real.

### 6. Imutabilidade no banco

Nova migration `32_rl06_3_imutabilidade.sql` cria gatilhos `BEFORE UPDATE`/`BEFORE DELETE` que
rejeitam alterações em `auditoria` e `historico_esteira_revisao` para o usuário da aplicação. O
expurgo da auditoria continua por um caminho privilegiado (evento/owner), documentado no rollback.
Complementarmente, `scripts/db-least-privilege.sql` remove `UPDATE`/`DELETE` dessas tabelas do grant
da aplicação. Alternativa descartada: apenas confiar em grants, que não cobrem todos os ambientes.

### 7. Documentação como parte do change

Atualizar contagens, faixa de seções, dica de upload, textos de retenção, `DB_TIMEZONE` e referências
de navegação junto com o código. A vitrine é a referência viva; o índice deve listar 1–27.

## Risks / Trade-offs

- **Lazy TipTap atrasa a abertura do editor** → exibir estado de carregamento no modal e manter o
  editor em chunk separado; medir o chunk da rota antes/depois.
- **Cache SSR pode servir dado velho** → TTL curto + invalidação explícita nas escritas; testes de
  salvar configuração e reentrar na tela.
- **Gatilhos podem bloquear operações legítimas** → cobrir inserts, expurgo e transições com testes;
  rollback documentado remove os gatilhos.
- **Lote grande aumenta memória** → chunks de 100–200 e limite de importação já existente.
- **Mudanças de texto podem quebrar testes de UI** → ajustar testes e manter chaves de tradução
  estáveis quando existirem.

## Migration Plan

1. Aplicar a migration 32 em ambiente de teste e validar inserts, expurgo e rejeição de
   `UPDATE`/`DELETE`.
2. Atualizar o grant de menor privilégio e reiniciar a aplicação.
3. Medir bundle e transações antes/depois; se necessário, reverter apenas o cache/lazy sem tocar no
   banco.
4. Rollback do banco: remover os gatilhos e restaurar os grants anteriores (documentado no SQL).
5. Nenhum dado existente é migrado; a migration é aditiva.

## Open Questions

Nenhuma pergunta pendente que altere specs, abordagem ou tarefas.
