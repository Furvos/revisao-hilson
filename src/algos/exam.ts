/**
 * Animações da aba "Resolução da revisão" (lista P2 do Prof. Hilson Silva).
 * Cada função devolve uma lista de quadros, no mesmo formato das outras telas.
 */
import type { CodeSample, Frame, Item } from "../engine/types";
import { mergeFrames, type MergeState } from "./merge";
import type { BTree, BNode } from "./tree";
import type { Graph } from "./graph";
import { neighbors } from "./graph";

/* ================================================================== */
/* Q1 — Memória: MergeSort (vetor auxiliar) × QuickSort in-place       */
/* ================================================================== */

export interface MemState {
  arr: Item[];
  /** vetor auxiliar do Merge (null = ainda não alocado / não existe) */
  aux: (number | null)[] | null;
  lo: number;
  hi: number;
  mid: number | null;
  /** índices destacados no vetor principal */
  hot: number[];
  /** índices destacados no auxiliar */
  auxHot: number[];
  /** Quick: posição do pivô e marcadores i / j */
  pivot: number | null;
  i: number | null;
  j: number | null;
  swapped: boolean;
  fixed: number[];
  stack: string[];
  comps: number;
  /** memória em "posições": vetor original + auxiliar + quadros de pilha */
  mem: { orig: number; aux: number; stack: number };
  peak: number;
}

export const q1MergeCode: CodeSample = {
  java: [
    ["fn", "static void mergeSort(int[] v) {"],
    ["alloc", "    int[] aux = new int[v.length];   // vetor EXTRA do tamanho de v → O(n)"],
    ["call", "    ordenar(v, aux, 0, v.length - 1);"],
    [null, "}"],
    ["call", "static void ordenar(int[] v, int[] aux, int ini, int fim) {"],
    ["base", "    if (ini >= fim) return;               // caso base"],
    ["call", "    int meio = (ini + fim) / 2;"],
    ["call", "    ordenar(v, aux, ini, meio);"],
    ["call", "    ordenar(v, aux, meio + 1, fim);"],
    ["copy", "    for (int k = ini; k <= fim; k++) aux[k] = v[k];  // copia p/ auxiliar"],
    ["merge", "    int i = ini, j = meio + 1;"],
    ["merge", "    for (int k = ini; k <= fim; k++) {"],
    ["merge", "        if (i > meio)              v[k] = aux[j++];"],
    ["merge", "        else if (j > fim)          v[k] = aux[i++];"],
    ["merge", "        else if (aux[i] <= aux[j]) v[k] = aux[i++];"],
    ["merge", "        else                       v[k] = aux[j++];"],
    [null, "    }"],
    [null, "}"],
  ],
  python: [
    ["fn", "def merge_sort(v):"],
    ["alloc", "    aux = [0] * len(v)          # vetor EXTRA do tamanho de v → O(n)"],
    ["call", "    ordenar(v, aux, 0, len(v) - 1)"],
    [null, ""],
    ["call", "def ordenar(v, aux, ini, fim):"],
    ["base", "    if ini >= fim: return       # caso base"],
    ["call", "    meio = (ini + fim) // 2"],
    ["call", "    ordenar(v, aux, ini, meio)"],
    ["call", "    ordenar(v, aux, meio + 1, fim)"],
    ["copy", "    aux[ini:fim + 1] = v[ini:fim + 1]   # copia p/ auxiliar"],
    ["merge", "    i, j = ini, meio + 1"],
    ["merge", "    for k in range(ini, fim + 1):"],
    ["merge", "        if i > meio:            v[k] = aux[j]; j += 1"],
    ["merge", "        elif j > fim:           v[k] = aux[i]; i += 1"],
    ["merge", "        elif aux[i] <= aux[j]:  v[k] = aux[i]; i += 1"],
    ["merge", "        else:                   v[k] = aux[j]; j += 1"],
  ],
};

