# Proposal

## Why

`entregas_itens.situacao` (`Desenvolvimento` | `Homologação` | `Implantado`) nunca foi editável: o
formulário não expõe o campo, a importação sempre grava `Desenvolvimento` e o fluxo real é
representado por `status` (`Revisar` → `Aprovado` → `Publicar`, com `Recusado`). O campo virou peso
morto no schema, no modelo compartilhado, nas listagens de itens e na UI — e o Painel Executivo v1
não pode depender de um indicador sem semântica.

## What Changes

- **BREAKING** — remove a coluna `entregas_itens.situacao` e o índice `idx_entregas_situacao` do
  banco, via migration nova e idempotente.
- Remove o tipo `SituacaoChamada`/`SituacaoItem`, a validação, o filtro, o formulário, o payload e o
  mapeamento de leitura de `entregas_itens` em Lançar as Chamadas.
- Remove a coluna **Situação** das listagens de itens expandidos de Release Week, Manuais e Escopo de
  Projetos, e do detalhe da Esteira de Revisão.
- Atualiza as specs, a documentação dos módulos (`docs/12`–`docs/16`), a referência `docs/bd/01` e a
  convenção de migrations (`docs/02` §4.5).
- Registra na spec `migracoes-banco` a exceção estreita que permite remover uma coluna explicitamente
  obsoleta, com auditoria prévia e rollback documentado.
- **Não** altera as colunas homônimas ainda em uso: `usuarios.situacao`, `perfis_acesso.situacao`,
  `parceiros.situacao` e `softwares.situacao`.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `lancar-chamadas`: o modelo, a validação, os filtros e a importação deixam de expor/gravar
  `situacao`; o formulário e os detalhes não exibem mais o campo.
- `release-week`: a expansão de itens da release deixa de exibir a coluna Situação.
- `manuais-mensais`: a expansão de itens do manual deixa de exibir a coluna Situação.
- `escopo-projetos`: a expansão de itens do escopo deixa de exibir a coluna Situação.
- `esteira-revisao`: o detalhe da chamada deixa de exibir Situação na classificação.
- `migracoes-banco`: a regra de migrations não destrutivas ganha a exceção para remoção de coluna
  obsoleta comprovadamente sem uso.

## Impact

- **Banco:** nova migration `server/migration/28_remover_situacao_entregas.sql`; sem edição da
  migration `01` já aplicada. `docs/bd/01` passa a refletir o schema final.
- **Shared:** `shared/lancar-chamadas.ts`, `shared/release-week.ts`, `shared/manuais.ts`,
  `shared/escopo-projetos.ts`.
- **Server:** `server/utils/lancar-chamadas.ts`, `server/utils/release-week.ts`,
  `server/utils/manuais.ts`, `server/utils/escopo-projetos.ts`; a Esteira herda o modelo enxuto.
- **App:** `app/components/lancar-chamadas/{Filtros,Formulario,Tabela,useLancarChamadasModelo}`,
  `app/components/esteira/{Detalhe,useEsteiraRevisaoModelo}`,
  `app/components/{release-week,manuais,escopo-projetos}/Itens.vue`.
- **Testes:** fixtures e casos de `lancar-chamadas-validadores`, `esteira-revisao-validadores`,
  `release-week-validadores` e `manuais-validadores`.
- **Docs:** `docs/02` §4.5, `docs/12`–`docs/16`, `docs/bd/01`.
- **API:** os payloads de Lançar as Chamadas deixam de aceitar `situacao`; as leituras deixam de
  devolver o campo. Clientes que ainda enviarem o campo têm o valor ignorado.
- **Dependências:** nenhuma nova.
