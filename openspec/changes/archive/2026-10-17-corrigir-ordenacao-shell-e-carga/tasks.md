# Tasks

> Não há runner de testes no repositório; as verificações usam `npm run build`, a execução E2E no
> dev server (`localhost:3000`) e consultas read-only ao MariaDB.

## 1. Ordenação no servidor (backend)

- [x] 1.1 Em `server/utils/usuarios.ts`, `listarUsuarios` aceita `ordenar`/`direcao` e monta o `ORDER BY` por uma whitelist de colunas (nome, email, perfil, status, ultimoAcesso), ignorando id desconhecido (padrão: `u.nome_completo ASC`). Verificar por `EXPLAIN`/E2E que a ordenação muda o conjunto paginado.
- [x] 1.2 Em `server/utils/audit.ts`, `listarAuditoria` aceita `ordenar`/`direcao` com whitelist (dataHora, usuario, acao, recurso, detalhes, ip), padrão `data_hora DESC`. Verificar E2E.
- [x] 1.3 Em `server/api/usuarios/index.get.ts` e `server/api/auditoria/index.get.ts`, ler `ordenar`/`direcao` da query e repassar (só `asc`/`desc` válidos). Verificar E2E que `?ordenar=nome&direcao=desc` reordena.

## 2. Ordenação no servidor (cliente)

- [x] 2.1 Em `app/components/usuarios/useUsuarios.ts`, guardar o estado de ordenação, incluí-lo na query de `carregarUsuarios` e expor `ordenarPor(regras)` (reset para a 1ª página + recarga). Verificar por inspeção.
- [x] 2.2 Em `app/components/auditoria/useAuditoriaModelo.ts`, o mesmo para a auditoria. Verificar por inspeção.
- [x] 2.3 Em `usuarios/Tabela.vue` e `auditoria/Tabela.vue`, ouvir `@sort-change` e chamar a ação de ordenação do composable. Verificar E2E: clicar em "Nome"/"Usuário" reordena o conjunto pela API.

## 3. Preferências do shell para todos os perfis (M-03)

- [x] 3.1 Criar `server/api/configuracoes/shell/index.get.ts` (apenas sessão) devolvendo `logo_header_url`, `logo_login_url`, `sidebar_grupos`, `sidebar_expandida` (sem rate limit/retenção). Verificar E2E: Editor recebe `200` (e `GET /api/configuracoes` segue `403`).
- [x] 3.2 Em `app/composables/useConfiguracoesGlobais.ts`, adicionar `carregarShell()` (cache `config-shell-cache`) que aplica as preferências ao estado do shell. Verificar por inspeção.
- [x] 3.3 Em `app/layouts/admin.vue`, hidratar o shell via `carregarShell()` em vez do endpoint gated. Verificar E2E: usuário não-Administrador (Editor) vê a logo/sidebar salvas ao abrir `/admin`.

## 4. Cache de configurações após salvar (M-04)

- [x] 4.1 Em `app/pages/admin/configuracoes-globais.vue`, após o `PUT` confirmar, atualizar os caches (completo e do shell) com a resposta e reaplicar o estado. Verificar E2E: salvar, navegar e voltar (sem F5) mostra os valores salvos.

## 5. Recuperação de senha fora do caminho da resposta (M-07)

- [x] 5.1 Em `server/api/auth/esqueci-senha/index.post.ts`, emitir a resposta genérica após a resolução da conta + trilha e mover geração/envio/`UPDATE` para uma tarefa pós-resposta via `event.waitUntil` (fallback sem await). Verificar E2E: latência equivalente existente × inexistente e senha só troca após o envio.
- [x] 5.2 Garantir a ordem "entrega antes da troca": o `UPDATE` do hash ocorre só após `enviarEmail` resolver com sucesso (falha mantém a senha anterior). Verificar por inspeção + teste com e-mail não cadastrado.

## 6. Falha de carga zera o resumo (M-08)

- [x] 6.1 Em `useUsuarios.ts`, no `catch` de `carregarUsuarios`, zerar `total`, `kpis` e `opcoes` além da lista. Verificar E2E/inspeção.
- [x] 6.2 Em `useAuditoriaModelo.ts`, no `catch` de `carregarAuditoria`, zerar `total`, `kpis` e `opcoes` além da lista. Verificar E2E/inspeção.

## 7. Integração, regressão e documentação

- [x] 7.1 Rodar `npm run build` e confirmar sucesso (gate do projeto).
- [x] 7.2 Regressão: paginação/busca/filtros seguem funcionando; exportações seguem consultando o servidor; `GET /api/configuracoes` completo segue gated; login e página de Configurações Globais inalterados.
- [x] 7.3 Atualizar `docs/RL04 - Relatório de Qualidade Completo.md` marcando RL04-M-02, RL04-M-03, RL04-M-04, RL04-M-07 e RL04-M-08 como **CORRIGIDO**, com a data e o resumo, e registrar que o núcleo funcional da Etapa 3 foi concluído.
- [x] 7.4 Confirmar que os deltas de `gestao-usuarios`, `auditoria`, `configuracoes-globais` e `login` refletem o comportamento implementado e que `openspec validate corrigir-ordenacao-shell-e-carga` passa.