export const q1QuickCode: CodeSample = {
  java: [
    ["call", "static void quickSort(int[] v, int ini, int fim) {"],
    ["base", "    if (ini >= fim) return;                // caso base"],
    ["call", "    int p = particionar(v, ini, fim);"],
    ["call", "    quickSort(v, ini, p - 1);"],
    ["call", "    quickSort(v, p + 1, fim);"],
    [null, "}   // nenhum vetor novo: só a pilha de chamadas cresce"],
    [null, ""],
    ["pivot", "static int particionar(int[] v, int ini, int fim) {"],
    ["pivot", "    int pivo = v[fim];                     // pivô = último"],
    ["pivot", "    int i = ini - 1;"],
    ["cmp", "    for (int j = ini; j < fim; j++) {"],
    ["cmp", "        if (v[j] <= pivo) {"],
    ["swap", "            i++;"],
    ["swap", "            int t = v[i]; v[i] = v[j]; v[j] = t;   // troca NO PRÓPRIO vetor"],
    [null, "        }"],
    [null, "    }"],
    ["place", "    int t = v[i + 1]; v[i + 1] = v[fim]; v[fim] = t;"],
    ["place", "    return i + 1;                          // posição final do pivô"],
    [null, "}"],
  ],
  python: [
    ["call", "def quick_sort(v, ini, fim):"],
    ["base", "    if ini >= fim: return               # caso base"],
    ["call", "    p = particionar(v, ini, fim)"],
    ["call", "    quick_sort(v, ini, p - 1)"],
    ["call", "    quick_sort(v, p + 1, fim)"],
    [null, ""],
    ["pivot", "def particionar(v, ini, fim):"],
    ["pivot", "    pivo = v[fim]                       # pivô = último"],
    ["pivot", "    i = ini - 1"],
    ["cmp", "    for j in range(ini, fim):"],
    ["cmp", "        if v[j] <= pivo:"],
    ["swap", "            i += 1"],
    ["swap", "            v[i], v[j] = v[j], v[i]     # troca NO PRÓPRIO vetor"],
    ["place", "    v[i + 1], v[fim] = v[fim], v[i + 1]"],
    ["place", "    return i + 1"],
  ],
};

function memBase(arr: Item[]): MemState {
  return {
    arr,
    aux: null,
    lo: 0,
    hi: arr.length - 1,
    mid: null,
    hot: [],
    auxHot: [],
    pivot: null,
    i: null,
    j: null,
    swapped: false,
    fixed: [],
    stack: [],
    comps: 0,
    mem: { orig: arr.length, aux: 0, stack: 0 },
    peak: arr.length,
  };
}

