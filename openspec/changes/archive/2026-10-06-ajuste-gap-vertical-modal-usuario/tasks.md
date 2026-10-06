# Tasks

## 1. Ajuste dos gaps verticais no modal Novo/Editar Usuário

- [x] 1.1 Nível A — em `app/components/usuarios/Formulario.vue:393` trocar `grid gap-4` por `grid gap-y-[11px]` no grid raiz entre as seções; verificar por leitura da linha (grid de 1 coluna, nenhuma outra classe alterada)
- [x] 1.2 Nível C — nas linhas `:396`, `:407`, `:447`, `:488`, `:559` e `:643` de `Formulario.vue` trocar `gap-4` por `gap-x-4 gap-y-[11px]`; verificar com busca no arquivo de que não restou nenhuma ocorrência de `grid gap-4` e que as seis linhas contêm `gap-x-4 gap-y-[11px]`
- [x] 1.3 Nível B — adicionar `class="[&>div.grid]:gap-y-[11px]"` nas quatro `<UiModalSection>` de `Formulario.vue` (`:395`, `:487`, `:558`, `:638`); verificar com busca de 4 ocorrências da classe e conferindo que `app/components/ui/ModalSection.vue` **não** foi modificado
- [x] 1.4 Documentação — novo bullet em `docs/06 - Gestão de Usuários.md` §3.4 registrando o ritmo vertical 11px / horizontal 16px do modal e o mecanismo de override (`[&>div.grid]`, dependente do wrapper `div.grid` do `UiModalSection`); verificar lendo o bullet no arquivo

## 2. Verificação de integração

- [x] 2.1 `npm run build` completa sem erro (único gate automatizado do repo — não há lint/test)
- [x] 2.2 Conferência visual em `http://localhost:3000/admin/gestao-usuarios` → **Novo Usuário** e **Editar Usuário**: gaps entre linhas dos grids (Nome|E-mail × Telefone|Função|Depto; Endereço 2 linhas; SMTP 2 linhas), entre blocos das seções 1/3 e entre os cards de seção medem 11px; distância entre colunas (ex.: Nome × E-mail) segue 16px; sem sobreposição de mensagens de erro e sem regressão em 320–768px (grids em 1 coluna)
- [x] 2.3 Regressão dos modais não escopados — Filtros de Usuários, Filtros de Auditoria, Importar, Exclusão, Detalhe da Auditoria, Câmera e seção 15 do `/design` continuam com 16px verticais (conferência visual de `ModalSection.vue` intocado + amostragem de dois modais)
