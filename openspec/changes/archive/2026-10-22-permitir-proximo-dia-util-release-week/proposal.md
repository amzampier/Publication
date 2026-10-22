# Proposal

## Why

A Release Week exige que a `data_publicacao` caia em uma segunda-feira. Quando a segunda-feira é
feriado nacional — por exemplo, 02/11/2026 (Finados) — a publicação real ocorre no próximo dia útil
(03/11/2026), mas o sistema recusa a data. Isso bloqueia o cadastro/importação de releases válidas.

## What Changes

- A validação da `data_publicacao` da Release Week passa a aceitar **segunda-feira** ou o **próximo
  dia útil** quando a segunda-feira for feriado nacional.
- Um calendário de feriados nacionais (fixos + móveis) é centralizado em `shared/feriados.ts`, com
  suporte a feriados extras locais.
- O formulário, o backend, a importação XLSX e os testes passam a usar a mesma regra.
- Manuais Mensais e Escopo de Projetos **não** mudam: continuam sem a regra de segunda-feira e o
  usuário com acesso determina a data.
- A mensagem de erro passa a explicar a exceção: segunda-feira ou próximo dia útil quando a
  segunda-feira for feriado.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `release-week`: a validação de `data_publicacao` passa a aceitar o próximo dia útil quando a
  segunda-feira for feriado nacional, no backend e na importação XLSX.

## Impact

- **Código:** novo `shared/feriados.ts`; ajustes em `shared/release-week.ts`,
  `server/utils/release-week.ts`, no formulário de Release Week (via validação compartilhada), no
  parser de importação e nos testes.
- **Banco:** nenhuma migration ou alteração de schema.
- **API:** `POST/PUT /api/release-week` e `POST /api/release-week/importar` aceitam a data excepcional.
- **Documentação:** `docs/12 - Módulo das Releases Week.md` e a spec `release-week`.
- **Fora de escopo:** alterar as regras de Manuais Mensais e Escopo de Projetos.
