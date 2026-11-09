import { useMemo, useState } from "react";
import { recCode, recFrames, type RecMode } from "../algos/recursion";
import { CodePanel, Controls, Stat, StepNote, Tabs, Theory, TopicHeader } from "../components/Player";
import { usePlayer } from "../engine/usePlayer";
import { CallStackViz } from "../components/CallStackViz";

const PHASE: Record<string, string> = {
  ida: "Fase de ida · empilhando",
  volta: "Fase de volta · desempilhando",
  fim: "Terminou",
  estouro: "Estouro de pilha",
};

export default function RecursionPage() {
  const [mode, setMode] = useState<RecMode>("fatorial");
  const [n, setN] = useState(4);
  const frames = useMemo(() => recFrames(mode, n), [mode, n]);
  const p = usePlayer(frames);
  const s = p.frame.state;
  const range = mode === "parImpar" ? [0, 8] : mode === "semBase" ? [3, 5] : [1, 7];

  return (
    <article className="topic">
      <TopicHeader
        kicker="Base para árvores, Quick e Merge"
        title="Recursividade"
        lead="Uma função que resolve um problema chamando a si mesma com um subproblema menor. Toda função recursiva precisa de um caso base (para parar) e de um passo recursivo (que se aproxima do caso base)."
        source="Base: Aula 7 — Recursividade (Prof. Hilson Silva). Exemplos do slide: fatorial e eh_par / eh_impar."
      />
      <div className="row wrap toolbar">
        <Tabs
          value={mode}
          onChange={(m) => {
            setMode(m);
            setN(m === "parImpar" ? 5 : m === "semBase" ? 4 : 4);
          }}
          options={[
            { v: "fatorial", label: "Fatorial (direta)" },
            { v: "parImpar", label: "Par / ímpar (indireta)" },
            { v: "semBase", label: "Sem caso base" },
          ]}
        />
        <label className="field narrow">
          <span className="label">n</span>
          <select id="rec-n" value={n} onChange={(e) => setN(Number(e.target.value))}>
            {Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stage rec-stage">
        <div className={"phase phase-" + s.phase}>{PHASE[s.phase]}</div>
        <div className="rec-grid">
          <CallStackViz s={s} />
          <div className="rec-side">
            <h4 className="eyebrow">Valores devolvidos</h4>
            {s.log.length === 0 && <p className="muted note-text-sm">Nenhum ainda — os retornos só começam quando o caso base é atingido.</p>}
            <ol className="returns">
              {s.log.map((l, i) => (
                <li key={i} className="tabular">
                  {l}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <Controls p={p} />
      <div className="split">
        <StepNote desc={p.frame.desc}>
          <div className="stats">
            <Stat label="Chamadas na pilha" value={s.depth} />
            <Stat label="Profundidade máxima" value={s.maxDepth} />
            <Stat label="Resultado" value={s.result ?? "–"} />
          </div>
        </StepNote>
        <CodePanel code={recCode[mode]} line={p.frame.line} />
      </div>
      <Theory
        items={[
          { t: "Caso base", d: "Condição de parada obrigatória. Retorna um valor direto, sem nova chamada. Sem ele, a recursão é infinita e a pilha estoura." },
          { t: "Passo recursivo", d: "A chamada a si mesma com uma entrada MENOR, que se aproxima do caso base (n → n − 1)." },
          {
            t: "Pilha de execução",
            d: "Na ida, cada chamada empilha um stack frame (variáveis locais + ponto de retorno). No caso base, os resultados voltam desempilhando em ordem LIFO.",
          },
          { t: "Direta × indireta", d: "Direta: a função chama a si mesma (fatorial). Indireta: A chama B e B chama A (eh_par / eh_impar)." },
          {
            t: "Recursão × iteração",
            d: "Recursão deixa o código mais claro para estruturas não lineares (árvores, grafos, pastas, JSON), mas gasta memória da pilha e tem custo extra por chamada.",
          },
          { t: "Complexidade do fatorial", d: "n chamadas → tempo O(n) e memória de pilha O(n)." },
        ]}
      />
    </article>
  );
}
