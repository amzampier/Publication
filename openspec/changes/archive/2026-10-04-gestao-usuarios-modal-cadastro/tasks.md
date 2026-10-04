# Tasks

## 1. Kit: `UiModal` empilhado e `UiInput` com máscara

- [x] 1.1 Implementar a pilha de modais em `app/components/ui/Modal.vue` (push ao abrir, remoção ao
      fechar, `handleKeydown` processando `Escape`/`Tab` só quando a instância é o topo; tudo já
      guardado por `import.meta.server`) e verificar com `npm run build` que o projeto compila e que um
      modal isolado continua abrindo/fechando igual (Auditoria é o consumidor de regressão)
- [x] 1.2 Adicionar na seção 15 de `app/pages/design.vue` a demo de modal filho (botão que abre um
      `UiModal` `xs` sobre o modal de cadastro) e verificar em `/design`: `Escape` fecha só o filho,
      `Tab` circula só no filho e o pai permanece com os campos intactos
- [x] 1.3 Implementar a prop `mask` em `app/components/ui/Input.vue` (sintaxe `9` dígito, `A`
      alfanumérico, demais literais; formata no `input`, emite a string formatada, `backspace` remove o
      literal junto) e verificar com `npm run build`
- [x] 1.4 Demonstrar a máscara na seção 5 (Input) de `app/pages/design.vue` com um campo CEP e um
      telefone e verificar em `/design` que a digitação formata sem perder caracteres
- [x] 1.5 Registrar em `docs/01 - design_system.md`: linha da prop `mask` + nota de que o valor gravado
      é a string formatada na §5.3, e a regra de empilhamento (topo da pilha recebe teclado) na §5.12 —
      verificação: as duas seções citam a prop e a regra com os exemplos atualizados

## 2. Dados do módulo

- [x] 2.1 Criar `app/config/brasil.ts` com `UF` (27), `REGIOES` (5), `PROVEDORES_SMTP` e
      `SEGURANCAS_SMTP` (com porta sugerida 25/587/465) e verificar com `npm run build` que o módulo
      compila fora de `components/`
- [x] 2.2 Estender `UsuarioDemo` em `useUsuariosDemo.ts` (`telefone`, `funcao`, `departamento`,
      `endereco`, `smtp`, `avatar`, `dataCadastro`, `atualizadoEm`) e completar os 16 registros com os
      campos vazios/`null`, verificando com `npm run build` que a tabela segue exibindo as mesmas cinco
      colunas
- [x] 2.3 Transformar a base em `useState('usuarios-base')` semeada com clone de `USUARIOS` e fazer
      `usuariosFiltrados` ler desse estado, verificando em `/admin/gestao-usuarios` que os KPIs seguem
      16/13/3/4 e que a busca/filtros continuam funcionando
- [x] 2.4 Adicionar os helpers `salvarUsuario(rascunho, modo)` (criar com `dataCadastro`/`atualizadoEm`
      iguais ao instante; editar preservando `dataCadastro`) e `formatarDataHora(iso)` (`dd/mm/aaaa
      HH:mm`) e verificar com `npm run build` que os helpers tipam corretamente

## 3. Modal de usuário (`UsuariosFormulario`)

- [x] 3.1 Criar `app/components/usuarios/Formulario.vue` com `UiModal size="lg"` e os cinco
      `UiModalSection` (Dados do Usuário com coluna de avatar, Acesso ao Sistema, Endereço,
      Configurações de E-mail, Informações de Cadastro) e verificar com `npm run build` que o modal abre
      pelos dois modos com layout sem overflow
- [x] 3.2 Aplicar as máscaras em CEP (`99999-999`), Telefone (`(99) 99999-9999`) e Porta (`9999`) e
      verificar na digitação que os valores formatam e são os que seguem para o rascunho
- [x] 3.3 Adicionar o botão do slot `rightIcon` do CEP (`Search` + `UiTooltip` "Buscar CEP (ViaCEP)" +
      `aria-label`) emitindo `toast.info` de próxima etapa e verificar que nenhum campo de endereço é
      preenchido no clique
- [x] 3.4 Implementar `validar(rascunho, modo, base)` e a pintura de `:error` com foco no primeiro campo
      inválido via `data-campo`, verificando os quatro cenários da spec: e-mail duplicado, senha curta
      na criação, confirmação divergente e senha parcial na edição (modal permanece aberto, mensagem
      persistente rose-700)
