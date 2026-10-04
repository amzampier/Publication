# Proposal

## Why

A fase 1 da Gestão de Usuários entrega a listagem, mas todo o fluxo de cadastro morre em um toast
"funcionalidade disponível na próxima etapa": não é possível criar nem editar usuário algum. A fase 2
começa pelo modal de cadastro — a peça que destrava o CRUD em memória e dá conteúdo real aos botões
"Novo Usuário" e ao lápis da linha, hoje sem nenhum destino.

## What Changes

- **Modal único de cadastro/edição** (`app/components/usuarios/Formulario.vue`) com cinco blocos:
  Dados do Usuário (avatar, nome, e-mail, telefone, função, departamento), Acesso ao Sistema (perfil,
  situação, senha, confirmar senha), Endereço (CEP, endereço, número, complemento, bairro, cidade,
  estado, região), Configurações de E-mail (SMTP, com teste simulado) e Informações de Cadastro
  (datas desabilitadas) — acionado pelo botão "Novo Usuário" e pelo lápis da linha.
- **Gravação em memória:** a base deixa de ser constante de módulo e passa a ser estado reativo;
  criar adiciona a linha, editar atualiza, `Data Cadastro`/`Última Atualização` são geradas, KPIs e
  tabela recalculam e um toast de sucesso fecha o fluxo.
- **Validação no envio:** e-mail único e com formato, senha obrigatória só na criação (mínimo 8 +
  confirmação), demais campos opcionais; erro em `rose-700` e foco no primeiro campo inválido.
- **Componentes de kit alterados:** `UiInput` ganha a prop `mask` (CEP, telefone, porta) e `UiModal`
  passa a empilhar modais — com o modal de câmera aberto por cima, Escape e Tab afetam apenas o topo.
- **SMTP simulado:** "Testar conexão" e "Enviar teste" não fazem rede; o Status da Configuração percorre
  Não testado → Testando → Conectado/Falha, com reset quando qualquer campo do bloco muda.
- **Ações remanescentes intactas:** Excluir, Bloquear, Enviar convite, Importar e Filtros continuam com
  toast de transição (escopo mínimo desta change); o clique no ícone de CEP também.
- **Documentação:** `docs/06` ganha o seção do modal e o comportamento da fase 2; `docs/01` registra a
  prop `mask` (§5.3) e o empilhamento (§5.12); a vitrine `/design` demonstra as duas mudanças de kit.

## Capabilities

### New Capabilities

- `design-system/modais`: comportamento de teclado e empilhamento do `UiModal` — quando um modal abre
  sobre outro, Escape e a armadilha de Tab atingem somente o modal do topo e o modal subjacente preserva
  foco e rascunho.
- `design-system/segmented`: controle segmentado (`UiSegmented`) para escolha única entre poucas
  opções em uma linha — seleção por clique/teclado como radiogroup, foco e erro no padrão do kit —
  usado pelo campo Status (Ativo/Inativo) no lugar de um `UiSelect`.

### Modified Capabilities

- `gestao-usuarios`: o requirement dos sete gatilhos com toast passa a prever que "Novo Usuário" e
  "Editar" abrem o modal (os demais cinco seguem com toast); o requirement de KPIs ganha cenário de
  recálculo após criar/editar; e entram requirements novos para o modal (blocos e campos), a validação,
  a gravação em memória com as datas, o SMTP simulado e o avatar com câmera.

## Impact

- **Componentes de domínio:** novos `app/components/usuarios/Formulario.vue` e
  `app/config/brasil.ts` (UF, regiões, provedores e segurança SMTP); alterados `Cabecalho.vue`
  (`@novo`), `Tabela.vue` (`@editar`), `useUsuariosDemo.ts` (base reativa + `UsuarioDemo` estendido) e
  `app/pages/admin/gestao-usuarios.vue` (coordenação do modal).
- **Componentes de kit:** `app/components/ui/Input.vue` (prop `mask`),
  `app/components/ui/Modal.vue` (pilha de modais) e o novo `app/components/ui/Segmented.vue` — sem
  consumidor existente alterado.
- **Vitrine e documentação:** `app/pages/design.vue` (demos de `mask` na seção 5, de modal filho na
  seção 15 e do `UiSegmented` na seção 9), `docs/06 - Gestão de Usuários.md` (reescrita das seções de
  fase 1 para fase 2), `docs/01 - design_system.md` (§5.3, §5.12 e §5.15).
- **Fora de escopo:** `docs/02` permanece intocado (o modelo estendido vive no `UsuarioDemo`), nenhum
  endpoint em `server/`, nenhum teste real de SMTP ou ViaCEP, e nenhum dos demais cinco gatilhos deixa
  de exibir toast.
