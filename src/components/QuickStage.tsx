import type { QuickState } from "../algos/quick";
import { Legend } from "./Player";
import { Bars, Cells } from "./viz";

/** Palco do Quick Sort: barras + caixas X1 / pivô / X2. */
export function QuickStage({ s, max }: { s: QuickState; max: number }) {
  const fixed = new Set(s.fixed);
  const inX1 = new Set(s.x1.map((x) => x.id));
  const inX2 = new Set(s.x2.map((x) => x.id));
  const pivot = s.arr.find((x) => x.id === s.pivotId);
  return (
    <div className="stage">
      <Bars
        items={s.arr}
        max={max}
        tone={(it, i) => {
          if (fixed.has(it.id)) return "done";
          if (it.id === s.pivotId) return "pivot";
          if (it.id === s.cmpId) return "cmp";
          if (inX1.has(it.id)) return "x1";
          if (inX2.has(it.id)) return "x2";
          if (i < s.lo || i > s.hi) return "dim";
          return "base";
        }}
        tags={(it) => (it.id === s.pivotId ? "p" : inX1.has(it.id) ? "X1" : inX2.has(it.id) ? "X2" : null)}
      />
      <Legend
        items={[
          ["tone-pivot", "pivô"],
          ["tone-cmp", "comparando"],
          ["tone-x1", "X1 (≤ p)"],
          ["tone-x2", "X2 (> p)"],
          ["tone-done", "posição final"],
          ["tone-dim", "fora do trecho atual"],
        ]}
      />
      <div className="partition">
        <div className="bin">
          <h4 className="eyebrow">X1 · menores ou iguais</h4>
          <Cells values={s.x1.map((x) => ({ key: x.id, v: x.v }))} tone="x1" />
        </div>
        <div className="bin pivot-bin">
          <h4 className="eyebrow">pivô</h4>
          <Cells values={s.partitioning && pivot ? [{ key: pivot.id, v: pivot.v }] : []} tone="pivot" />
        </div>
        <div className="bin">
          <h4 className="eyebrow">X2 · maiores</h4>
          <Cells values={s.x2.map((x) => ({ key: x.id, v: x.v }))} tone="x2" />
        </div>
      </div>
    </div>
  );
}
