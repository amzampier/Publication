# Design

## Context

Fase 1 (frontend puro, em memória) como nas demais telas da Área Administrativa. O que já existe e condiciona a solução:

- **Sessão e dados:** `useAuth` guarda `{ id, nome, email, perfil }` + cookie do id; o registro completo (`UsuarioDemo` — telefone, funcao, departamento, endereco, smtp, avatar, ultimoAcesso, dataCadastro, senha) vive na base demo `useUsuariosDemo`, a mesma que alimenta Gestão de Usuários e o login.
- **Padrões de página:** telas como `/admin/configuracoes-globais` usam página fina + componentes de domínio com prefixo auto-importado, header sem container com tile `bg-brand-primary`, container de abas em card único (barra + `role="tabpanel"`) e botão Salvar que nasce desabilitado até painéis emitirem `change`.
- **Kit disponível:** `UiTabs` (pílula), `UiInput` (máscara, ícones, `error`, `disabled`), `UiSelect`, `UiSegmented`, `UiBadge`, `UiButton`, `UiTooltip`, `UiUploadFiles` (forma circular), `UiCameraWeb`, `useToast`.
- **Bloco SMTP pronto:** `usuarios/Formulario.vue` concentra a máquina de estados do SMTP (porta sugerida pela segurança com flag `portaManual`, reset de status ao editar, teste simulado de 1.200 ms, badge de status) e o modal de endereço com o stub ViaCEP.
- **Menu da conta:** `accountMeuPerfil` (`config/navigation.ts`) está sem `to` e o `AppHeader.vue` o renderiza como botão que só fecha o menu; o spec `design-system/layout-navigation` registra que "Meu Perfil" fica sem navegação — daí o delta.

Ver `proposal.md` para a motivação e `specs/meu-perfil/spec.md` + delta de `layout-navigation` para o contrato de comportamento.

## Goals / Non-Goals

**Goals:**

- Página `/admin/meu-perfil` componentizada em `app/components/perfil/`, reutilizando o kit sem criar controles paralelos.
- Avatar como ponto de destaque visual (foto/iniciais, lápis como único ponto de entrada da troca + fluxo de câmera) sobre card com degradê vertical suave.
- Uma única fonte de comportamento SMTP (componente compartilhado extraído do modal).
- Item "Meu Perfil" do menu da conta navegando para a rota, com o delta de spec correspondente.
- `docs/09` espelhando o código, com os ajustes de `docs/01`, `docs/03` e `docs/08`.

**Non-Goals:**

- Backend, persistência além da base demo, JWT/HttpOnly, envio real de e-mail, ViaCEP real.
- Novo componente de kit (`UiAvatar`) ou seção na vitrine `/design` — sem reuso genérico hoje.
- Mudança de comportamento do modal de Gestão de Usuários (a extração do SMTP é estrutural).
- RBAC por perfil na página (qualquer usuário autenticado acessa; regra de permissão fica para a fase de sessão real).

## Decisions

### D1 — Componentes de domínio em `perfil/`, sem promover nada a `Ui*`

Pasta `app/components/perfil/` com prefixo auto-importado `Perfil*`: `Cabecalho`, `Resumo`, `Avatar`, `Abas`, `AbaDadosPessoais`, `AbaSeguranca`, `AbaEndereco`, `AbaEmail`. O Avatar com iniciais/foto e lápis é específico desta tela (hoje não há outro consumidor); promover a `UiAvatar` criaria kit sem uso e exigiria seção nova na vitrine. Se um segundo consumidor surgir, a extração para `ui/` vira change própria.

**Alternativa descartada:** `UiAvatar` + seção 17 do `/design` — custo de vitrine/spec/DS sem reuso imediato.

### D2 — Extração de `usuarios/CamposSmtp.vue` com `v-model` do objeto `smtp`

O bloco de `Formulario.vue` (template 568-649 + script 274-346: watches de porta/status, `testarConexao`, `enviarTeste`, `SMTP_POR_STATUS`) vira `app/components/usuarios/CamposSmtp.vue`:

- **Interface:** `v-model` (props `modelValue: ConfigSmtpUsuario`, emit `update:modelValue`) + emit `change` (sinaliza alteração para o dono do rascunho). A máquina de estados vive inteira no componente; `limparTimer`/`onBeforeUnmount` vão junto.
- **Consumidores:** o modal (substitui o bloco inline — mesma rascunho, mesmo `@change`) e `PerfilAbaEmail` (`v-model` no rascunho SMTP da página).
- As constantes (`PROVEDORES_SMTP`, `SEGURANCAS_SMTP`, `PORTAS_SMTP_VALIDAS`) continuam em `config/brasil.ts`.

**Por quê:** o comportamento (sugestão de porta, reset de status, badge) é uma regra só; duplicar em `AbaEmail` criaria duas verdades. **Alternativa descartada:** composable renderless — mesmo reuso, porém a parte visual também é idêntica nos dois lugares, então componente é o menor desenho.

### D3 — Rascunho único da página, Salvar global; senha com botão atômico próprio

A página mantém um `rascunho` (clone profundo do registro, com `endereco` e `smtp` copiados) e a flag `alterado` (padrão Configurações): qualquer painel emite `change`, "Salvar alterações" habilita, `salvar()` valida dados pessoais e grava tudo (dados, endereço, SMTP, foto, `atualizadoEm`) num toast só. **A aba Segurança é a exceção:** trocar senha não passa pelo Salvar global — tem botão próprio "Alterar senha" que valida e grava a senha imediatamente. **Por quê:** troca de senha é atômica e não deve exigir "salvar" abas não tocadas; misturar senha no salvamento global criaria validação cruzada artificial.