- [x] 3.5 Implementar a máquina de estados do SMTP (Status inicial "Não testado", `Testar conexão`
      habilitado com servidor+porta+e-mail, 1.200 ms de "Testando", porta fora de 25/465/587 →
      "Falha", `Enviar teste` só com "Conectado" + toast, reset ao editar campo, timer limpo no
      fechamento) e verificar os quatro estados na tela com a porta 250 e a 587
- [x] 3.6 Montar o avatar com `UiUploadFiles forma="circular"` + `UiCameraWeb` e verificar que a
      captura atualiza a pré-visualização, o modal de câmera fecha sem fechar o formulário e o rascunho
      permanece intacto
- [x] 3.7 Implementar as Informações de Cadastro (criação: `-` com `helperText` "Preenchidos ao
      salvar"; edição: datas reais) e as ações `Salvar` (grava, fecha, `toast.success`) e `Cancelar`/
      `Escape`/`X` (fecha descartando), verificando na tela os dois caminhos

## 4. Integração na página

- [x] 4.1 Adicionar em `app/pages/admin/gestao-usuarios.vue` o estado de coordenação (`modalAberto`,
      `modo`, `usuarioAlvo`) montando `<UsuariosFormulario />` e verificar com `npm run build`
- [x] 4.2 Fazer `Cabecalho.vue` emitir `@novo` em vez do toast e verificar em
      `/admin/gestao-usuarios` que "Novo Usuário" abre o modal vazio sem exibir toast de próxima etapa
- [x] 4.3 Fazer `Tabela.vue` emitir `@editar(usuario)` no lápis (mantendo toast nos demais três
      ícones) e verificar que a linha abre o modal preenchido e que convite/bloquear/excluir seguem com
      toast
- [x] 4.4 Verificar o ciclo completo na tela: criar usuário → linha nova com "Último acesso" `-`,
      KPI "Total de usuários" 17 e toast de sucesso; editar → linha e "Última Atualização" atualizados;
      recarga → base de 16 restaurada
- [x] 4.5 Confirmar que os gatilhos remanescentes mantêm o contrato de transição (Importar, Filtros,
      Enviar convite, Bloquear, Excluir e o ícone do CEP = 6 toasts de "próxima etapa", nenhum modal)

## 5. Documentação do módulo

- [x] 5.1 Reescrever `docs/06 - Gestão de Usuários.md` para a fase 2: escopo e cabeçalho do modal,
      nova subseção do `Formulario.vue` em §3, o `useUsuariosDemo` com base reativa, §4 com os dois
      itens de kit alterados (`UiInput.mask`, `UiModal` empilhado), §5 com modal + validação + SMTP +
      gravação, §11 de verificação atualizada e §12 com as pendências restantes (Importar, Filtros,
      Excluir/Bloquear/Convite, ViaCEP) — verificação: sumário, seções e tabela de gatilhos batem com o
      comportamento implementado e as referências a "sem modais"/"fase 1" desaparecem do texto de fase 2

## 6. Verificação final

- [x] 6.1 Rodar `npm run build` e confirmar sucesso (não há lint/test no repositório — a build é o gate)
- [x] 6.2 Smoke visual em `http://localhost:3000`: `/admin/gestao-usuarios` (dois modos do modal,
      validação, estados do SMTP, avatar com câmera, KPIs, 6 toasts remanescentes, sem rolagem
      horizontal ≥1280px) e `/design` (máscara na seção 5, modal filho na seção 15, e Auditoria com
      Filtros/Detalhe intactos)
- [x] 6.3 Rodar `openspec validate --change "gestao-usuarios-modal-cadastro" --strict` e confirmar
      que o delta valida sem erros

## 7. Controle segmentado de Status
- [x] 7.1 Criar `app/components/ui/Segmented.vue` (`UiSegmented`: radiogroup com tons por opção,
  recortes de foco/erro do kit, mensagens `sr-only`) e registrar em `docs/01` (§5.15) com demo na
  seção 9 de `app/pages/design.vue`
- [x] 7.2 Trocar o `UiSelect` de Status pelo `UiSegmented` em `Formulario.vue` (válido, foco no
  primeiro campo inválido e navegação por Enter preservados) e atualizar `docs/06` (§3.4 e §5.2)
