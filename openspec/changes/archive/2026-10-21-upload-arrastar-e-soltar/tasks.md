# Tasks

## 1. Componente compartilhado

- [x] 1.1 Atualizar `UiUploadFiles` com overlay “Solte os arquivos aqui”, `dropEffect = copy`, proteção de `dragleave` em filhos e `data-upload-files`; verificar `npm run typecheck` e lint
- [x] 1.2 Expor `aplicarArquivos(File[])` e garantir que o drop interno aplique uma única vez; verificar o fluxo de drop em `Midias` e em um importador

## 2. Consumidores

- [x] 2.1 Tornar `LancarChamadasMidias` uma área de drop externa que encaminha arquivos ao `UiUploadFiles` sem duplicar; verificar adicionando uma imagem solta sobre a galeria
- [x] 2.2 Atualizar os rótulos de todos os `Importar.vue` (usuários, softwares, parceiros, release-week, manuais, escopo-projetos e lançar-chamadas) para “Arraste o arquivo aqui ou clique para selecionar”; verificar por busca que não restou o rótulo antigo

## 3. Documentação e verificação

- [x] 3.1 Atualizar `docs/01` (upload), `docs/15` (mídias/importação) e a descrição da seção 6 de `/design`; verificar que o texto cita arrastar e soltar
- [x] 3.2 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar que todos passam
- [x] 3.3 Validar a change e o smoke visual de drop no navegador (imagem em `Midias` e `.xlsx` em um importador); verificar que o arquivo é adicionado à chamada/importação

> **Verificação (2026-10-21):** overlay e drop revisados no componente compartilhado; os sete importadores usam o mesmo UiUploadFiles; Midias encaminha drops da área externa; lint, 166 testes, typecheck e build passaram. O smoke de vínculos confirmou release/projeto/manual persistidos e devolvidos na API.
