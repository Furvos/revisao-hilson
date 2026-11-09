import { useMemo, useState } from "react";
import { PIVOT_NAME, quickCode, quickFrames, type PivotRule } from "../algos/quick";
import { CodePanel, Controls, Stat, StepNote, Theory, TopicHeader } from "../components/Player";
import { CallStack, DataInput } from "../components/viz";
import { QuickStage } from "../components/QuickStage";
import { usePlayer } from "../engine/usePlayer";
import { randomValues } from "../engine/types";

const EXAMPLES = [
  { label: "Slide: atividade (pivô 4)", values: [4, 2, 1, 3, 6, 5, 7, 8] },
  { label: "Slide: vetor A", values: [9, 12, 10, 13, 6, 5, 7, 8] },
  { label: "Slide: vetor B", values: [9, 8, 3, 14, 5, 6, 17, 8] },
  { label: "Slide: vetor C", values: [9, 8, 3, 14, 5, 6, 17, 2, 3, 8] },
];

export default function QuickPage() {
  const [values, setValues] = useState<number[]>([4, 2, 1, 3, 6, 5, 7, 8]);
  const [rule, setRule] = useState<PivotRule>("primeiro");
  const frames = useMemo(() => quickFrames(values, rule), [values, rule]);
  const p = usePlayer(frames);
  const s = p.frame.state;
  const max = Math.max(...values);

  return (
    <article className="topic">
      <TopicHeader
        kicker="Ordenação por troca · dividir para conquistar"
        title="Quick Sort"
        lead="Escolhe um pivô p e separa o restante em X1 (≤ p) e X2 (> p). O pivô fica na posição final. Depois, X1 e X2 são ordenados do mesmo jeito, recursivamente."
        source="Base: Aula 9 — Algoritmo de Ordenação QuickSort (Prof. Hilson Silva)."
      />
      <DataInput values={values} onChange={setValues} examples={EXAMPLES} maxLen={12} />
      <div className="row wrap toolbar">
        <span className="label">Pivô</span>
        <div className="seg" role="radiogroup" aria-label="Escolha do pivô">
          {(["primeiro", "meio", "ultimo", "mediana3"] as PivotRule[]).map((r) => (
            <button key={r} role="radio" aria-checked={rule === r} className={rule === r ? "on" : ""} onClick={() => setRule(r)}>
              {PIVOT_NAME[r]}
            </button>
          ))}
        </div>
        <span className="hint">O slide diz: não existe regra fixa para o pivô. Teste “primeiro” com um vetor já ordenado para ver o pior caso.</span>
      </div>
      <QuickStage s={s} max={max} />
      <Controls p={p} onNewData={() => setValues(randomValues(values.length, 3, 60))} />
      <div className="split">
        <StepNote desc={p.frame.desc}>
          <div className="stats">
            <Stat label="Comparações" value={s.comps} />
            <Stat label="Profundidade" value={s.stack.length} />
          </div>
          <CallStack items={s.stack} />
        </StepNote>
        <CodePanel code={quickCode} line={p.frame.line} />
      </div>
      <Theory
        items={[
          {
            t: "Ideia",
            d: "Dividir para conquistar: particionar em X1 (≤ p) e X2 (> p), ordenar cada parte recursivamente e juntar X1 + p + X2. Criado por C. A. R. Hoare em 1960.",
          },
          {
            t: "Complexidade",
            d: (
              <>
                Melhor caso / médio: <b>O(n log n)</b> — C(n) = 2C(n/2) + n, quando o pivô divide o vetor ao meio. Pior caso: <b>O(n²)</b> — quando o pivô é sempre um extremo (ex.:
                primeiro elemento num vetor já ordenado).
              </>
            ),
          },
          { t: "Vantagens", d: "Muito rápido na prática; precisa só de uma pequena pilha (recursão) como memória auxiliar." },
          { t: "Desvantagens", d: "Pior caso O(n²); implementação delicada; não é estável." },
          {
            t: "Sobre esta animação",
            d: "Aqui X1 e X2 são montados como listas separadas, como no slide “Separando os conjuntos”. Implementações “no lugar” (in-place) fazem a mesma separação trocando elementos dentro do próprio vetor.",
          },
        ]}
      />
    </article>
  );
}
