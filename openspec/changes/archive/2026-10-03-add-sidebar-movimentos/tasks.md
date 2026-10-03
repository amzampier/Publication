# Tasks

## 1. Código da navegação

- [x] 1.1 Em `app/config/navigation.ts`, inserir a sessão `Movimentos` **após Publicações e antes de Cadastros** (`aberto: true`) com os itens `Esteira de Revisão` (`Workflow`, cor `#8b5cf6`) e `Lançar as Chamadas` (`Megaphone`, cor `#f59e0b`), ambos **sem `to`** — verificar: em `/admin` com sidebar expandida a ordem é Publicações → Movimentos → Cadastros → Administração (11 itens no total), ícones com as cores novas via `tinta()`, clique marca estado sem navegar, e o rail mostra os dois ícones com divisor entre sessões
- [x] 1.2 Em `app/components/configuracoes/AbaSidebar.vue`, acrescentar `'Movimentos': ArrowLeftRight` ao mapa `iconeDaSessao` e alinhar `estaAberta` ao fallback do `AppSidebar` (`sessoesAbertas[label] ?? sessao?.aberto ?? false`) — verificar: o cartão "Movimentos" exibe o ícone `ArrowLeftRight` (não `Folder`), o badge "Aberta"/"Recolhida" bate com o estado real da sidebar nos dois sentidos, e os presets globais consideram as quatro sessões

## 2. Documentação

- [x] 2.1 Atualizar `docs/01 - design_system.md` §sidebar: lista das quatro sessões na nova ordem (com Movimentos · Esteira de Revisão · Lançar as Chamadas) e as duas cores novas na tabela de ícones — verificar: § cita as quatro sessões, os onze itens e as cores `#f59e0b`/`#8b5cf6`
- [x] 2.2 Atualizar `docs/03 - Header e Sidebar.md`: árvore de navegação com o grupo Movimentos na posição correta — verificar: árvore espelha `navigation.ts` (Publicações → Movimentos → Cadastros → Administração)
- [x] 2.3 Atualizar `docs/04 - Configurações Gerais.md` (enumeração das sessões do painel de sidebar) — verificar: texto lê "(Publicações · Movimentos · Cadastros · Administração)"

## 3. Verificação integrada

- [x] 3.1 Rodar `npm run build` e confirmar conclusão sem erros (gate único do repositório)
- [x] 3.2 Checklist visual: `/admin` — sidebar expandida com as quatro sessões na ordem, recolhimento individual da sessão Movimentos, rail com os dois ícones novos; `/admin/configuracoes-globais` → aba Sidebar — quatro cartões de sessão (Movimentos com ícone e badge coerentes), presets "Todas Abertas/Recolhidas" refletem na sidebar em tempo real; vitrine `/design` §14 espelha a árvore nova sem edição manual; menu do Account inalterado
