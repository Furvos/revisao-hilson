# Lab AED — Revisão da 2ª prova

Aplicação React + TypeScript (Vite) com visualizações interativas, passo a passo, para a revisão da 2ª prova de **Algoritmos e Estrutura de Dados I** (Engenharia de Software · iCEV). O conteúdo segue os slides do Prof. Hilson Silva (Aulas 6 a 10).

| Assunto | O que a animação mostra |
| --- | --- |
| Recursividade | Pilha de execução empilhando e desempilhando: fatorial (direta), eh_par/eh_impar (indireta) e o estouro de pilha quando falta o caso base |
| Árvores | Terminologia clicável na árvore T do slide (pai, filhos, nível, grau, altura), percursos pré/em/pós-ordem com pilha de chamadas e, como **complemento**, inserção/remoção/busca em árvore binária de busca |
| Grafos | Terminologia (grau, grau de entrada/saída, simples, conexo, completo, laço, multigrafo) com editor de arestas e, como **complemento**, BFS (fila) e DFS (recursão/pilha) |
| Bubble Sort | Comparações e trocas entre vizinhos, passadas e parada antecipada |
| Quick Sort | Escolha do pivô (primeiro, meio, último ou mediana de três), separação em X1 (≤ p) e X2 (> p) e recursão em cada lado |
| Merge Sort | Árvore de divisões (igual ao diagrama do slide) e intercalação elemento a elemento com o vetor auxiliar |
| **Resolução da revisão** | As 7 questões da lista P2 do professor (`#q1` … `#q7`): enunciado, gabarito, comentário da monitoria e uma animação própria para cada questão |

Todas as telas têm: **Início / Voltar / Rodar–Pausar / Avançar**, controle de velocidade, barra para pular para qualquer passo, botão de novos dados, explicação do passo atual e o código em **Java ou Python** com a linha em execução destacada.

Atalhos: `Espaço` roda/pausa · `←` `→` voltam/avançam um passo.

## Como rodar

Requer Node.js 18 ou mais novo.

```bash
npm install
npm run dev          # abre em http://localhost:5173
```

## Como gerar para distribuir

```bash
npm run build         # pasta dist/ (para hospedar em qualquer servidor estático)
npm run build:single  # dist-single/index.html — um arquivo único, abre com duplo clique
```

O arquivo `dist-single/index.html` já gerado está incluído; basta abri-lo no navegador (as fontes vêm do Google Fonts; sem internet, o navegador usa fontes do sistema).

## Estrutura

```
src/
  engine/       motor de passos (lista de quadros + hook usePlayer)
  algos/        algoritmos que "gravam" cada passo (puros, sem React)
  components/   controles, painel de código, barras, pilha de chamadas
  topics/       uma página por assunto + página inicial
```

Para criar uma nova animação: escreva uma função em `src/algos/` que devolve uma lista de `Frame` (`{ state, desc, line }`) e uma página em `src/topics/` que desenha `state`. O `usePlayer` cuida de avançar, voltar, rodar e pausar.
