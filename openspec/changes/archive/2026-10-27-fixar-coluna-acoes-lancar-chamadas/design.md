# Design

## Context

Ver `proposal.md` — Why. A `UiDataTable` já renderiza a coluna de Ações como a última coluna dentro de um contêiner `overflow-x-auto` (`app/components/ui/DataTable.vue:763`). O cabeçalho e as células de Ações são renderizados em três pontos: cabeçalho, linha de dados agrupada, linha plana e rodapé. A tabela usa `border-collapse: collapse` e as linhas têm hover próprio, o que exige cuidado com o fundo e as bordas da célula fixa.

## Goals / Non-Goals

**Goals:**

- Fixar a coluna de Ações à direita durante a rolagem horizontal, com cabeçalho, corpo e rodapé alinhados.
- Manter a coluna legível sobre o conteúdo que passa por baixo.
- Restringir a mudança a Lançar as Chamadas, sem alterar as demais tabelas.
- Preservar o comportamento atual quando a opção não é usada.

**Non-Goals:**

- Fixar a primeira coluna ou o cabeçalho verticalmente.
- Alterar a ordem, o conteúdo ou as permissões das ações.
- Reduzir a largura das demais colunas.
- Criar overlay, segunda tabela ou duplicação do slot de ações.

## Decisions

### 1. Prop opt-in no `UiDataTable`

Adicionar `stickyActions?: boolean`, default `false`. A prop controla apenas a apresentação da coluna; o slot `actions` e o conteúdo continuam responsabilidade do chamador. Alternativa descartada: aplicar `sticky` globalmente a toda coluna de Ações, porque outras telas foram dimensionadas para não ter rolagem e não pediram a mudança.

### 2. `position: sticky` nas células, não no slot

A fixação será aplicada ao `<th>` e aos `<td>` da coluna de Ações, que são os elementos alinhados à borda do contêiner de rolagem. Aplicar `sticky` ao wrapper do slot não funcionaria, pois o `<td>` continuaria rolando.

Classes-base quando ativa:

- Cabeçalho: `sticky right-0 z-30 bg-brand-primary`.
- Linhas de dados: `sticky right-0 z-20 bg-white group-hover:bg-slate-50`.
- Rodapé: `sticky right-0 z-20 bg-slate-100`.
- Largura estável: `w-28 min-w-28 max-w-28` (112 px; comporta Editar + Excluir + menu com folga).
- Separação: `border-l` na cor da respectiva faixa e `shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]`.

### 3. Hover coerente

As linhas de dados (agrupadas e planas) recebem a classe `group`; a célula fixa usa `group-hover:bg-slate-50` com fundo sólido. Isso evita que o branco da célula fixa contraste com o hover do restante da linha e evita transparência deixando o conteúdo rolado aparecer.

### 4. Ativação local

`app/components/lancar-chamadas/Tabela.vue` passa `sticky-actions` ao `UiDataTable`. As demais tabelas permanecem sem a prop e mantêm o layout atual.

### 5. Sombra sempre visível

A sombra é aplicada sempre que a prop está ativa, inclusive quando a tabela cabe sem rolagem. A alternativa de calcular `scrollLeft` para exibir a sombra só sob rolagem adicionaria estado e listeners sem benefício relevante para o escopo.

## Risks / Trade-offs

- **Bordas irregulares com `border-collapse`** → usar `border-l` e sombra na célula fixa, validando nos navegadores suportados.
- **Sobreposição da última coluna de dados** → a coluna fixa ocupa espaço próprio; testar o scroll até o fim para garantir que a coluna anterior continue legível.
- **Largura fixa apertada em zoom alto** → reservar 112 px e validar com os três controles visíveis; não reduzir os alvos de toque.
- **Sombra permanente em telas largas** → risco estético aceito; a sombra é sutil e delimita a área fixa.
- **Perda de contexto em tabelas agrupadas** → validar as linhas de grupo e as linhas folha, que usam ramos de renderização distintos.

## Migration Plan

Sem migration. Deploy e rollback são feitos apenas pela alteração de UI; remover a prop restaura o comportamento anterior. Não há dados a converter.

## Open Questions

Nenhuma.
