import type { CodeSample, Frame } from "../engine/types";

export type NodeStatus = "hidden" | "idle" | "active" | "split" | "merging" | "sorted";

export interface MNode {
  key: string;
  lo: number;
  hi: number;
  depth: number;
  vals: number[];
  status: NodeStatus;
}

export interface MergeInfo {
  key: string;
  left: string;
  right: string;
  i: number;
  j: number;
  out: number[];
  /** de onde veio o último elemento copiado */
  took: "a" | "b" | null;
}

export interface MergeState {
  nodes: MNode[];
  merge: MergeInfo | null;
  stack: string[];
  comps: number;
  maxDepth: number;
  n: number;
}

export const mergeCode: CodeSample = {
  java: [
    ["fn", "static int[] mergeSort(int[] v) {"],
    ["base", "    if (v.length <= 1) return v;              // caso base"],
    ["div", "    int meio = v.length / 2;                  // DIVISÃO"],
    ["div", "    int[] esq = mergeSort(copia(v, 0, meio));   // CONQUISTA"],
    ["div", "    int[] dir = mergeSort(copia(v, meio, v.length));"],
    ["merge", "    return intercalar(esq, dir);              // COMBINAÇÃO"],
    [null, "}"],
    [null, ""],
    ["merge", "static int[] intercalar(int[] a, int[] b) {"],
    [null, "    int[] r = new int[a.length + b.length];   // vetor auxiliar"],
    [null, "    int i = 0, j = 0, k = 0;"],
    ["cmp", "    while (i < a.length && j < b.length) {"],
    ["cmp", "        if (a[i] <= b[j]) r[k++] = a[i++];   // menor de A"],
    ["cmp", "        else              r[k++] = b[j++];   // menor de B"],
    [null, "    }"],
    ["rest", "    while (i < a.length) r[k++] = a[i++];     // sobras"],
    ["rest", "    while (j < b.length) r[k++] = b[j++];"],
    ["done", "    return r;"],
    [null, "}"],
  ],
  python: [
    ["fn", "def merge_sort(v):"],
    ["base", "    if len(v) <= 1:                 # caso base"],
    ["base", "        return v"],
    ["div", "    meio = len(v) // 2              # DIVISÃO"],
    ["div", "    esq = merge_sort(v[:meio])      # CONQUISTA"],
    ["div", "    dir = merge_sort(v[meio:])"],
    ["merge", "    return intercalar(esq, dir)     # COMBINAÇÃO"],
    [null, ""],
    ["merge", "def intercalar(a, b):"],
    [null, "    r = []                          # vetor auxiliar"],
    [null, "    i = j = 0"],
    ["cmp", "    while i < len(a) and j < len(b):"],
    ["cmp", "        if a[i] <= b[j]:"],
    ["cmp", "            r.append(a[i]); i += 1"],
    ["cmp", "        else:"],
    ["cmp", "            r.append(b[j]); j += 1"],
    ["rest", "    r += a[i:] + b[j:]              # sobras"],
    ["done", "    return r"],
  ],
};

const fmt = (a: number[]) => "[" + a.join(", ") + "]";

