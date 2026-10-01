# Design

## Context

Dois documentos de base (`docs/01 - design_system.md`, 672 linhas; `docs/02 - Guia de Arquitetura e Migrations.md`, 620 linhas) foram escritos para o FinancePro (ERP multi-tenant financeiro) e precisam ser adaptados ao Publications (Dicas Teorema) — sistema sem multi-tenant, com Área Pública (leitura anônima) e Área Administrativa (cadastros e publicação de Releases Week Semanal, Manuais, Escopo de Projetos). Motivação completa em proposal.md.

Restrições verificadas no repositório (estado atual):

- Os 19 componentes em `app/components/ui/` existem e **não serão alterados** — labels fixos como `Reconciliado` (Badge.vue) permanecem.
- O shell existe parcialmente (`app/layouts/default.vue`, `AppHeader.vue`, `AppSidebar.vue`) mas `app/app.vue` ainda renderiza `<NuxtWelcome/>` sem `<NuxtPage/>`; `AppHeader` e `navigation.ts` ainda contêm conteúdo FinancePro (texto "FinancePro", seletor Matriz/Filial, sessões multi-filiais).
- `app/pages/design.vue` (vitrine `/design`) existe com dados de demo FinancePro.
- `openspec/specs/` está vazio — a spec `design-system` citada pelo doc 01 não existe; nenhum artefato de spec será criado nesta change (`skip_specs: true`).
- Não há `server/`, nem dependências de banco/auth (só nuxt + tailwind) — o doc 02 é um **guia de arquitetura** a seguir quando o backend for criado, não uma descrição do que existe.

## Goals / Non-Goals

**Goals:**

- Reescrever os dois documentos removendo toda referência a FinancePro/multi-tenant e incorporando a identidade dual de áreas do Publications.
- Manter a natureza de cada doc: doc 01 = definição dos padrões de design system que o sistema deve seguir; doc 02 = guia de arquitetura e migrations (referência para replicação/implantação futura).
- Preservar a estrutura técnica dos docs: sumário, âncoras internas, tabelas de props dos componentes (fiéis ao código), tokens de cor e convenções.

**Non-Goals:**

- Alterar qualquer arquivo de código (`app/components/**`, `app/layouts/**`, `navigation.ts`, `design.vue`, `app.vue`).
- Adaptar `docs/qa/*` (próxima rodada).
- Criar specs em `openspec/specs/` ou a spec `design-system`.
- Instalar dependências ou criar `server/`.

## Decisions

1. **Stance do doc 01: estado alvo, não estado atual.** O doc 01 descreve o design system que o sistema *deve seguir*; o shell real ainda tem resíduos FinancePro. Alternativa descartada: marcar pendências inline (poluiria o doc de status transitório). A divergência doc↔código fica registrada aqui como follow-up, não no doc.

2. **Remoção total do seletor Matriz/Filial (§3.2), sem substituto de troca.** Zona esquerda do header = toggle + logo + nome institucional. Alternativas consideradas: indicador fixo de área (informativo, mas sem necessidade — a área é evidente pela rota) e seletor Pública↔Admin (espelharia o padrão de tenant que queremos eliminar). Decisão do usuário: opção simples.

3. **Sessões da sidebar do domínio**: `Publicações` (Releases Week Semanal, Manuais, Escopo de Projetos) + `Administração` (Usuários, Perfis de Acesso, Auditoria, Configurações). Alinhada ao que `navigation.ts` terá que se tornar depois (código não alterado agora).

4. **Mapeamento status→Badge como documentação de uso, não mudança de componente.** Nova tabela no §5.2: Publicado→`done`, Agendado→`pending`, Em Revisão→`inReview`, Bloqueado→`blocked`, Rascunho→`neutral`; variante `reconciled` ("Reconciliado") marcada como reservada/não usada no domínio. Alternativa descartada: renomear variantes (violaria a restrição de não tocar componentes).

5. **Tokens de cor preservados byte a byte.** Só a coluna *Aplicação* das linhas Esmeralda/Rose/Índigo é reescrita (Receitas/Despesas/Conciliação → semântica de publicação). Os componentes referenciam esses tokens; mudar hex/nome quebraria o design system.

6. **Doc 02 mantém natureza de guia** com exemplos reescritos para o domínio: endpoint `server/api/publicacoes/index.post.ts`, `USE publications;`, extras RBAC `publicar`/`arquivar`, `can('publicacoes','criar')`, redirect `/admin/login`. Ganha subitem "Áreas do Sistema" em §2 documentando o roteamento público × `/admin/**`.

7. **Identificadores de código reais mantidos** (`.fp-shell`, `.fp-modal-body`, `fp-toast-progress`): referenciam classes que existem no CSS; renomeá-los seria mudança de código. Serão atualizados quando o código for migrado (fora desta change).

8. **Título e cabeçalho**: `Design System — Publications (Dicas Teorema)`; link da spec substituído por nota de que a spec será criada depois e o doc é a referência até lá.

## Risks / Trade-offs

- [Doc §3 descreve shell que ainda tem "FinancePro" no código] → Aceito e registrado: mudança de código fica para follow-up; risco de confusão é baixo (equipe sabe que componentes são intocados nesta fase).
- [Âncoras/links internos do doc 01 quebrarem ao remover §3.2] → Verificação por grep de âncoras após edição; nenhum link aponta para `#32-...` (verificado na exploração).
- [Resíduos FinancePro escaparem da revisão] → Verificação final: grep por `FinancePro|filial|CNPJ|concilia|lancament|SEFAZ|SPED|multi-tenant|contábil` nos 2 arquivos, esperado zero (exceto identificadores `.fp-*` legítimos).
- [Doc 02 parecer descrever sistema inexistente (server/, MySQL)] → Redigido como guia/replicação desde a introdução; a natureza-guia é explicitada, não mudada.

## Migration Plan

Sem implantação de código. Ordem de execução: doc 01 primeiro (maior reescrita conceitual), depois doc 02 (trocas pontuais), depois verificação por grep. Rollback = git (arquivos são texto puro).

## Open Questions

Nenhuma bloqueante. Dúvida adiável: data/versão do cabeçalho do doc 01 (mantida 1.0.0 / 2026-09-28, pode ser atualizada quando a spec for criada).
