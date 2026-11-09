import { useMemo, useState } from "react";
import {
  bstCode,
  bstFromValues,
  bstInsertFrames,
  bstRemoveFrames,
  bstSearchFrames,
  heightOf,
  ORDER_NAME,
  randomBinaryTree,
  slideBinaryTree,
  TERM_TREE,
  travCode,
  traversalFrames,
  type BstState,
  type BTree,
  type Order,
} from "../algos/tree";
import { CodePanel, Controls, Legend, Stat, StepNote, Tabs, Theory, TopicHeader } from "../components/Player";
import { CallStack } from "../components/viz";
import { BinaryTreeSvg } from "../components/TreeSvg";
import { usePlayer } from "../engine/usePlayer";
import type { Frame } from "../engine/types";
import { randomValues } from "../engine/types";

type Tab = "termos" | "percursos" | "busca";

export default function TreePage() {
  const [tab, setTab] = useState<Tab>("termos");
  return (
    <article className="topic">
      <TopicHeader
        kicker="Estrutura não linear · hierárquica"
        title="Árvores"
        lead="Uma coleção de nós organizados hierarquicamente a partir de um nó raiz. Cada nó (menos a raiz) tem um pai e zero ou mais filhos; nós sem filhos são folhas."
        source="Base: Aula 6 — Árvore (Prof. Hilson Silva): terminologia, árvore binária e caminhamentos. A aba “Árvore de busca” é complementar: não está nos slides."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { v: "termos", label: "Terminologia" },
          { v: "percursos", label: "Percursos" },
          { v: "busca", label: "Árvore de busca", extra: true },
        ]}
      />
      {tab === "termos" && <TermsTab />}
      {tab === "percursos" && <TraversalTab />}
      {tab === "busca" && <BstTab />}
      <Theory
        items={[
          { t: "Terminologia", d: "Raiz (nó de origem), folha / nó externo (sem filhos), nó interno (1+ filhos), irmãos (mesmo pai), antepassados (pai, avô… até a raiz)." },
          {
            t: "Medidas",
            d: "Nível de um nó = nº de ligações até a raiz (raiz = 0). Altura da árvore = maior nível. Grau de um nó = nº de filhos. Grau da árvore = maior grau entre os nós.",
          },
          { t: "Árvore binária", d: "Árvore de grau 2: cada nó tem no máximo uma subárvore esquerda e uma direita — e a esquerda é diferente da direita." },
          { t: "Percursos", d: "Pré-ordem: raiz → esq → dir. Em-ordem (central): esq → raiz → dir. Pós-ordem: esq → dir → raiz. No slide: ABDECFG, DBEAFCG e DEBFGCA." },
          {
            t: "Complexidade",
            d: "Qualquer percurso visita cada nó uma vez: O(n). Numa árvore de busca, buscar/inserir/remover custa O(altura): O(log n) se estiver balanceada, O(n) se degenerar numa “lista”.",
          },
        ]}
      />
    </article>
  );
}

/* ---------------- Terminologia (árvore T do slide) ---------------- */

