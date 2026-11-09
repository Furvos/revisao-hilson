export interface TopicMeta {
  id: string;
  title: string;
  blurb: string;
  needs?: string;
  bigO: string;
}

/** Ordem de estudo usada no menu e no roteiro de aula. */
export const TOPICS: TopicMeta[] = [
  { id: "recursividade", title: "Recursividade", blurb: "Caso base, passo recursivo e pilha de execução.", bigO: "fatorial: O(n)" },
  { id: "arvores", title: "Árvores", blurb: "Terminologia, árvore binária e percursos pré, em e pós-ordem.", needs: "recursividade", bigO: "percurso: O(n)" },
  { id: "grafos", title: "Grafos", blurb: "Vértices, arestas, grau e tipos de grafo. Extra: BFS e DFS.", needs: "árvores (e fila/pilha da 1ª prova)", bigO: "BFS/DFS: O(V + A)" },
  { id: "bubble", title: "Bubble Sort", blurb: "Compara vizinhos e troca. O mais simples de todos.", bigO: "O(n²)" },
  { id: "quick", title: "Quick Sort", blurb: "Pivô, X1 ≤ p < X2 e recursão em cada lado.", needs: "recursividade, bubble (troca)", bigO: "O(n log n) · pior O(n²)" },
  { id: "merge", title: "Merge Sort", blurb: "Divide ao meio, ordena cada metade e intercala.", needs: "recursividade, quick (comparar)", bigO: "O(n log n)" },
];
