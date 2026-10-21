# Design

## Context

Ver `proposal.md` — Why. O estado atual que condiciona o desenho:

- `app/components/lancar-chamadas/useLancarChamadasModelo.ts` já tem o contrato de tela
  (`ChamadaModelo`, `EntradaChamada`, `CatalogosChamada`) e `shared/lancar-chamadas.ts` concentra
  validação, origem, filtros, KPIs e guardas. Hoje a tela usa um seed em memória e só reexporta o
  shared via `validadores.ts`.
- A tabela `entregas_itens` já existe com FKs, `imagens`/`tags` JSON e `status` ENUM
  `Revisar|Aprovado|Publicar`; faltam `Recusado`, `manual_titulo` e unicidade de `chamada`.
- O runner (`server/utils/migration-runner.ts`) tolera `errno 1062`; um `ADD UNIQUE` que encontre
  duplicatas seria ignorado silenciosamente. O boot é fail-fast (`server/plugins/migration.ts`).
- Os módulos Manuais/Softwares/Parceiros já usam o padrão “parser `.xlsx` no cliente + revalidação
  no servidor + transação all-or-nothing” com `exceljs` (já é dependência).
- Uploads hoje têm três destinos planos (`logomarcas`, `avatares`, `logos`) em
  `server/utils/uploads.ts`; o `POST /api/uploads` valida permissão por destino e nunca preserva a
  extensão enviada.
- `entregas_itens` já tem os campos de snapshot (`parceiro`, `software`, `modulo`, `release`) que a
  tela exibe; o backend deve preenchê-los na escrita para não depender de joins na leitura.

## Goals / Non-Goals

**Goals:**

- API de `lancar-chamadas` com o shape `ChamadaModelo` (camelCase, datas civis `AAAA-MM-DD`,
  timestamps ISO), para trocar o seed sem reescrever a tela.
- Escrita transacional, RBAC no servidor e auditoria em todas as rotas.
- Migração 24 idempotente e verificada, sem deixar a unicidade de `chamada` “meio aplicada”.
- Importação `.xlsx` previsível: preview no cliente, revalidação no servidor, 500 linhas, rollback
  total em qualquer erro.
- Ciclo de vida das imagens: upload no salvar, URLs no JSON, remoção de arquivos only-after-commit e
  sem apagar arquivo compartilhado.
- Preservar filtros, busca, ordenação, KPIs e relatórios no cliente (sem paginação server-side).

**Non-Goals:**

- Paginação/filtros server-side da listagem de chamadas.
- Área Pública, ação Arquivar, uso de `anexos_midias` e importação de imagens pela planilha.
- Limpeza de uploads órfãos de chamadas canceladas ou de writes que falharam depois do upload.
- Alterar o layout/UX do módulo ou o catálogo dos demais módulos.
- Migrar automaticamente dados duplicados de `chamada`; a correção é operacional e explícita.

## Decisions

### 1. Contrato da API espelha `ChamadaModelo`

`GET /api/lancar-chamadas` devolve `{ chamadas: ChamadaModelo[] }`; `GET /api/lancar-chamadas/opcoes`
devolve `CatalogosChamada` (releases com `dataPublicacao`, projetos, manuais, softwares, parceiros).
As escritas devolvem a chamada criada/alterada no mesmo shape. O cliente continua filtrando,
buscando, ordenando e calculando KPIs localmente.

- **Por quê:** elimina um adaptador grande na tela e mantém a fonte única de tipos em
  `shared/lancar-chamadas.ts`.
- **Alternativa descartada:** devolver o shape tabular do banco e adaptar em cada componente — mais
  código e risco de divergência de datas/JSON.
- `temHistorico` é derivado no servidor como `status !== 'Revisar'` (não há tabela de histórico do
  item); a exclusão continua permitida apenas em `Revisar`. O campo permanece no contrato para a
  guarda da UI.

### 2. Escrita resolve vínculos, deriva origem e grava snapshots

No create/update, o servidor:

1. valida o corpo com `validarChamada` (shared) e normaliza tags;
2. resolve release/projeto/manual/software/parceiro por id em queries separadas;
3. rejeita com `400` vínculo inexistente/incompatível;
4. deriva `origem` com `derivarOrigem` (nunca aceita a origem do cliente);
5. herda `data_liberacao` de `release_week.data_publicacao` quando vazia;
6. grava `release` (código), `software` (descrição), `parceiro` (nome fantasia) e `modulo` como
   snapshots;
7. preenche `autor_id`/`autor_nome` pela sessão e `id` com UUID.

Status: criação em `Revisar`; aprovação `Revisar -> Aprovado`; recusa `Revisar -> Recusado`.
Transições fora disso retornam `409` (estado inválido). O número `chamada` é único e a checagem de
duplicidade é feita antes do insert/update e reforçada pelo índice.

