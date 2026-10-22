# Design

## Context

Ver `proposal.md` — Why. Hoje a regra está em `shared/release-week.ts` (`ehSegundaFeira`), usada pelo
formulário, pelo backend (`server/utils/release-week.ts`) e pelo parser de importação. Não existe
calendário de feriados no projeto. Manuais e Escopo de Projetos não têm a regra e não serão tocados.

## Goals / Non-Goals

**Goals:**

- Aceitar a `data_publicacao` no próximo dia útil quando a segunda-feira for feriado nacional.
- Centralizar o calendário de feriados e a regra em código puro, reutilizado por cliente, servidor e
  importação.
- Manter a mensagem de erro explicativa e os testes existentes verdes.

**Non-Goals:**

- Criar UI de cadastro de feriados ou integrar API externa de feriados.
- Alterar as regras de Manuais Mensais e Escopo de Projetos.
- Alterar schema, migrations ou o fluxo de publicação.

## Decisions

### 1. Calendário nacional em `shared/feriados.ts`

O módulo contém:

- feriados fixos nacionais: 01/01, 21/04, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11 e 25/12;
- feriados móveis: Carnaval (segunda e terça), Sexta-feira Santa e Corpus Christi, calculados a
  partir do Domingo de Páscoa;
- `FERIADOS_EXTRAS` (vazio por padrão) para feriados locais/estaduais que a operação queira incluir.

**Por que:** a regra depende de feriado; hardcode apenas de 02/11/2026 resolveria o exemplo, mas não
os próximos feriados. **Alternativa descartada:** consultar API externa — adiciona dependência,
latência e disponibilidade a uma validação síncrona.

### 2. Regra `dataPublicacaoValida`

```text
se a data não for dia útil -> inválida
se for segunda-feira -> válida
senão:
  segunda = segunda-feira daquela semana
  se a segunda não for feriado -> inválida
  se a data == proximoDiaUtil(segunda) -> válida
  senão -> inválida
```

`proximoDiaUtil` avança dia a dia até encontrar um dia útil (segunda a sexta, fora do calendário).
Assim, se segunda e terça forem feriados (Carnaval), a quarta é o próximo dia útil e é aceita.
Aritmética em UTC para não deslocar a data civil.

### 3. Reuso e mensagem

`shared/release-week.ts` passa a importar/reexportar `dataPublicacaoValida` e `validarReleaseWeek`
usa a nova regra. O servidor (`validarEntradaReleaseWeek`) usa a mesma função. O parser de importação
já usa `validarReleaseWeek`, então herda a regra. A mensagem fica:

> A data de publicação deve ser uma segunda-feira ou o próximo dia útil quando a segunda-feira for
> feriado.

### 4. Feriados móveis

Cálculo do Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher; os deslocamentos são:

- Carnaval segunda: Páscoa - 48 dias;
- Carnaval terça: Páscoa - 47 dias;
- Sexta-feira Santa: Páscoa - 2 dias;
- Corpus Christi: Páscoa + 60 dias.

**Por que:** são os feriados que podem deslocar uma segunda-feira na prática. **Alternativa
descartada:** considerar apenas feriados fixos — perderia Carnaval.

## Risks / Trade-offs

- **Feriado local não cadastrado** → a data pode ser recusada. Mitigação: `FERIADOS_EXTRAS` no
  módulo, documentado em `docs/12`.
- **Carnaval/Corpus Christi não são feriados nacionais por lei federal** → incluídos por serem
  tratados como não úteis na operação. Mitigação: lista explícita e documentada; remover é uma
  decisão de produto.
- **Datas fora do intervalo usual** → o algoritmo de Páscoa e a aritmética UTC funcionam para
  qualquer ano; os testes cobrem 2026.

## Migration Plan

Não há migration de banco. Deploy normal; rollback é reverter o código para `ehSegundaFeira` estrita.

## Open Questions

Nenhuma.
