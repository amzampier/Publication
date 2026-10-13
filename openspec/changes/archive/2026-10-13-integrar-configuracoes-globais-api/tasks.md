# Tasks

## 1. Infra de uploads (diretório + serving)

- [x] 1.1 Adicionar `uploads/` ao `.gitignore` preservando `.gitkeep` (`uploads/**` ignorado, `!uploads/**/.gitkeep`) e criar `uploads/logomarcas/.gitkeep` + `uploads/avatares/.gitkeep` — verificar que `git status` mostra só os `.gitkeep` como rastreáveis e os futuros arquivos ficam ignorados
- [x] 1.2 Registrar `nitro.publicAssets` em `nuxt.config.ts` apontando `baseURL: '/uploads'` para `<rootDir>/uploads` — verificar com dev server no ar que `GET http://localhost:3000/uploads/logomarcas/.gitkeep` retorna 200 e `npm run build` continua verde
- [x] 1.3 Documentar no `AGENTS.md` o gotcha de `uploads/` (pasta na raiz servida via `nitro.publicAssets`, não usar `public/uploads/`) — verificar que o texto condiz com o estado do repositório

## 2. Backend — API de configurações e uploads

- [x] 2.1 Implementar `server/utils/configuracoes.ts` com `getConfiguracoes()` (lê a linha `config_default` inteira de `configuracoes_globais`) e `atualizarConfiguracoes(patch)` (UPDATE parcial só das colunas do patch) — verificar que `npm run build` compila
- [x] 2.2 Implementar `server/api/configuracoes/index.get.ts` devolvendo a linha completa em JSON — verificar em dev que o JSON tem todos os campos (`nome_empresa`, `banner_*`, `sidebar_grupos`, `logo_header_url`, `logo_login_url`, `dias_retencao_auditoria`) e `dias_retencao_auditoria` = 180 no seed
- [x] 2.3 Implementar `server/api/configuracoes/index.put.ts` aceitando `{ dias_retencao_auditoria, logo_header_url, logo_login_url, sidebar_grupos }`, validando (retenção inteiro 30–730, URLs string ≤ 500, `sidebar_grupos` objeto com as 4 chaves booleanas), atualizando parcialmente e devolvendo a linha atualizada; payload inválido → 400 — verificar em dev: PUT retenção 365 reflete no GET, PUT retenção 10 retorna 400, campos fora do patch (ex.: `banner_texto`) não são alterados
- [x] 2.4 Implementar `server/utils/uploads.ts` + `server/api/uploads/index.post.ts`: destinos permitidos (`logomarcas`, `avatares`), sanitização do nome (espaços → `-`, sem `/` `\` `..`), colisão com sufixo `-1`/`-2`, limite 5 MB, MIME png/jpeg/webp/gif, `mkdir recursive`, resposta `{ url }`; inválido → 400 sem gravar — verificar em dev: upload de PNG → 200 com URL `/uploads/logomarcas/<nome>` e arquivo no disco; `.txt` → 400; destino `../fora` → 400; imagem > 5 MB → 400; colisão de nome gera sufixo

## 3. Frontend — infra de chamada e mapeamento

- [x] 3.1 Implementar `app/composables/useApiFetch.ts` (wrapper do `$fetch` com `credentials: 'include'` e headers `x-usuario-id`/`x-usuario-nome` de `useState('auth-usuario')`, sem auto-refresh de 401) — verificar que `npm run build` compila e a função existe para uso nos próximos passos
- [x] 3.2 Criar `app/config/sidebar-keys.ts` com os pares label↔chave (`Publicações`↔`publicacoes`, `Movimentos`↔`movimentos`, `Cadastros`↔`cadastros`, `Administração`↔`administracao`) e helpers `chavePorLabel`/`labelPorChave` — verificar que os 4 pares batem com as chaves de `sidebar_grupos` do seed e com os labels de `app/config/navigation.ts`

## 4. Frontend — wiring da página de Configurações Globais

- [x] 4.1 Em `configuracoes-globais.vue`, hidratar no `onMounted` via `GET /api/configuracoes`: `diasRetencao`, `useLogomarcaHeader`/`useLogomarcaLogin` (caminho; sem preview dataURL — prévia vem do caminho), `useSessoesAbertas` (converter chaves do JSON em labels) e `useSidebarExpandida` (defaults do seed quando ausente); falha do GET → defaults do seed e tela utilizável — verificar em dev: salvar valores, recarregar e vê-los restaurados; com API fora do ar, a página abre com 180/marca padrão/todas abertas
- [x] 4.2 Trocar o `salvar()` da página por `PUT /api/configuracoes` via `useApiFetch` com `{ dias_retencao_auditoria, logo_header_url, logo_login_url, sidebar_grupos }` (sidebar convertido de labels para chaves); sucesso → toast sucesso + `alterado = false`; falha → toast erro + `alterado` mantido — verificar em dev: alterar retenção → Salvar → recarregar → valor persiste; simular falha (parar o MariaDB) → toast de erro e botão continua habilitado
- [x] 4.3 Em `AbaLogomarcas.vue`, enviar `FormData` (`file` + `pasta=logomarcas`) ao `POST /api/uploads` na seleção do arquivo e usar a URL retornada no campo de caminho (campo desabilitado, badge e limpar continuam como estão; upload não depende do Salvar) — verificar em dev: selecionar imagem → caminho vem do servidor (sufixo em caso de colisão), prévia aparece, e a URL abre em nova aba; limpar continua voltando à marca padrão
- [x] 4.4 Criar `server/migration/03_add_sidebar_expandida.sql` (coluna `sidebar_expandida TINYINT(1) NOT NULL DEFAULT 1` em `configuracoes_globais`, sem `USE`, rollback comentado) e estender `configuracoes.ts` + `index.put.ts` (campo `sidebar_expandida` booleano no GET/PUT com validação 400) — verificar em dev: boot aplica a migration (`_migrations` = 3), PUT `sidebar_expandida:false` reflete no GET
- [x] 4.5 Corrigir a persistência pós-implantação: na página, hidratar e enviar `sidebar_expandida` (com `marcarPreferenciaManual()` na hidratação para a viewport não sobrescrever); em `AbaLogomarcas`, watch `immediate` global→local para as refs da aba refletirem a hidratação do GET — verificar em dev: salvar logo + sidebar recolhida, recarregar com a aba Logomarcas já ativa → logo aparece no card, e a sidebar do shell abre recolhida
- [x] 4.6 Criar `app/composables/useConfiguracoesGlobais.ts` (`carregarConfiguracoesGlobais()` aplica logos/sidebar/sessões no estado compartilhado) e chamá-lo no `onMounted` do layout admin — verificar em dev: com preferências salvas (sidebar recolhida + logo), F5 em qualquer rota `/admin` abre com a sidebar recolhida e a logo no header, sem visitar Configurações Globais
- [x] 4.7 Em `AbaLogomarcas`, desabilitar o campo de caminho quando o valor vier do servidor (upload **ou** hidratação — flag `veioUpload*` setado também na sincronização global→local) e suprimir o `change` durante a sincronização de hidratação — verificar em dev: recarregar a página com logo salva → campo desabilitado, badge "Personalizada", e o botão Salvar continua desabilitado até uma alteração real

## 5. Verificação de integração

- [x] 5.1 Rodar `npm run build`, subir dev e percorrer o fluxo completo: load hidrata do GET, upload de logo grava em `uploads/logomarcas/` e a URL abre, Salvar faz PUT, recarregar restaura tudo, aba Segurança continua demo (Liberar/Atualizar só em memória) — verificar também que `GET /api/configuracoes` e `PUT` funcionam sem cookie de sessão (sem guard, por decisão)
- [x] 5.2 Rodar `openspec validate "integrar-configuracoes-globais-api" --strict` e corrigir qualquer erro apontado nos deltas
