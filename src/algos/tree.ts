import type { CodeSample, Frame } from "../engine/types";

/* ------------------------------------------------------------------ */
/* Estrutura de árvore binária (guardada como mapa de nós)             */
/* ------------------------------------------------------------------ */

export interface BNode {
  id: number;
  label: string;
  left: number | null;
  right: number | null;
}

export interface BTree {
  root: number | null;
  nodes: Record<number, BNode>;
}

export const cloneTree = (t: BTree): BTree => ({
  root: t.root,
  nodes: Object.fromEntries(Object.entries(t.nodes).map(([k, v]) => [k, { ...v }])),
});

/** Posição de cada nó: x pela ordem "em-ordem", y pelo nível. */
export function layoutBinary(t: BTree): Record<number, { x: number; y: number }> {
  const pos: Record<number, { x: number; y: number }> = {};
  let i = 0;
  const walk = (id: number | null, d: number) => {
    if (id === null) return;
    const n = t.nodes[id];
    walk(n.left, d + 1);
    pos[id] = { x: i++, y: d };
    walk(n.right, d + 1);
  };
  walk(t.root, 0);
  return pos;
}

export function heightOf(t: BTree): number {
  const h = (id: number | null): number => (id === null ? -1 : 1 + Math.max(h(t.nodes[id].left), h(t.nodes[id].right)));
  return h(t.root);
}

/** Árvore do slide do professor: A(B(D,E), C(F,G)). */
export function slideBinaryTree(): BTree {
  const L = ["A", "B", "C", "D", "E", "F", "G"];
  const nodes: Record<number, BNode> = {};
  L.forEach((label, id) => (nodes[id] = { id, label, left: null, right: null }));
  nodes[0].left = 1;
  nodes[0].right = 2;
  nodes[1].left = 3;
  nodes[1].right = 4;
  nodes[2].left = 5;
  nodes[2].right = 6;
  return { root: 0, nodes };
}

/** Árvore binária aleatória (formato variado) com rótulos A, B, C... */
export function randomBinaryTree(count = 7 + Math.floor(Math.random() * 3)): BTree {
  const nodes: Record<number, BNode> = {};
  nodes[0] = { id: 0, label: "A", left: null, right: null };
  for (let id = 1; id < count; id++) {
    // Escolhe uma vaga livre aleatória limitando a altura a 3.
    const free: [number, "left" | "right"][] = [];
    const depth = (target: number): number => {
      const f = (cur: number | null, d: number): number => {
        if (cur === null) return -1;
        if (cur === target) return d;
        return Math.max(f(nodes[cur].left, d + 1), f(nodes[cur].right, d + 1));
      };
      return f(0, 0);
    };
    Object.values(nodes).forEach((n) => {
      if (depth(n.id) >= 3) return;
      if (n.left === null) free.push([n.id, "left"]);
      if (n.right === null) free.push([n.id, "right"]);
    });
    const [pid, side] = free[Math.floor(Math.random() * free.length)];
    nodes[id] = { id, label: "", left: null, right: null };
    nodes[pid][side] = id;
  }
  // Rotula em pré-ordem para ficar natural (A na raiz, letras descendo).
  let c = 0;
  const lab = (id: number | null) => {
    if (id === null) return;
    nodes[id].label = String.fromCharCode(65 + c++);
    lab(nodes[id].left);
    lab(nodes[id].right);
  };
  lab(0);
  return { root: 0, nodes };
}

/* ------------------------------------------------------------------ */
/* Percursos (caminhamentos)                                           */
/* ------------------------------------------------------------------ */

export type Order = "pre" | "em" | "pos";
export const ORDER_NAME: Record<Order, string> = { pre: "pré-ordem", em: "em-ordem (central)", pos: "pós-ordem" };

export interface TravState {
  tree: BTree;
  current: number | null;
  visited: number[];
  output: string[];
  stack: string[];
  /** nó cujo filho é nulo e está sendo testado */
  nullOf: { id: number; side: "esq" | "dir" } | null;
}

