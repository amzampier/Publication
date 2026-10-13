# Tasks

## 1. Extração do bloco SMTP (`CamposSmtp`)

- [x] 1.1 Criar `app/components/usuarios/CamposSmtp.vue` extraindo de `usuarios/Formulario.vue` o template do bloco SMTP (campos, botões "Testar conexão"/"Enviar teste", badge de status) e o script (watches de porta sugerida com `portaManual` e de reset de status, `testarConexao`, `enviarTeste`, `SMTP_POR_STATUS`), com `v-model: modelValue` (`ConfigSmtpUsuario`), emit `update:modelValue` e emit `change`; constantes seguem vindo de `config/brasil.ts` — verificar com `npm run build`
- [x] 1.2 Substituir em `usuarios/Formulario.vue` o bloco inline por `<UsuariosCamposSmtp v-model="rascunho.smtp" @change="...">`, removendo o código extraído sem alterar o restante do modal — verificar com `npm run build`
- [x] 1.3 Regressão visual do modal em `/admin/gestao-usuarios` (editar usuário): porta sugerida ao trocar segurança, reset de status ao editar campo, teste simulado conectando com porta válida e badge de status — comportamento idêntico ao anterior

## 2. Navegação do item "Meu Perfil"

- [x] 2.1 Em `app/config/navigation.ts`, adicionar `to: '/admin/meu-perfil'` em `accountMeuPerfil` — verificar com `npm run build`
- [x] 2.2 Em `app/components/layout/AppHeader.vue`, trocar o botão fixo de "Meu Perfil" (que só chamava `fecharMenus`) pelo mesmo caminho dos itens com rota — `clicarItemMenu(accountMeuPerfil)` — mantendo markup, ícone e sem `cor` — verificar clicando no item com a página aberta: navega para `/admin/meu-perfil` e o menu fecha
- [x] 2.3 Atualizar `docs/03 - Header e Sidebar.md` §3 (tabela e texto do menu da conta): "Meu Perfil" com rota `/admin/meu-perfil` — conferir que o texto não afirma mais "sem navegação"

## 3. Estrutura da página e casca do perfil

- [x] 3.1 Criar `app/pages/admin/meu-perfil.vue` com `definePageMeta({ layout: 'admin' })`: registro base da sessão (`useAuth` → `useUsuariosDemo`), `rascunho` clonado (`endereco` e `smtp` copiados), refs `aba` (default `dados`), `alterado`, `erros`; funções `salvar()` (valida dados pessoais, grava no registro, `atualizadoEm`, toast, `alterado = false`) e `cancelar()` (restaura rascunho/erros, `alterado = false`) — verificar com `npm run build`
- [x] 3.2 Criar `app/components/perfil/Cabecalho.vue` no padrão dos demais headers sem container (tile `rounded-lg bg-brand-primary p-2` com ícone `User`, título "Meu Perfil", subtítulo "Gerencie suas informações e preferências"), `flex flex-wrap` + `min-w-0` — a página renderiza o cabeçalho no topo
- [x] 3.3 Criar `app/components/perfil/Abas.vue` no padrão de `configuracoes/Abas.vue`: card único, `UiTabs id-prefix="perfil"` com as 4 abas (Dados Pessoais, Segurança, Endereço, E-mail — ícones e cores), painel `role="tabpanel"` com `id`/`aria-labelledby` do prefixo, slot do painel ativo e rodapé `border-t` com "Cancelar" (outline) e "Salvar alterações" (primary, `:disabled="!alterado"`) — as abas trocam o painel e o botão Salvar só habilita após `change`
- [x] 3.4 Criar `app/components/perfil/Resumo.vue` (card lateral): slot para o Avatar, nome, e-mail, `UiBadge` de status (`VARIANTE_POR_STATUS`) e de perfil (`VARIANTE_POR_PERFIL`), linhas informativas E-mail/Último acesso (`formatarUltimoAcesso`)/Conta criada em (`dataCadastro`), botão outline "Alterar foto" (emite `alterar-foto`) e mini-card "Sua conta está segura" — a página liga o grid `grid gap-6 lg:grid-cols-[320px_1fr]` com resumo + abas; abaixo de `lg` empilha sem overflow horizontal em 375px

## 4. Avatar em destaque

