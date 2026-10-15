# Design

## Context

Ver `proposal.md` — Why. Contexto mínimo:

- `app/composables/useViaCep.ts` existe e é puro cliente da API (`fetch` → `Endereco | null`), sem consumo em nenhum componente.
- Os dois pontos de integração têm markup de ícone idêntico (`span[role=button]` fora do input + `UiTooltip` + `MapPinCheck`) e stub `toast.info` próprio: `app/components/perfil/AbaEndereco.vue` (emite `change` para habilitar o salvar) e `app/components/usuarios/Formulario.vue` (rascunho com watcher deep).
- ViaCEP testado ao vivo: sucesso devolve também `regiao` (valores idênticos aos de `REGIOES`) e `uf` (sigla idêntica aos `UFS`); não encontrado = HTTP 200 com `{"erro": "true"}` (string); URL malformada = HTTP 400 com HTML (hoje inalcançável pela validação de 8 dígitos).
- `useToast` expõe `success | warning | danger | info` com assinatura `(title, message?)`; títulos por módulo já são o padrão ("Meu Perfil", "Gestão de Usuários").
- Padrão de spinner do projeto: `LoaderCircle` + `animate-spin` (`UiLoading`, `UiButton`); movimento reduzido já é coberto pela regra global em `app/assets/css/main.css`.

## Goals / Non-Goals

**Goals:**

- Um único lugar que concentre o comportamento da busca (validação, requisição, timeout, mapeamento, toasts, loading) consumível pelos dois formulários sem divergência de UX.
- Contrato de falha discriminado para que cada componente escolha a mensagem certa sem adivinhar.
- Zero mudança de markup visível fora do estado de carregamento do ícone; zero mudança no design system.

**Non-Goals:**

- Proxy/server route para ViaCEP, cache ou telemetria.
- Busca automática no blur/Enter do campo CEP (só o ícone, como hoje).
- Preenchimento de `complemento` com o complemento genérico da ViaCEP ("lado ímpar") — campo é do usuário.
- Alterações em `UiInput`/kit, nos grids dos dois formulários ou em persistência/validação do endereço no banco.

## Decisions

**D1 — Dois composites: `useViaCep` (cliente puro) + `useBuscaCep` (orquestração).**
`useViaCep` passa a retornar um resultado discriminado em vez de `Endereco | null`:

```ts
export interface EnderecoViaCep { logradouro: string; bairro: string; localidade: string; uf: string; regiao: string }
export type ResultadoCep =
  | { status: 'ok'; endereco: EnderecoViaCep }
  | { status: 'incompleto' }      // < 8 dígitos — sem requisição
  | { status: 'nao-encontrado' }  // data.erro truthy (boolean ou string 'true')
  | { status: 'erro' }            // rede, timeout, !response.ok, JSON inválido
```

E o novo `app/composables/useBuscaCep.ts` (auto-importado) encapsula o restante: `carregando` ref, `abort` + timeout de 10s, mapeamento para `EnderecoUsuario`, toasts e bloqueio de acionamento.

- *Alternativa considerada:* aprofundar o próprio `useViaCep` com loading/toast — rejeitada: mistura cliente HTTP puro com UI (toast/título do módulo) e fica difícil de testar/reusar.
- *Alternativa considerada:* componente `CampoCep` compartilhado — rejeitada: moveria markup para fora dos grids existentes e criaria um componente de domínio cruzado `perfil × usuarios` fora do kit `ui/*`; a duplicação de markup aceita é pequena e o comportamento fica centralizado no composable.
- Renomear `Endereco` → `EnderecoViaCep` para não colidir conceitualmente com `EnderecoUsuario`.

**D2 — Assinatura do orquestrador: `useBuscaCep(endereco, tituloToast)`** — recebe um **getter** do `EnderecoUsuario` vigente (`() => EnderecoUsuario` — leitura na hora da busca, porque a página troca a referência do rascunho ao cancelar/salvar e o modal recria o rascunho a cada abertura) e o título do módulo. Retorna `{ carregando, buscar }`. `buscar`:

```
buscar()
  ├─ carregando já true? → return            (bloqueio de clique duplo)
  ├─ useViaCep.buscarCep(cep) → status
  │    ├─ incompleto  → toast.warning(titulo, 'Informe um CEP com 8 dígitos.')   [sem fetch]
  │    ├─ nao-encontrado → toast.danger(titulo, 'CEP não encontrado. Verifique o número digitado.')
  │    ├─ erro        → toast.danger(titulo, 'Não foi possível consultar o CEP. Tente novamente.')
  │    └─ ok          → preencher()  [sem toast]
  └─ finally → carregando = false
```

`preencher()` grava **apenas campos não vazios** na resposta (`logradouro→logradouro`, `bairro→bairro`, `localidade→cidade`, `uf→estado`, `regiao→regiao`), preserva `numero`/`complemento`/`cep` e retorna `true` se algo mudou (para o chamador decidir se emite `change`).

