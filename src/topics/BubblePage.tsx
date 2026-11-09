import { useMemo, useState } from "react";
import { bubbleCode, bubbleFrames } from "../algos/bubble";
import { CodePanel, Controls, Legend, Stat, StepNote, Theory, TopicHeader } from "../components/Player";
import { Bars, DataInput } from "../components/viz";
import { usePlayer } from "../engine/usePlayer";
import { randomValues } from "../engine/types";

export default function BubblePage() {
  const [values, setValues] = useState<number[]>([14, 21, 30, 7, 56, 28, 24, 33]);
  const frames = useMemo(() => bubbleFrames(values), [values]);
  const p = usePlayer(frames);
  const s = p.frame.state;
  const max = Math.max(...values);

  return (
    <article className="topic">
      <TopicHeader
        kicker="Ordenação por troca"
        title="Bubble Sort"
        lead="Percorre o vetor comparando vizinhos e trocando os que estão fora de ordem. A cada passada, o maior valor restante sobe até o fim, como uma bolha."
        source="Citado no slide de Quick Sort (classificação por troca). Não há aula própria na pasta — versão clássica."
      />
      <DataInput values={values} onChange={setValues} />
      <div className="stage">
        <Bars
          items={s.arr}
          max={max}
          tone={(_, i) => {
            if (i >= s.sortedFrom) return "done";
            if (s.cmp && (i === s.cmp[0] || i === s.cmp[1])) return s.swapped ? "swap" : "cmp";
            return "base";
          }}
          tags={(_, i) => (s.cmp && i === s.cmp[0] ? "j" : s.cmp && i === s.cmp[1] ? "j+1" : null)}
        />
        <Legend
          items={[
            ["tone-cmp", "comparando"],
            ["tone-swap", "trocou"],
            ["tone-done", "posição final"],
          ]}
        />
      </div>
      <Controls p={p} onNewData={() => setValues(randomValues(values.length, 3, 60))} />
      <div className="split">
        <StepNote desc={p.frame.desc}>
          <div className="stats">
            <Stat label="Passada" value={s.pass || "–"} />
            <Stat label="Comparações" value={s.comps} />
            <Stat label="Trocas" value={s.swaps} />
          </div>
        </StepNote>
        <CodePanel code={bubbleCode} line={p.frame.line} />
      </div>
      <Theory
        items={[
          { t: "Ideia", d: "Comparar pares vizinhos (v[j] e v[j+1]) e trocar se estiverem fora de ordem. Após a passada i, os i maiores já estão no fim." },
          { t: "Por que importa", d: "É o algoritmo de ordenação mais simples de entender e implementar. Serve de base para comparar com algoritmos mais rápidos." },
          {
            t: "Complexidade",
            d: (
              <>
                Pior caso e caso médio: <b>O(n²)</b> (≈ n²/2 comparações). Melhor caso (vetor já ordenado, com a flag <code>trocou</code>): <b>O(n)</b>. Memória extra: O(1). É
                estável.
              </>
            ),
          },
          { t: "Pegadinha de prova", d: "Contar passadas e trocas à mão. Teste: rode com o modelo “Decrescente” (máximo de trocas) e com “Já ordenado” (para na 1ª passada)." },
        ]}
      />
    </article>
  );
}
