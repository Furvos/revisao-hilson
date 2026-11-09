import type { CodeSample, Frame, Item } from "../engine/types";

export interface BubbleState {
  arr: Item[];
  /** índices sendo comparados */
  cmp: [number, number] | null;
  /** true quando o par acabou de ser trocado */
  swapped: boolean;
  /** a partir deste índice o vetor já está na posição final */
  sortedFrom: number;
  pass: number;
  comps: number;
  swaps: number;
}

export const bubbleCode: CodeSample = {
  java: [
    ["fn", "static void bubbleSort(int[] v) {"],
    [null, "    int n = v.length;"],
    ["pass", "    for (int i = 0; i < n - 1; i++) {      // passada"],
    ["flag", "        boolean trocou = false;"],
    ["loop", "        for (int j = 0; j < n - 1 - i; j++) {"],
    ["cmp", "            if (v[j] > v[j + 1]) {         // compara vizinhos"],
    ["swap", "                int aux = v[j];            // troca"],
    ["swap", "                v[j] = v[j + 1];"],
    ["swap", "                v[j + 1] = aux;"],
    ["swap", "                trocou = true;"],
    [null, "            }"],
    [null, "        }"],
    ["stop", "        if (!trocou) break;            // já está ordenado"],
    [null, "    }"],
    ["done", "}"],
  ],
  python: [
    ["fn", "def bubble_sort(v):"],
    [null, "    n = len(v)"],
    ["pass", "    for i in range(n - 1):           # passada"],
    ["flag", "        trocou = False"],
    ["loop", "        for j in range(n - 1 - i):"],
    ["cmp", "            if v[j] > v[j + 1]:      # compara vizinhos"],
    ["swap", "                v[j], v[j + 1] = v[j + 1], v[j]  # troca"],
    ["swap", "                trocou = True"],
    ["stop", "        if not trocou:               # já está ordenado"],
    ["stop", "            break"],
    ["done", "    return v"],
  ],
};

export function bubbleFrames(values: number[]): Frame<BubbleState>[] {
  const arr: Item[] = values.map((v, id) => ({ id, v }));
  const n = arr.length;
  const frames: Frame<BubbleState>[] = [];
  let comps = 0;
  let swaps = 0;
  let sortedFrom = n;
  const snap = (desc: string, line: string, extra: Partial<BubbleState> = {}) =>
    frames.push({
      desc,
      line,
      state: { arr: arr.map((x) => ({ ...x })), cmp: null, swapped: false, sortedFrom, pass: 0, comps, swaps, ...extra },
    });

  snap(
    `Vetor inicial com ${n} elementos. O Bubble Sort compara vizinhos e troca quando o da esquerda é maior. A cada passada, o maior valor que sobrou "borbulha" até o fim.`,
    "fn",
  );

  for (let i = 0; i < n - 1; i++) {
    let trocou = false;
    snap(`Passada ${i + 1}: vamos percorrer da posição 0 até a ${n - 2 - i}. As últimas ${i} posições já estão no lugar certo.`, "pass", { pass: i + 1 });
    for (let j = 0; j < n - 1 - i; j++) {
      comps++;
      const a = arr[j].v;
      const b = arr[j + 1].v;
      if (a > b) {
        snap(`Compara v[${j}] = ${a} com v[${j + 1}] = ${b}. Como ${a} > ${b}, eles estão fora de ordem.`, "cmp", { cmp: [j, j + 1], pass: i + 1 });
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
        trocou = true;
        snap(`Troca: ${b} vai para a posição ${j} e ${a} vai para a posição ${j + 1}.`, "swap", { cmp: [j, j + 1], swapped: true, pass: i + 1 });
      } else {
        snap(`Compara v[${j}] = ${a} com v[${j + 1}] = ${b}. Como ${a} ≤ ${b}, já estão em ordem: não troca.`, "cmp", { cmp: [j, j + 1], pass: i + 1 });
      }
    }
    sortedFrom = n - 1 - i;
    snap(`Fim da passada ${i + 1}: o valor ${arr[n - 1 - i].v} chegou à sua posição final (${n - 1 - i}).`, "loop", { pass: i + 1 });
    if (!trocou) {
      sortedFrom = 0;
      snap(`Nenhuma troca aconteceu nesta passada, então o vetor já está ordenado. O algoritmo para mais cedo (é por isso que o melhor caso é O(n)).`, "stop", { pass: i + 1 });
      break;
    }
  }
  sortedFrom = 0;
  snap(`Vetor ordenado! Foram ${comps} comparações e ${swaps} trocas.`, "done");
  return frames;
}
