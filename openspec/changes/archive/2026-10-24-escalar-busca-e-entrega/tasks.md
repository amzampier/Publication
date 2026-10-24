# Tasks

## 1. Busca FULLTEXT

- [x] 1.1 Criar migration 35 com índices FULLTEXT em `entregas_itens`, `auditoria` e `usuarios`; verificar aplicação idempotente e presença dos índices.
- [x] 1.2 Implementar o adaptador de busca (FULLTEXT para 3+ caracteres, prefixo/igualdade para códigos/e-mails/termos curtos) e usá-lo em Chamadas, Auditoria e Usuários; verificar com `EXPLAIN`.
- [x] 1.3 Adicionar testes de termo textual, prefixo, e-mail, termo curto, acentos e filtros combinados; verificar resultados/contagens.
- [x] 1.4 Atualizar `docs/02`/`docs/15`/`docs/17` com a semântica e o token mínimo; verificar que não prometem substring em todo campo.

## 2. Exportação CSV em fluxo

- [x] 2.1 Criar o helper de CSV streaming com escape (aspas, CR/LF, anti-fórmula) e cursor/keyset; testar com 1, 100 e 10.000 linhas.
- [x] 2.2 Expor `?exportar=1&formato=csv` nas listagens de Chamadas, Auditoria e Usuários com `text/csv` e `Content-Disposition`; verificar que o JSON antigo continua para PDF/compatibilidade.
- [x] 2.3 Aplicar os mesmos filtros/RBAC da listagem e abortar a leitura na desconexão do cliente; testar permissão, filtros e abort.
- [x] 2.4 Atualizar os botões de exportação para baixar o CSV por URL direta, sem montar o arquivo no browser; verificar em Chamadas/Auditoria/Usuários.
- [x] 2.5 Documentar o contrato e o limite de memória em `docs/02`/`docs/15`; verificar que o runbook não promete CSV em memória.

## 3. Assets e produção

- [x] 3.1 Adicionar `routeRules` para `/_nuxt/**` com cache público imutável e `Vary: Accept-Encoding`; verificar que HTML/`/admin` continua sem cache público.
- [x] 3.2 Configurar/validar Brotli/gzip no proxy/Nitro sem dupla compressão e sem recomprimir mídia; verificar `Content-Encoding` e `Vary` em assets textuais.
- [x] 3.3 Criar `docs/18 - Produção.md` com checklist executável (HTTPS, proxies, headers, migrations 1–35, backup/restore, e-mail, pool, compressão/CDN, carga e rollback).
- [x] 3.4 Adicionar verificação automatizada de headers/cache/compressão quando possível; verificar em preview/proxy local.

## 4. Integração

- [x] 4.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; registrar o número de testes e corrigir falhas.
- [x] 4.2 Executar medições de busca/exportação com volume e o checklist de produção em ambiente de teste; registrar resultados e limpar dados.
- [x] 4.3 Executar `openspec validate "escalar-busca-e-entrega" --type change --strict` e `openspec validate --specs`; verificar ambos válidos.
- [x] 4.4 Revisar `git status`/`git diff --stat` e confirmar que só a migration 35 foi adicionada, sem segredos ou artefatos.
