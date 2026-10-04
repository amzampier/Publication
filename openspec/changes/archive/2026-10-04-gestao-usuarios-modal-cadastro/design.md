# Design

## Context

A página `/admin/gestao-usuarios` é fina (só composição: `UsuariosCabecalho`, `UsuariosKpis`,
`UsuariosTabela`) porque a fase 1 não tinha nada para coordenar; com o modal, ela passa a ser o dono do
estado `modalAberto`/`modo`/`usuarioAlvo`. O estado de dados vive em
`app/components/usuarios/useUsuariosDemo.ts`, onde `USUARIOS` é **constante de módulo** e o composable
só filtra — não existe lista reativa para gravar. `UiModal` registra `keydown` na `window` por instância
(`Modal.vue:116`), sem noção de pilha, e `UiCameraWeb` é um `UiModal` comum (`CameraWeb.vue:138`), de
modo que câmera aberta por cima do formulário faria Escape e Tab chegarem aos dois ao mesmo tempo.
Não há máscara em nenhum `Ui*`. Motivação em `proposal.md`; contrato em `specs/gestao-usuarios/spec.md`
e `specs/design-system/modais/spec.md`.

## Goals / Non-Goals

**Goals:**

- Um único componente de modal para criar e editar, com os cinco blocos e a validação da spec.
- Base de usuários reativa no cliente, sem HTTP, com recálculo imediato de KPIs e tabela.
- Corrigir a coordenação de teclado entre modais empilhados no `UiModal` (genérico, não do módulo).
- Máscara de digitação no `UiInput` como capacidade de kit documentada no `docs/01`.

**Non-Goals:**

- Conexão real com provedores SMTP ou ViaCEP (simulação/toast nesta etapa).
- Endpoint, migration ou alteração de `docs/02` (o modelo estendido vive só no `UsuarioDemo`).
- Modais de Excluir/Bloquear/Convite/Importar/Filtros (seguem com toast).
- Novo componente de avatar ou de botão de ícone — composição dos `Ui*` existentes.

## Decisions

**D1 — Coordenação na página, componente `UsuariosFormulario` sem estado global.**
A página guarda `modalAberto`, `modo: 'novo' | 'editar'` e `usuarioAlvo: UsuarioDemo | null`;
`Cabecalho` emite `@novo`, `Tabela` emite `@editar(usuario)`. Alternativa descartada: composable com
`useState` de modal — desnecessário, já que nada fora da página abre o diálogo, e o padrão de fase 2
registrado no `docs/06` §2 é "a página ganha o estado de coordenação".

**D2 — Base reativa por `useState`, semeada a partir da constante.**
`useState<UsuarioDemo[]>('usuarios-base', () => USUARIOS.map(u => ({ ...u })))` — clone profundo na
inicialização para nunca mutar a constante de módulo; `usuariosFiltrados` passa a ler desse estado.
Alternativa descartada: `ref` dentro do composable — perderia as alterações na navegação entre rotas,
contrariando o cenário "criar/editar sobrevive à navegação" da spec; `useState` já é o padrão dos
filtros (`usuarios-filtros`).

**D3 — `UsuarioDemo` estendido com campos opcionais e defaults vazios.**
Novas propriedades: `telefone`, `funcao`, `departamento`, `endereco` (objeto com CEP, logradouro,
numero, complemento, bairro, cidade, estado, regiao), `smtp` (objeto com email, senha, provedor,
servidor, porta, seguranca, status), `avatar` (dataURL), `dataCadastro`, `atualizadoEm` (ISO). Os 16
registros de demonstração ganham os campos vazios/`null`; nenhuma alteração de formato nas colunas da
tabela (que seguem Nome/E-mail/Perfil/Status/Último acesso).

**D4 — Prop `mask` no `UiInput` com sintaxe mínima.**
`9` = dígito, `A` = alfanumérico, demais caracteres = literal fixo. A formatação acontece no `input`
(`@input`), o `update:modelValue` emite a **string já formatada** e `backspace` apaga o caractere
literal junto. Máscaras usadas: CEP `99999-999`, telefone `(99) 99999-9999`, porta `9999`. Alternativa
descartada: componente `UiMaskedInput` novo — exigiria seção nova na vitrine e `docs/01` §5.15 para a
mesma identidade visual; o campo inválido continua usando o recorte `rose-700` já existente.

