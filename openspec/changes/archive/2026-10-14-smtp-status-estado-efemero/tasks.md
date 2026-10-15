# Tasks

## 1. Modelo de dados limpo

- [x] 1.1 Em `app/components/usuarios/useUsuariosDemo.ts`: remover `status: StatusSmtp` da interface `ConfigSmtpUsuario` e a inicialização `status: 'nao-testado'` de `smtpVazio()`, mantendo o `export type StatusSmtp` (domínio do estado interno de 2.1); verificar: o arquivo compila sem referências órfãs ao campo no tipo/factory e `grep` por `status` no bloco `ConfigSmtpUsuario`/`smtpVazio` não encontra mais o campo

## 2. Estado efêmero no `CamposSmtp`

- [x] 2.1 Em `app/components/usuarios/CamposSmtp.vue`: extrair o status para `const status = ref<StatusSmtp>('nao-testado')` interno; ajustar os escritores — watcher de troca externa do objeto (`props.modelValue`, com a guarda `ultimoEmitido`) reseta o ref para `'nao-testado'` junto de `limparTimer`/`portaManual`; watcher de edição de campos zera o ref; `testarConexao` e o timeout escrevem no ref; `statusSmtp = computed(() => SMTP_POR_STATUS[status.value])`; garantir que `watch(interno, { deep })` emite sem status; verificar em dev: abrir a aba E-mail do `/admin/meu-perfil` exibe os campos e o badge "Não testado" (bug fechado), digitar habilita "Testar conexão", o teste simulado passa por "Testando" → "Conectado" (porta válida) ou "Falha", e alterar qualquer campo volta o badge a "Não testado"
- [x] 2.2 Verificar em dev que o status **não vaza mais para o dono**: com a aba E-mail aberta e um teste em andamento (ou concluído), o botão "Salvar alterações" do perfil **não** fica habilitado por causa do status (antes o eco do v-model podia setar `alterado`); e que abrir a aba, testar, trocar de aba e reabrir volta a "Não testado"

## 3. Consumidores e documentação

- [x] 3.1 Em `app/components/usuarios/Formulario.vue`: remover o workaround da linha 81 (`smtp: { ...u.smtp, status: 'nao-testado' }` → `smtp: { ...u.smtp }`); confirmar que `app/pages/admin/meu-perfil.vue` e `app/components/perfil/AbaEmail.vue` permanecem **sem edição de código** (correção por construção, design D2); verificar: `grep -r "status: 'nao-testado'" app/` não encontra mais nenhuma injeção manual do campo
- [x] 3.2 Conferir `docs/06` e `docs/09` (busca por "status" no contexto SMTP): se algum texto tratar o status como parte do objeto de dados persistido, ajustar a menção para estado interno do bloco; se só descrever o comportamento visível (reset, teste simulado, badge), nenhuma edição; verificar: docs coerentes com o modelo novo

## 4. Verificação final (integração)

- [x] 4.1 Rodar `npm run build` e verificar que a build passa (gate estrutural do repositório — não há lint/test)
- [x] 4.2 Bateria manual em dev: (a) `/admin/meu-perfil` — as 4 abas abrem e voltam sem painel vazio (regressão do sintoma original), aba E-mail funcional de ponta a ponta (campos, teste simulado, badge, reset); (b) salvar com alteração em SMTP grava via PATCH e o corpo **não** contém `status` no objeto `smtp` (conferir no network); (c) reload da página mantém os dados SMTP gravados e o badge volta a "Não testado"; (d) Gestão de Usuários → abrir edição de um usuário → bloco SMTP do modal funciona como antes (abrir, testar conexão, alterar campo zera status, salvar sem regressão); (e) usuário recém-criado/sem SMTP pré-preenchido abre a aba E-mail sem erro (objeto vindo da API sem campos de UI)
