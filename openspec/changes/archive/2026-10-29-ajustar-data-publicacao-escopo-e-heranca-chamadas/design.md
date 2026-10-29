# Design

## Context

See `proposal.md` for motivation. O estado atual que molda a solução:

- A validação compartilhada de Chamadas importa `dataPublicacaoValida` de `shared/feriados.ts` e aplica a regra de segunda-feira/próximo dia útil à `dataLiberacao` (`shared/lancar-chamadas.ts:458-463`).
- A aprovação repete a regra ao herdar a data do pai e considera apenas a primeira data não nula do `COALESCE(release, manual, projeto)` (`server/utils/lancar-chamadas.ts:1082-1100`).
- A criação e a importação derivam `dataLiberacao` apenas da Release (`server/utils/lancar-chamadas.ts:687-689` e `:1322-1324`), e o preview do XLSX faz o mesmo (`app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts:145-147`).
- Os catálogos remotos não expõem `data_publicacao` de projetos/manuais (`server/utils/opcoes-chamadas.ts:51-76`, `server/utils/lancar-chamadas.ts:493-538`), então o formulário não tem como preencher a data.
- O campo **Data de liberação** é somente leitura no formulário; só a Release tem handler de preenchimento (`app/components/lancar-chamadas/Formulario.vue:311-318`, `:625-634`).
- O Escopo de Projetos já aceita qualquer data civil em `data_publicacao`; o Manual também não tem regra de dia. A Release Week mantém a regra de segunda-feira e não será alterada.
- `projetos_escopo.data_publicacao` e `entregas_itens.data_liberacao` já são `DATE`; não há mudança de schema.

## Goals / Non-Goals

**Goals:**

- Alinhar a Data de liberação da Chamada ao contrato de datas do Escopo e do Manual.
- Preencher a Data de liberação a partir do vínculo escolhido, com precedência estável entre UI, create, importação e aprovação.
- Travar por teste/documentação que o Escopo aceita qualquer dia.

**Non-Goals:**

- Alterar a regra de segunda-feira da Release Week.
- Tornar a Data de liberação editável manualmente.
- Alterar a visibilidade pública (`publicado_em`) ou a cascata de publicação pai→filhos.
- Recalcular retroativamente datas de chamadas existentes.

## Decisions

### 1. Remover a regra de dia da semana apenas da Chamada

`dataLiberacao` passa a validar somente data civil válida, como `dataLancamento`. A regra de segunda-feira continua em `dataPublicacaoValida` e no módulo Release Week.

**Alternativas:** validar a regra só quando a data é digitada e relaxar na herança. Rejeitada porque o campo é somente leitura e a origem da data não é rastreável na validação; além disso, Manual e Escopo já produzem datas arbitrárias, então qualquer validação por dia recriaria o defeito.

**Consequência:** chamadas existentes com datas fora de segunda deixam de ser bloqueadas na aprovação. A Release continua gerando apenas segundas/próximo dia útil por sua própria regra, então o comportamento dela não muda.

### 2. Precedência Release > Manual > Projeto

A ordem replica o `COALESCE` já usado na aprovação e a documentação do módulo. No formulário, a data é recomputada quando os vínculos mudam:

- Release selecionada → usa a publicação da Release.
- Sem Release e com Manual → usa a publicação do Manual.
- Sem Release e sem Manual e com Projeto → usa a publicação do Projeto.
- Nenhum vínculo com data → limpa a data.

Ao abrir a edição, a data persistida é preservada; a recomputação só ocorre em ação explícita de troca/remoção de vínculo.

**Alternativas:** precedência Projeto > Manual > Release. Rejeitada por contrariar o comportamento atual da aprovação e a documentação de `docs/15`.

### 3. Catálogos passam a expor `dataPublicacao`

`OpcaoChamada` já possui `dataPublicacao`; projetos e manuais passam a preencher o campo nas duas consultas de catálogo (paginada e completa). O formulário e o preview da importação reutilizam o mesmo campo sem novo tipo.

**Alternativas:** buscar a data sob demanda ao selecionar cada vínculo. Rejeitada por adicionar chamadas de rede e latência no wizard, quando a data já pode vir na opção.

### 4. Uma única regra de herança no servidor

Criar/atualizar e importar derivam a data vazia pelo mesmo helper/ordem Release → Manual → Projeto. A aprovação mantém a consulta agregada, mas sem a validação de dia. O update passa a persistir a data enviada pelo formulário (somente leitura) em vez de ignorá-la, para que a recomputação na edição não seja descartada.

**Alternativas:** manter o update ignorando `dataLiberacao`. Rejeitada porque a UI passaria a exibir uma data que o servidor não grava, repetindo a divergência atual.

### 5. Escopo de Projetos: comportamento mantido e documentado

Nenhuma mudança funcional no Escopo é necessária; a entrega adiciona teste de regressão para datas fora de segunda e explicita a regra na spec e em `docs/14`. A ação Publicar continua usando a data corrente.

### 6. Limpeza de helpers mortos

`ehSegundaFeira` e `proximaSegunda` de `shared/lancar-chamadas.ts` não têm uso de produção. Serão removidos junto com os testes correspondentes se a busca confirmar ausência de uso; `dataPublicacaoValida` permanece em `shared/feriados.ts` para a Release Week.

### 7. Cataloga o vínculo já filtrado e atalhos na toolbar

O filtro de status dos vínculos passa a ser aplicado no `whereBase` de cada catálogo no servidor, antes do `LIMIT`/`OFFSET`. O cliente continua com o mesmo filtro defensivo, mas a primeira página deixa de abrir vazia quando os registros mais recentes estão em status não vinculável.

Na toolbar, o filtro rápido de Origem usa `filtros.origem` (mesmo estado do modal, portanto o badge e o recarregamento server-side existentes valem sem duplicação). A limpeza rápida é um `X` renderizado no novo slot genérico `filtersRight` do `UiDataTable`, visível apenas quando `criteriosAtivosCount > 0`, e chama `limparFiltros()` + `busca = ''` — o mesmo padrão do board da Esteira.

**Alternativas:** um segundo estado só para o filtro rápido. Rejeitada por duplicar o recorte, o badge e o disparo de recarga.

## Risks / Trade-offs

- **Opção remota sem a data carregada** (edição com vínculo fora da página atual) → só recomputar quando a opção selecionada trouxer `dataPublicacao`; caso contrário, preservar a data atual. A data persistida nunca é apagada por falta de metadado da opção.
- **Cache de catálogo de 30 s** → o campo é aditivo; consumidores antigos ignoram a nova propriedade e o próximo ciclo recarrega.
- **Chamadas históricas fora da regra** → passam a ser aprovadas; é o comportamento desejado. Nenhum dado é reescrito.
- **Preview e commit divergirem** → ambos usam a mesma ordem de fallback e o servidor revalida; teste de parser cobre projeto único.
- **Regressão na Release Week** → a regra permanece em `shared/feriados.ts` e os testes de `release-week` não são alterados.

## Migration Plan

- Sem migration de banco.
- Deploy do código e dos testes; nenhum backfill.
- Rollback: reverter o commit; os dados gravados com datas fora de segunda continuam válidos no banco.

## Open Questions

Nenhuma pendente.
