# Tasks

> Não há runner de testes no repositório; as verificações usam `npm run build`, a execução E2E no
> dev server (`localhost:3000`) e consultas read-only ao MariaDB, conforme o gate do projeto.

## 1. Revogação de sessão centralizada (D1)

- [x] 1.1 Em `server/utils/auth.ts`, criar `revogarSessoesDoUsuario(usuarioId, exec)` que incrementa `usuarios.token_version` e marca `sessoes.revogado_em = NOW()` das sessões abertas do usuário, aceitando o executor (`query` ou `tx.query`). Verificar por inspeção que roda com `query` e com uma transação.
- [x] 1.2 Fazer `revogarAccessVigente` (usado pelo logout) passar a delegar ao helper centralizado (ou manter-se e o helper reusar a mesma lógica), garantindo que o logout também revoga as linhas de `sessoes`. Verificar por inspeção que não há dois caminhos divergentes.
- [x] 1.3 Usar `revogarSessoesDoUsuario` em `alterarSituacaoUsuario` (`server/utils/usuarios.ts:522-540`) no lugar do `UPDATE ... token_version + 1`. Verificar E2E: desativar por `/situacao` → `401` e `POST /api/auth/refresh` com o refresh capturado antes → `401`.

## 2. Sessão e refresh consideram a situação do perfil (D2)

- [x] 2.1 Em `sessaoAtivaNoServidor` (`server/utils/auth.ts:326-337`), incluir `JOIN perfis_acesso` e exigir `usuarios.situacao = 'Ativo'` **e** `perfis_acesso.situacao = 'Ativo'`. Verificar por inspeção e E2E: usuário com perfil ativo segue `200`; perfil inativado → `401`.
- [x] 2.2 Em `renovarSessao` (`server/utils/auth.ts:229-255`), recusar a renovação quando `usuario.perfil_situacao !== 'Ativo'` (além da situação do usuário). Verificar E2E: inativar o perfil e chamar `POST /api/auth/refresh` → `401`.
- [x] 2.3 (Opcional, defesa em profundidade) Ao tornar um perfil não-Ativo em `server/utils/perfis.ts`, revogar (`revogarSessoesDoUsuario`) as sessões dos usuários vinculados. Verificar por inspeção que a mutação e a revogação são atômicas (transação).

## 3. Anti-lockout e desativação pela edição geral (D4/D5)

- [x] 3.1 Em `server/utils/perfis.ts`, extrair `garantirAdministracaoApos(tx)` reutilizável (a contagem de administradores essenciais já existe) e exportá-la para uso em `usuarios.ts`. Verificar por inspeção que `salvarMatriz`/`copiarMatriz` continuam usando a guarda.
- [x] 3.2 Em `server/utils/usuarios.ts`, converter `atualizarUsuario` para transação: aplicar o `UPDATE`, e quando a situação transitar para **Inativo**, chamar `revogarSessoesDoUsuario` (D5) e `garantirAdministracaoApos(tx)` (D4) antes do commit. Verificar E2E: desativar pelo `PUT /api/usuarios/:id` → `401` no acesso e no refresh; reativar → cookie antigo segue `401`.
- [x] 3.3 Aplicar `garantirAdministracaoApos(tx)` em `alterarSituacaoUsuario` e `excluirUsuario` (em transação), respondendo `409` sem gravar quando a operação zerar a administração essencial. Verificar E2E: desativar/excluir o último administrador → `409`; com um segundo administrador → `200`.

## 4. Perfis Ativos nas opções da UI (D3)

- [x] 4.1 Em `listarUsuarios` (`server/utils/usuarios.ts:326-331`), restringir `opcoes.perfis` a `situacao = 'Ativo'`. Verificar E2E: um perfil Inativo criado não aparece em `opcoes.perfis` de `GET /api/usuarios` nem no filtro/modal.
- [x] 4.2 Confirmar que o modal de usuário (`usuarios/Formulario.vue`), os filtros (`usuarios/Filtros.vue`) e a importação (`lerPlanilhaUsuarios`) derivam de `opcoes.perfis`; ajustar se algum usar lista fixa. Verificar que uma planilha com Perfil Inativo marca a linha como "Linha inválida".

## 5. Mensagem real do anti-lockout (D4)

- [x] 5.1 Em `app/components/perfis/Permissoes.vue`, no `salvar` e no `confirmarCopia`, ler o `statusMessage`/`data.statusMessage` do erro `409` e exibi-lo no toast, caindo no texto genérico só quando não houver mensagem. Verificar E2E: tentar salvar a matriz que zera a administração → toast com a mensagem de lockout do servidor.

## 6. Integração, regressão e documentação

- [x] 6.1 Rodar `npm run build` e confirmar sucesso (gate do projeto).
- [x] 6.2 Regressão: confirmar que logout continua revogando (access e refresh → `401`), que o login/`seguro`/`trocar-senha` seguem funcionando com sessão válida e que perfis Ativos seguem atribuíveis/importáveis.
- [x] 6.3 Atualizar `docs/RL04 - Relatório de Qualidade Completo.md` marcando RL04-M-01, RL04-M-09, RL04-M-05, RL04-M-06, RL04-B-10 e RL04-B-14 como **CORRIGIDO**, com a data e o resumo da verificação, e registrar que a Etapa 2 foi concluída.
- [x] 6.4 Confirmar que os deltas de `revogacao-sessao`, `perfis-acesso` e `gestao-usuarios` refletem o comportamento implementado e que `openspec validate endurecer-revogacao-e-autorizacao` passa.