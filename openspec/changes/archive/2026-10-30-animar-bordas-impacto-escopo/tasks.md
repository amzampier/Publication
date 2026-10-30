# Tasks

## 1. Borda animada no card

- [x] 1.1 No EscopoChamadaCard, remover a barra esquerda de 4px e manter uma borda base de 1px para Crítico e Alto; verificar os cards com e sem impacto.
- [x] 1.2 Adicionar o SVG absoluto com rect de rx 16, pathLength 100, stroke-dasharray 22 78, stroke-linecap round e aria-hidden, usando rose-600 para Crítico e orange-500 para Alto; verificar o contorno nos temas claro e escuro.
- [x] 1.3 Animar stroke-dashoffset de 0 a -100 com 5s linear infinite para os dois impactos, sem pausa no hover/focus; verificar o loop no navegador.
- [x] 1.4 Em prefers-reduced-motion reduce, ocultar o cometa e aplicar borda estática de 2px na cor do impacto; verificar com a preferência de movimento reduzido ativa.

## 2. Vitrine e documentação

- [x] 2.1 Atualizar a seção 30 do /design com um card Crítico e um Alto exibindo o cometa; verificar /design.
- [x] 2.2 Atualizar docs/21 §5.2 e docs/01 (movimento e fallback) para descrever a borda animada, o loop de 5s e o reduced motion; verificar a coerência com a spec.
- [x] 2.3 Atualizar a spec escopo-publico com os cenários de cometa e movimento reduzido; executar openspec validate --specs --strict.

## 3. Verificação integrada

- [x] 3.1 Conferir no navegador o cometa nos dois impactos, o mesmo ritmo, a ausência da barra estática e o fallback sem animação; verificar 390px e 1440px.
- [x] 3.2 Executar npm run lint, npm run test, npm run typecheck e npm run build; corrigir qualquer falha.
- [x] 3.3 Executar openspec validate "animar-bordas-impacto-escopo" --type change --strict.