**D3 — Timeout com `AbortController` + `setTimeout` de 10.000 ms** (limpar no `finally`). `AbortSignal.timeout` é mais limpo mas exige suporte de navegador mais novo; `AbortController` é o padrão já usado no ecossistema. Abort vira `status: 'erro'` → mesmo toast de falha. `response.ok` é checado **antes** do `.json()` (o 400 em HTML da ViaCEP viraria exceção de parse — hoje inalcançável pela validação prévia, mas a checagem torna o contrato independente disso).

**D4 — Estado de carregamento no ícone, sem mudar o markup estrutural.** O `span` existente ganha, durante o voo: ícone `MapPinCheck` trocado por `LoaderCircle` + `animate-spin`, `aria-busy="true"`, classe `pointer-events-none`, e o handler retorna cedo se `carregando`. Tooltip continua o mesmo. `prefers-reduced-motion` já é coberto pela regra global do `main.css` (spinner fica estático, conteúdo idêntico).

**D5 — Emissão de `change` só quando algo mudou.** `AbaEndereco` compara o endereço antes/depois do `preencher()` e emite `change` apenas se houve diferença — evita habilitar "Salvar alterações" com uma busca que não alterou nada (mesmo CEP já salvo). No `Formulario` o watcher deep do rascunho já cuida do estado; nada muda lá além de chamar `buscar()`.

**D6 — fetch direto do navegador, sem proxy.** ViaCEP é pública, sem chave e com CORS liberado; proxy em `server/api/` só adicionaria latência e código sem beneficiar nada (não há segredo, nem cache necessário para um clique manual). `useApiFetch` não entra: ele é o cliente das APIs same-origin do projeto (com refresh/401).

**D7 — `numero` vazio: corrigir na raiz (default da coluna) + limpar legados, numa migration nova.** Causa raiz: `numero VARCHAR(20) NOT NULL DEFAULT 'S/N'` — todo `INSERT` que omite as colunas de endereço (importação, convite find-or-create, bootstrap-admin) herda `S/N`, mesmo com o endereço inteiramente vazio. Decisões:
- `server/migration/04_numero_vazio_sem_endereco.sql` (as `01`–`03` aplicadas nunca são editadas — regra da própria migration 03): `ALTER TABLE usuarios ALTER numero SET DEFAULT ''` + `UPDATE usuarios SET numero='' WHERE numero='S/N' AND cep='' AND endereco='' AND bairro='' AND cidade=''`.
- *Alternativa considerada:* incluir colunas de endereço explicitamente em cada `INSERT` — rejeitada: corrige só os caminhos conhecidos hoje e deixa o default como armadilha para o próximo INSERT; o default é a correção de raiz única.
- `S/N` mantido quando há endereço parcial preenchido: ali é o "sem número" legítimo do formulário, não resíduo de default.
- `docs/bd/01 - banco_dados_mariadb.sql` (dump de referência com `USE`) espelha o novo default. Cadastro manual já gravava `''` (payload explícito) — verificado por reprodução via API; o ajuste visível vem da limpeza de legados (`ana`, `fabiola`) e da importação.

**D8 — Progresso da importação: painel honesto durante o único POST.** A importação é uma única requisição em lote (até 500 linhas, transação server-side) — não existe progresso real por linha para reportar. Enquanto o POST está em voo, `Importar.vue` troca a pré-visualização por um `UiModalSection` de progresso: contagem "Importando N registro(s)" + lista dos registros selecionados (nome, e-mail) cada um com `LoaderCircle` girando, e o botão com `:loading`. Nada é marcado como "concluído" antes da resposta (sem simulação — diferente do teste SMTP, que é explicitamente simulado na spec). *Alternativa considerada:* requisições sequenciais por linha para progresso real — rejeitada: quebra a atomicidade da transação do servidor e multiplica chamadas. Falha devolve a tabela com o erro (estado já existente).

## Risks / Trade-offs

- [ViaCEP fora do ar ou lenta] → timeout de 10s + toast de falha distinto; o usuário sempre pode digitar manualmente (o preenchimento é assistência, não dependência).
- [`data.erro` vem como string `"true"`] → tratar `erro` por truthiness cobre boolean e string; registrado no composable para não "corrigir" depois.
- [CEP genérico sem logradouro/bairro] → política "só preenche o que veio não vazio"; conteúdo digitado nunca é apagado.
- [Markup do ícone duplicado nos dois componentes pode divergir no futuro] → aceito: o comportamento (o que importa) vive no composable; o markup é pequeno e visualmente idêntico. Se um terceiro ponto de busca nascer, reavaliar um componente.
- [Toasts do `useBuscaCep` acoplam o módulo (título)] → parâmetro `titulo` mantém o composable genérico; nenhum componente decide mensagens.
- [Digitação concorrente durante o voo] → a máscara do `UiInput` segue editável; o preenchimento sobrescreve os campos mapeados no retorno. Janela de 10s com usuário digitando logradouro ao mesmo tempo é caso raro e aceito (o preenchedor só grava campos não vazios da resposta).

## Migration Plan

Sem migração de dados ou de API. Deploy único junto com as mudanças de spec/docs da change; rollback = rever os três arquivos de código (os stubs voltam a ser aceitos pela spec antiga apenas se a change também for revertida).

## Open Questions

Nenhuma — o contrato (mapeamento, preservação, mensagens, loading, timeout, gatilho só no ícone) está fechado nas specs da change.
