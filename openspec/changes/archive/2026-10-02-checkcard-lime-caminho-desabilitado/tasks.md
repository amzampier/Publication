# Tasks

## 1. Aba Sidebar — CheckCards com o estado lime do DS (spec `configuracoes-globais` ADDED)

- [x] 1.1 Em `app/components/configuracoes/AbaSidebar.vue`, remover as 6 ocorrências de `variant="slate"` dos `UiCheckCard` (mantendo `checkbox-position="start"`, badges e bindings) — verificar: `Select-String` por `variant="slate"` no arquivo retorna 0 e, via CDP na aba Sidebar, um cartão marcado (ex.: "Expandida por padrão") tem `border-color` verde `#4ed813` (brand-accent) e `background-color` lime-50/30 no card, com o checkbox interno em lime
- [x] 1.2 Atualizar `docs/04 - Configurações Gerais.md` (§ Sidebar: "`UiCheckCard variant="slate"`") para descrever o variant lime do DS — verificar: grep do trecho não encontra mais `variant="slate"` e a doc cita o estado verde `docs/01` §5.9

## 2. Aba Logomarcas — input de caminho desabilitado após upload (spec `configuracoes-globais` MODIFIED)

- [x] 2.1 Em `app/components/configuracoes/AbaLogomarcas.vue`, ligar `:disabled` dos 2 `UiInput` "Caminho da imagem" ao preview ser dataURL (`previewHeader`/`previewLogin` vindos do upload), mantendo-os habilitados quando vazios/digitados — verificar: via CDP, upload simulado no bloco do header → `input.disabled === true` com o caminho preenchido; remover o arquivo na caixa → `disabled === false` e valor vazio; campo vazio aceita digitação e segue habilitado
- [x] 2.2 Atualizar `docs/04 - Configurações Gerais.md` (§ Logomarcas: "`UiInput mono` "Caminho da imagem" — … editável manualmente") para a nova regra (desabilitado com valor de upload; editável apenas vazio) — verificar: grep do trecho não encontra mais "editável manualmente" fora dessa ressalva e a doc descreve a remoção do arquivo como via de limpeza

## 3. Verificação integrada

- [x] 3.1 `npm run build` conclui sem erro
- [x] 3.2 Conferência CDP na aba Sidebar + aba Logomarcas: cartões marcados com borda/fundo lime, campo de caminho desabilitado após upload e "Salvar Alterações Globais" habilitando normalmente ao trocar o estado (regressão do fluxo de alteração) — screenshot de evidência
