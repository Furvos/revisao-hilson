import { useMemo, useState } from "react";
import { mergeCode, mergeFrames } from "../algos/merge";
import { MergeTree } from "../components/MergeTree";
import { CodePanel, Controls, Legend, Stat, StepNote, Theory, TopicHeader } from "../components/Player";
import { CallStack, DataInput } from "../components/viz";
import { usePlayer } from "../engine/usePlayer";
import { randomValues } from "../engine/types";

const EXAMPLES = [
  { label: "Slide: diagrama (8 valores)", values: [56, 29, 35, 42, 15, 41, 75, 21] },
  { label: "Slide: exemplo prático", values: [38, 27, 43, 10] },
];

export default function MergePage() {
  const [values, setValues] = useState<number[]>(EXAMPLES[0].values);
  const frames = useMemo(() => mergeFrames(values), [values]);
  const p = usePlayer(frames);
  const s = p.frame.state;
  const m = s.merge;

  return (
    <article className="topic">
      <TopicHeader
        kicker="Ordenação por intercalação · dividir para conquistar"
        title="Merge Sort"
        lead="Divide o vetor ao meio até sobrarem pedaços de tamanho 1 e depois intercala (merge) os pares de pedaços, sempre em ordem crescente, até formar um único vetor ordenado."
        source="Base: Aula 10 — Algoritmo de Ordenação MergeSort (Prof. Hilson Silva). Os dados iniciais são os do diagrama do slide."
      />
      <DataInput values={values} onChange={setValues} examples={EXAMPLES} maxLen={10} />
      <div className="stage">
        <MergeTree s={s} />
        <div className="aux">
          <h4 className="eyebrow">Vetor auxiliar (memória extra do Merge Sort)</h4>
          <div className="mnode-cells aux-cells">
            {m ? (
              m.out.map((v, k) => (
                <span key={k} className="mcell filled">
                  {v}
                </span>
              ))
            ) : (
              <span className="muted">usado durante a intercalação</span>
            )}
          </div>
        </div>
        <Legend
          items={[
            ["mk-active", "chamada atual"],
            ["mk-ptr", "elemento comparado (i em A, j em B)"],
            ["mk-used", "já copiado"],
            ["mk-sorted", "trecho ordenado"],
          ]}
        />
      </div>
      <Controls p={p} onNewData={() => setValues(randomValues(values.length, 3, 80))} />
      <div className="split">
        <StepNote desc={p.frame.desc}>
          <div className="stats">
            <Stat label="Comparações" value={s.comps} />
            <Stat label="Níveis de divisão" value={s.maxDepth} />
          </div>
          <CallStack items={s.stack} />
        </StepNote>
        <CodePanel code={mergeCode} line={p.frame.line} />
      </div>
      <Theory
        items={[
          {
            t: "Etapas",
            d: "DIVISÃO (quebra ao meio), CONQUISTA (ordena cada metade recursivamente) e COMBINAÇÃO (intercala as metades ordenadas). Criado por John von Neumann em 1945.",
          },
          {
            t: "Complexidade",
            d: (
              <>
                <b>O(n log n)</b> em todos os casos: são ≈ log₂ n níveis de divisão e cada nível faz cerca de n comparações. Memória extra: <b>O(n)</b> (vetor auxiliar do mesmo
                tamanho).
              </>
            ),
          },
          {
            t: "Merge × Quick",
            d: "Merge Sort sempre divide ao meio (subproblemas do mesmo tamanho). Quick Sort divide pelo pivô (tamanhos diferentes). Merge é mais previsível, mas usa mais memória e, na prática, costuma ser mais lento que o Quick.",
          },
          { t: "Pegadinha de prova", d: "A intercalação só funciona porque A e B já estão ordenados. Quando um lado acaba, o resto do outro é copiado direto." },
        ]}
      />
    </article>
  );
}