const fnName: Record<Order, [string, string]> = {
  pre: ["preOrdem", "pre_ordem"],
  em: ["emOrdem", "em_ordem"],
  pos: ["posOrdem", "pos_ordem"],
};

export function travCode(order: Order): CodeSample {
  const [j, p] = fnName[order];
  const visitJ: [string, string] = ["visit", `    System.out.print(no.valor);   // visita a raiz`];
  const leftJ: [string, string] = ["left", `    ${j}(no.esquerda);           // subárvore esquerda`];
  const rightJ: [string, string] = ["right", `    ${j}(no.direita);            // subárvore direita`];
  const visitP: [string, string] = ["visit", `    print(no.valor)              # visita a raiz`];
  const leftP: [string, string] = ["left", `    ${p}(no.esquerda)        # subárvore esquerda`];
  const rightP: [string, string] = ["right", `    ${p}(no.direita)         # subárvore direita`];
  const seqJ = order === "pre" ? [visitJ, leftJ, rightJ] : order === "em" ? [leftJ, visitJ, rightJ] : [leftJ, rightJ, visitJ];
  const seqP = order === "pre" ? [visitP, leftP, rightP] : order === "em" ? [leftP, visitP, rightP] : [leftP, rightP, visitP];
  return {
    java: [["call", `static void ${j}(No no) {`], ["null", `    if (no == null) return;      // caso base`], ...seqJ, [null, "}"]],
    python: [["call", `def ${p}(no):`], ["null", `    if no is None:               # caso base`], ["null", "        return"], ...seqP],
  };
}

export function traversalFrames(tree: BTree, order: Order): Frame<TravState>[] {
  const frames: Frame<TravState>[] = [];
  const visited: number[] = [];
  const output: string[] = [];
  const stack: string[] = [];
  const [fn] = fnName[order];
  const snap = (desc: string, line: string, current: number | null, nullOf: TravState["nullOf"] = null) =>
    frames.push({ desc, line, state: { tree, current, visited: [...visited], output: [...output], stack: [...stack], nullOf } });

  const rule = order === "pre" ? "RAIZ → esquerda → direita" : order === "em" ? "esquerda → RAIZ → direita" : "esquerda → direita → RAIZ";
  snap(`Percurso em ${ORDER_NAME[order]}: para cada nó, a regra é ${rule}. O percurso é recursivo: cada subárvore é percorrida com a mesma regra.`, "call", null);

  const go = (id: number | null, parent: number | null, side: "esq" | "dir" | null) => {
    if (id === null) {
      if (parent !== null && side) {
        stack.push(`${fn}(null)`);
        snap(`O filho da ${side === "esq" ? "esquerda" : "direita"} de ${tree.nodes[parent].label} é nulo: caso base, volta sem fazer nada.`, "null", parent, { id: parent, side });
        stack.pop();
      }
      return;
    }
    const n = tree.nodes[id];
    stack.push(`${fn}(${n.label})`);
    snap(`Chama ${fn}(${n.label}).`, "call", id);
    const visit = () => {
      visited.push(id);
      output.push(n.label);
      snap(`VISITA ${n.label}: escreve "${n.label}" na saída.`, "visit", id);
    };
    const left = () => {
      snap(`Em ${n.label}: vai para a subárvore ESQUERDA${n.left !== null ? ` (${tree.nodes[n.left].label})` : " (vazia)"}.`, "left", id);
      go(n.left, id, "esq");
    };
    const right = () => {
      snap(`De volta em ${n.label}: vai para a subárvore DIREITA${n.right !== null ? ` (${tree.nodes[n.right].label})` : " (vazia)"}.`, "right", id);
      go(n.right, id, "dir");
    };
    if (order === "pre") {
      visit();
      left();
      right();
    } else if (order === "em") {
      left();
      visit();
      right();
    } else {
      left();
      right();
      visit();
    }
    stack.pop();
    snap(`${fn}(${n.label}) terminou. Volta para ${stack.length ? "quem chamou" : "o início"}.`, "call", stack.length ? id : null);
  };
  go(tree.root, null, null);
  snap(`Percurso completo em ${ORDER_NAME[order]}: ${output.join(" ")}`, "call", null);
  return frames;
}

