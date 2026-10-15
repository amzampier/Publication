# Proposal

## Why

A busca de CEP por ViaCEP está implementada como stub nos dois formulários de endereço do sistema — a aba Endereço de Meu Perfil e a seção Endereço do modal de Gestão de Usuários — exibindo apenas um toast de "próxima etapa" e deixando o usuário digitando logradouro, bairro, cidade, estado e região manualmente. O composable `useViaCep` já foi adicionado ao projeto (`app/composables/useViaCep.ts`) mas ainda não é consumido por nenhum componente; é hora de ligar o ícone existente à consulta real e eliminar a pendência documentada em `docs/09 - Meu Perfil.md`.

## What Changes

- O ícone de busca ao lado do campo CEP passa a consultar a API pública ViaCEP e a preencher automaticamente os campos de endereço nos dois formulários (Meu Perfil e Gestão de Usuários).
- Preenchimento: `logradouro` → Endereço, `bairro` → Bairro, `localidade` → Cidade, `uf` → Estado, `regiao` → Região; `numero` e `complemento` são **preservados** (a ViaCEP não os fornece), e campos que a API devolver vazios permanecem com o valor atual.
- Estados de feedback no clique: CEP incompleto (menos de 8 dígitos), CEP não encontrado na base e falha de rede/consulta, cada um com toast próprio; sem toast de sucesso (o preenchimento dos campos é o próprio feedback).
- Indicador de carregamento no ícone durante a requisição, com o clique bloqueado para evitar consultas duplicadas e timeout/abort para não deixar o ícone preso em voo infinito.
- No Meu Perfil, o preenchimento automático marca o rascunho como alterado (emite `change`), habilitando "Salvar alterações".
- Remoção dos stubs (`toast.info` de "próxima etapa") dos dois componentes.
- Atualização de `docs/09 - Meu Perfil.md` para retirar ViaCEP das pendências.
- **Número do endereço nasce vazio** (ajuste solicitado antes do arquivamento): a coluna
  `usuarios.numero` hoje tem `DEFAULT 'S/N'`, então qualquer `INSERT` sem colunas de endereço
  (importação por planilha, convite, bootstrap) grava `S/N` mesmo com o endereço inteiramente
  vazio. Nova migration altera o default para `''` e limpa o `S/N` legado dos registros cujo
  endereço está vazio (`S/N` junto a endereço preenchido é mantido — é o "sem número" legítimo).
- **Loading da importação por planilha**: enquanto o POST de importação está em voo, o modal
  exibe um painel de progresso listando os registros selecionados (nome + e-mail) com
  indicador de carregamento e a contagem, no lugar da pré-visualização — sem simular conclusão
  de linhas antes da resposta da API.

## Capabilities

### New Capabilities

- `busca-cep`: comportamento da consulta de endereço por CEP ViaCEP — contrato do composable (validação, distinção de falhas, timeout), estados do ícone de busca e preenchimento dos campos de endereço, compartilhado pelos dois formulários.

### Modified Capabilities

- `meu-perfil`: o requirement da aba Endereço deixa de exigir o stub e passa a descrever a busca ViaCEP real com preenchimento automático, estados de feedback e habilitação do "Salvar alterações"; o requirement de documentação deixa de listar ViaCEP como pendência.
- `gestao-usuarios`: o cenário "Ícone de busca de CEP não preenche nada nesta etapa" é substituído pelo comportamento real de preenchimento e feedback no modal de usuário; acrescenta os requirements de **número nascendo vazio** (manual/importação/rotas de criação, com limpeza do legado via migration) e de **progresso da importação** (painel de registros em voo).

## Impact

- **Código**: `app/composables/useViaCep.ts` (refino de contrato), `app/components/perfil/AbaEndereco.vue`, `app/components/usuarios/Formulario.vue` (substituição dos stubs), `app/components/usuarios/Importar.vue` (painel de progresso).
- **Banco**: nova `server/migration/04_numero_vazio_sem_endereco.sql` (default da coluna + limpeza de legados); `docs/bd/01 - banco_dados_mariadb.sql` espelhando o novo default. Migrations `01`–`03` aplicadas não são editadas.
- **Specs**: deltas em `openspec/specs/meu-perfil/spec.md` e `openspec/specs/gestao-usuarios/spec.md`; nova capability `busca-cep`.
- **Docs**: `docs/09 - Meu Perfil.md` (pendência ViaCEP removida).
- **Dependências externas**: nenhuma nova — ViaCEP é API pública sem chave, chamada do navegador via `fetch` (CORS liberado); nenhuma rota de servidor nova.
- **Fora de escopo**: RBAC, validação de endereço contra o banco, busca automática no blur do CEP (mantém-se apenas o clique no ícone), alterações no design system (o ícone já existe e mantém o mesmo markup).