function TermsTab() {
  const [sel, setSel] = useState("G");
  const parent: Record<string, string | null> = { A: null };
  Object.entries(TERM_TREE).forEach(([p, cs]) => cs.forEach((c) => (parent[c] = p)));
  const level = (id: string): number => (parent[id] ? 1 + level(parent[id]!) : 0);
  const ancestors = (id: string): string[] => (parent[id] ? [parent[id]!, ...ancestors(parent[id]!)] : []);
  const ids = Object.keys(TERM_TREE);
  const height = Math.max(...ids.map(level));
  const treeDegree = Math.max(...ids.map((i) => TERM_TREE[i].length));

  // layout: folhas recebem x em sequência; pais ficam no centro dos filhos.
  const pos: Record<string, { x: number; y: number }> = {};
  let leafX = 0;
  const place = (id: string): number => {
    const cs = TERM_TREE[id];
    const x = cs.length === 0 ? leafX++ : cs.map(place).reduce((a, b) => a + b, 0) / cs.length;
    pos[id] = { x, y: level(id) };
    return x;
  };
  place("A");
  const W = leafX;
  const sx = (x: number) => 40 + x * 64;
  const sy = (y: number) => 36 + y * 78;
  const kids = TERM_TREE[sel];
  const sib = parent[sel] ? TERM_TREE[parent[sel]!].filter((c) => c !== sel) : [];

  return (
    <div className="stage">
      <p className="hint">Clique em um nó para ver as suas propriedades. Esta é a árvore T usada no slide de terminologia.</p>
      <div className="term-grid">
        <div className="svg-wrap">
          <svg viewBox={`0 0 ${sx(W - 1) + 40} ${sy(height) + 40}`} className="tree-svg" role="img" aria-label="Árvore T do slide">
            {ids.flatMap((p) =>
              TERM_TREE[p].map((c) => (
                <line
                  key={p + c}
                  x1={sx(pos[p].x)}
                  y1={sy(pos[p].y)}
                  x2={sx(pos[c].x)}
                  y2={sy(pos[c].y)}
                  className={"edge" + (ancestors(sel).includes(p) && (ancestors(sel).includes(c) || c === sel) ? " edge-path" : "")}
                />
              )),
            )}
            {Array.from({ length: height + 1 }, (_, l) => (
              <text key={l} x={6} y={sy(l) + 4} className="lvl-label">
                {l}
              </text>
            ))}
            {ids.map((id) => {
              const cls =
                id === sel
                  ? "n-sel"
                  : parent[sel] === id
                    ? "n-parent"
                    : kids.includes(id)
                      ? "n-child"
                      : sib.includes(id)
                        ? "n-sib"
                        : ancestors(sel).includes(id)
                          ? "n-anc"
                          : TERM_TREE[id].length === 0
                            ? "n-leaf"
                            : "";
              return (
                <g
                  key={id}
                  className={"tnode " + cls}
                  onClick={() => setSel(id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Nó ${id}`}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(id)}
                >
                  <circle cx={sx(pos[id].x)} cy={sy(pos[id].y)} r={19} />
                  <text x={sx(pos[id].x)} y={sy(pos[id].y) + 5} textAnchor="middle">
                    {id}
                  </text>
                </g>
              );
            })}
          </svg>
          <Legend
            items={[
              ["lg-sel", "selecionado"],
              ["lg-parent", "pai"],
              ["lg-child", "filhos"],
              ["lg-sib", "irmãos"],
              ["lg-anc", "outros antepassados"],
            ]}
          />
        </div>
        <dl className="facts">
          <div>
            <dt>Nó</dt>
            <dd className="big">{sel}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{sel === "A" ? "Raiz (e nó interno)" : kids.length === 0 ? "Folha (nó externo)" : "Nó interno"}</dd>
          </div>
          <div>
            <dt>Pai</dt>
            <dd>{parent[sel] ?? "— (a raiz não tem pai)"}</dd>
          </div>
          <div>
            <dt>Filhos</dt>
            <dd>{kids.length ? kids.join(", ") : "nenhum"}</dd>
          </div>
          <div>
            <dt>Irmãos</dt>
            <dd>{sib.length ? sib.join(", ") : "nenhum"}</dd>
          </div>
          <div>
            <dt>Antepassados</dt>
            <dd>{ancestors(sel).length ? ancestors(sel).join(", ") : "nenhum"}</dd>
          </div>
          <div>
            <dt>Nível</dt>
            <dd className="tabular">{level(sel)}</dd>
          </div>
          <div>
            <dt>Grau do nó</dt>
            <dd className="tabular">{kids.length}</dd>
          </div>
          <div className="sep">
            <dt>Altura da árvore</dt>
            <dd className="tabular">{height}</dd>
          </div>
          <div>
            <dt>Grau da árvore</dt>
            <dd className="tabular">{treeDegree}</dd>
          </div>
          <div>
            <dt>Folhas</dt>
            <dd>{ids.filter((i) => TERM_TREE[i].length === 0).join(", ")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ---------------- Percursos ---------------- */

function TraversalTab() {
  const [tree, setTree] = useState<BTree>(slideBinaryTree);
  const [order, setOrder] = useState<Order>("pre");
  const frames = useMemo(() => traversalFrames(tree, order), [tree, order]);
  const p = usePlayer(frames);
  const s = p.frame.state;
  const visited = new Set(s.visited);
  return (
    <>
      <div className="row wrap toolbar">
        <span className="label">Percurso</span>
        <div className="seg" role="radiogroup" aria-label="Tipo de percurso">
          {(["pre", "em", "pos"] as Order[]).map((o) => (
            <button key={o} role="radio" aria-checked={order === o} className={order === o ? "on" : ""} onClick={() => setOrder(o)}>
              {ORDER_NAME[o]}
            </button>
          ))}
        </div>
        <button className="chip chip-slide" onClick={() => setTree(slideBinaryTree())}>
          Árvore do slide
        </button>
      </div>
      <div className="stage">
        <BinaryTreeSvg tree={s.tree} nullOf={s.nullOf} nodeClass={(id) => (id === s.current ? "n-sel" : visited.has(id) ? "n-done" : "")} />
        <div className="output">
          <span className="eyebrow">Saída</span>
          <div className="output-seq">
            {s.output.map((c, i) => (
              <span key={i} className="out-chip">
                {c}
              </span>
            ))}
            {s.output.length === 0 && <span className="muted">nada visitado ainda</span>}
          </div>
        </div>
        <Legend
          items={[
            ["lg-sel", "nó da chamada atual"],
            ["lg-done", "já visitado (escrito na saída)"],
          ]}
        />
      </div>
      <Controls p={p} onNewData={() => setTree(randomBinaryTree())} newDataLabel="Nova árvore" />
      <div className="split">
        <StepNote desc={p.frame.desc}>
          <CallStack items={s.stack} />
        </StepNote>
        <CodePanel code={travCode(order)} line={p.frame.line} />
      </div>
    </>
  );
}

/* ---------------- Árvore binária de busca (complementar) ---------------- */

const START = [50, 30, 70, 20, 40, 60, 80];

function idle(tree: BTree, desc: string): Frame<BstState>[] {
  return [{ desc, line: undefined, state: { tree, current: null, path: [], found: null, fresh: null, removing: null, successor: null, ghost: null } }];
}

function BstTab() {
  const [tree, setTree] = useState<BTree>(() => bstFromValues(START));
  const [frames, setFrames] = useState<Frame<BstState>[]>(() =>
    idle(bstFromValues(START), "Árvore binária de busca: para cada nó, tudo à esquerda é menor e tudo à direita é maior. Digite um valor e escolha uma operação."),
  );
  const [val, setVal] = useState("45");
  const [err, setErr] = useState<string | null>(null);
  const p = usePlayer(frames, true);
  const s = p.frame.state;

  const run = (kind: "ins" | "rem" | "busca") => {
    const v = Number(val);
    if (!Number.isInteger(v) || v < 0 || v > 99 || val.trim() === "") {
      setErr("Digite um número inteiro de 0 a 99.");
      return;
    }
    setErr(null);
    if (kind === "busca") {
      setFrames(bstSearchFrames(tree, v));
      return;
    }
    if (kind === "ins" && Object.keys(tree.nodes).length >= 15) {
      setErr("A árvore já tem 15 nós. Remova algum ou gere uma nova.");
      return;
    }
    const r = kind === "ins" ? bstInsertFrames(tree, v) : bstRemoveFrames(tree, v);
    setTree(r.result);
    setFrames(r.frames);
  };

  const fresh = () => {
    const t = bstFromValues(randomValues(7, 5, 95));
    setTree(t);
    setFrames(idle(t, "Nova árvore gerada inserindo 7 valores aleatórios na ordem em que foram sorteados."));
  };

  const pathSet = new Set(s.path);
  return (
    <>
      <p className="extra-note">
        <b>Complementar:</b> os slides da disciplina não cobrem inserção/remoção em árvore de busca. Use só se sobrar tempo ou se o professor pedir.
      </p>
      <form
        className="row wrap toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          run("ins");
        }}
      >
        <label className="field narrow">
          <span className="label">Valor</span>
          <input id="bst-val" value={val} onChange={(e) => setVal(e.target.value)} inputMode="numeric" />
        </label>
        <button className="btn btn-primary" type="submit">
          Inserir
        </button>
        <button className="btn" type="button" onClick={() => run("rem")}>
          Remover
        </button>
        <button className="btn" type="button" onClick={() => run("busca")}>
          Buscar
        </button>
        {err && <span className="error">{err}</span>}
      </form>
      <div className="stage">
        <BinaryTreeSvg
          tree={s.tree}
          ghost={s.ghost}
          nodeClass={(id) =>
            id === s.removing
              ? "n-remove"
              : id === s.successor
                ? "n-succ"
                : id === s.found || id === s.fresh
                  ? "n-fresh"
                  : id === s.current
                    ? "n-sel"
                    : pathSet.has(id)
                      ? "n-path"
                      : ""
          }
          edgeClass={(a, b) => (pathSet.has(a) && (pathSet.has(b) || b === s.current) ? "edge-path" : "")}
        />
        <Legend
          items={[
            ["lg-sel", "comparando agora"],
            ["lg-path", "caminho percorrido"],
            ["lg-fresh", "inserido / encontrado"],
            ["lg-remove", "a remover"],
            ["lg-succ", "sucessor / filho que sobe"],
          ]}
        />
      </div>
      <Controls p={p} onNewData={fresh} newDataLabel="Nova árvore" />
      <div className="split">
        <StepNote desc={p.frame.desc}>
          <div className="stats">
            <Stat label="Nós" value={Object.keys(s.tree.nodes).length} />
            <Stat label="Altura" value={Math.max(heightOf(s.tree), 0)} />
          </div>
        </StepNote>
        <CodePanel code={bstCode} line={p.frame.line} />
      </div>
    </>
  );
}