**D5 — Pilha de modais no `UiModal`.**
Array no escopo do módulo (`pilhaModais: symbol[]`), com push no `watch(modelValue=true)` e remoção no
fechamento (ambos já guardados por `import.meta.server`). O `handleKeydown` só processa `Escape`/`Tab`
quando o próprio id é o **topo** da pilha; com um único modal a pilha tem um elemento e o comportamento
atual é byte a byte o mesmo. O `previousFocus` de cada instância já resolve a restauração de foco
(D3 da capacidade `design-system/modais`). Alternativa descartada: prop `desativarTeclado` no pai —
exigiria que cada pai conheça todos os filhos e já nasceria quebrada para o próximo modal aninhado.

**D6 — Validação como função pura + foco por atributo de fallback.**
`validar(rascunho, modo, base)` devolve `Record<campo, string>`; o componente pinta `:error` nos
campos e, após `nextTick`, foca o primeiro erro com
`document.querySelector('[data-campo="<campo>"] input')?.focus()`. O `data-campo` chega ao wrapper do
`UiInput` via *fallthrough attrs* do Vue — **sem tocar no kit**. Alternativa descartada: `ref` por
campo no componente — frágil com 20+ campos e com a ordem de foco.

**D7 — Máquina de estados do SMTP como `ref` local com timer cancelável.**
`statusSmtp: 'nao-testado' | 'testando' | 'conectado' | 'falha'` dentro do `Formulario`, iniciado a
partir do registro salvo ao editar; `setTimeout` de 1.200 ms guardado numa variável e limpo no
fechamento do modal e no reset. A porta sugerida é aplicada num `watch` de `seguranca` (só quando o
usuário não editou a porta manualmente depois da sugestão — controle por flag simples). Alternativa
descartada: composable `useTesteSmtp` — um único consumidor, não paga a abstração.

**D8 — Dados estáticos em `app/config/brasil.ts`.**
Exporta `UF` (27), `REGIOES` (5), `PROVEDORES_SMTP` (Gmail, Outlook/365, Yahoo, Personalizado) e
`SEGURANCAS_SMTP` (Nenhuma/STARTTLS/SSL/TLS com porta sugerida 25/587/465). Fora de `components/`
para não ser auto-importado como componente, mesmo padrão de `app/config/navigation.ts`.

**D9 — Avatar e ícone do CEP compostos, sem componente novo.**
Avatar = `UiUploadFiles forma="circular"` (coluna de 140px, rótulos curtos) + `UiCameraWeb` em
`v-model`; a câmera depende de D5. Ícone do CEP = slot `rightIcon` com `<button>` real (não a `div`
cliqueável da prop) + `UiTooltip` "Buscar CEP (ViaCEP)" + `aria-label`, e clique → `toast.info` de
transição — mesmo contrato dos demais gatilhos pendentes.

**D10 — Datas e feedback de gravação.**
`Data Cadastro`/`Última Atualização` são `UiInput disabled`; na criação valor `-` com
`helperText="Preenchidos ao salvar"`, na edição `dd/mm/aaaa HH:mm` (reaproveitando o formato de
`formatarUltimoAcesso`). Salvar válido → grava, fecha e `toast.success('Gestão de Usuários', ...)`;
Cancelar/`Escape`/`X` → só fecha (o `UiModal` já emite `close`).

## Risks / Trade-offs

- **Pilha de modais altera um componente compartilhado** (Auditoria, Filtros, Câmera usam `UiModal`) →
  a regra "topo da pilha" degrada para o comportamento atual quando a pilha tem 1 elemento; verificar
  visualmente Auditoria (Filtros e Detalhe) além do módulo de usuários.
- **Máscara grava string formatada** (não dígitos crus) → validações de senha/CEP devem medir dígitos e
  não caracteres; documentar em `docs/01` §5.3 para o próximo consumidor não se surpreender.
- **Avatar como dataURL em `useState`** infla o estado da sessão → aceito em fase em memória; nada é
  persistido, e a recarga descarta (mesmo contrato dos dados).
- **Timer do SMTP vazar após fechar o modal** → limpar no watch de fechamento e em `onUnmounted`.
- **Foco no primeiro erro depende de `data-campo` no wrapper** → se o `UiInput` algum dia ganhar
  múltiplos inputs internos o seletor precisa ser refinado; hoje há exatamente um.
- **Dados de demonstração sem endereço/SMTP** → a edição de um usuário antigo mostra os blocos vazios;
  é o comportamento esperado (nada de fake pre-fill), registrado na spec como campos opcionais.

## Migration Plan

Sem migração de dados: tudo em memória. Deploy = `npm run build`; rollback = reverter os commits da
change (nenhum estado externo é criado). A constante `USUARIOS` permanece como seed, portanto qualquer
versão anterior continua funcional sozinha.

## Open Questions

Nenhuma — as decisões de escopo (máscara, simulação de SMTP, câmera no modal, `docs/02` intocado) foram
fechadas na exploração e estão refletidas na spec.