/* ------------------------------------------------------------------ */
/* Árvore Binária de Busca (complementar)                              */
/* ------------------------------------------------------------------ */

export interface BstState {
  tree: BTree;
  current: number | null;
  path: number[];
  found: number | null;
  fresh: number | null;
  removing: number | null;
  successor: number | null;
  ghost: { parent: number; side: "left" | "right"; value: number } | null;
}

export const bstCode: CodeSample = {
  java: [
    ["ins", "No inserir(No no, int x) {"],
    ["insNull", "    if (no == null) return new No(x);       // vaga encontrada"],
    ["cmp", "    if (x < no.valor) no.esquerda = inserir(no.esquerda, x);"],
    ["cmp", "    else if (x > no.valor) no.direita = inserir(no.direita, x);"],
    [null, "    return no;"],
    [null, "}"],
    [null, ""],
    ["rem", "No remover(No no, int x) {"],
    ["remNull", "    if (no == null) return null;            // não achou"],
    ["cmp", "    if (x < no.valor) no.esquerda = remover(no.esquerda, x);"],
    ["cmp", "    else if (x > no.valor) no.direita = remover(no.direita, x);"],
    ["remCase", "    else {                                  // achou o nó"],
    ["leaf", "        if (no.esquerda == null) return no.direita;  // 0 ou 1 filho"],
    ["leaf", "        if (no.direita == null) return no.esquerda;"],
    ["succ", "        No s = menor(no.direita);           // 2 filhos: sucessor"],
    ["succ", "        no.valor = s.valor;"],
    ["succ", "        no.direita = remover(no.direita, s.valor);"],
    [null, "    }"],
    [null, "    return no;"],
    [null, "}"],
  ],
  python: [
    ["ins", "def inserir(no, x):"],
    ["insNull", "    if no is None: return No(x)        # vaga encontrada"],
    ["cmp", "    if x < no.valor: no.esquerda = inserir(no.esquerda, x)"],
    ["cmp", "    elif x > no.valor: no.direita = inserir(no.direita, x)"],
    [null, "    return no"],
    [null, ""],
    ["rem", "def remover(no, x):"],
    ["remNull", "    if no is None: return None         # não achou"],
    ["cmp", "    if x < no.valor: no.esquerda = remover(no.esquerda, x)"],
    ["cmp", "    elif x > no.valor: no.direita = remover(no.direita, x)"],
    ["remCase", "    else:                              # achou o nó"],
    ["leaf", "        if no.esquerda is None: return no.direita  # 0 ou 1 filho"],
    ["leaf", "        if no.direita is None: return no.esquerda"],
    ["succ", "        s = menor(no.direita)          # 2 filhos: sucessor"],
    ["succ", "        no.valor = s.valor"],
    ["succ", "        no.direita = remover(no.direita, s.valor)"],
    [null, "    return no"],
  ],
};

let nextId = 1000;

export function bstFromValues(vals: number[]): BTree {
  let t: BTree = { root: null, nodes: {} };
  for (const v of vals) t = bstInsertSilent(t, v);
  return t;
}

function bstInsertSilent(t: BTree, v: number): BTree {
  const id = nextId++;
  const node: BNode = { id, label: String(v), left: null, right: null };
  if (t.root === null) return { root: id, nodes: { [id]: node } };
  let cur = t.root;
  for (;;) {
    const n = t.nodes[cur];
    const nv = Number(n.label);
    if (v === nv) return t;
    const side = v < nv ? "left" : "right";
    if (n[side] === null) {
      n[side] = id;
      t.nodes[id] = node;
      return t;
    }
    cur = n[side]!;
  }
}

