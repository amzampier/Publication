# Proposal

## Why

O `UiUploadFiles` já escuta `drop`, mas o feedback visual é discreto e a área de arrasto fica limitada à
caixa de upload. Na etapa de mídias de Lançar as Chamadas, arrastar uma imagem sobre a galeria não
faz nada; nos modais de importação XLSX, o rótulo só fala em clique. O usuário espera soltar o arquivo
em qualquer ponto do componente.

## What Changes

- **`UiUploadFiles`** ganha um overlay visível “Solte os arquivos aqui” enquanto o arquivo é arrastado
  sobre o componente, com `dropEffect = copy` e proteção contra o flicker de `dragleave` em filhos.
- O componente passa a expor `aplicarArquivos(File[])` para que consumidores possam encaminhar drops
  feitos fora da caixa de upload.
- **`LancarChamadasMidias`** passa a aceitar o drop em toda a sua área (galeria, campos e caixa de
  upload), encaminhando as imagens ao `UiUploadFiles`.
- Os rótulos de **todos os modais de importação XLSX** passam a dizer “Arraste o arquivo aqui ou
  clique para selecionar”, tornando o recurso descobrível.
- Documentação do design system (`docs/01`), da tela (`docs/15`) e da vitrine (`/design`) é atualizada.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova: o componente e os fluxos já existem. -->

### Modified Capabilities

- `design-system/upload`: o componente SHALL aceitar arrastar e soltar em toda a sua raiz, com
  feedback visual explícito, e SHALL expor uma forma de consumo para áreas externas encaminharem
  arquivos.

## Impact

- `app/components/ui/UploadFiles.vue`
- `app/components/lancar-chamadas/Midias.vue`
- `app/components/{usuarios,softwares,parceiros,release-week,manuais,escopo-projetos,lancar-chamadas}/Importar.vue`
- `app/pages/design.vue`, `docs/01 - design_system.md` e `docs/15 - Módulo Lançar Chamadas.md`
- Spec `openspec/specs/design-system/upload/spec.md` (via change)
