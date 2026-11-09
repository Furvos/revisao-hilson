import type { CodeSample, Frame, Item } from "../engine/types";

export type PivotRule = "primeiro" | "meio" | "ultimo" | "mediana3";

export const PIVOT_NAME: Record<PivotRule, string> = { primeiro: "primeiro", meio: "meio", ultimo: "último", mediana3: "mediana de 3" };

export interface QuickState {
  arr: Item[];
  lo: number;
  hi: number;
  pivotId: number | null;
  /** elemento sendo comparado com o pivô */
  cmpId: number | null;
  x1: Item[];
  x2: Item[];
  /** ids que já estão na posição final */
  fixed: number[];
  stack: string[];
  comps: number;
  partitioning: boolean;
}

export const quickCode: CodeSample = {
  java: [
    ["fn", "static List<Integer> quickSort(List<Integer> v) {"],
    ["base", "    if (v.size() <= 1) return v;          // caso base"],
    ["pivot", "    int p = escolherPivo(v);              // pivô"],
    [null, "    List<Integer> x1 = new ArrayList<>();  // <= p"],
    [null, "    List<Integer> x2 = new ArrayList<>();  // >  p"],
    ["cmp", "    for (int x : semOPivo(v, p)) {"],
    ["cmp", "        if (x <= p) {"],
    ["x1", "            x1.add(x);"],
    [null, "        } else {"],
    ["x2", "            x2.add(x);"],
    [null, "        }"],
    [null, "    }"],
    ["join", "    List<Integer> r = new ArrayList<>(quickSort(x1));"],
    ["join", "    r.add(p);"],
    ["join", "    r.addAll(quickSort(x2));"],
    ["join", "    return r;                             // combina"],
    [null, "}"],
  ],
  python: [
    ["fn", "def quick_sort(v):"],
    ["base", "    if len(v) <= 1:          # caso base"],
    ["base", "        return v"],
    ["pivot", "    p = escolher_pivo(v)     # pivô"],
    [null, "    x1, x2 = [], []          # x1: <= p | x2: > p"],
    ["cmp", "    for x in sem_o_pivo(v, p):"],
    ["cmp", "        if x <= p:"],
    ["x1", "            x1.append(x)"],
    [null, "        else:"],
    ["x2", "            x2.append(x)"],
    ["join", "    return quick_sort(x1) + [p] + quick_sort(x2)"],
  ],
};

const fmt = (items: Item[]) => "[" + items.map((x) => x.v).join(", ") + "]";

export function quickFrames(values: number[], rule: PivotRule): Frame<QuickState>[] {
  const arr: Item[] = values.map((v, id) => ({ id, v }));
  const frames: Frame<QuickState>[] = [];
  const fixed = new Set<number>();
  const stack: string[] = [];
  let comps = 0;

  const snap = (desc: string, line: string, s: Partial<QuickState>) =>
    frames.push({
      desc,
      line,
      state: {
        arr: arr.map((x) => ({ ...x })),
        lo: 0,
        hi: arr.length - 1,
        pivotId: null,
        cmpId: null,
        x1: [],
        x2: [],
        fixed: [...fixed],
        stack: [...stack],
        comps,
        partitioning: false,
        ...s,
      },
    });

  snap(
    `Vetor inicial. A ideia do Quick Sort: escolher um pivô p e separar os demais em dois conjuntos — X1 (valores ≤ p) e X2 (valores > p). Depois, ordenar X1 e X2 do mesmo jeito (recursão).`,
    "fn",
    {},
  );

  const qs = (lo: number, hi: number) => {
    const part = arr.slice(lo, hi + 1);
    stack.push(`quickSort(${fmt(part)})`);
    snap(`Chamada recursiva para o trecho ${fmt(part)} (posições ${lo} a ${hi}).`, "fn", { lo, hi });

    if (hi - lo + 1 <= 1) {
      if (hi === lo) fixed.add(arr[lo].id);
      snap(
        hi < lo
          ? `Trecho vazio: caso base, não há nada para ordenar. Volta para quem chamou.`
          : `Trecho com um único elemento (${arr[lo].v}): caso base. Um elemento sozinho já está ordenado e fica nessa posição.`,
        "base",
        { lo, hi },
      );
      stack.pop();
      return;
    }

    const mid = lo + Math.floor((hi - lo) / 2);
    let pIdx = rule === "primeiro" ? lo : rule === "ultimo" ? hi : mid;
    let why = `${PIVOT_NAME[rule]} elemento do trecho`;
    if (rule === "mediana3") {
      // Mediana de três: olha o primeiro, o do meio e o último e fica com o valor do meio.
      const cand = [lo, mid, hi].sort((a, b) => arr[a].v - arr[b].v);
      pIdx = cand[1];
      why = `mediana de três entre ${arr[lo].v}, ${arr[mid].v} e ${arr[hi].v}`;
    }
    const pivot = arr[pIdx];
    snap(`Pivô escolhido (${why}): p = ${pivot.v}.`, "pivot", { lo, hi, pivotId: pivot.id, partitioning: true });

    const x1: Item[] = [];
    const x2: Item[] = [];
    for (let k = lo; k <= hi; k++) {
      if (k === pIdx) continue;
      const it = arr[k];
      comps++;
      snap(`Compara ${it.v} com o pivô ${pivot.v}...`, "cmp", { lo, hi, pivotId: pivot.id, cmpId: it.id, x1: [...x1], x2: [...x2], partitioning: true });
      if (it.v <= pivot.v) {
        x1.push(it);
        snap(`${it.v} ≤ ${pivot.v}, então vai para X1 (lado esquerdo).`, "x1", { lo, hi, pivotId: pivot.id, cmpId: it.id, x1: [...x1], x2: [...x2], partitioning: true });
      } else {
        x2.push(it);
        snap(`${it.v} > ${pivot.v}, então vai para X2 (lado direito).`, "x2", { lo, hi, pivotId: pivot.id, cmpId: it.id, x1: [...x1], x2: [...x2], partitioning: true });
      }
    }

    // Reescreve o trecho: X1 + p + X2
    const merged = [...x1, pivot, ...x2];
    for (let k = 0; k < merged.length; k++) arr[lo + k] = merged[k];
    fixed.add(pivot.id);
    const pPos = lo + x1.length;
    snap(
      `Partição pronta: X1 = ${fmt(x1)}, pivô ${pivot.v}, X2 = ${fmt(x2)}. O pivô já está na posição final (${pPos}) — tudo à esquerda é ≤ ${pivot.v} e tudo à direita é > ${pivot.v}.`,
      "join",
      { lo, hi, pivotId: pivot.id },
    );

    qs(lo, pPos - 1);
    qs(pPos + 1, hi);
    stack.pop();
    snap(`O trecho ${fmt(arr.slice(lo, hi + 1))} terminou: X1 ordenado + pivô + X2 ordenado. Volta para quem chamou.`, "join", { lo, hi });
  };

  qs(0, arr.length - 1);
  arr.forEach((x) => fixed.add(x.id));
  snap(`Vetor ordenado! Foram ${comps} comparações com pivôs.`, "join", {});
  return frames;
}