export function q1MergeFrames(values: number[]): Frame<MemState>[] {
  const n = values.length;
  const arr: Item[] = values.map((v, id) => ({ id, v }));
  let aux: (number | null)[] | null = null;
  const stack: string[] = [];
  const frames: Frame<MemState>[] = [];
  let comps = 0;
  let peak = n;
  const snap = (desc: string, line: string, s: Partial<MemState> = {}) => {
    const mem = { orig: n, aux: aux ? n : 0, stack: stack.length };
    peak = Math.max(peak, mem.orig + mem.aux + mem.stack);
    frames.push({ desc, line, state: { ...memBase(arr.map((x) => ({ ...x }))), aux: aux ? [...aux] : null, stack: [...stack], comps, mem, peak, ...s } });
  };

  snap(`Vetor original com n = ${n} registros ocupando ${n} posições de memória. Vamos acompanhar o “medidor de RAM” enquanto o MergeSort roda.`, "fn");
  aux = Array(n).fill(null);
  snap(
    `Antes de começar, o MergeSort ALOCA um vetor auxiliar do mesmo tamanho do original (${n} posições). A memória usada passa de ${n} para ${2 * n}: ela DOBROU. Com milhões de transações, é aqui que acontece o Out of Memory.`,
    "alloc",
  );

  const go = (lo: number, hi: number) => {
    stack.push(`ordenar(${lo}..${hi})`);
    if (lo >= hi) {
      stack.pop();
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    go(lo, mid);
    go(mid + 1, hi);
    for (let k = lo; k <= hi; k++) aux![k] = arr[k].v;
    snap(`Intercalar v[${lo}..${mid}] com v[${mid + 1}..${hi}]: primeiro o trecho é COPIADO para o vetor auxiliar.`, "copy", { lo, hi, mid, auxHot: range(lo, hi) });
    let i = lo;
    let j = mid + 1;
    const vals = aux!.slice();
    for (let k = lo; k <= hi; k++) {
      let from: number;
      if (i > mid) from = j++;
      else if (j > hi) from = i++;
      else {
        comps++;
        from = vals[i]! <= vals[j]! ? i++ : j++;
      }
      arr[k] = { id: arr[k].id, v: vals[from]! };
      snap(`v[${k}] recebe ${vals[from]} vindo do auxiliar (posição ${from}).`, "merge", { lo, hi, mid, hot: [k], auxHot: [from] });
    }
    stack.pop();
  };
  go(0, n - 1);
  aux = null;
  snap(`Ordenado. O pico de memória foi ${peak} posições: 2 × n = ${2 * n} dos dois vetores, mais a pilha de recursão. O MergeSort é O(n log n) sempre, mas paga com O(n) de memória extra.`, "fn", { fixed: range(0, n - 1) });
  return frames;
}

export function q1QuickFrames(values: number[]): Frame<MemState>[] {
  const n = values.length;
  const arr: Item[] = values.map((v, id) => ({ id, v }));
  const stack: string[] = [];
  const fixed = new Set<number>();
  const frames: Frame<MemState>[] = [];
  let comps = 0;
  let peak = n;
  let maxStack = 0;
  const snap = (desc: string, line: string, s: Partial<MemState> = {}) => {
    const mem = { orig: n, aux: 0, stack: stack.length };
    maxStack = Math.max(maxStack, stack.length);
    peak = Math.max(peak, mem.orig + mem.stack);
    frames.push({ desc, line, state: { ...memBase(arr.map((x) => ({ ...x }))), stack: [...stack], comps, mem, peak, fixed: [...fixed], ...s } });
  };
  snap(`Mesmo vetor, agora com QuickSort “in-place” (no próprio vetor). Repare no medidor: não existe vetor auxiliar.`, "call");

  const go = (lo: number, hi: number) => {
    stack.push(`quickSort(${lo}..${hi})`);
    if (lo >= hi) {
      if (lo === hi) fixed.add(lo);
      snap(lo === hi ? `Trecho de 1 elemento (${arr[lo].v}): caso base.` : `Trecho vazio: caso base.`, "base", { lo, hi });
      stack.pop();
      return;
    }
    const pv = arr[hi].v;
    let i = lo - 1;
    snap(`Particionar v[${lo}..${hi}] com pivô = último elemento (${pv}). O índice i marca o fim da região “≤ pivô”.`, "pivot", { lo, hi, pivot: hi, i });
    for (let j = lo; j < hi; j++) {
      comps++;
      if (arr[j].v <= pv) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        snap(`${arr[i].v} ≤ ${pv}: avança i e troca v[${i}] com v[${j}] — dentro do próprio vetor, sem memória nova.`, "swap", {
          lo,
          hi,
          pivot: hi,
          i,
          j,
          hot: [i, j],
          swapped: true,
        });
      } else {
        snap(`${arr[j].v} > ${pv}: fica onde está.`, "cmp", { lo, hi, pivot: hi, i, j, hot: [j] });
      }
    }
    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    fixed.add(i + 1);
    snap(`Coloca o pivô ${pv} na posição ${i + 1}: é a posição final dele.`, "place", { lo, hi, pivot: i + 1, hot: [i + 1, hi], swapped: true });
    const p = i + 1;
    go(lo, p - 1);
    go(p + 1, hi);
    stack.pop();
  };
  go(0, n - 1);
  range(0, n - 1).forEach((k) => fixed.add(k));
  snap(
    `Ordenado. Memória extra usada: só a pilha de chamadas (no máximo ${maxStack} quadros aqui). Em média isso é O(log n); no pior caso (pivô ruim) a pilha chega a O(n).`,
    "call",
    {},
  );
  return frames;
}

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k);

