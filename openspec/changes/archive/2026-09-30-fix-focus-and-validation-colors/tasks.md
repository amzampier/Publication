# Tasks

## 1. Restauração da folha de estilo (causa raiz)

- [x] 1.1 Declarar `tailwindcss.cssPath = '~/assets/css/main.css'` em `nuxt.config.ts` e verificar que o dev server (reiniciado pela troca de config) serve a folha do projeto: o `<link>` de stylesheet aponta para `app/assets/css/main.css` e o CSS servido contém a regra `.ds-bottom-clip`
- [x] 1.2 Rodar `npm run build` e verificar que o CSS de saída em `.output/public/_nuxt/*.css` contém `.ds-bottom-clip`, `@media print` e `scrollbar-discreta` (prova de que `main.css` deixou de ser ignorada em favor do fallback de `node_modules/tailwindcss/tailwind.css`)

## 2. Verde canônico de foco (`brand.focus`)

- [x] 2.1 Adicionar `brand.focus: '#1a9e07'` em `tailwind.config.js` e verificar, via `npm run build`, que `.border-brand-focus` existe no CSS gerado com `#1a9e07`
- [x] 2.2 Trocar o verde de foco/abertura em `Input.vue:78`, `Select.vue:258`, `Select.vue:301`, `Select.vue:349` e `DatePicker.vue:156` para `brand-focus` e verificar que `Select-String -Pattern 'lime-500' app/components/ui/Input.vue,Select.vue,DatePicker.vue` retorna vazio
- [x] 2.3 Trocar anéis e contornos `focus-visible`/`focus` em `Checkbox.vue:152-153`, `CheckChip.vue:116`, `CheckCard.vue:112`, `UploadFiles.vue:121`, `CameraWeb.vue:219`, `layout/AppHeader.vue:98/136/207` e `DataTable.vue:526` para `brand-focus` e verificar que filtrar esses arquivos por `focus` não devolve nenhuma linha contendo `lime-500`
- [x] 2.4 Trocar os 3 inputs de demonstração em `design.vue:1267`, `design.vue:1277` e `design.vue:1286` para `focus:border-brand-focus` e verificar que filtrar `app/pages/design.vue` por `focus:border-lime-500` retorna vazio
- [x] 2.5 Atualizar `docs/01 - design_system.md` §2.2 (linhas 97-98), §5.3 linha 275, §5.7 linha 411 e §5.8 linha 441 para citar `brand-focus` no lugar de `border-lime-500`/`border-b-lime-500`/`ring-lime-500`/`outline-lime-500` e verificar que `Select-String -Pattern 'lime-500' 'docs/01 - design_system.md'` não retorna mais essas linhas

## 3. Vermelho de validação (`rose-700`)

- [x] 3.1 Em `Input.vue`: label (`:60`), overlay de erro (`:84`) e ícone (`:124`) passam a `rose-700` com hover `rose-800`, com atualização de `docs/01 - design_system.md` §2.2 linha 99 e §5.3 linha 276; verificar que `Select-String -Pattern 'rose-500|rose-600' app/components/ui/Input.vue` retorna vazio e que as linhas atualizadas dos docs citam `rose-700`
- [x] 3.2 Em `Select.vue`: gatilho em erro (`:256`), overlay (`:309`) e ícone (`:322`) passam a `rose-700`, com atualização da linha 411 de `docs/01 - design_system.md`; verificar que `Select-String -Pattern 'rose-500|rose-600' app/components/ui/Select.vue` retorna vazio
- [x] 3.3 Em `DatePicker.vue`: o erro deixa o contorno total `border-rose-400` (`:154`) e passa ao par `border-slate-200 border-b-rose-700 border-b-[1.5px]` + overlay `.ds-bottom-clip` espelhando o `Select`, o ícone (`:187`) passa a `rose-700`, e a linha 441 de `docs/01 - design_system.md` descreve o recorte; verificar que `Select-String -Pattern 'rose-400|rose-500|rose-600' app/components/ui/DatePicker.vue` retorna vazio
- [x] 3.4 Trocar `label-class="text-rose-600"` do card de validação em `design.vue:950` para `text-rose-700` e verificar que a linha 950 não contém mais `rose-600`

