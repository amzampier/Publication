# Tasks

## 1. Dependências

- [x] 1.1 `npm i jspdf jspdf-autotable` — verificar: `package.json` com as duas deps e `npm run build` conclui sem erro após a instalação

## 2. Logo de login compartilhado

- [x] 2.1 Criar `app/composables/useLogomarcaLogin.ts` (espelho do `useLogomarcaHeader`: `useState` de caminho + preview) e trocar as refs locais `logoLogin`/`previewLogin` de `AbaLogomarcas.vue` pelo composable (watch e bindings do bloco de login permanecem) — verificar: `grep` não encontra mais `const logoLogin = ref` no painel; a aba Logomarcas continua funcionando (badge/prévia/campo desabilitado) e o estado sobrevive à troca de aba

## 3. Gerador do relatório

- [x] 3.1 Criar `app/components/auditoria/gerarPdfAuditoria.ts`: jsPDF A4 paisagem + autoTable com cabeçalho (logo de login rasterizada à esquerda quando houver dataURL, título "Relatório de Gestão de Auditoria" + "Gerado em …" à direita, filtros vigentes, linha divisória navy), colunas Data/Hora…IP com head navy repetido, `overflow: 'linebreak'` nos detalhes, rodapé "Página X de Y" em todas as páginas e `save('auditoria.pdf')` — verificar: função assíncrona exportada e usada pelo `Cabecalho` (validação de conteúdo na task 4.2/6.2)

## 4. Menu Exportar

- [x] 4.1 Em `AuditoriaCabecalho.vue`: item "Listar em PDF" → **"Download em PDF"**; o handler passa a chamar o gerador com `registrosFiltrados`, rótulos dos filtros vigentes e o preview do `useLogomarcaLogin`, **removendo** o `window.print()` — verificar (CDP): clicar no item baixa `auditoria.pdf` (`%PDF-`), MediaBox em paisagem (≈841×595 pt) e o spy de `window.print` **não** é acionado; item do menu com o novo rótulo

## 5. Documentação

- [x] 5.1 Atualizar `docs/05 - Gestão de Auditoria.md` (§3.1 exportação, §5, §8 sem usar `@media print`, §11 verificação, sumário/escopo) para o novo fluxo de PDF — verificar: grep do docs/05 não encontra mais "Listar em PDF"/"window.print" como comportamento desta tela e descreve o relatório paisagem

## 6. Verificação integrada

- [x] 6.1 `npm run build` sem erro e `openspec validate relatorio-pdf-auditoria --strict` válido
- [x] 6.2 Checagem CDP final: com filtros aplicados, "Download em PDF" gera arquivo com cabeçalho/filtros/colunas (PDF decodificado e conferido visualmente), paisagem confirmada, `window.print` nunca chamado, CSV continua OK; screenshot do relatório PDF de evidência
## 7. Ajustes finais da tabela (pedido do usuário)

- [x] 7.1 Na `UiDataTable`, deixar a header **sem tooltip** (sem `title` nativo no th/handle e sem `UiTooltip` na coluna), trocar `cursor-grab` por `cursor-pointer` (mão apontando) e dar mais peso à seta de ordenação padrão (`h-3`, `stroke-[2.5]`, sem `opacity-30`) — verificar (CDP **4/4**): hover sem tooltip algum, cursor computado = `pointer`, seta com as novas classes e ordenação por clique funcionando
- [x] 7.2 `npm run build` sem erro após os ajustes da header