/* ================================================================== */
/* Q2 — MergeSort por níveis (igual ao gabarito)                       */
/* ================================================================== */

/**
 * O gabarito apresenta a árvore "por níveis": primeiro todas as divisões,
 * depois todas as intercalações de cada nível. A execução real é recursiva
 * (termina a metade esquerda antes de começar a direita), mas o resultado
 * de cada nível é o mesmo.
 */
export function mergeLevelFrames(values: number[]): Frame<MergeState>[] {
  // Reaproveita a árvore completa do último quadro da execução recursiva.
  const full = mergeFrames(values);
  const last = full[full.length - 1].state;
  const maxDepth = last.maxDepth;
  const nodes0 = last.nodes.map((nd) => ({ ...nd, vals: values.slice(nd.lo, nd.hi + 1) }));
  const sorted = new Map(last.nodes.map((nd) => [nd.key, nd.vals]));
  const frames: Frame<MergeState>[] = [];
  const fmt = (a: number[]) => "[" + a.join(", ") + "]";
  const mk = (desc: string, line: string, nodes: MergeState["nodes"]) =>
    frames.push({ desc, line, state: { nodes, merge: null, stack: [], comps: 0, maxDepth, n: values.length } });

  for (let d = 0; d <= maxDepth; d++) {
    const nodes = nodes0.map((nd) => ({ ...nd, status: (nd.depth < d ? "split" : nd.depth === d ? "active" : "hidden") as MergeState["nodes"][number]["status"] }));
    const row = nodes0.filter((nd) => nd.depth === d).map((nd) => fmt(nd.vals));
    const intro =
      d === 0
        ? `a) DIVISÃO — Nível 0: o lote inteiro ${row[0]}.`
        : d === maxDepth
          ? `a) DIVISÃO — Nível ${d}: todos os pedaços têm tamanho 1: ${row.join(" ")}. Um elemento sozinho já está ordenado (caso base).`
          : `a) DIVISÃO — Nível ${d}: cada pedaço do nível anterior é dividido ao meio → ${row.join(", ")}.`;
    mk(intro, d === maxDepth ? "base" : "div", nodes);
  }
  for (let d = maxDepth - 1, passo = 1; d >= 0; d--, passo++) {
    const nodes = nodes0.map((nd) => ({
      ...nd,
      vals: nd.depth >= d ? sorted.get(nd.key)! : nd.vals,
      status: (nd.depth > d ? "sorted" : nd.depth === d ? "merging" : "split") as MergeState["nodes"][number]["status"],
    }));
    const row = nodes0.filter((nd) => nd.depth === d).map((nd) => fmt(sorted.get(nd.key)!));
    const size = values.length / 2 ** d;
    mk(
      d === 0
        ? `b) COMBINAÇÃO — Passo ${passo} (resultado final): intercalando as duas metades ordenadas → ${row[0]}.`
        : `b) COMBINAÇÃO — Passo ${passo}: intercala os pares adjacentes do nível de baixo, formando subvetores de ${Number.isInteger(size) ? size : "~" + Math.round(size)} → ${row.join(" | ")}.`,
      "merge",
      nodes.map((nd) => (nd.depth === d ? { ...nd, status: "sorted" as const } : nd)),
    );
  }
  return frames;
}

/* ================================================================== */
/* Q4 — Árvore de decisão do empréstimo                                */
/* ================================================================== */

export const DECISION_CAPTION: Record<string, string> = {
  A: "Renda > 5000",
  B: "Score > 700",
  C: "Reprovado",
  D: "Aprovado",
  E: "Reprovado",
};