- [x] 4.1 Criar `app/components/perfil/Avatar.vue`: anel `ring-2 ring-brand-accent`, foto (`preview`) ou iniciais do nome sobre `bg-brand-structure`, botão lápis flutuante; emite `alterar-foto` — sem foto as iniciais aparecem, com foto a imagem substitui
- [x] 4.2 Ligar o fluxo de troca de foto na página: "Alterar foto"/lápis abrem `UiUploadFiles` circular (`forma="circular"`, `compacto`) + modal `UiCameraWeb`; handlers `FileReader` → dataURL e captura → dataURL no `rascunho.avatar` (mesmo fluxo do `Formulario.vue`), `@change` de qualquer painel liga `alterado` — trocar a imagem habilita o Salvar e só grava ao salvar; remover a foto volta às iniciais
- [x] 4.3 Registrar a linguagem visual do avatar e do card de resumo (sem anel; iniciais em neutro `slate-600`; lápis flutuante `h-7 w-7`; foto em dataURL; degradê vertical `from-brand-structure/15 → to-white` no card) na seção apropriada de `docs/01 - design_system.md` (§2.1 + §3.2 + §5.20) — conferir que o `docs/01` descreve o novo padrão visual

## 5. Aba Dados Pessoais

- [x] 5.1 Criar `app/components/perfil/AbaDadosPessoais.vue`: `UiInput` Nome completo (obrigatório), E-mail de acesso (obrigatório + `EMAIL_RE` + unicidade na base excluindo o próprio `id` — regras do `Formulario.vue`), Telefone com `mask="(99) 99999-9999"`; emite `change` em qualquer edição — validar localmente as três regras de erro com o padrão `error` do kit
- [x] 5.2 Acrescentar a seção "Informações adicionais" na mesma aba: `UiInput disabled` com Cargo (`funcao`) e Setor (`departamento`) e o alerta informativo azul (`border-blue-200 bg-blue-50`, mesmo padrão de `configuracoes/AbaRetencaoAuditoria.vue`) — campos desabilitados, fora da validação e do salvamento
- [x] 5.3 Conectar a aba na página (`v-if="aba === 'dados'"`), com `@change="alterado = true"`; no `salvar()`, validar e focar o primeiro campo inválido — cenários "Informe o nome.", e-mail duplicado de outro usuário e e-mail próprio sem conflito funcionando

## 6. Aba Segurança

- [x] 6.1 Criar `app/components/perfil/AbaSeguranca.vue`: `UiInput` Senha atual (password + Eye/EyeOff), Nova senha (mín. 8) e Confirmação; botão próprio "Alterar senha" — validar senha atual contra `registro.senha || SENHA_DEMO` e formatos, erros no padrão do kit
- [x] 6.2 Em `salvarSenha()` local: grava `senha` no registro, toast de sucesso, limpa os três campos; a nova senha passa a autenticar no `/admin/login` — testar os 4 cenários do spec (atual errada, confirmação divergente, senha curta, sucesso refletindo no login)

## 7. Aba Endereço

- [x] 7.1 Criar `app/components/perfil/AbaEndereco.vue` com os ocho campos do modal (`Formulario.vue` seção Endereço): CEP com máscara + botão ViaCEP (stub `toast.info` "próxima etapa"), Endereço, Número, Complemento, Bairro, Cidade, Estado (`UFS`), Região (`REGIOES`), grids idênticos ao modal; emite `change` — os campos editam `rascunho.endereco` e o stub não preenche nada

## 8. Aba E-mail

- [x] 8.1 Criar `app/components/perfil/AbaEmail.vue` usando `<UsuariosCamposSmtp v-model="rascunho.smtp" @change="alterado = true">` e o aviso de contexto da aba — segurança sugere porta, editar zera status, teste simulado conecta e badge acompanha (mesmo comportamento do modal)

## 9. Documentação da tela

- [x] 9.1 Criar `docs/09 - Meu Perfil.md` no formato do `docs/04`: cabeçalho (versão, escopo, arquivos-fonte, autoridade visual/comportamental), sumário, rota, estrutura da página, cada componente de domínio, comportamento das 4 abas, avatar, salvar/cancelar, navegação pelo menu da conta, verificação (build + visual) e pendências (backend, ViaCEP real, RBAC, e-mail real) — conferir que o documento reflete o código implementado
- [x] 9.2 Atualizar `docs/08 - Login de Autenticação.md` §11: a pendência "Troca da senha provisória ("Meu Perfil")" passa a apontar para `docs/09` — o item não é mais change futura

## 10. Verificação de integração

- [x] 10.1 `openspec validate --specs` passa sem erros para a change `construir-meu-perfil`
- [x] 10.2 `npm run build` passa (único gate automatizado do projeto; não existe lint/test)
- [x] 10.3 Percurso visual completo em `http://localhost:3000`: login → menu da conta → Meu Perfil; as 4 abas, avatar (iniciais, upload, câmera), validações, troca de senha refletindo no login, salvar/cancelar, e regressão do modal de Gestão de Usuários — tudo funcional e sem overflow horizontal em 375px
