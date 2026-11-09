import { useMemo, useState } from "react";
import {
  DECISION_CAPTION,
  decisionTree,
  mergeLevelFrames,
  q1MergeCode,
  q1MergeFrames,
  q1QuickCode,
  q1QuickFrames,
  q4TermCode,
  q4TermFrames,
  q5Code,
  q6Code,
  q6Frames,
  q7Code,
  q7Frames,
  type MemState,
} from "../algos/exam";
import { mergeCode, mergeFrames } from "../algos/merge";
import { PIVOT_NAME, quickCode, quickFrames, type PivotRule } from "../algos/quick";
import { recFrames, type RecState } from "../algos/recursion";
import { ORDER_NAME, travCode, traversalFrames, type Order } from "../algos/tree";
import { CallStackViz } from "../components/CallStackViz";
import { GraphSvg } from "../components/GraphSvg";
import { MergeTree } from "../components/MergeTree";
import { CodePanel, Controls, Legend, Stat, StepNote, Tabs } from "../components/Player";
import { QuickStage } from "../components/QuickStage";
import { BinaryTreeSvg } from "../components/TreeSvg";
import { Bars, CallStack } from "../components/viz";
import type { CodeLine, CodeSample, Frame } from "../engine/types";
import { randomValues } from "../engine/types";
import { usePlayer } from "../engine/usePlayer";

export const QUESTIONS = [
  { id: "q1", title: "MergeSort estourou a memória", topic: "Merge × Quick · memória" },
  { id: "q2", title: "Árvore de execução do MergeSort", topic: "Merge Sort" },
  { id: "q3", title: "QuickSort ficou O(n²) em produção", topic: "Quick Sort · pivô" },
  { id: "q4", title: "Árvore de decisão do empréstimo", topic: "Árvores" },
  { id: "q5", title: "Recursão sem caso base", topic: "Recursividade" },
  { id: "q6", title: "Transações PIX como grafo", topic: "Grafos · multigrafo" },
  { id: "q7", title: "Servidor isolado e rede K5", topic: "Grafos · conexidade" },
] as const;

export type QId = (typeof QUESTIONS)[number]["id"];