- **Por quê:** a tela precisa dos textos sem joins e o banco não pode depender de dados derivados
  enviados pelo cliente.
- **Alternativa descartada:** resolver tudo em um único `JOIN` no INSERT — mais difícil de validar e
  de devolver mensagens por campo.

### 3. Migração 24 + verificação de unicidade no boot

`server/migration/24_lancar-chamadas_backend.sql`:

- `ALTER TABLE entregas_itens MODIFY status ENUM('Revisar','Aprovado','Recusado','Publicar') ...`;
- `ADD COLUMN manual_titulo VARCHAR(255) NULL` (idempotente via `IF NOT EXISTS`);
- `DROP INDEX IF EXISTS idx_entregas_chamada` e `ADD UNIQUE KEY uk_entregas_chamada (chamada)`;
- `UPDATE permissoes_perfil` com `JSON_ARRAY_APPEND` de `importar` para Administrador e Editor no
  módulo `lancar-chamadas`, apenas quando ainda não existe.

O boot ganha uma verificação antes/depois de `runMigrations`:

- **pré:** `SELECT chamada, COUNT(*) ... GROUP BY chamada HAVING COUNT(*) > 1 LIMIT 5`; se houver
  duplicatas, aborta com mensagem listando exemplos (não deixa o `1062` ser tolerado).
- **pós:** `SHOW INDEX FROM entregas_itens WHERE Key_name = 'uk_entregas_chamada'`; se o índice não
  existir, aborta com instrução de correção.

- **Por quê:** o runner tolera `1062` por design; sem a verificação, o app subiria sem o índice e a
  duplicidade voltaria a ser possível.
- **Alternativa descartada:** deduplicar automaticamente — escolheria arbitrariamente qual chamada
  manter e apagaria dados de negócio.
- A collation `utf8mb4_unicode_520_ci` já torna a unicidade case-insensitive, coerente com a
  validação do cliente (`toLowerCase`).

### 4. Importação: parser puro no cliente, revalidação e transação no servidor

Novo parser `app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts`:

- `exceljs` com import dinâmico (não entra no bundle inicial);
- cabeçalho exato do modelo versionado; linhas vazias ignoradas;
- datas aceitam `Date` do Excel, `dd/mm/aaaa` e `AAAA-MM-DD`;
- tags separadas por `;` (trim, dedupe, limites do shared);
- códigos: release/projeto/manual por `codigo`; software/parceiro por `id` (`SFT-...`/`PAR-...`);
- classificação `pronto | já cadastrado | repetido | inválido`, com motivo por linha.

`POST /api/lancar-chamadas/importar` recebe `{ linhas: [...] }` já normalizadas, exige
`lancar-chamadas/importar`, rejeita mais de 500 linhas e revalida TUDO no servidor (não confia no
preview). O commit é uma única transação:

- conflito/duplicidade/invalidez em qualquer linha -> `400`/`409` com `motivos`, nada gravado;
- cada linha nasce `status = 'Revisar'`, `situacao = 'Desenvolvimento'` e origem derivada;
- `data_liberacao` vazia herda a publicação da release;
- sem imagens, sem `status`/`situação` da planilha.

- **Por quê:** segue o padrão já provado em Manuais; o cliente dá feedback rápido e o servidor
  continua sendo a autoridade.
- **Alternativa descartada:** enviar o binário `.xlsx` ao servidor — duplicaria o parser e aumentaria
  o payload sem ganho de segurança, já que a validação de negócio continua necessária.
- **Limite:** 500 linhas por importação (constante compartilhada server/client) para manter a
  transação curta.

### 5. Upload de imagens no salvar, com subpasta por ano/mês

`server/utils/uploads.ts` passa a aceitar `chamadas` e um segmento opcional de subpastas:

- `gravarUpload('chamadas', nome, dados, tipo, [ano, mes])` grava em
  `uploads/chamadas/<ano>/<mes>/` e devolve `/uploads/chamadas/<ano>/<mes>/<arquivo>`;
- `ano`/`mes` vêm de `data_lancamento`, não da data do servidor;
- `POST /api/uploads` lê `pasta`, `ano` e `mes`; valida `ano` com 4 dígitos e `mes` 01-12; exige
  `criar` OU `alterar` em `lancar-chamadas`; mantém as validações de magic bytes/tamanho/extensão.

No cliente, `Midias.vue` continua produzindo data URLs no rascunho. No `salvar` do formulário:

1. separa URLs já persistidas (`/uploads/chamadas/...`) de data URLs novas;
2. envia cada data URL como `File` para `POST /api/uploads` com `pasta=chamadas`, `ano`, `mes`;
3. substitui cada data URL pela URL retornada;
4. só então chama `POST`/`PUT` de chamadas. Falha de upload aborta o salvamento.