export function decisionTree(): BTree {
  const mk = (id: number, label: string, left: number | null = null, right: number | null = null): BNode => ({ id, label, left, right });
  return {
    root: 0,
    nodes: { 0: mk(0, "A", 1, 2), 1: mk(1, "B", 3, 4), 2: mk(2, "C"), 3: mk(3, "D"), 4: mk(4, "E") },
  };
}

export interface TermState {
  /** classe CSS por id do nó */
  cls: Record<number, string>;
  levels: boolean;
  facts: [string, string][];
}

export const q4TermCode: CodeSample = {
  java: [
    ["raiz", "No raiz = arvore.raiz;                       // nó sem pai"],
    [null, ""],
    ["folha", "boolean ehFolha(No no) {                     // sem filhos"],
    ["folha", "    return no.esquerda == null && no.direita == null;"],
    [null, "}"],
    ["interno", "boolean ehInterno(No no) { return !ehFolha(no); }"],
    [null, ""],
    ["altura", "int altura(No no) {                          // maior nível"],
    ["altura", "    if (no == null) return -1;"],
    ["altura", "    return 1 + Math.max(altura(no.esquerda), altura(no.direita));"],
    [null, "}"],
  ],
  python: [
    ["raiz", "raiz = arvore.raiz                          # nó sem pai"],
    [null, ""],
    ["folha", "def eh_folha(no):                           # sem filhos"],
    ["folha", "    return no.esquerda is None and no.direita is None"],
    [null, ""],
    ["interno", "def eh_interno(no): return not eh_folha(no)"],
    [null, ""],
    ["altura", "def altura(no):                             # maior nível"],
    ["altura", "    if no is None: return -1"],
    ["altura", "    return 1 + max(altura(no.esquerda), altura(no.direita))"],
  ],
};

export function q4TermFrames(): Frame<TermState>[] {
  const f: Frame<TermState>[] = [];
  const facts: [string, string][] = [];
  const push = (desc: string, line: string, cls: Record<number, string>, levels = false) => f.push({ desc, line, state: { cls, levels, facts: [...facts] } });
  push("Árvore binária de decisão do empréstimo. Nós internos guardam condições; folhas guardam o resultado final. Vamos responder o item a) passo a passo.", "raiz", {});
  facts.push(["Raiz", "A (Renda > 5000)"]);
  push("RAIZ: é o nó de origem, o único sem pai. Aqui é A [Renda > 5000] — toda decisão começa por ela.", "raiz", { 0: "n-sel" });
  facts.push(["Nós internos", "A, B"]);
  push("NÓS INTERNOS: têm pelo menos um filho. São A e B — as condições. (A raiz também conta como nó interno.)", "interno", { 0: "n-parent", 1: "n-parent" });
  facts.push(["Folhas (externos)", "C, D, E"]);
  push("FOLHAS (nós externos): não têm filhos. São C [Reprovado], D [Aprovado] e E [Reprovado] — os resultados finais.", "folha", { 2: "n-done", 3: "n-done", 4: "n-done" });
  push(
    "NÍVEIS: a raiz está no nível 0; B e C no nível 1; D e E no nível 2 (nível = nº de ligações até a raiz).",
    "altura",
    { 0: "n-anc", 1: "n-path", 2: "n-path", 3: "n-sel", 4: "n-sel" },
    true,
  );
  facts.push(["Altura", "2"]);
  push(
    "ALTURA = maior nível = 2. É o caminho A → B → D (ou A → B → E): 2 ligações da raiz até a folha mais distante. Cuidado: não é 3 (isso seria contar nós, não ligações).",
    "altura",
    { 0: "n-sel", 1: "n-sel", 3: "n-sel" },
    true,
  );
  return f;
}

/* ================================================================== */
/* Q5 — calcular(n) sem e com caso base                               */
/* ================================================================== */