**Alternativa descartada:** rodapé único também para senha (como no mockup) — acopla operações independentes.

### D4 — Origem dos dados: registro da base demo pelo `id` da sessão

`useUsuariosDemo().usuarios.find(u => u.id === auth.usuario.value.id)` (mesma reidenciação do `ensureSessao`), guardado num ref de "registro base"; o rascunho nasce como clone. **O e-mail não compõe o rascunho:** é exibido só em leitura no resumo lateral e não é editável nesta tela (a unicidade de e-mail continua sendo regra apenas do modal de Gestão de Usuários). Cargo/Setor renderizam `funcao`/`departamento` em `UiInput disabled` — fora do rascunho de validação.

### D5 — Avatar: dataURL no registro, como no modal

`PerfilAvatar` recebe `preview` (dataURL) e emite `change`/`camera`; a página conecta ao mesmo fluxo do modal: `UiUploadFiles forma="circular"` (leitura via `FileReader` → dataURL) + `UiCameraWeb` (captura → dataURL). Sem foto, exibe iniciais sobre fundo neutro `slate-600` (texto branco — cor do Account no header também migrada de `brand-structure` para `slate-600` na mesma revisão), **sem anel de destaque**, com o lápis flutuante em `h-7 w-7` como único ponto de entrada da troca (não há botão "Alterar foto" separado). A foto só persiste ao Salvar (está no rascunho, não no registro).

### D6 — Navegação: `accountMeuPerfil.to = '/admin/meu-perfil'`

No `AppHeader.vue`, o botão de "Meu Perfil" passa a usar `clicarItemMenu(accountMeuPerfil)` (mesmo caminho dos itens com `to`: `navigateTo` + `fecharMenus`). Delta em `design-system/layout-navigation` atualiza o requirement "Itens de navegação podem declarar rota…" (hoje exclui Meu Perfil da navegação). A sidebar não ganha item novo — o acesso continua só pelo menu da conta.

### D7 — Casca de abas copia o padrão `ConfiguracoesAbas`

`PerfilAbas` = card único `rounded-xl border border-slate-200 bg-white shadow-xs`, `UiTabs id-prefix="perfil"` na barra (`border-b`), painel `role="tabpanel"` com `id="perfil-panel-<aba>"`/`aria-labelledby`, slot para o painel ativo; a página alterna os `Aba*` por `v-if`. O rodapé (Cancelar/Salvar) fica dentro do card, separado por `border-t`, alinhado à direita, `flex-wrap` para 375px.

### D8 — Responsividade desde o desenho (RL01)

Grid da página `grid gap-6 lg:grid-cols-[320px_1fr]` (coluna única abaixo de `lg`, resumo primeiro); cabeçalho `flex flex-wrap` com `min-w-0`; barra de abas com `overflow-x-auto` em telas estreitas (mesmo comportamento do `UiTabs`); grids de campos herdam os `sm:grid-cols-*` do modal; botões do rodapé `w-full sm:w-auto`.

### D9 — Ajustes de revisão com o usuário

Rodada de ajustes após a primeira build: (a) card de resumo ganha fundo em degradê vertical
`bg-gradient-to-b from-brand-structure/15 to-white` (azul clarinho → branco; a primeira versão
usava `brand-primary/10` e o usuário apontou que ficava **cinza**) — exige delta **MODIFIED** em
`design-system/brand-tokens`, que passa a enumerar essa superfície; (b) Avatar sem anel
`brand-accent` e sem botão "Alterar foto" (o lápis `h-7 w-7` é o único ponto de entrada) e com
fundo neutro `slate-600` no lugar de `brand-structure` — mesma troca no avatar do Account do
header (`AppHeader` + espelho da vitrine); (c) aba Dados Pessoais perde o campo de e-mail
(leitura só no resumo, unicidade sai desta tela); (d) mini-card "Sua conta está segura" migra
do resumo para a aba Segurança, cujo layout é 2 colunas com Senha atual sozinha na 1ª linha
(metade da largura) e Nova senha ao lado da Confirmação na 2ª; (e) a aba E-mail ganha um
wrapper `grid gap-4` com `mt-4` — `CamposSmtp` tem dois nós-raiz, então a classe `mt-4` direta
era descartada pelo fallthrough e os campos grudavam no título.

## Risks / Trade-offs

- [Extração do `CamposSmtp` quebra o modal de Gestão de Usuários] → interface `v-model`+`change` espelha o uso atual; verificação visual do modal antes/depois na task de regressão.
- [Degradê no card de resumo contraria a regra "degradê só em ações máximas"] → exceção registrada no delta `brand-tokens` e em `docs/01` §2.1, limitada a esta superfície (fundo clara, opacidade baixa).
- [Troca de senha esquecida pelo usuário ao salvar outras abas] → botão próprio com feedback de toast e limpeza dos campos após o sucesso; aviso no `docs/09`.
- [Foto em dataURL no registro demo "pesa" o estado em memória] → mesmo trade-off já aceito no modal de usuários; sem upload real na fase 1.
- [Página nova sem permissão por perfil] → consistente com as demais telas da fase 1 (nenhuma tem RBAC no cliente); fica registrado em `docs/09` como pendência da fase de sessão real (já prevista no `docs/02`).

## Migration Plan

Sem migração — fase 1 em memória, sem dados persistentes nem API. Rollback: remover a página/pasta `perfil/`, restaurar `Formulario.vue` e o item do menu.

## Open Questions

Nenhuma que afete specs, abordagem ou tasks — as decisões de escopo (4 abas, Cargo/Setor readonly, sem campo de nome de usuário, extração do SMTP) foram fechadas com o usuário durante a exploração.
