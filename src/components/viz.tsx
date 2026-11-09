import { motion } from "framer-motion";
import { useState } from "react";
import type { Item } from "../engine/types";
import { parseValues, randomValues } from "../engine/types";

export type BarTone = "base" | "cmp" | "swap" | "done" | "pivot" | "dim" | "x1" | "x2" | "range";

/** Barras animadas para os algoritmos de ordenação. */
export function Bars({
  items,
  tone,
  max,
  showIndex = true,
  tags,
}: {
  items: Item[];
  tone: (it: Item, i: number) => BarTone;
  max: number;
  showIndex?: boolean;
  tags?: (it: Item, i: number) => string | null;
}) {
  return (
    <div className="bars" style={{ ["--cols" as string]: items.length }}>
      {items.map((it, i) => {
        const t = tone(it, i);
        const tag = tags?.(it, i);
        return (
          <motion.div layout transition={{ type: "spring", stiffness: 420, damping: 34 }} key={it.id} className="bar-col">
            <div className="bar-tag">{tag ?? ""}</div>
            <div className="bar-track">
              <div className={"bar tone-" + t} style={{ height: `${Math.max(8, (it.v / max) * 100)}%` }}>
                <span className="bar-val tabular">{it.v}</span>
              </div>
            </div>
            {showIndex && <div className="bar-idx tabular">{i}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}

/** Caixinhas (células de vetor), usadas em Quick X1/X2 e Merge. */
export function Cells({ values, tone, small }: { values: { key: string | number; v: number; tone?: string }[]; tone?: string; small?: boolean }) {
  return (
    <div className={"cells" + (small ? " small" : "")}>
      {values.map((c) => (
        <motion.span layout key={c.key} className={"cell " + (c.tone ?? tone ?? "")} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          {c.v}
        </motion.span>
      ))}
    </div>
  );
}

const PRESETS: { label: string; make: (n: number) => number[] }[] = [
  { label: "Aleatório", make: (n) => randomValues(n, 3, 60) },
  {
    label: "Quase ordenado",
    make: (n) => {
      const a = randomValues(n, 3, 60).sort((x, y) => x - y);
      const i = Math.floor(Math.random() * (n - 1));
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a;
    },
  },
  { label: "Decrescente", make: (n) => randomValues(n, 3, 60).sort((x, y) => y - x) },
  { label: "Já ordenado", make: (n) => randomValues(n, 3, 60).sort((x, y) => x - y) },
];

/** Entrada de dados: digitar valores ou usar um modelo pronto. */
export function DataInput({
  values,
  onChange,
  examples,
  maxLen = 10,
}: {
  values: number[];
  onChange: (v: number[]) => void;
  examples?: { label: string; values: number[] }[];
  maxLen?: number;
}) {
  const [text, setText] = useState(values.join(", "));
  const [err, setErr] = useState<string | null>(null);
  const [n, setN] = useState(values.length);
  const apply = (v: number[]) => {
    setText(v.join(", "));
    setErr(null);
    onChange(v);
  };
  return (
    <div className="data-input">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const v = parseValues(text, maxLen);
          if (!v) setErr(`Digite de 2 a ${maxLen} números inteiros entre 0 e 99, separados por vírgula.`);
          else {
            setN(v.length);
            apply(v);
          }
        }}
      >
        <label className="field">
          <span className="label">Vetor</span>
          <input id="vetor" value={text} onChange={(e) => setText(e.target.value)} inputMode="numeric" spellCheck={false} />
        </label>
        <button className="btn" type="submit">
          Usar estes valores
        </button>
      </form>
      <div className="row wrap">
        <label className="field narrow">
          <span className="label">Tamanho</span>
          <select id="tamanho" value={n} onChange={(e) => setN(Number(e.target.value))}>
            {Array.from({ length: maxLen - 3 }, (_, i) => i + 4).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {PRESETS.map((p) => (
          <button key={p.label} className="chip" onClick={() => apply(p.make(n))}>
            {p.label}
          </button>
        ))}
        {examples?.map((ex) => (
          <button key={ex.label} className="chip chip-slide" onClick={() => apply(ex.values)} title="Exemplo usado nos slides">
            {ex.label}
          </button>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
    </div>
  );
}

/** Pilha de chamadas genérica (topo em cima). */
export function CallStack({ items, title = "Pilha de chamadas", emptyText = "vazia", hot }: { items: string[]; title?: string; emptyText?: string; hot?: boolean }) {
  return (
    <div className="mini-stack">
      <h4 className="eyebrow">{title}</h4>
      <div className="mini-stack-body">
        {items.length === 0 && <span className="muted">{emptyText}</span>}
        {[...items].reverse().map((s, i) => (
          <motion.div
            layout
            key={items.length - 1 - i + s}
            className={"mini-frame" + (i === 0 && hot !== false ? " top" : "")}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {s}
            {i === 0 && <span className="topo">topo</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