export const q5Code: Record<"junior" | "fix", CodeSample> = {
  junior: {
    python: [
      ["call", "def calcular(n):"],
      ["rec", "    return n * calcular(n - 1)     # ⚠ falta o caso base"],
      [null, ""],
      [null, "calcular(5)   # RecursionError: maximum recursion depth exceeded"],
    ],
    java: [
      ["call", "static int calcular(int n) {"],
      ["rec", "    return n * calcular(n - 1);    // ⚠ falta o caso base"],
      [null, "}"],
      [null, "// calcular(5) → StackOverflowError"],
    ],
  },
  fix: {
    python: [
      ["call", "def calcular(n):"],
      ["test", "    if n <= 1:                     # caso base"],
      ["base", "        return 1"],
      ["rec", "    return n * calcular(n - 1)     # passo recursivo"],
      [null, ""],
      [null, "print(calcular(5))   # 120"],
    ],
    java: [
      ["call", "static int calcular(int n) {"],
      ["test", "    if (n <= 1)                    // caso base"],
      ["base", "        return 1;"],
      ["rec", "    return n * calcular(n - 1);    // passo recursivo"],
      [null, "}"],
    ],
  },
};

/* ================================================================== */
/* Q6 — Multigrafo direcionado de transações PIX                      */
/* ================================================================== */

export interface PixState {
  g: Graph;
  labels: string[];
  hotEdges: number[];
  hotVertex: string | null;
  dOut: number | null;
  dIn: number | null;
  tags: string[];
}

export const q6Code: CodeSample = {
  java: [
    ["model", "record Pix(String origem, String destino, String quando) {}"],
    [null, ""],
    ["edges", "List<Pix> arestas = List.of("],
    ["edges", '    new Pix("A", "B", "10h · R$ 50"),'],
    ["edges", '    new Pix("A", "B", "14h · R$ 1.200"),   // aresta PARALELA'],
    ["loop", '    new Pix("A", "A", "conta própria")      // LAÇO'],
    ["edges", ");"],
    [null, ""],
    ["out", "int grauSaida(String v) {          // setas que SAEM de v"],
    ["out", "    int g = 0;"],
    ["out", "    for (Pix p : arestas) if (p.origem().equals(v)) g++;"],
    ["out", "    return g;"],
    [null, "}"],
    ["in", "int grauEntrada(String v) {        // setas que CHEGAM em v"],
    ["in", "    int g = 0;"],
    ["in", "    for (Pix p : arestas) if (p.destino().equals(v)) g++;"],
    ["in", "    return g;"],
    [null, "}"],
  ],
  python: [
    ["edges", "arestas = ["],
    ["edges", "    ('A', 'B', '10h · R$ 50'),"],
    ["edges", "    ('A', 'B', '14h · R$ 1.200'),   # aresta PARALELA"],
    ["loop", "    ('A', 'A', 'conta própria'),    # LAÇO"],
    ["edges", "]"],
    [null, ""],
    ["out", "def grau_saida(v):                  # setas que SAEM de v"],
    ["out", "    return sum(1 for o, d, _ in arestas if o == v)"],
    [null, ""],
    ["in", "def grau_entrada(v):                # setas que CHEGAM em v"],
    ["in", "    return sum(1 for o, d, _ in arestas if d == v)"],
  ],
};

