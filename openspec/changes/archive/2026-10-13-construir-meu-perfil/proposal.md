# Proposal

## Why

O item **Meu Perfil** do menu da conta existe desde o shell inicial, mas é um botão morto: sem rota, sem página e sem dono para a pendência declarada no `docs/08` §11 (troca da senha provisória gravada pelo fluxo "Esqueci a senha"). A base de demonstração já mantém todos os dados do usuário logado (contato, endereço, SMTP, avatar), mas hoje só o modal do administrador os expõe — o próprio usuário não tem onde consultar ou atualizar suas informações.

## What Changes

- Nova página `/admin/meu-perfil` (layout `admin`), componentizada em `app/components/perfil/` (`Cabecalho`, `Resumo`, `Avatar`, `Abas`, `AbaDadosPessoais`, `AbaSeguranca`, `AbaEndereco`, `AbaEmail`), com destaque visual para o Avatar (foto ou iniciais, lápis flutuante como único ponto de entrada com `UiUploadFiles` circular + `UiCameraWeb`) sobre card de resumo com degradê vertical suave (delta `brand-tokens`).
- Quatro abas via `UiTabs`: **Dados Pessoais** (nome e telefone com máscara — sem campo de e-mail, que é somente leitura no resumo; Cargo/Setor somente leitura — preenchidos pelo admin no cadastro), **Segurança** (troca de senha com validação contra a senha vigente, botão próprio atômico, layout em 2 colunas e mini-card "Sua conta está segura"), **Endereço** (mesmos campos do modal de usuários, busca CEP como stub "próxima etapa") e **E-mail** (SMTP pessoal).
- Extração do bloco SMTP de `usuarios/Formulario.vue` para o componente compartilhado `usuarios/CamposSmtp.vue`, consumido pelo modal de Gestão de Usuários e pela aba E-mail do perfil — mesma máquina de estados, sem duplicação de comportamento.
- Item **Meu Perfil** do menu do Account passa a declarar `to: '/admin/meu-perfil'` e a navegar (mesmo caminho dos demais itens com rota).
- Documentação: novo `docs/09 - Meu Perfil.md` (espelho do código), seção do avatar em `docs/01 - design_system.md`, tabela do menu da conta em `docs/03 - Header e Sidebar.md` (Meu Perfil ganha rota) e atualização da pendência do `docs/08` §11.
- Fase 1 como nas demais telas: tudo em memória (rascunho clonado do registro da base demo), sem backend, sem persistência.

## Capabilities

### New Capabilities

- `meu-perfil`: página do perfil do usuário logado — rota, composição (cabeçalho, resumo lateral com avatar, abas), edição de dados pessoais/endereço/SMTP, troca de senha, foto de perfil, salvar/cancelar e integração com a sessão.

### Modified Capabilities

- `design-system/layout-navigation`: o requirement "Itens de navegação podem declarar rota e os sem rota avisam que estão em construção" passa a prever **Meu Perfil** declarando rota (`/admin/meu-perfil`) e navegando ao clique — hoje o spec registra que o item mantém comportamento próprio sem navegação.

## Impact

- **Código:** `app/pages/admin/meu-perfil.vue` (nova), `app/components/perfil/*` (novos), `app/components/usuarios/CamposSmtp.vue` (novo, extraído), `app/components/usuarios/Formulario.vue` (consumir `CamposSmtp` — regressão estrutural sem mudança de comportamento), `app/config/navigation.ts` (`accountMeuPerfil.to`), `app/components/layout/AppHeader.vue` (item Meu Perfil navega).
- **Dados:** `useUsuariosDemo` (leitura/escrita do registro do usuário logado), `useAuth` (sessão fornece o `id`), `config/brasil.ts` e `app/utils/cookies.ts` permanecem sem alteração.
- **Especificações:** capability nova `meu-perfil`; delta em `design-system/layout-navigation`. `login` não muda em nível de requirement (a "troca no Meu Perfil" só aparece como item de documentação).
- **Documentação:** `docs/09` (novo), `docs/01`, `docs/03`, `docs/08`.
- **Fora de escopo:** backend/persistência, envio real de e-mail, ViaCEP real, RBAC por perfil, nova seção na vitrine `/design` (nenhum componente de kit nasce nesta change — `UiUploadFiles`, `UiCameraWeb` e `UiTabs` já têm seção).
