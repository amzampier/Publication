# Proposal

## Why

A aba E-mail do `/admin/meu-perfil` quebra ao ser aberta: os campos não aparecem e, após o erro de render, voltar para outra aba também deixa o painel vazio. Causa-raiz confirmada: o `status` SMTP ("Não testado"/"Testando"/…) é campo **efêmero de UI** — documentado como "não persiste" (`useUsuariosDemo.ts`) e nunca enviado/recebido pela API —, mas mora dentro do tipo de dados `ConfigSmtpUsuario` como se fosse persistido. O `GET /api/usuarios/eu` devolve o smtp **sem** `status`; o `clonar()` do perfil espelha o objeto sem injetar o campo; `CamposSmtp` faz `SMTP_POR_STATUS[undefined]` → `undefined` → `statusSmtp.variant` lança `TypeError` no template → painel em branco + árvore Vue fora de sincronia. O modal de Gestão de Usuários nunca quebrou porque `Formulario.vue:81` injeta `status: 'nao-testado'` à mão ao clonar — um workaround que prova a ambiguidade do modelo: dois donos do mesmo componente, um normaliza, o outro esquece.

## What Changes

- **Modelo de dados corrigido:** `ConfigSmtpUsuario` deixa de carregar `status` — o tipo passa a representar apenas os dados persistíveis (`email`, `senha`, `provedor`, `servidor`, `porta`, `seguranca`). O tipo `StatusSmtp` continua exportado para a UI.
- **Estado efêmero muda de dono:** o `status` vira `ref` **interno** de `UsuariosCamposSmtp` (`app/components/usuarios/CamposSmtp.vue`), dono único da máquina de estados (reset em edição de campo e em troca externa do objeto, "Testando" → "Conectado"/"Falha" no teste simulado). Nunca sai do componente nem viaja no v-model.
- **Workaround removido:** `Formulario.vue` não precisa mais injetar `status: 'nao-testado'` ao clonar o registro (`smtp: { ...u.smtp, ... }` vira só `{ ...u.smtp }`).
- **Bugfix por construção:** `meu-perfil.vue` (`clonar()` com `smtp: { ...u.smtp }`) não muda em código — fica correto porque o modelo não tem mais o campo a esquecer. A aba E-mail passa a abrir com os campos e o badge "Não testado", e a navegação entre as abas volta a ser estável.
- **Efeito colateral bom:** o `emit('update:modelValue')` do bloco SMTP só carrega dados — hoje, iniciar um teste podia vazár `status: 'testando'` para o rascunho do pai e até viajar no PATCH (o servidor ignora, mas o rascunho ficava sujo).
- **Zero mudança no servidor:** `normalizarSmtp` só lê campos conhecidos; nada mais enviará `status` no body.

## Capabilities

### New Capabilities

_Nenhuma — a mudança não introduz comportamento novo._

### Modified Capabilities

_Nenhuma — os requirements já existentes descrevem o comportamento alvo:_

- `meu-perfil` já exige a aba E-mail com "qualquer alteração zera o status para 'Não testado'", o teste simulado e o badge — o bug é implementação divergente (a aba nem renderizava).
- `gestao-usuarios` cobre os mesmos cenários do bloco SMTP no modal — comportamento preservado.

Refatoração de modelo + bugfix de implementação: nenhum texto de requirement muda. O change declara `skip_specs: true`.

## Impact

- **Código:** `app/components/usuarios/useUsuariosDemo.ts` (tipo + `smtpVazio`), `app/components/usuarios/CamposSmtp.vue` (extração do estado), `app/components/usuarios/Formulario.vue` (remoção do workaround). `app/pages/admin/meu-perfil.vue` e `app/components/perfil/AbaEmail.vue` **sem mudança de código**.
- **API/servidor:** nenhuma.
- **Docs:** eventuais menções em `docs/06`/`docs/09` que tratem o status como parte do objeto de dados (verificar; comportamento visível inalterado).
- **Sem mudança de specs, migrations ou tokens.**
- **Risco de regressão:** baixo — bateria manual cobre perfil (4 abas + salvar) e modal de usuários (bloco SMTP); `npm run build` é o gate estrutural.