export function q6Frames(): Frame<PixState>[] {
  const vertices = [
    { id: "A", x: 12, y: 58 },
    { id: "B", x: 88, y: 58 },
  ];
  const allEdges: [string, string][] = [
    ["A", "B"],
    ["A", "B"],
    ["A", "A"],
  ];
  const allLabels = ["10h · R$ 50", "14h · R$ 1.200", "conta própria"];
  const f: Frame<PixState>[] = [];
  const push = (desc: string, line: string, k: number, s: Partial<PixState> = {}, directed = true) =>
    f.push({
      desc,
      line,
      state: { g: { vertices, edges: allEdges.slice(0, k), directed }, labels: allLabels.slice(0, k), hotEdges: [], hotVertex: null, dOut: null, dIn: null, tags: [], ...s },
    });
  push("Modelagem: cada CLIENTE é um vértice e cada TRANSFERÊNCIA PIX é uma aresta. Começamos com os clientes A e B.", "model", 0);
  push("10h: A transfere R$ 50 para B → primeira aresta A → B.", "edges", 1, { hotEdges: [0] });
  push("14h: A transfere R$ 1.200 para B → SEGUNDA aresta entre o mesmo par. São transações diferentes, então não podemos juntá-las: temos ARESTAS PARALELAS.", "edges", 2, {
    hotEdges: [0, 1],
    tags: ["Multigrafo"],
  });
  push("Toda transferência tem sentido: sai do remetente e chega no favorecido. Por isso as arestas são SETAS → o grafo é DIRECIONADO (orientado).", "edges", 2, {
    hotEdges: [0, 1],
    tags: ["Multigrafo", "Direcionado"],
  });
  push("A transfere para outra conta dele mesmo: a aresta sai de A e volta para A. Isso é um LAÇO (loop).", "loop", 3, {
    hotEdges: [2],
    tags: ["Multigrafo", "Direcionado", "Tem laço"],
  });
  push(
    "a) Classificação: MULTIGRAFO DIRECIONADO. Multigrafo porque há arestas paralelas A → B; direcionado porque cada PIX tem origem e destino. (Com laço ou aresta paralela, o grafo NÃO é simples.)",
    "edges",
    3,
    { tags: ["Multigrafo", "Direcionado", "Tem laço", "Não é simples"] },
  );
  push("b) Grau de SAÍDA de A: contamos as setas que SAEM de A. Primeira: PIX de R$ 50 → 1.", "out", 3, {
    hotEdges: [0],
    hotVertex: "A",
    dOut: 1,
    tags: ["Multigrafo", "Direcionado"],
  });
  push("Segunda: PIX de R$ 1.200 → 2.", "out", 3, { hotEdges: [0, 1], hotVertex: "A", dOut: 2, tags: ["Multigrafo", "Direcionado"] });
  push("O laço também SAI de A → d_out(A) = 3.", "out", 3, { hotEdges: [0, 1, 2], hotVertex: "A", dOut: 3, tags: ["Multigrafo", "Direcionado"] });
  push("Grau de ENTRADA de A: setas que CHEGAM em A. As duas transferências chegam em B, não em A. Só o laço chega de volta em A → d_in(A) = 1.", "in", 3, {
    hotEdges: [2],
    hotVertex: "A",
    dOut: 3,
    dIn: 1,
    tags: ["Multigrafo", "Direcionado"],
  });
  push("Resposta: d_out(A) = 3 e d_in(A) = 1. Conferência: o laço conta UMA vez na saída e UMA na entrada, por isso no grau total ele vale 2 (d(A) = 3 + 1 = 4).", "in", 3, {
    hotVertex: "A",
    dOut: 3,
    dIn: 1,
    tags: ["Multigrafo", "Direcionado", "Tem laço"],
  });
  return f;
}

/* ================================================================== */
/* Q7 — Servidores: vértice isolado e grafo completo K5               */
/* ================================================================== */

export interface NetState {
  g: Graph;
  hotEdges: number[];
  cut: [string, string] | null;
  visited: string[];
  current: string | null;
  isolated: string | null;
  count: number | null;
  formula: string | null;
  verdict: string | null;
}

export const q7Code: CodeSample = {
  java: [
    ["iso", "boolean isolado(String v) {"],
    ["iso", "    return grau(v) == 0;                    // nenhuma aresta incide em v"],
    [null, "}"],
    [null, ""],
    ["bfs", "boolean conexo() {"],
    ["bfs", '    Set<String> vis = bfs("S1");            // tudo que S1 alcança'],
    ["verdict", "    return vis.size() == vertices.size();   // alcançou todos?"],
    [null, "}"],
    [null, ""],
    ["kn", "int arestasCompleto(int n) {"],
    ["kn", "    return n * (n - 1) / 2;                 // cada par uma única vez"],
    [null, "}"],
  ],
  python: [
    ["iso", "def isolado(v):"],
    ["iso", "    return grau(v) == 0          # nenhuma aresta incide em v"],
    [null, ""],
    ["bfs", "def conexo():"],
    ["bfs", "    vis = bfs('S1')              # tudo que S1 alcança"],
    ["verdict", "    return len(vis) == len(vertices)"],
    [null, ""],
    ["kn", "def arestas_completo(n):"],
    ["kn", "    return n * (n - 1) // 2      # cada par uma única vez"],
  ],
};

