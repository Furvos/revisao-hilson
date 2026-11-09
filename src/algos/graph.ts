import type { CodeSample, Frame } from "../engine/types";

export interface Vertex {
  id: string;
  x: number; // 0..100
  y: number; // 0..100
}

export interface Graph {
  vertices: Vertex[];
  /** arestas como pares (u, v); em grafo direcionado significa u → v */
  edges: [string, string][];
  directed: boolean;
}

/** Grafo do slide: V = {A,B,C,D,E}, A = {(A,B),(A,C),(A,E),(E,D),(B,C),(D,C)} */
export function slideGraph(): Graph {
  return {
    vertices: [
      { id: "A", x: 50, y: 10 },
      { id: "B", x: 88, y: 40 },
      { id: "C", x: 72, y: 88 },
      { id: "D", x: 28, y: 88 },
      { id: "E", x: 12, y: 40 },
    ],
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["A", "E"],
      ["E", "D"],
      ["B", "C"],
      ["D", "C"],
    ],
    directed: false,
  };
}

/** Exemplo do torneio de futebol do slide (turmas 6A…8B). */
export function torneioGraph(): Graph {
  const ids = ["6A", "6B", "7A", "7B", "8A", "8B"];
  return {
    vertices: circle(ids),
    edges: [
      ["6A", "7A"],
      ["6A", "7B"],
      ["6A", "8B"],
      ["6B", "7A"],
      ["6B", "8A"],
      ["6B", "8B"],
      ["7B", "8A"],
      ["7B", "8B"],
      ["8A", "8B"],
    ],
    directed: false,
  };
}

/** "Casinha" do slide (desenhar sem tirar o lápis). */
export function casinhaGraph(): Graph {
  return {
    vertices: [
      { id: "A", x: 50, y: 8 },
      { id: "B", x: 22, y: 40 },
      { id: "C", x: 78, y: 40 },
      { id: "D", x: 22, y: 92 },
      { id: "E", x: 78, y: 92 },
    ],
    edges: [
      ["D", "B"],
      ["B", "A"],
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
      ["E", "C"],
      ["C", "D"],
      ["D", "E"],
    ],
    directed: false,
  };
}

function circle(ids: string[]): Vertex[] {
  return ids.map((id, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / ids.length;
    return { id, x: 50 + 40 * Math.cos(a), y: 50 + 40 * Math.sin(a) };
  });
}

export function randomGraph(): Graph {
  const n = 6 + Math.floor(Math.random() * 2);
  const ids = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  const vertices = circle(ids);
  const edges: [string, string][] = [];
  const has = (a: string, b: string) => edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
  // Garante conexo: cada vértice liga a um anterior.
  for (let i = 1; i < n; i++) {
    const j = Math.floor(Math.random() * i);
    edges.push([ids[j], ids[i]]);
  }
  const extra = 2 + Math.floor(Math.random() * 3);
  for (let k = 0; k < extra * 4 && edges.length < n - 1 + extra; k++) {
    const a = ids[Math.floor(Math.random() * n)];
    const b = ids[Math.floor(Math.random() * n)];
    if (a !== b && !has(a, b)) edges.push([a, b]);
  }
  return { vertices, edges, directed: false };
}

export function neighbors(g: Graph, u: string): string[] {
  const out = new Set<string>();
  for (const [a, b] of g.edges) {
    if (a === b) continue;
    if (a === u) out.add(b);
    if (!g.directed && b === u) out.add(a);
  }
  return [...out].sort((x, y) => x.localeCompare(y, "pt", { numeric: true }));
}

export function degrees(g: Graph, u: string): { total: number; entrada: number; saida: number } {
  let entrada = 0;
  let saida = 0;
  let total = 0;
  for (const [a, b] of g.edges) {
    if (a === u && b === u) {
      total += 2; // laço conta 2 no grau
      entrada++;
      saida++;
      continue;
    }
    if (a === u) {
      total++;
      saida++;
    }
    if (b === u) {
      total++;
      entrada++;
    }
  }
  return { total, entrada, saida };
}

