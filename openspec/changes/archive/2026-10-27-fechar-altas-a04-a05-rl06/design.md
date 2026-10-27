# Design

## Context

Ver `proposal.md - Why`. O código já tem as correções de A-04 (pool 20/100, `503 + Retry-After` global e na rota do Painel) e de A-05 (arquivar não altera filhas; `sqlVinculoPublicado`/`itemVisivelNoPortal` negam pelo pai). O que falta é evidência reproduzível e cobertura explícita, sem mudar comportamento.

## Goals / Non-Goals

**Goals:**

- Transformar A-04 em uma verificação reproduzível: N=20 com `ok=20`, `500=0` e `503=0` nos dois endpoints, registrada em `docs/02`.
- Cobrir A-05 com testes explícitos para `release`, `manual` e `projeto` arquivados, além de múltiplos vínculos.
- Deixar escrito o contrato de leitura pública para futuras rotas.

**Non-Goals:**

- Otimizar consultas do Painel/Esteira ou alterar o pool.
- Reconciliar filhas ao arquivar (mudaria o contrato atual).
- Criar APIs públicas de conteúdo ou alterar specs.
- Commitar credenciais ou gravar segredos em arquivos.

## Decisions

1. **Usar o script existente, com critério de falha mais rígido.** `scripts/load-painel-esteira.mjs` já faz login, dispara N requisições e conta `200/503/500`. Ele passa a falhar quando `ok < N` ou houver `503`/`500`, não apenas `500`. Alternativa descartada: validar manualmente a saída, que deixaria `401/403/503` passarem como sucesso.
2. **Executar contra o dev server com credenciais em ambiente.** `ADMIN_EMAIL`/`ADMIN_PASSWORD` ficam apenas no shell; o artefato e o commit não contêm segredo. Alternativa descartada: mock/unitário, que não prova o pool nem a concorrência real.
3. **A-05 permanece gate-based.** Arquivar continua sem tocar nas filhas; a leitura pública usa `sqlVinculoPublicado`/`itemVisivelNoPortal`. A cobertura nova é unitária e explícita para os três tipos de pai. Alternativa descartada: reconciliar filhas no arquivamento, que exigiria mudança de spec, histórico e dados.
4. **Registrar a medição em `docs/02`.** A nota existente passa a citar a execução de 27/10, N e os contadores. Alternativa descartada: deixar a medição antiga de 24/10 como única evidência.
5. **Nota opcional no RL06.** Se o relatório for atualizado, entra apenas uma nota de revalidação de A-04/A-05; os achados históricos não são reescritos.

## Risks / Trade-offs

- [Credenciais inválidas ou senha provisória] → o login pode responder `200`, mas as APIs administrativas `403`; o script passa a falhar por `ok < N` e o operador deve usar uma conta sem senha provisória.
- [Sobrecarga real no N=20] → se houver `503`, o resultado é registrado como falha de A-04; avaliar pool/consultas em vez de mascarar.
- [Efeitos colaterais] → o teste cria sessões e eventos de auditoria append-only; isso é esperado e documentado.
- [Cobertura unitária não impede rota pública futura sem gate] → o contrato escrito em `docs/02` e as specs de visibilidade orientam a revisão; a rota de mídia atual já usa o gate.
- [Medição dependente da máquina] → registrar data, N e ambiente (dev local) junto do resultado.

## Migration Plan

1. Ajustar o script de carga, os testes de visibilidade e a documentação.
2. Subir o dev server, executar N=20 e registrar o resultado.
3. Rodar `npm run test`, `lint`, `typecheck` e `build`.
4. Rollback: reverter apenas script/teste/docs; nenhum schema ou dado de aplicação é alterado.

## Open Questions

Nenhuma. A decisão de manter o gate (opção A) e a conta de teste foram confirmadas.
