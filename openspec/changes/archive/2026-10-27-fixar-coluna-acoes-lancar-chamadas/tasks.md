# Tasks

## 1. Fixação no UiDataTable

- [x] 1.1 Adicionar `stickyActions?: boolean` (default `false`) ao `UiDataTable` e aplicar as classes de cabeçalho fixo, com fundo `bg-brand-primary`, largura `w-28 min-w-28 max-w-28`, borda esquerda e sombra; verificar que o `th` de Ações usa as classes somente quando a prop está ativa
- [x] 1.2 Aplicar a fixação às células de Ações das linhas agrupadas e planas, com fundo opaco, `group-hover:bg-slate-50`, largura e sombra; verificar que ambos os ramos de renderização exibem a coluna alinhada
- [x] 1.3 Aplicar a fixação à célula de Ações do rodapé, com fundo `bg-slate-100` opaco; verificar que o rodapé acompanha o alinhamento das células de dados
- [x] 1.4 Adicionar `group` às linhas de dados agrupadas e planas; verificar que o hover da célula fixa acompanha o hover da linha sem transparência

## 2. Ativação e documentação

- [x] 2.1 Passar `sticky-actions` ao `UiDataTable` em `app/components/lancar-chamadas/Tabela.vue`; verificar que a listagem renderiza a coluna fixa e que as demais tabelas continuam sem a prop
- [x] 2.2 Documentar a prop `stickyActions` e o comportamento da coluna fixa em `docs/01 - design_system.md` §5.11; verificar que a tabela de props e a descrição da coluna de Ações refletem o comportamento real
- [x] 2.3 Atualizar `docs/15 - Módulo Lançar Chamadas.md` §3.3 com a coluna Ações fixa; verificar que a documentação do módulo descreve o comportamento observado

## 3. Verificação integrada

- [x] 3.1 Validar em 1440, 1280, 1024, 768 e 375 px: rolar a tabela até os extremos e confirmar cabeçalho, linhas e rodapé da coluna Ações sempre visíveis e alinhados, sem overflow horizontal na página
- [x] 3.2 Validar hover, tooltips, menu de ações, foco por teclado e estado desabilitado de Excluir na coluna fixa; confirmar que nenhum conteúdo é encoberto de forma permanente
- [x] 3.3 Validar agrupamento, paginação e troca de linhas por página com a coluna fixa; confirmar que as linhas de grupo continuam ocupando a largura total e que as linhas folha mantêm as ações acessíveis
- [x] 3.4 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; confirmar que todos passam
- [x] 3.5 Rodar `openspec validate "fixar-coluna-acoes-lancar-chamadas" --type change --strict` e `openspec validate --specs`; revisar o diff final e confirmar que não há alterações fora do escopo