export function graphFacts(g: Graph) {
  const loops = g.edges.filter(([a, b]) => a === b).length;
  const key = (a: string, b: string) => (g.directed ? `${a}>${b}` : [a, b].sort().join("-"));
  const seen = new Map<string, number>();
  g.edges.forEach(([a, b]) => seen.set(key(a, b), (seen.get(key(a, b)) ?? 0) + 1));
  const parallel = [...seen.values()].some((c) => c > 1);
  // Conexo (ignorando direção)
  const und: Graph = { ...g, directed: false };
  const ids = g.vertices.map((v) => v.id);
  const seenV = new Set<string>();
  if (ids.length) {
    const q = [ids[0]];
    seenV.add(ids[0]);
    while (q.length) {
      const u = q.shift()!;
      for (const w of neighbors(und, u))
        if (!seenV.has(w)) {
          seenV.add(w);
          q.push(w);
        }
    }
  }
  const isolated = ids.filter((id) => degrees(g, id).total === 0);
  const n = ids.length;
  const simpleEdges = new Set(g.edges.filter(([a, b]) => a !== b).map(([a, b]) => [a, b].sort().join("-")));
  return {
    ordem: n,
    arestas: g.edges.length,
    loops,
    parallel,
    simples: loops === 0 && !parallel,
    conexo: seenV.size === n,
    isolated,
    completo: !g.directed && loops === 0 && !parallel && simpleEdges.size === (n * (n - 1)) / 2,
  };
}

/* ------------------------------------------------------------------ */
/* BFS (largura, usa FILA) e DFS (profundidade, usa PILHA/recursão)    */
/* ------------------------------------------------------------------ */

export interface SearchState {
  visited: string[];
  current: string | null;
  checking: string | null;
  queue: string[];
  stack: string[];
  order: string[];
  treeEdges: [string, string][];
}

export const bfsCode: CodeSample = {
  java: [
    ["start", "void bfs(String inicio) {"],
    ["start", "    Queue<String> fila = new LinkedList<>();"],
    ["start", "    visitados.add(inicio);"],
    ["start", "    fila.add(inicio);                       // enqueue"],
    ["loop", "    while (!fila.isEmpty()) {"],
    ["deq", "        String u = fila.remove();           // dequeue"],
    ["deq", '        System.out.print(u + " ");'],
    ["nb", "        for (String w : vizinhos(u)) {"],
    ["nb", "            if (!visitados.contains(w)) {"],
    ["enq", "                visitados.add(w);"],
    ["enq", "                fila.add(w);                // enqueue"],
    [null, "            }"],
    [null, "        }"],
    [null, "    }"],
    ["end", "}"],
  ],
  python: [
    ["start", "def bfs(inicio):"],
    ["start", "    visitados = {inicio}"],
    ["start", "    fila = [inicio]                  # enqueue"],
    ["loop", "    while fila:"],
    ["deq", "        u = fila.pop(0)              # dequeue"],
    ["deq", "        print(u, end=' ')"],
    ["nb", "        for w in vizinhos(u):"],
    ["nb", "            if w not in visitados:"],
    ["enq", "                visitados.add(w)"],
    ["enq", "                fila.append(w)       # enqueue"],
    ["end", ""],
  ],
};

export const dfsCode: CodeSample = {
  java: [
    ["call", "void dfs(String u) {"],
    ["visit", "    visitados.add(u);"],
    ["visit", '    System.out.print(u + " ");'],
    ["nb", "    for (String w : vizinhos(u)) {"],
    ["nb", "        if (!visitados.contains(w)) {"],
    ["rec", "            dfs(w);          // chamada recursiva"],
    [null, "        }"],
    [null, "    }"],
    ["back", "}                            // desempilha: volta"],
  ],
  python: [
    ["call", "def dfs(u):"],
    ["visit", "    visitados.add(u)"],
    ["visit", "    print(u, end=' ')"],
    ["nb", "    for w in vizinhos(u):"],
    ["nb", "        if w not in visitados:"],
    ["rec", "            dfs(w)           # chamada recursiva"],
    ["back", "    # fim da função: volta"],
  ],
};