export function mergeFrames(values: number[]): Frame<MergeState>[] {
  const n = values.length;
  const nodes = new Map<string, MNode>();
  let maxDepth = 0;

  // Monta a árvore de divisões de antemão (fica escondida até ser "visitada").
  const build = (lo: number, hi: number, depth: number) => {
    const key = `${lo}-${hi}`;
    nodes.set(key, { key, lo, hi, depth, vals: values.slice(lo, hi + 1), status: "hidden" });
    maxDepth = Math.max(maxDepth, depth);
    if (hi > lo) {
      const mid = lo + Math.floor((hi - lo + 1) / 2) - 1;
      build(lo, mid, depth + 1);
      build(mid + 1, hi, depth + 1);
    }
  };
  build(0, n - 1, 0);

  const frames: Frame<MergeState>[] = [];
  const stack: string[] = [];
  let comps = 0;
  const snap = (desc: string, line: string, merge: MergeInfo | null = null) =>
    frames.push({
      desc,
      line,
      state: {
        nodes: [...nodes.values()].map((x) => ({ ...x, vals: [...x.vals] })),
        merge: merge ? { ...merge, out: [...merge.out] } : null,
        stack: [...stack],
        comps,
        maxDepth,
        n,
      },
    });

  const root = nodes.get(`0-${n - 1}`)!;
  root.status = "idle";
  snap(
    `Vetor inicial com ${n} elementos. O Merge Sort tem 3 etapas: DIVISÃO (quebrar ao meio), CONQUISTA (ordenar cada metade recursivamente) e COMBINAÇÃO (intercalar as metades já ordenadas).`,
    "fn",
  );

  const ms = (lo: number, hi: number): number[] => {
    const node = nodes.get(`${lo}-${hi}`)!;
    stack.push(`mergeSort(${fmt(node.vals)})`);
    node.status = "active";
    if (lo === hi) {
      snap(`${fmt(node.vals)} tem um único elemento: caso base. Já está ordenado.`, "base");
      node.status = "sorted";
      stack.pop();
      return node.vals;
    }
    const mid = lo + Math.floor((hi - lo + 1) / 2) - 1;
    const L = nodes.get(`${lo}-${mid}`)!;
    const R = nodes.get(`${mid + 1}-${hi}`)!;
    L.status = "idle";
    R.status = "idle";
    snap(`DIVISÃO: ${fmt(node.vals)} é quebrado ao meio em ${fmt(L.vals)} e ${fmt(R.vals)}.`, "div");
    node.status = "split";
    const a = ms(lo, mid);
    node.status = "split";
    const b = ms(mid + 1, hi);

    // COMBINAÇÃO
    node.status = "merging";
    L.status = "sorted";
    R.status = "sorted";
    const info: MergeInfo = { key: node.key, left: L.key, right: R.key, i: 0, j: 0, out: [], took: null };
    node.vals = [];
    snap(`COMBINAÇÃO: intercalar ${fmt(a)} com ${fmt(b)}. Usamos um vetor auxiliar e dois índices (i em A, j em B).`, "merge", info);
    while (info.i < a.length && info.j < b.length) {
      comps++;
      const x = a[info.i];
      const y = b[info.j];
      snap(`Compara A[${info.i}] = ${x} com B[${info.j}] = ${y}.`, "cmp", info);
      if (x <= y) {
        info.out.push(x);
        info.i++;
        info.took = "a";
        node.vals = [...info.out];
        snap(`${x} ≤ ${y}: copia ${x} (de A) para o auxiliar.`, "cmp", info);
      } else {
        info.out.push(y);
        info.j++;
        info.took = "b";
        node.vals = [...info.out];
        snap(`${y} < ${x}: copia ${y} (de B) para o auxiliar.`, "cmp", info);
      }
      info.took = null;
    }
    if (info.i < a.length || info.j < b.length) {
      const rest = info.i < a.length ? a.slice(info.i) : b.slice(info.j);
      const from = info.i < a.length ? "A" : "B";
      info.out.push(...rest);
      info.i = a.length;
      info.j = b.length;
      node.vals = [...info.out];
      snap(`Um dos lados acabou. As sobras de ${from} (${fmt(rest)}) já estão ordenadas e são copiadas direto para o final.`, "rest", info);
    }
    node.status = "sorted";
    snap(`Trecho combinado: ${fmt(node.vals)} está ordenado.`, "done");
    stack.pop();
    return node.vals;
  };

  // Os filhos já combinados continuam visíveis, como no diagrama do slide do professor.
  const result = ms(0, n - 1);
  snap(
    `Vetor ordenado: ${fmt(result)}. Foram ${comps} comparações. Repare que a árvore tem ${maxDepth} níveis de divisão (≈ log₂ n) e cada nível faz cerca de n comparações: O(n log n).`,
    "done",
  );
  return frames;
}