## 4. Paleta e vitrine

- [x] 4.1 Corrigir o swatch "Vermelho Rosa" em `design.vue:164-165` (`hex` e `bgClass`) e a linha 81 de `docs/01 - design_system.md` para `#be123c`, e verificar que `Select-String -Pattern '#b91c1c' app/ docs/` retorna vazio

## 5. Verificação de integração

- [x] 5.1 Rodar `npm run build` e confirmar conclusão sem erro; conferir que o CSS gerado contém `.border-brand-focus` com `#1a9e07`, que nenhuma classe de foco/abertura de controle usa `lime-500` e que não resta `#b91c1c`
- [x] 5.2 Inspecionar em `http://localhost:3000/design` a seção 5 (cards 1 a 6: foco permanente, senha, e-mail, mono, padrão, validação) e confirmar que o destaque ocupa só a borda inferior com os cantos arredondados, em `#1a9e07` no foco e `#be123c` na validação; se aparecer filete reto de 1px acima do arco, ajustar `.ds-bottom-clip` de `calc(100% - 9px)` para `calc(100% - 8px)` (design D7) e repetir a inspeção
- [x] 5.3 Inspecionar `Select` aberto/erro, `DatePicker` aberto/erro, `Checkbox` focada e o cabeçalho do app, além de conferir a folha de impressão (Ctrl+P) e o scroll do cabeçalho — efeitos colaterais da restauração da `main.css` previstos no design

## 6. Ajustes de UX solicitados na validação visual

- [x] 6.1 `Tooltip.vue`: auto-ajuste do balão — medir viewport + ancestrais com `overflow` que recortam ao exibir, deslocar via propriedade CSS `translate` (não `transform`, para preservar o `-translate-x-1/2` e a escala da `Transition`), contra-deslocar a seta com limite nas margens do balão, recalcular em `scroll` (captura) e `resize`, e limpar os deslocamentos ao ocultar
- [x] 6.2 Reduzir o peso do valor digitado/selecionado globalmente: `Input.vue` (`font-medium` → `font-normal` e `mono` `font-semibold` → `font-medium`), `Select.vue:274` e `DatePicker.vue:173` (`font-medium` → `font-normal`), com documentação em `docs/01 - design_system.md` (§1.2, §5.3)
- [x] 6.3 Verificar no navegador: (a) tooltip do botão "Espelhar imagem" (canto esquerdo do rodapé do `UiModal` de `CameraWeb`) aparece inteiro, dentro do painel, com a seta apontando ao botão; (b) valores de `Input`, `Select` e `DatePicker` em `font-normal`

## 7. Seção 14 — Shell (tooltip no rail, Account e menu suspenso)

- [x] 7.1 `design.vue` seção 14: envolver cada item da sidebar em `<UiTooltip position="right" :disabled="sidebarOpen">` e trocar `overflow-hidden` por `overflow-hidden`/`overflow-visible` conforme o modo (espelhando `AppSidebar.vue`), para o balão não ser cortado no rail
- [x] 7.2 Bloco Account da seção 14: coluna de texto `text-right` → `text-left` (perfil continua abaixo do nome) e pesos `font-medium` → `font-normal` em nome e perfil; no `AppHeader.vue` real o perfil passa de `font-light` para `font-normal` para casar com a demo
- [x] 7.3 Menu suspenso da seção 14: `text-xs font-medium` → `text-xs font-light` nos três itens (o menu do `AppHeader.vue` real já era `font-light`)
- [x] 7.4 Atualizar `docs/01 - design_system.md` §3.2 (Account: duas linhas à esquerda, `font-normal`; menu `font-light`) e §3.3 (rail com `<UiTooltip>` e `overflow-visible`)
- [x] 7.5 Verificar no navegador: rail mostra os 4 ícones com tooltip visível sem corte (`translate 0px`, dentro do viewport) e nenhum tooltip no modo expandido; Account com `text-left` e pesos 400/400; itens do menu em 300; `npm run build` verde