export function bfsFrames(g: Graph, start: string): Frame<SearchState>[] {
  const frames: Frame<SearchState>[] = [];
  const visited: string[] = [start];
  const queue: string[] = [start];
  const order: string[] = [];
  const tree: [string, string][] = [];
  const snap = (desc: string, line: string, current: string | null, checking: string | null = null) =>
    frames.push({ desc, line, state: { visited: [...visited], current, checking, queue: [...queue], stack: [], order: [...order], treeEdges: [...tree] } });

  snap(
    `Busca em LARGURA (BFS) a partir de ${start}. Usa uma FILA (FIFO): visita primeiro todos os vizinhos, depois os vizinhos dos vizinhos — "em camadas". ${start} é marcado e entra na fila.`,
    "start",
    null,
  );
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    snap(`Dequeue: sai ${u} da frente da fila e é processado. Ordem até agora: ${order.join(" ")}.`, "deq", u);
    const nb = neighbors(g, u);
    if (!nb.length) snap(`${u} não tem vizinhos${g.directed ? " de saída" : ""}.`, "nb", u);
    for (const w of nb) {
      if (visited.includes(w)) {
        snap(`Vizinho ${w} de ${u}: já foi descoberto antes, ignora.`, "nb", u, w);
      } else {
        visited.push(w);
        queue.push(w);
        tree.push([u, w]);
        snap(`Vizinho ${w} de ${u}: ainda não visitado → marca e coloca no FIM da fila (enqueue).`, "enq", u, w);
      }
    }
  }
  const missing = g.vertices.map((v) => v.id).filter((id) => !visited.includes(id));
  snap(
    `Fila vazia: fim da BFS. Ordem de visita: ${order.join(" → ")}.` +
      (missing.length ? ` Os vértices ${missing.join(", ")} não foram alcançados: o grafo não é conexo a partir de ${start}.` : ""),
    "end",
    null,
  );
  return frames;
}

export function dfsFrames(g: Graph, start: string): Frame<SearchState>[] {
  const frames: Frame<SearchState>[] = [];
  const visited: string[] = [];
  const stack: string[] = [];
  const order: string[] = [];
  const tree: [string, string][] = [];
  const snap = (desc: string, line: string, current: string | null, checking: string | null = null) =>
    frames.push({ desc, line, state: { visited: [...visited], current, checking, queue: [], stack: [...stack], order: [...order], treeEdges: [...tree] } });

  snap(
    `Busca em PROFUNDIDADE (DFS) a partir de ${start}. Vai o mais fundo possível por um caminho antes de voltar. Usa recursão — ou seja, a PILHA de chamadas (LIFO).`,
    "call",
    null,
  );
  const go = (u: string) => {
    stack.push(u);
    visited.push(u);
    order.push(u);
    snap(`dfs(${u}): empilha ${u}, marca como visitado. Ordem: ${order.join(" ")}.`, "visit", u);
    for (const w of neighbors(g, u)) {
      if (visited.includes(w)) {
        snap(`Vizinho ${w} de ${u}: já visitado, ignora.`, "nb", u, w);
      } else {
        tree.push([u, w]);
        snap(`Vizinho ${w} de ${u}: não visitado → chama dfs(${w}) e aprofunda.`, "rec", u, w);
        go(w);
        snap(`dfs(${w}) terminou e foi desempilhada. De volta em ${u}, continua olhando os próximos vizinhos.`, "nb", u);
      }
    }
    stack.pop();
    snap(`${u} não tem mais vizinhos novos: dfs(${u}) termina e é desempilhada (backtracking).`, "back", stack[stack.length - 1] ?? null);
  };
  go(start);
  const missing = g.vertices.map((v) => v.id).filter((id) => !visited.includes(id));
  snap(`Pilha vazia: fim da DFS. Ordem de visita: ${order.join(" → ")}.` + (missing.length ? ` Os vértices ${missing.join(", ")} não foram alcançados.` : ""), "back", null);
  return frames;
}