const base = (tree: BTree): BstState => ({ tree: cloneTree(tree), current: null, path: [], found: null, fresh: null, removing: null, successor: null, ghost: null });

export function bstInsertFrames(t0: BTree, v: number): { frames: Frame<BstState>[]; result: BTree } {
  const t = cloneTree(t0);
  const frames: Frame<BstState>[] = [];
  const path: number[] = [];
  const push = (desc: string, line: string, s: Partial<BstState>) => frames.push({ desc, line, state: { ...base(t), path: [...path], ...s } });

  push(`Inserir ${v}. Regra da árvore binária de busca: valores MENORES ficam à esquerda, MAIORES à direita. Começamos pela raiz.`, "ins", {});
  if (t.root === null) {
    const id = nextId++;
    t.nodes[id] = { id, label: String(v), left: null, right: null };
    t.root = id;
    push(`A árvore estava vazia: ${v} vira a raiz.`, "insNull", { fresh: id });
    return { frames, result: t };
  }
  let cur = t.root;
  for (;;) {
    const n = t.nodes[cur];
    const nv = Number(n.label);
    path.push(cur);
    if (v === nv) {
      push(`${v} já existe na árvore. Nesta versão não inserimos repetidos.`, "cmp", { current: cur, found: cur });
      return { frames, result: t0 };
    }
    const side = v < nv ? "left" : "right";
    push(`Compara ${v} com ${nv}: ${v} ${v < nv ? "<" : ">"} ${nv}, então segue para a ${side === "left" ? "ESQUERDA" : "DIREITA"}.`, "cmp", { current: cur });
    if (n[side] === null) {
      push(`O filho da ${side === "left" ? "esquerda" : "direita"} de ${nv} está vazio (null): achamos a vaga.`, "insNull", {
        current: cur,
        ghost: { parent: cur, side, value: v },
      });
      const id = nextId++;
      t.nodes[id] = { id, label: String(v), left: null, right: null };
      n[side] = id;
      push(`${v} foi inserido como filho da ${side === "left" ? "esquerda" : "direita"} de ${nv}. Todo nó novo entra como FOLHA.`, "insNull", { fresh: id });
      return { frames, result: t };
    }
    cur = n[side]!;
  }
}