export default function ExamPage({ q }: { q: QId }) {
  const idx = QUESTIONS.findIndex((x) => x.id === q);
  return (
    <article className="topic">
      <header className="topic-head">
        <p className="kicker">Lista de revisão P2 · Prof. Hilson Silva · resolução comentada</p>
        <h1>Resolução da revisão</h1>
        <p className="lead">
          As 7 questões da lista do professor, cada uma com uma animação que monta a resposta passo a passo. Leia o enunciado, tente responder e só depois rode a animação.
        </p>
      </header>
      <nav className="qnav" aria-label="Questões">
        {QUESTIONS.map((x, i) => (
          <a key={x.id} href={"#" + x.id} className={x.id === q ? "on" : ""} aria-current={x.id === q ? "page" : undefined}>
            <span className="qnav-n tabular">{i + 1}</span>
            <span className="qnav-t">{x.topic}</span>
          </a>
        ))}
      </nav>
      {q === "q1" && <Q1 />}
      {q === "q2" && <Q2 />}
      {q === "q3" && <Q3 />}
      {q === "q4" && <Q4 />}
      {q === "q5" && <Q5 />}
      {q === "q6" && <Q6 />}
      {q === "q7" && <Q7 />}
      <div className="qpager">
        {idx > 0 ? (
          <a className="pager-link" href={"#" + QUESTIONS[idx - 1].id}>
            ← Questão {idx}
          </a>
        ) : (
          <span />
        )}
        {idx < QUESTIONS.length - 1 && (
          <a className="pager-link next" href={"#" + QUESTIONS[idx + 1].id}>
            Questão {idx + 2} →
          </a>
        )}
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- */
/* Moldura comum: enunciado, gabarito e comentário                   */
/* ---------------------------------------------------------------- */

function Question({ n, title, statement, answer, tips }: { n: number; title: string; statement: React.ReactNode; answer: React.ReactNode; tips: React.ReactNode }) {
  return (
    <section className="question">
      <div className="q-head">
        <span className="q-num tabular">Questão {n}</span>
        <h2 className="h2">{title}</h2>
      </div>
      <div className="q-statement">{statement}</div>
      <div className="q-boxes">
        <details className="q-answer">
          <summary>Resposta do gabarito</summary>
          <div className="q-body">{answer}</div>
        </details>
        <details className="q-tips">
          <summary>Comentário da monitoria</summary>
          <div className="q-body">{tips}</div>
        </details>
      </div>
    </section>
  );
}

function Player<S>({
  frames,
  code,
  children,
  side,
  onNewData,
  newDataLabel,
}: {
  frames: Frame<S>[];
  code: CodeSample;
  children: (s: S) => React.ReactNode;
  side?: (s: S) => React.ReactNode;
  onNewData?: () => void;
  newDataLabel?: string;
}) {
  const p = usePlayer(frames);
  const s = p.frame.state;
  return (
    <>
      <div className="stage">{children(s)}</div>
      <Controls p={p} onNewData={onNewData} newDataLabel={newDataLabel} />
      <div className="split">
        <StepNote desc={p.frame.desc}>{side?.(s)}</StepNote>
        <CodePanel code={code} line={p.frame.line} />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q1                                                               */
/* ---------------------------------------------------------------- */

function RamMeter({ s, cap }: { s: MemState; cap: number }) {
  const total = s.mem.orig + s.mem.aux + s.mem.stack;
  const pct = (x: number) => `${(x / cap) * 100}%`;
  return (
    <div className="ram">
      <div className="ram-head">
        <span className="eyebrow">Medidor de RAM (posições ocupadas)</span>
        <span className="tabular ram-total">
          {total} <span className="muted">· pico {Math.max(s.peak, total)}</span>
        </span>
      </div>
      <div className="ram-bar" role="img" aria-label={`Memória: vetor ${s.mem.orig}, auxiliar ${s.mem.aux}, pilha ${s.mem.stack}`}>
        <span className="ram-seg seg-orig" style={{ width: pct(s.mem.orig) }}>
          vetor {s.mem.orig}
        </span>
        {s.mem.aux > 0 && (
          <span className="ram-seg seg-aux" style={{ width: pct(s.mem.aux) }}>
            auxiliar {s.mem.aux}
          </span>
        )}
        {s.mem.stack > 0 && (
          <span className="ram-seg seg-stack" style={{ width: pct(s.mem.stack) }}>
            {s.mem.stack > 1 ? `pilha ${s.mem.stack}` : ""}
          </span>
        )}
      </div>
      <div className="ram-scale tabular">
        <span style={{ left: 0 }}>0</span>
        <span style={{ left: pct(s.mem.orig) }}>n = {s.mem.orig}</span>
        <span style={{ left: pct(2 * s.mem.orig) }}>2n = {2 * s.mem.orig}</span>
      </div>
    </div>
  );
}

function Q1() {
  const [mode, setMode] = useState<"merge" | "quick">("merge");
  const [values, setValues] = useState([56, 29, 35, 42, 15, 41, 75, 21]);
  const frames = useMemo(() => (mode === "merge" ? q1MergeFrames(values) : q1QuickFrames(values)), [mode, values]);
  const max = Math.max(...values);
  const cap = values.length * 2 + 4;
  return (
    <>
      <Question
        n={1}
        title="MergeSort estourou a memória da fintech"
        statement={
          <p>
            Um sistema ordena lotes de transações com <b>MergeSort</b>. Num pico de tráfego o servidor teve <b>Out of Memory</b> e a RAM alocada <b>dobrou</b> durante a ordenação.
            Explique a causa com base nas características do MergeSort, compare com o <b>QuickSort</b> (memória auxiliar e pior caso) e diga se trocar para o QuickSort resolve sem
            risco de degradar o tempo.
          </p>
        }
        answer={
          <ol>
            <li>
              <b>Causa:</b> o MergeSort precisa de um vetor adicional do mesmo tamanho (n) do original para fazer a intercalação. Por isso a memória dobra: n + n = 2n.
            </li>
            <li>
              <b>Memória:</b> MergeSort usa espaço auxiliar O(n). O QuickSort ordena <i>in-place</i> (no próprio vetor) e usa apenas a pilha de recursão, O(log n) em média.
            </li>
            <li>
              <b>Troca:</b> o QuickSort reduz muito o consumo de memória, mas o pior caso dele é O(n²), enquanto o MergeSort garante O(n log n) sempre. Para não degradar o tempo, é
              preciso uma boa escolha de pivô (mediana de três, pivô aleatório) ou versões otimizadas.
            </li>
          </ol>
        }
        tips={
          <ul>
            <li>
              A resposta tem 3 partes e a questão cobra as 3: causa (vetor auxiliar), comparação de memória e o <b>risco</b> do QuickSort (pior caso). Quem responde só “troca para
              o Quick” perde a parte do risco.
            </li>
            <li>
              “In-place” é a versão que troca elementos dentro do próprio vetor (veja o modo QuickSort desta animação). A versão do slide, que monta X1 e X2 como listas separadas,
              também gastaria memória extra.
            </li>
            <li>Detalhe técnico: a pilha do QuickSort é O(log n) em média, mas pode chegar a O(n) no pior caso. Por isso a escolha do pivô importa também para a memória.</li>
          </ul>
        }
      />
      <div className="row wrap toolbar">
        <div className="seg" role="radiogroup" aria-label="Algoritmo">
          <button role="radio" aria-checked={mode === "merge"} className={mode === "merge" ? "on" : ""} onClick={() => setMode("merge")}>
            MergeSort · vetor auxiliar
          </button>
          <button role="radio" aria-checked={mode === "quick"} className={mode === "quick" ? "on" : ""} onClick={() => setMode("quick")}>
            QuickSort · in-place
          </button>
        </div>
        <span className="hint">Rode os dois e compare o medidor de RAM.</span>
      </div>
      <Player
        frames={frames}
        code={mode === "merge" ? q1MergeCode : q1QuickCode}
        onNewData={() => setValues(randomValues(8, 5, 90))}
        side={(s) => (
          <>
            <div className="stats">
              <Stat label="Memória agora" value={s.mem.orig + s.mem.aux + s.mem.stack} />
              <Stat label="Pico" value={s.peak} />
              <Stat label="Comparações" value={s.comps} />
            </div>
            <CallStack items={s.stack} />
          </>
        )}
      >
        {(s) => {
          const fixed = new Set(s.fixed);
          const hot = new Set(s.hot);
          return (
            <>
              <h4 className="eyebrow">Vetor principal</h4>
              <Bars
                items={s.arr}
                max={max}
                tone={(_, i) => {
                  if (fixed.has(i)) return "done";
                  if (hot.has(i)) return s.swapped ? "swap" : "cmp";
                  if (i === s.pivot) return "pivot";
                  if (i < s.lo || i > s.hi) return "dim";
                  return "base";
                }}
                tags={(_, i) => {
                  const t: string[] = [];
                  if (i === s.pivot && mode === "quick") t.push("p");
                  if (i === s.i) t.push("i");
                  if (i === s.j) t.push("j");
                  return t.join(" ") || null;
                }}
              />
              {mode === "merge" && (
                <div className="aux">
                  <h4 className="eyebrow">Vetor auxiliar (memória extra)</h4>
                  <div className="mnode-cells aux-cells aux-full">
                    {s.aux ? (
                      s.aux.map((v, k) => (
                        <span key={k} className={"mcell " + (s.auxHot.includes(k) ? "ptr" : v === null ? "empty" : "filled")}>
                          {v ?? ""}
                        </span>
                      ))
                    ) : (
                      <span className="muted">ainda não alocado</span>
                    )}
                  </div>
                </div>
              )}
              <RamMeter s={s} cap={cap} />
            </>
          );
        }}
      </Player>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q2                                                               */
/* ---------------------------------------------------------------- */

function Q2() {
  const [mode, setMode] = useState<"niveis" | "recursiva">("niveis");
  const values = [56, 29, 35, 42, 15, 41, 75, 21];
  const frames = useMemo(() => (mode === "niveis" ? mergeLevelFrames(values) : mergeFrames(values)), [mode]);
  return (
    <>
      <Question
        n={2}
        title="Árvore de execução do MergeSort"
        statement={
          <p>
            Ordene os códigos de rastreamento <code>[56, 29, 35, 42, 15, 41, 75, 21]</code> com MergeSort e apresente a árvore completa: <b>a)</b> a divisão sucessiva até
            subproblemas de tamanho 1; <b>b)</b> a combinação (merge), com os vetores resultantes em cada nível de retorno da recursão.
          </p>
        }
        answer={
          <div className="gab-grid">
            <div>
              <b>a) Divisão</b>
              <pre className="gab-pre">{`Nível 0: [56, 29, 35, 42, 15, 41, 75, 21]
Nível 1: [56, 29, 35, 42] e [15, 41, 75, 21]
Nível 2: [56, 29], [35, 42] | [15, 41], [75, 21]
Nível 3: [56] [29] [35] [42] | [15] [41] [75] [21]`}</pre>
            </div>
            <div>
              <b>b) Intercalação</b>
              <pre className="gab-pre">{`Passo 1: [29, 56], [35, 42] | [15, 41], [21, 75]
Passo 2: [29, 35, 42, 56] | [15, 21, 41, 75]
Passo 3: [15, 21, 29, 35, 41, 42, 56, 75]`}</pre>
            </div>
          </div>
        }
        tips={
          <ul>
            <li>É a mesma lista do diagrama do slide da Aula 10. Na prova, desenhe a árvore: divisões descendo, intercalações voltando.</li>
            <li>
              O gabarito mostra a árvore <b>por níveis</b>. A execução real é recursiva: o algoritmo termina toda a metade esquerda antes de começar a direita. Use o modo “Execução
              recursiva” para ver essa ordem. Os vetores de cada nível são os mesmos nos dois modos.
            </li>
            <li>Erro comum: no Passo 1, escrever [75, 21] em vez de [21, 75]. Cada intercalação devolve o trecho em ordem crescente.</li>
          </ul>
        }
      />
      <div className="row wrap toolbar">
        <div className="seg" role="radiogroup" aria-label="Visão">
          <button role="radio" aria-checked={mode === "niveis"} className={mode === "niveis" ? "on" : ""} onClick={() => setMode("niveis")}>
            Por níveis (como no gabarito)
          </button>
          <button role="radio" aria-checked={mode === "recursiva"} className={mode === "recursiva" ? "on" : ""} onClick={() => setMode("recursiva")}>
            Execução recursiva (ordem real)
          </button>
        </div>
      </div>
      <Player frames={frames} code={mergeCode} side={(s) => (mode === "recursiva" ? <CallStack items={s.stack} /> : null)}>
        {(s) => (
          <>
            <MergeTree s={s} levelLabels />
            {mode === "recursiva" && s.merge && (
              <div className="aux">
                <h4 className="eyebrow">Vetor auxiliar</h4>
                <div className="mnode-cells aux-cells">
                  {s.merge.out.map((v, k) => (
                    <span key={k} className="mcell filled">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Legend
              items={[
                ["mk-active", "nível atual / chamada atual"],
                ["mk-ptr", "elemento comparado"],
                ["mk-sorted", "trecho já intercalado (ordenado)"],
              ]}
            />
          </>
        )}
      </Player>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q3                                                               */
/* ---------------------------------------------------------------- */

const PIVOT_CODE: Record<"extremo" | "mediana", { java: CodeLine[]; python: CodeLine[] }> = {
  extremo: {
    java: [
      [null, ""],
      ["pivot", "static int escolherPivo(List<Integer> v) {"],
      ["pivot", "    return v.get(0);          // EXTREMO: péssimo para lista ordenada"],
      [null, "}"],
    ],
    python: [
      [null, ""],
      ["pivot", "def escolher_pivo(v):"],
      ["pivot", "    return v[0]               # EXTREMO: péssimo para lista ordenada"],
    ],
  },
  mediana: {
    java: [
      [null, ""],
      ["pivot", "static int escolherPivo(List<Integer> v) {   // MEDIANA DE TRÊS"],
      ["pivot", "    int a = v.get(0), b = v.get(v.size() / 2), c = v.get(v.size() - 1);"],
      ["pivot", "    return Math.max(Math.min(a, b), Math.min(Math.max(a, b), c));"],
      [null, "}"],
    ],
    python: [
      [null, ""],
      ["pivot", "def escolher_pivo(v):                    # MEDIANA DE TRÊS"],
      ["pivot", "    a, b, c = v[0], v[len(v) // 2], v[-1]"],
      ["pivot", "    return sorted([a, b, c])[1]"],
    ],
  },
};

const Q3_DATA: { label: string; values: number[] }[] = [
  { label: "Totalmente ordenado", values: [10, 20, 30, 40, 50, 60, 70, 80, 90] },
  { label: "Parcialmente ordenado", values: [10, 20, 30, 40, 50, 60, 90, 80, 70] },
  { label: "Aleatório (como nos testes)", values: [50, 20, 80, 10, 90, 40, 60, 30, 70] },
];

function quickStats(values: number[], rule: PivotRule) {
  const fr = quickFrames(values, rule);
  return { comps: fr[fr.length - 1].state.comps, depth: Math.max(...fr.map((f) => f.state.stack.length)) };
}

function Q3() {
  const [rule, setRule] = useState<PivotRule>("primeiro");
  const [data, setData] = useState(0);
  const values = Q3_DATA[data].values;
  const frames = useMemo(() => quickFrames(values, rule), [values, rule]);
  const code: CodeSample = useMemo(() => {
    const kind = rule === "mediana3" ? "mediana" : "extremo";
    return { java: [...quickCode.java, ...PIVOT_CODE[kind].java], python: [...quickCode.python, ...PIVOT_CODE[kind].python] };
  }, [rule]);
  const table = useMemo(() => (["primeiro", "ultimo", "mediana3"] as PivotRule[]).map((r) => ({ r, ...quickStats(values, r) })), [values]);
  const n = values.length;
  return (
    <>
      <Question
        n={3}
        title="QuickSort ficou O(n²) em produção"
        statement={
          <p>
            Nos testes com listas aleatórias o QuickSort foi excelente. Em produção, com relatórios que já chegam <b>parcial ou totalmente ordenados</b>, o tempo foi de O(n log n)
            para <b>O(n²)</b>, gerando timeouts. Explique por que isso acontece com pivô nos <b>extremos</b> e indique uma solução prática para manter O(n log n).
          </p>
        }
        answer={
          <ol>
            <li>
              <b>Causa:</b> com o vetor ordenado e o pivô sempre num extremo (primeiro ou último), a partição fica desbalanceada: um lado com 0 elementos e o outro com n − 1. São n
              chamadas recursivas, e C(n) vira O(n²).
            </li>
            <li>
              <b>Solução:</b> escolher melhor o pivô, com <b>pivô aleatório</b> (Randomized QuickSort) ou <b>mediana de três</b> (primeiro, meio e último). Assim a divisão fica
              próxima de duas metades, 2C(n/2) + n, e a complexidade volta a O(n log n).
            </li>
          </ol>
        }
        tips={
          <ul>
            <li>
              Conta para a prova: com pivô no extremo e lista ordenada, as comparações são (n−1) + (n−2) + … + 1 = n(n−1)/2. Para n = {n}, isso dá <b>{(n * (n - 1)) / 2}</b>, que é
              o número da tabela ao lado.
            </li>
            <li>Os testes não pegaram o problema porque, com dados aleatórios, o pivô do extremo costuma cair “no meio” dos valores.</li>
            <li>
              Mediana de três e pivô aleatório tornam o pior caso <b>muito improvável</b>, não impossível. Na prova, use a formulação do gabarito: elas mantêm O(n log n) na
              prática.
            </li>
          </ul>
        }
      />
      <div className="row wrap toolbar">
        <span className="label">Dados</span>
        <div className="seg" role="radiogroup" aria-label="Dados">
          {Q3_DATA.map((d, i) => (
            <button key={d.label} role="radio" aria-checked={data === i} className={data === i ? "on" : ""} onClick={() => setData(i)}>
              {d.label}
            </button>
          ))}
        </div>
        <span className="label">Pivô</span>
        <div className="seg" role="radiogroup" aria-label="Pivô">
          {(["primeiro", "ultimo", "mediana3"] as PivotRule[]).map((r) => (
            <button key={r} role="radio" aria-checked={rule === r} className={rule === r ? "on" : ""} onClick={() => setRule(r)}>
              {r === "mediana3" ? "mediana de 3" : `${PIVOT_NAME[r]} (extremo)`}
            </button>
          ))}
        </div>
      </div>
      <Player
        frames={frames}
        code={code}
        side={(s) => (
          <>
            <div className="stats">
              <Stat label="Comparações" value={s.comps} />
              <Stat label="Profundidade" value={s.stack.length} />
            </div>
            <div className="table-wrap">
              <table className="cmp-table small">
                <thead>
                  <tr>
                    <th>Pivô</th>
                    <th>Comparações</th>
                    <th>Pilha máx.</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((t) => (
                    <tr key={t.r} className={t.r === rule ? "row-on" : ""}>
                      <td>{t.r === "mediana3" ? "mediana de 3" : PIVOT_NAME[t.r]}</td>
                      <td>{t.comps}</td>
                      <td>{t.depth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">
              Para n = {n}: pior caso n(n−1)/2 = {(n * (n - 1)) / 2} comparações; n·log₂n ≈ {Math.round(n * Math.log2(n))}.
            </p>
          </>
        )}
      >
        {(s) => <QuickStage s={s} max={Math.max(...values)} />}
      </Player>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q4                                                               */
/* ---------------------------------------------------------------- */

function Q4() {
  const [part, setPart] = useState<"a" | Order>("a");
  const tree = useMemo(decisionTree, []);
  const termFrames = useMemo(q4TermFrames, []);
  const travFrames = useMemo(() => (part === "a" ? [] : traversalFrames(tree, part)), [tree, part]);
  const caption = (id: number) => DECISION_CAPTION[tree.nodes[id].label];
  return (
    <>
      <Question
        n={4}
        title="Árvore de decisão do empréstimo"
        statement={
          <>
            <p>Nós internos guardam condições e as folhas guardam o resultado (Aprovado / Reprovado). Considere a árvore binária de decisão:</p>
            <pre className="gab-pre">{`        [Renda > 5000] (A)
         /            \\
  [Score > 700] (B)   [Reprovado] (C)
    /         \\
[Aprovado] (D) [Reprovado] (E)`}</pre>
            <p>
              <b>a)</b> Identifique a raiz, os nós internos, as folhas e a altura. <b>b)</b> Dê a sequência de visitação em pré-ordem, em-ordem e pós-ordem.
            </p>
          </>
        }
        answer={
          <>
            <p>
              <b>a)</b> Raiz: A [Renda &gt; 5000]. Nós internos: A e B. Folhas: C [Reprovado], D [Aprovado] e E [Reprovado]. Altura: <b>2</b> (maior nível, ou número de ligações da
              raiz até a folha mais distante).
            </p>
            <p>
              <b>b)</b> Pré-ordem: <b>A → B → D → E → C</b> · Em-ordem: <b>D → B → E → A → C</b> · Pós-ordem: <b>D → E → B → C → A</b>
            </p>
          </>
        }
        tips={
          <ul>
            <li>
              Altura conta <b>ligações</b>, não nós: o caminho A → B → D tem 3 nós e 2 ligações. Responder 3 é o erro mais comum.
            </li>
            <li>A raiz também é um nó interno, porque tem filhos. Não esqueça o A na lista de internos.</li>
            <li>
              Na em-ordem, o C sai por último porque está na subárvore direita da raiz. Primeiro termina tudo do lado esquerdo (D, B, E), depois visita A, depois vai para a
              direita.
            </li>
          </ul>
        }
      />
      <Tabs
        value={part}
        onChange={setPart}
        options={[
          { v: "a", label: "a) Terminologia" },
          { v: "pre", label: "b) Pré-ordem" },
          { v: "em", label: "b) Em-ordem" },
          { v: "pos", label: "b) Pós-ordem" },
        ]}
      />
      {part === "a" ? (
        <Player
          frames={termFrames}
          code={q4TermCode}
          side={(s) => (
            <dl className="facts">
              {s.facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              {s.facts.length === 0 && (
                <div>
                  <dt>Respostas</dt>
                  <dd className="muted">aparecem aqui</dd>
                </div>
              )}
            </dl>
          )}
        >
          {(s) => <BinaryTreeSvg tree={tree} caption={caption} levels={s.levels} nodeClass={(id) => s.cls[id] ?? ""} />}
        </Player>
      ) : (
        <Player key={part} frames={travFrames} code={travCode(part)} side={(s) => <CallStack items={s.stack} />}>
          {(s) => {
            const visited = new Set(s.visited);
            return (
              <>
                <BinaryTreeSvg tree={s.tree} caption={caption} nullOf={s.nullOf} nodeClass={(id) => (id === s.current ? "n-sel" : visited.has(id) ? "n-done" : "")} />
                <div className="output">
                  <span className="eyebrow">Saída · {ORDER_NAME[part]}</span>
                  <div className="output-seq">
                    {s.output.map((c, i) => (
                      <span key={i} className="out-chip">
                        {c}
                      </span>
                    ))}
                    {s.output.length === 0 && <span className="muted">nada visitado ainda</span>}
                  </div>
                </div>
              </>
            );
          }}
        </Player>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q5                                                               */
/* ---------------------------------------------------------------- */

function rename(frames: Frame<RecState>[]): Frame<RecState>[] {
  const r = (t: string) => t.replace(/fatorial/g, "calcular");
  return frames.map((f) => ({
    ...f,
    desc: r(f.desc),
    state: { ...f.state, stack: f.state.stack.map((c) => ({ ...c, label: r(c.label), note: r(c.note) })), log: f.state.log.map(r) },
  }));
}

function Q5() {
  const [mode, setMode] = useState<"junior" | "fix">("junior");
  const frames = useMemo(() => rename(mode === "junior" ? recFrames("semBase", 5) : recFrames("fatorial", 5)), [mode]);
  return (
    <>
      <Question
        n={5}
        title="Recursão sem caso base"
        statement={
          <>
            <p>
              Um desenvolvedor júnior escreveu a função abaixo para calcular o fatorial. Ao testar com <code>calcular(5)</code>, o servidor caiu com{" "}
              <i>Maximum Recursion Depth Exceeded</i> (Stack Overflow).
            </p>
            <pre className="gab-pre">{`def calcular(n):
    return n * calcular(n - 1)`}</pre>
            <p>
              <b>a)</b> Identifique o erro conceitual em relação aos componentes obrigatórios de uma função recursiva. <b>b)</b> Explique o que acontece com a pilha de execução nas
              fases de empilhamento e desempilhamento e corrija o código.
            </p>
          </>
        }
        answer={
          <>
            <p>
              <b>a)</b> Falta o <b>caso base</b> (condição de parada). Sem ele, a função faz chamadas infinitas ao passo recursivo.
            </p>
            <p>
              <b>b)</b> <b>Empilhamento:</b> cada chamada adiciona um <i>stack frame</i> (variáveis + ponto de retorno) no topo da pilha. Sem caso base, a pilha consome toda a
              memória alocada, e vem o Stack Overflow. <b>Desempilhamento:</b> acontece quando o caso base é atingido; os valores voltam em ordem LIFO.
            </p>
            <pre className="gab-pre">{`def calcular(n):
    if n <= 1: return 1          # Caso Base
    return n * calcular(n - 1)   # Passo Recursivo`}</pre>
          </>
        }
        tips={
          <ul>
            <li>
              Use os nomes do slide: <b>caso base</b> e <b>passo recursivo</b>. A questão pede “componentes obrigatórios”, então cite os dois.
            </li>
            <li>
              Sem caso base, o código do júnior <b>nunca</b> chega à fase de desempilhamento. A pilha só cresce, como mostra a animação.
            </li>
            <li>
              Use <code>n &lt;= 1</code>, não <code>n == 1</code>: assim <code>calcular(0)</code> também termina.
            </li>
          </ul>
        }
      />
      <Tabs
        value={mode}
        onChange={setMode}
        options={[
          { v: "junior", label: "Código do júnior" },
          { v: "fix", label: "Código corrigido" },
        ]}
      />
      <Player
        frames={frames}
        code={q5Code[mode]}
        side={(s) => (
          <div className="stats">
            <Stat label="Chamadas na pilha" value={s.depth} />
            <Stat label="Profundidade máxima" value={s.maxDepth} />
            <Stat label="Resultado" value={s.result ?? "–"} />
          </div>
        )}
      >
        {(s) => (
          <>
            <div className={"phase phase-" + s.phase}>
              {s.phase === "ida" ? "Empilhamento (ida)" : s.phase === "volta" ? "Desempilhamento (volta)" : s.phase === "estouro" ? "Stack Overflow" : "Terminou"}
            </div>
            <div className="rec-grid">
              <CallStackViz s={s} />
              <div className="rec-side">
                <h4 className="eyebrow">Valores devolvidos</h4>
                {s.log.length === 0 && (
                  <p className="muted note-text-sm">
                    {mode === "junior" ? "Nenhum — sem caso base, nenhuma chamada consegue retornar." : "Os retornos começam quando o caso base é atingido."}
                  </p>
                )}
                <ol className="returns">
                  {s.log.map((l, i) => (
                    <li key={i} className="tabular">
                      {l}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </Player>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q6                                                               */
/* ---------------------------------------------------------------- */

function Q6() {
  const frames = useMemo(q6Frames, []);
  return (
    <>
      <Question
        n={6}
        title="Transações PIX como grafo"
        statement={
          <>
            <p>
              Num dia, o cliente A fez um PIX de <b>R$ 50</b> para B às 10h e outro de <b>R$ 1.200</b> para o mesmo B às 14h. Também fez uma transferência para{" "}
              <b>outra conta própria</b> na mesma instituição.
            </p>
            <p>
              <b>a)</b> Classifique o grafo quanto às arestas (simples × multigrafo) e às direções (direcionado × não direcionado), justificando. <b>b)</b> Explique o que é “laço”
              nesse cenário e calcule <b>d_in(A)</b> e <b>d_out(A)</b> considerando as duas transações para B e o laço.
            </p>
          </>
        }
        answer={
          <>
            <p>
              <b>a)</b> <b>Multigrafo direcionado</b> (multigrafo orientado). É multigrafo porque há duas arestas paralelas entre A e B (duas transações em horários diferentes). É
              direcionado porque a transferência tem sentido definido: origem/remetente → destino/favorecido.
            </p>
            <p>
              <b>b)</b> <b>Laço:</b> aresta que liga um vértice a ele mesmo (A transferindo para a própria conta). <b>d_out(A) = 3</b> (2 transações para B + 1 saída do laço).{" "}
              <b>d_in(A) = 1</b> (a entrada do próprio laço).
            </p>
          </>
        }
        tips={
          <ul>
            <li>É o exemplo de multigrafo do slide de Grafos (Pix de R$ 50 e de R$ 1.200).</li>
            <li>
              O laço conta <b>1 na saída e 1 na entrada</b>. Somando os dois, ele vale 2 no grau total, a mesma regra do grafo não direcionado.
            </li>
            <li>
              Erro comum: dizer d_in(A) = 0, esquecendo que o laço também <b>chega</b> em A.
            </li>
          </ul>
        }
      />
      <Player
        frames={frames}
        code={q6Code}
        side={(s) => (
          <>
            <div className="stats">
              <Stat label="d_out(A)" value={s.dOut ?? "–"} />
              <Stat label="d_in(A)" value={s.dIn ?? "–"} />
              <Stat label="Arestas" value={s.g.edges.length} />
            </div>
            <div className="tagrow">
              {s.tags.map((t) => (
                <span key={t} className="ctag">
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
      >
        {(s) => (
          <div className="svg-wrap graph-wrap">
            <GraphSvg
              g={s.g}
              hl={{
                vertex: (id) => (id === s.hotVertex ? "v-sel" : ""),
                edge: (_a, _b, i) => (s.hotEdges.includes(i) ? "e-check" : ""),
                edgeLabel: (i) => s.labels[i] ?? null,
              }}
            />
          </div>
        )}
      </Player>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Q7                                                               */
/* ---------------------------------------------------------------- */

function Q7() {
  const frames = useMemo(q7Frames, []);
  return (
    <>
      <Question
        n={7}
        title="Servidor isolado e rede completa K5"
        statement={
          <>
            <p>
              Uma empresa ligou 5 servidores (S1 a S5). Na manutenção, o cabo que ligava S5 à rede foi cortado, e o grau de S5 ficou <b>d(S5) = 0</b>.
            </p>
            <p>
              <b>a)</b> Como se chama um vértice de grau 0, e qual o impacto disso na conexidade do grafo? <b>b)</b> Se um grafo completo Kn tem n = 5, quantas arestas existem
              nessa rede perfeitamente malhada?
            </p>
          </>
        }
        answer={
          <>
            <p>
              <b>a)</b> Vértice de grau 0 é um <b>vértice isolado</b>. Todo grafo com vértice isolado é <b>desconexo</b>, porque deixa de existir caminho entre ele e os demais
              vértices.
            </p>
            <p>
              <b>b)</b> Em Kn, A = n · (n − 1) / 2. Para n = 5: A = 5 · 4 / 2 = <b>10 arestas</b>.
            </p>
          </>
        }
        tips={
          <ul>
            <li>A nota do slide de Grafos diz exatamente isso: “todo grafo que possui um vértice isolado é dito grafo desconexo”.</li>
            <li>
              Erro comum no item b: responder 20 (= 5 × 4). Cada cabo liga <b>dois</b> servidores, então contar “4 cabos por servidor” conta cada cabo duas vezes. Por isso divide
              por 2.
            </li>
            <li>Para conferir: em K5 cada vértice tem grau 4; a soma dos graus é 5 × 4 = 20 = 2 × 10 arestas.</li>
          </ul>
        }
      />
      <Player
        frames={frames}
        code={q7Code}
        side={(s) => (
          <div className="stats">
            <Stat label="d(S5)" value={s.g.edges.filter(([a, b]) => a === "S5" || b === "S5").length} />
            <Stat label="Conexo?" value={s.verdict ? "Não" : "–"} />
            <Stat label="Arestas" value={s.count ?? s.g.edges.length} />
            {s.formula && <Stat label="n(n−1)/2" value={s.formula} />}
          </div>
        )}
      >
        {(s) => (
          <div className="svg-wrap graph-wrap">
            <GraphSvg
              g={s.g}
              hl={{
                vertex: (id) => (id === s.isolated ? "v-iso v-isolated" : id === s.current ? "v-sel" : s.visited.includes(id) ? "v-done" : ""),
                edge: (a, b, i) => (s.cut && ((a === s.cut[0] && b === s.cut[1]) || (a === s.cut[1] && b === s.cut[0])) ? "e-cut" : s.hotEdges.includes(i) ? "e-check" : ""),
              }}
            />
            <Legend
              items={[
                ["lg-vsel", "vértice de onde a busca saiu"],
                ["lg-vdone", "alcançado a partir de S1"],
                ["lg-iso", "vértice isolado"],
              ]}
            />
          </div>
        )}
      </Player>
    </>
  );
}