export function q7Frames(): Frame<NetState>[] {
  const ids = ["S1", "S2", "S3", "S4", "S5"];
  const vertices = ids.map((id, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / 5;
    return { id, x: 50 + 40 * Math.cos(a), y: 52 + 40 * Math.sin(a) };
  });
  const net: [string, string][] = [
    ["S1", "S2"],
    ["S2", "S3"],
    ["S3", "S4"],
    ["S4", "S1"],
    ["S1", "S3"],
    ["S4", "S5"],
  ];
  const f: Frame<NetState>[] = [];
  const base = (edges: [string, string][]): NetState => ({
    g: { vertices, edges, directed: false },
    hotEdges: [],
    cut: null,
    visited: [],
    current: null,
    isolated: null,
    count: null,
    formula: null,
    verdict: null,
  });
  const push = (desc: string, line: string, edges: [string, string][], s: Partial<NetState> = {}) => f.push({ desc, line, state: { ...base(edges), ...s } });

  push("a) Rede dos 5 servidores antes da manutenção. S5 está ligado à rede por um único cabo (S4–S5).", "iso", net, { hotEdges: [5] });
  push("O cabo S4–S5 é cortado: a aresta deixa de existir.", "iso", net, { hotEdges: [5], cut: ["S4", "S5"] });
  const after = net.slice(0, 5);
  push("Agora nenhuma aresta incide em S5: d(S5) = 0. Um vértice de grau 0 é chamado de VÉRTICE ISOLADO.", "iso", after, { isolated: "S5" });

  // BFS a partir de S1 para mostrar que S5 não é alcançado
  const g: Graph = { vertices, edges: after, directed: false };
  const visited = ["S1"];
  const queue = ["S1"];
  push("Para saber se o grafo é conexo, tentamos alcançar todos os vértices a partir de S1 (busca em largura).", "bfs", after, {
    isolated: "S5",
    visited: [...visited],
    current: "S1",
  });
  while (queue.length) {
    const u = queue.shift()!;
    const novos = neighbors(g, u).filter((w) => !visited.includes(w));
    novos.forEach((w) => {
      visited.push(w);
      queue.push(w);
    });
    if (novos.length) push(`De ${u} alcançamos ${novos.join(", ")}.`, "bfs", after, { isolated: "S5", visited: [...visited], current: u });
  }
  push(
    `A busca alcançou ${visited.join(", ")} — mas NÃO alcançou S5. Não existe caminho entre S5 e os demais, então o grafo é DESCONEXO. Regra do slide: todo grafo com vértice isolado é desconexo.`,
    "verdict",
    after,
    { isolated: "S5", visited: [...visited], verdict: "Desconexo" },
  );

  // Parte b — K5
  const pairs: [string, string][] = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) pairs.push([ids[i], ids[j]]);
  push("b) Rede perfeitamente malhada = GRAFO COMPLETO K5: todo par de servidores ligado diretamente. Vamos contar as arestas ligando par por par.", "kn", [], { count: 0 });
  pairs.forEach((pr, k) => {
    push(`Aresta ${k + 1}: ${pr[0]}–${pr[1]}.`, "kn", pairs.slice(0, k + 1), { hotEdges: [k], count: k + 1 });
  });
  push(
    "Fórmula: A = n · (n − 1) / 2 = 5 · 4 / 2 = 10 arestas. Cada servidor se liga aos outros 4 (5 × 4 = 20), mas assim cada cabo é contado duas vezes (uma em cada ponta), por isso dividimos por 2.",
    "kn",
    pairs,
    { count: 10, formula: "5 · 4 / 2 = 10" },
  );
  return f;
}
