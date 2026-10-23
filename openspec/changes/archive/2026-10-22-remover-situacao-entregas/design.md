# Design

## Context

See `proposal.md` — Why. O campo `entregas_itens.situacao` existe desde a migration `01` e tem três
valores (`Desenvolvimento`, `Homologação`, `Implantado`), mas nunca teve edição na UI: o formulário
não o expõe, a importação grava `Desenvolvimento` e o fluxo real usa `status`. A leitura aparece em
três lugares independentes: modelo de Lançar as Chamadas, expansão de itens de Release/Manual/Escopo
e detalhe da Esteira. O runner de migrations aplica arquivos novos no boot e tolera apenas erros
idempotentes de criação (1050/1060/1061/1062); `DROP COLUMN` sem `IF EXISTS` falharia em reexecução
ou em base onde a coluna já foi removida manualmente.

## Goals / Non-Goals

**Goals:**
- Remover a coluna e o índice do schema sem deixar drift entre `server/migration/` e `docs/bd/01`.
- Remover o campo de todos os contratos de leitura/escrita e de toda a UI.
- Manter a remoção idempotente, auditável e reversível por rollback documentado.

**Non-Goals:**
- Renomear ou substituir `status`/`situacao` por um novo campo de workflow.
- Alterar `usuarios.situacao`, `perfis_acesso.situacao`, `parceiros.situacao` ou
  `softwares.situacao`.
- Migrar ou reinterpretar valores históricos: a auditoria prévia comprova que só existe o default.
- Reescrever a migration `01` já aplicada.

## Decisions

### D1 — Remover a coluna de verdade, não apenas ignorá-la no código
Alternativas: (a) manter a coluna e só parar de ler/escrever; (b) renomear para
`situacao_legado`; (c) remover com `DROP COLUMN`.

Escolha: (c). A coluna não tem semântica, não é editável e não alimenta nenhum indicador; mantê-la
seria drift permanente e tentaria futuros desenvolvedores a reutilizá-la. A remoção é registrada na
spec `migracoes-banco` como exceção estreita, com auditoria prévia e rollback.

### D2 — Migration nova, idempotente e sem tocar a 01
`server/migration/28_remover_situacao_entregas.sql` executa
`ALTER TABLE entregas_itens DROP COLUMN IF EXISTS situacao`. O índice `idx_entregas_situacao` cai
junto com a coluna no MariaDB; o rollback comentado recria a coluna com o ENUM original, o `AFTER
impacto` e o índice. A migration `01` permanece intacta porque já foi aplicada em bases existentes;
uma base nova cria a coluna na 01 e a remove na 28, convergindo para o mesmo schema final.

### D3 — Auditoria prévia obrigatória
Antes do deploy, a consulta
`SELECT situacao, COUNT(*) FROM entregas_itens GROUP BY situacao` deve retornar apenas
`Desenvolvimento`. Se houver qualquer outro valor, a remoção para e o caso é tratado manualmente.
Isso evita perda silenciosa de um valor que, embora não editável pela UI, poderia ter sido gravado
por acesso direto ao banco. A auditoria é operacional (documentada na change), não uma trava de boot:
depois da 28 a coluna não existe mais e a checagem seria inútil.

### D4 — Contrato de API tolerante à entrada legada
Os payloads de criação/edição deixam de declarar e validar `situacao`. Se um cliente antigo ainda
enviar o campo, ele é ignorado (não gera `400`), porque o valor não tem efeito de negócio. As
respostas deixam de devolver o campo. Alternativa descartada: rejeitar o campo com `400`, o que
quebraria integrações sem ganho.

### D5 — Remoção em camadas, do contrato para fora
Ordem: `shared/` (tipos, validação, filtros) → `server/utils/` (SELECT, mapeamento, INSERT/UPDATE) →
`app/` (filtros, formulário, tabelas, detalhe) → testes → docs. Isso mantém o typecheck como guia:
cada camada removida acusa os usos restantes na seguinte. No servidor, a remoção de `situacao` do
`SQL_INSERT`, do `UPDATE` e dos arrays posicionais exige reconferir a ordem dos demais parâmetros;
os testes de API/E2E cobrem criação, edição e importação.

### D6 — Escopo restrito à tabela `entregas_itens`
`situacao` em usuários, perfis, parceiros e softwares é comportamento vigente e permanece. A change
toca apenas o modelo de item/chamada e as listagens que o projetam.

### D7 — Documentação alinhada ao schema final
`docs/bd/01` (referência humana) passa a mostrar `entregas_itens` sem a coluna e sem
`idx_entregas_situacao`; `docs/02` §4.5 ganha a exceção de coluna obsoleta; `docs/12`–`docs/16`
perdem a coluna Situação das listagens/filtros/importação. A migration `01` não é reescrita.

## Risks / Trade-offs

- **Perda de valores não default** → auditoria prévia obrigatória; se houver, a migration não é
  aplicada e o caso é tratado manualmente.
- **Erro posicional no INSERT/UPDATE** ao remover uma coluna do meio → revisão dos arrays e testes de
  criação/edição/importação; o `typecheck` também acusa divergência de tipos.
- **Cliente antigo enviando `situacao`** → campo ignorado; nenhuma resposta muda além da ausência do
  campo.
- **Drift entre `docs/bd/01` e a 01** → a referência humana reflete o schema final; o comentário da 01
  continua sendo o registro histórico da criação.
- **Reexecução da 28** → `IF EXISTS` + `_migrations` mantêm o boot idempotente.

## Migration Plan

1. Rodar a auditoria prévia e confirmar que só existe `Desenvolvimento`.
2. Deploy: o boot executa a 28; conferir `_migrations` e a ausência da coluna/índice.
3. Verificar criação, edição, importação, expansão de itens e detalhe da esteira.
4. Rollback manual: recriar a coluna e o índice pelo bloco comentado da 28 e remover o registro
   `DELETE FROM _migrations WHERE nome = '28_remover_situacao_entregas.sql'`.