export function bstRemoveFrames(t0: BTree, v: number): { frames: Frame<BstState>[]; result: BTree } {
  const t = cloneTree(t0);
  const frames: Frame<BstState>[] = [];
  const path: number[] = [];
  const push = (desc: string, line: string, s: Partial<BstState>) => frames.push({ desc, line, state: { ...base(t), path: [...path], ...s } });

  push(`Remover ${v}. Primeiro precisamos ENCONTRAR o nó, descendo pela árvore como numa busca.`, "rem", {});
  let parent: number | null = null;
  let pside: "left" | "right" | null = null;
  let cur = t.root;
  while (cur !== null) {
    const n = t.nodes[cur];
    const nv = Number(n.label);
    path.push(cur);
    if (v === nv) break;
    const side = v < nv ? "left" : "right";
    push(`Compara ${v} com ${nv}: segue para a ${side === "left" ? "esquerda" : "direita"}.`, "cmp", { current: cur });
    parent = cur;
    pside = side;
    cur = n[side];
  }
  if (cur === null) {
    push(`Chegamos em null: ${v} não está na árvore. Nada é removido.`, "remNull", {});
    return { frames, result: t0 };
  }
  const target = t.nodes[cur];
  const setChild = (newId: number | null) => {
    if (parent === null) t.root = newId;
    else t.nodes[parent][pside!] = newId;
  };
  const kids = (target.left !== null ? 1 : 0) + (target.right !== null ? 1 : 0);
  push(`Achamos ${v}. Ele tem ${kids} filho(s). ${kids === 0 ? "Caso 1: é uma folha." : kids === 1 ? "Caso 2: tem um único filho." : "Caso 3: tem dois filhos."}`, "remCase", {
    current: cur,
    removing: cur,
  });

  if (kids < 2) {
    const child = target.left ?? target.right;
    if (kids === 0) push(`Folha: basta o pai deixar de apontar para ele (vira null).`, "leaf", { removing: cur });
    else
      push(`Um filho: o pai de ${v} passa a apontar direto para o filho ${t.nodes[child!].label} ("pula" o nó, como na lista encadeada).`, "leaf", {
        removing: cur,
        successor: child,
      });
    setChild(child);
    delete t.nodes[cur];
    path.pop();
    push(`${v} removido. A regra esquerda < raiz < direita continua valendo.`, "leaf", {});
    return { frames, result: t };
  }

  // Dois filhos: sucessor = menor valor da subárvore direita
  let sParent = cur;
  let s = target.right!;
  push(`Dois filhos: procuramos o SUCESSOR — o menor valor da subárvore direita (vai à direita uma vez e depois só para a esquerda).`, "succ", { removing: cur, current: s });
  while (t.nodes[s].left !== null) {
    sParent = s;
    s = t.nodes[s].left!;
    push(`Desce para a esquerda: ${t.nodes[s].label}.`, "succ", { removing: cur, current: s });
  }
  const sv = t.nodes[s].label;
  push(`Sucessor encontrado: ${sv}. Ele é maior que tudo à esquerda de ${v} e menor que o resto da direita, então pode ocupar o lugar de ${v}.`, "succ", {
    removing: cur,
    successor: s,
  });
  target.label = sv;
  if (sParent === cur) t.nodes[sParent].right = t.nodes[s].right;
  else t.nodes[sParent].left = t.nodes[s].right;
  delete t.nodes[s];
  push(`Copia ${sv} para o nó de ${v} e remove o sucessor do lugar antigo (ele tinha no máximo um filho, à direita).`, "succ", { fresh: cur });
  return { frames, result: t };
}

export function bstSearchFrames(t: BTree, v: number): Frame<BstState>[] {
  const frames: Frame<BstState>[] = [];
  const path: number[] = [];
  const push = (desc: string, line: string, s: Partial<BstState>) => frames.push({ desc, line, state: { ...base(t), path: [...path], ...s } });
  push(`Buscar ${v}. Em cada nó comparamos e descartamos metade do caminho: menor → esquerda, maior → direita.`, "cmp", {});
  let cur = t.root;
  let steps = 0;
  while (cur !== null) {
    const nv = Number(t.nodes[cur].label);
    path.push(cur);
    steps++;
    if (nv === v) {
      push(`Encontrado! ${v} está na árvore. Foram ${steps} comparações (no máximo a altura + 1).`, "cmp", { current: cur, found: cur });
      return frames;
    }
    push(`Compara ${v} com ${nv}: vai para a ${v < nv ? "esquerda" : "direita"}.`, "cmp", { current: cur });
    cur = v < nv ? t.nodes[cur].left : t.nodes[cur].right;
  }
  push(`Chegou em null: ${v} não está na árvore.`, "remNull", {});
  return frames;
}

/* ------------------------------------------------------------------ */
/* Árvore genérica do slide de terminologia                            */
/* ------------------------------------------------------------------ */

export interface GNode {
  id: string;
  children: string[];
}

/** Árvore T do slide: A → B, C, D; B → E, F; D → G; G → H, I, J. */
export const TERM_TREE: Record<string, string[]> = {
  A: ["B", "C", "D"],
  B: ["E", "F"],
  C: [],
  D: ["G"],
  E: [],
  F: [],
  G: ["H", "I", "J"],
  H: [],
  I: [],
  J: [],
};