- **Por quê:** evita arquivos órfãos no simples clique da imagem e mantém a pasta previsível.
- **Trade-off aceito:** se o write da chamada falhar depois do upload, os arquivos ficam órfãos; a
  limpeza desse caso fica fora de escopo (não há transação entre FS e DB).

### 6. Remoção de imagens only-after-commit e preservando compartilhadas

No update, o servidor compara `imagens` antigas e novas; no delete, lê as imagens antes de apagar a
linha. Depois do commit:

- considera apenas URLs que começam com `/uploads/chamadas/`;
- resolve o caminho real e confirma que está dentro de `uploads/chamadas` (anti path traversal);
- verifica se outro registro de `entregas_itens` ainda referencia a URL (comparação em JS sobre as
  linhas candidatas, volume pequeno por chamada);
- remove com `unlink`; `ENOENT` e falhas de FS são logadas e não desfazem a operação.

- **Por quê:** o banco é a fonte de verdade; apagar antes do commit poderia destruir imagem de uma
  chamada que continuou existindo. A checagem de referência evita quebrar imagem compartilhada.
- **Alternativa descartada:** `ON DELETE CASCADE` em `anexos_midias` — a tabela não é usada pelo
  módulo e não cobre arquivos físicos.

### 7. RBAC: `importar` no catálogo e guarda de download

- `app/config/perfis.ts` e `server/utils/perfis.ts` adicionam `importar` ao módulo
  `lancar-chamadas`; o total do catálogo passa de 90 para 91.
- Administrador 91/91 e Editor 66/91 recebem `importar`; Revisor 39/91 e Leitor 14/91 permanecem sem.
- Rotas: `visualizar` (lista/opções), `download` (lista com `?download=1`), `criar`, `alterar`
  (editar/recusar), `publicar` (aprovar), `excluir`, `importar`.
- `?download=1` retorna o mesmo JSON sob a permissão `download`; o PDF/CSV continua sendo gerado no
  cliente. Assim a ação de relatório é autorizada no servidor sem mover a geração de arquivo.
- A ação “Importar” na UI usa `.can('lancar-chamadas', 'importar')`.

- **Por quê:** mantém a matriz dinâmica e o padrão de precedência de exportação já usado nos outros
  módulos.
- **Alternativa descartada:** reutilizar `criar` para importar — negaria a operação em massa a um
  perfil que pode criar chamadas individualmente.

### 8. Auditoria e respostas de erro

Toda escrita chama `registrarAuditoria` depois do sucesso, com recurso `Lançar as Chamadas`,
`entidadeId` e ação `Inclusão`/`Alteração`/`Exclusão`/`Homologação` (aprovar). Importação registra
uma entrada com a contagem. Erros usam `400` (validação/vínculo), `403` (RBAC), `404` (id), `409`
(duplicidade/transição inválida); a UI mostra `statusMessage`/`data.motivos`.

- **Por quê:** consistência com os demais módulos e rastreabilidade do volume importado.

## Risks / Trade-offs

- **Duplicatas pré-existentes impedem o boot** -> pré-checagem falha com exemplos e instrução de
  limpeza; é preferível a subir sem o índice.
- **Índice único silenciosamente ausente** -> verificação `SHOW INDEX` pós-migração derruba o boot.
- **Lista completa em memória** -> volume atual é administrativo; filtros/paginação server-side
  ficam como evolução futura. O download usa o mesmo conjunto.
- **Upload órfão após falha do write** -> aceito e documentado; não apaga arquivos de uploads
  cancelados nesta change.
- **Corrida entre dois deletes/edições** -> a checagem de referência e o `unlink` best-effort podem
  deixar arquivo sem referência em caso extremo; não corrompe o banco.
- **Divergência cliente/servidor na validação** -> ambos usam `shared/lancar-chamadas.ts`; o parser
  de planilha tem testes puros.
- **`exceljs` no cliente** -> import dinâmico evita peso no bundle inicial; arquivos grandes são
  limitados a 500 linhas.
- **Rollback da migration** -> encolher o ENUM pode falhar se existirem `Recusado`; o rollback
  documentado mantém o valor e remove apenas o índice/coluna quando seguro.

## Migration Plan

1. Backup do banco.
2. Rodar a pré-checagem de duplicatas; se houver, corrigir manualmente os `chamada` repetidos.
3. Subir a aplicação: migration 24 aplica enum, coluna, índice e `importar`; a verificação pós
   confirma `uk_entregas_chamada`.
4. Smoke test: CRUD, aprovar/recusar, upload em `uploads/chamadas/<ano>/<mes>/`, exclusão com
   remoção de arquivo, importação válida e inválida, 403 sem `importar`.
5. Rollback: reverter o código; remover `importar` dos extras; recriar `idx_entregas_chamada` e
   remover `uk_entregas_chamada`; manter `manual_titulo` e `Recusado` se houver dados (o ENUM não
   deve ser encolhido com valores em uso).
