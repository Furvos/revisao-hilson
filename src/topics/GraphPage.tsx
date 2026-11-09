import { useMemo, useState } from "react";
import { bfsCode, bfsFrames, casinhaGraph, degrees, dfsCode, dfsFrames, graphFacts, neighbors, randomGraph, slideGraph, torneioGraph, type Graph } from "../algos/graph";
import { CodePanel, Controls, Legend, StepNote, Tabs, Theory, TopicHeader } from "../components/Player";
import { CallStack } from "../components/viz";
import { GraphSvg } from "../components/GraphSvg";
import { usePlayer } from "../engine/usePlayer";

type Tab = "termos" | "busca";

const DATASETS: { label: string; make: () => Graph }[] = [
  { label: "Grafo do slide", make: slideGraph },
  { label: "Casinha", make: casinhaGraph },
  { label: "Torneio de futebol", make: torneioGraph },
  { label: "Aleatório", make: randomGraph },
];

export default function GraphPage() {
  const [tab, setTab] = useState<Tab>("termos");
  const [g, setG] = useState<Graph>(slideGraph);
  return (
    <article className="topic">
      <TopicHeader
        kicker="Estrutura não linear · relações entre pares"
        title="Grafos"
        lead="Um grafo G = (V, A) é formado por um conjunto de vértices (os objetos: pessoas, cidades, computadores) e um conjunto de arestas (as relações entre pares de vértices: amizades, estradas, cabos)."
        source="Base: Aula 8 — Grafos (Prof. Hilson Silva): terminologia e tipos. A aba “Percursos BFS / DFS” é complementar: não está nos slides."
      />
      <div className="row wrap toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { v: "termos", label: "Terminologia" },
            { v: "busca", label: "Percursos BFS / DFS", extra: true },
          ]}
        />
        <label className="field">
          <span className="label">Exemplo</span>
          <select id="graph-ds" onChange={(e) => setG(DATASETS[Number(e.target.value)].make())} defaultValue={0}>
            {DATASETS.map((d, i) => (
              <option key={d.label} value={i}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle">
          <input id="directed" type="checkbox" checked={g.directed} onChange={(e) => setG({ ...g, directed: e.target.checked })} />
          <span>Direcionado (dígrafo)</span>
        </label>
      </div>
      {tab === "termos" ? <TermsTab g={g} setG={setG} /> : <SearchTab g={g} setG={setG} />}
      <Theory
        items={[
          { t: "Definição", d: "G = (V, A): V é o conjunto de vértices e A o de arestas. A ordem do grafo é o nº de vértices." },
          {
            t: "Grau",
            d: "d(v) = nº de arestas que incidem em v (um laço conta 2). Em grafo direcionado: grau de entrada (setas que chegam) e de saída (setas que saem). Grau 0 = vértice isolado; grau 1 = pendente (folha).",
          },
          {
            t: "Tipos",
            d: "Direcionado (arestas com sentido). Laço: aresta de um vértice para ele mesmo. Multigrafo: arestas paralelas (ex.: dois Pix de A para B). Simples: sem laços e sem arestas paralelas. Completo (Kn): todo par de vértices ligado. Conexo: existe caminho entre qualquer par; um vértice isolado torna o grafo desconexo. Subgrafo: pedaço de G.",
          },
          { t: "Árvore × grafo", d: "Toda árvore é um grafo conexo e sem ciclos. Grafos podem ter ciclos, vários caminhos entre dois vértices e nenhuma “raiz”." },
          {
            t: "BFS × DFS (complementar)",
            d: "BFS usa FILA e visita por camadas; DFS usa PILHA (ou recursão) e vai fundo antes de voltar. Ambas visitam cada vértice e aresta uma vez: O(V + A).",
          },
        ]}
      />
    </article>
  );
}

/* ---------------- Terminologia + edição ---------------- */

function TermsTab({ g, setG }: { g: Graph; setG: (g: Graph) => void }) {
  const [sel, setSel] = useState<string>(g.vertices[0]?.id ?? "A");
  const [edit, setEdit] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const f = graphFacts(g);
  const selOk = g.vertices.some((v) => v.id === sel) ? sel : g.vertices[0]?.id;
  const deg = selOk ? degrees(g, selOk) : null;
  const nb = selOk ? neighbors(g, selOk) : [];

  const clickVertex = (id: string) => {
    if (!edit) {
      setSel(id);
      return;
    }
    if (pending === null) setPending(id);
    else {
      setG({ ...g, edges: [...g.edges, [pending, id]] });
      setPending(null);
    }
  };
  const addVertex = () => {
    const used = new Set(g.vertices.map((v) => v.id));
    let c = 65;
    while (used.has(String.fromCharCode(c))) c++;
    const id = String.fromCharCode(c);
    let best = { x: 50, y: 50 };
    let bestD = -1;
    for (let k = 0; k < 60; k++) {
      const cand = { x: 5 + Math.random() * 90, y: 5 + Math.random() * 90 };
      const d = Math.min(...g.vertices.map((v) => Math.hypot(v.x - cand.x, v.y - cand.y)), 999);
      if (d > bestD) {
        bestD = d;
        best = cand;
      }
    }
    setG({ ...g, vertices: [...g.vertices, { id, ...best }] });
  };

  return (
    <div className="stage">
      <div className="row wrap">
        <label className="toggle">
          <input
            id="edit-mode"
            type="checkbox"
            checked={edit}
            onChange={(e) => {
              setEdit(e.target.checked);
              setPending(null);
            }}
          />
          <span>Modo edição</span>
        </label>
        {edit && (
          <>
            <button className="chip" onClick={addVertex} disabled={g.vertices.length >= 10}>
              + vértice
            </button>
            <span className="hint">
              {pending
                ? `Agora clique no vértice de destino (clicar em ${pending} de novo cria um laço).`
                : "Clique em dois vértices para criar uma aresta. Clique numa aresta para apagá-la."}
            </span>
          </>
        )}
        {!edit && <span className="hint">Clique em um vértice para ver grau e vizinhos.</span>}
      </div>
      <div className="term-grid">
        <div className="svg-wrap graph-wrap">
          <GraphSvg
            g={g}
            hl={{
              vertex: (id) => (id === pending ? "v-pending" : !edit && id === selOk ? "v-sel" : !edit && nb.includes(id) ? "v-nb" : degrees(g, id).total === 0 ? "v-iso" : ""),
              edge: (a, b) => (!edit && (a === selOk || b === selOk) ? "e-hot" : ""),
              onVertex: clickVertex,
              onEdge: edit ? (i) => setG({ ...g, edges: g.edges.filter((_, k) => k !== i) }) : undefined,
            }}
          />
          <p className="set-notation">
            V = {"{"}
            {g.vertices.map((v) => v.id).join(", ")}
            {"}"}
            <br />A = {"{"}
            {g.edges.map(([a, b]) => `(${a},${b})`).join("; ")}
            {"}"}
          </p>
        </div>
        <dl className="facts">
          {selOk && deg && (
            <>
              <div>
                <dt>Vértice</dt>
                <dd className="big">{selOk}</dd>
              </div>
              {g.directed ? (
                <>
                  <div>
                    <dt>Grau de entrada</dt>
                    <dd className="tabular">{deg.entrada}</dd>
                  </div>
                  <div>
                    <dt>Grau de saída</dt>
                    <dd className="tabular">{deg.saida}</dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt>Grau d({selOk})</dt>
                  <dd className="tabular">
                    {deg.total}
                    {deg.total === 0 ? " · isolado" : deg.total === 1 ? " · pendente" : ""}
                  </dd>
                </div>
              )}
              <div>
                <dt>{g.directed ? "Sucessores" : "Vizinhos"}</dt>
                <dd>{nb.length ? nb.join(", ") : "nenhum"}</dd>
              </div>
            </>
          )}
          <div className="sep">
            <dt>Ordem (|V|)</dt>
            <dd className="tabular">{f.ordem}</dd>
          </div>
          <div>
            <dt>Arestas (|A|)</dt>
            <dd className="tabular">{f.arestas}</dd>
          </div>
          <div>
            <dt>Simples?</dt>
            <dd>{f.simples ? "Sim" : `Não (${[f.loops ? "tem laço" : "", f.parallel ? "tem arestas paralelas" : ""].filter(Boolean).join(" e ")})`}</dd>
          </div>
          <div>
            <dt>Conexo?</dt>
            <dd>{f.conexo ? "Sim" : `Não${f.isolated.length ? ` (isolado: ${f.isolated.join(", ")})` : ""}`}</dd>
          </div>
          <div>
            <dt>Completo?</dt>
            <dd>{f.completo ? `Sim (K${f.ordem})` : "Não"}</dd>
          </div>
          <div>
            <dt>Soma dos graus</dt>
            <dd className="tabular">
              {g.vertices.reduce((s, v) => s + degrees(g, v.id).total, 0)} = 2 × {f.arestas}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ---------------- BFS / DFS ---------------- */

function SearchTab({ g, setG }: { g: Graph; setG: (g: Graph) => void }) {
  const [alg, setAlg] = useState<"bfs" | "dfs">("bfs");
  const [start, setStart] = useState(g.vertices[0]?.id ?? "A");
  const st = g.vertices.some((v) => v.id === start) ? start : g.vertices[0].id;
  const frames = useMemo(() => (alg === "bfs" ? bfsFrames(g, st) : dfsFrames(g, st)), [g, st, alg]);
  const p = usePlayer(frames);
  const s = p.frame.state;
  const visited = new Set(s.visited);
  const done = new Set(s.order);
  const isTree = (a: string, b: string) => s.treeEdges.some(([u, w]) => (u === a && w === b) || (!g.directed && u === b && w === a));

  return (
    <>
      <p className="extra-note">
        <b>Complementar:</b> BFS e DFS não estão nos slides de grafos. Valem como ponte com a 1ª prova (fila e pilha) e com recursividade.
      </p>
      <div className="row wrap toolbar">
        <div className="seg" role="radiogroup" aria-label="Algoritmo">
          <button role="radio" aria-checked={alg === "bfs"} className={alg === "bfs" ? "on" : ""} onClick={() => setAlg("bfs")}>
            BFS · largura (fila)
          </button>
          <button role="radio" aria-checked={alg === "dfs"} className={alg === "dfs" ? "on" : ""} onClick={() => setAlg("dfs")}>
            DFS · profundidade (pilha)
          </button>
        </div>
        <label className="field narrow">
          <span className="label">Início</span>
          <select id="start" value={st} onChange={(e) => setStart(e.target.value)}>
            {g.vertices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id}
              </option>
            ))}
          </select>
        </label>
        <span className="hint">Vizinhos são examinados em ordem alfabética.</span>
      </div>
      <div className="stage">
        <div className="term-grid">
          <div className="svg-wrap graph-wrap">
            <GraphSvg
              g={g}
              hl={{
                vertex: (id) => (id === s.current ? "v-sel" : id === s.checking ? "v-check" : done.has(id) ? "v-done" : visited.has(id) ? "v-found" : ""),
                edge: (a, b) => ((a === s.current && b === s.checking) || (!g.directed && b === s.current && a === s.checking) ? "e-check" : isTree(a, b) ? "e-tree" : ""),
                onVertex: (id) => setStart(id),
              }}
            />
            <Legend
              items={[
                ["lg-vsel", "processando"],
                ["lg-vcheck", "vizinho examinado"],
                ["lg-vfound", alg === "bfs" ? "descoberto (na fila)" : "na pilha"],
                ["lg-vdone", "visitado"],
              ]}
            />
          </div>
          <div className="search-side">
            {alg === "bfs" ? (
              <div className="queue">
                <h4 className="eyebrow">Fila (FIFO)</h4>
                <div className="queue-row">
                  <span className="queue-end">frente</span>
                  {s.queue.length === 0 && <span className="muted">vazia</span>}
                  {s.queue.map((q) => (
                    <span key={q} className="qcell">
                      {q}
                    </span>
                  ))}
                  <span className="queue-end">fim</span>
                </div>
              </div>
            ) : (
              <CallStack items={s.stack.map((v) => `dfs(${v})`)} title="Pilha de chamadas (LIFO)" />
            )}
            <div className="output">
              <span className="eyebrow">Ordem de visita</span>
              <div className="output-seq">
                {s.order.map((c, i) => (
                  <span key={i} className="out-chip">
                    {c}
                  </span>
                ))}
                {s.order.length === 0 && <span className="muted">—</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Controls p={p} onNewData={() => setG(randomGraph())} newDataLabel="Grafo aleatório" />
      <div className="split">
        <StepNote desc={p.frame.desc} />
        <CodePanel code={alg === "bfs" ? bfsCode : dfsCode} line={p.frame.line} />
      </div>
    </>
  );
}
