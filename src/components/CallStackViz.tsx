import { AnimatePresence, motion } from "framer-motion";
import type { RecState } from "../algos/recursion";

/** Pilha de execução desenhada como um "pote": topo em cima, main embaixo. */
export function CallStackViz({ s }: { s: RecState }) {
  return (
    <div className="callstack" aria-label="Pilha de execução">
      <div className="callstack-cap">topo da pilha ↑</div>
      <div className="callstack-body">
        <AnimatePresence initial={false}>
          {[...s.stack].reverse().map((f, i) => (
            <motion.div
              key={f.id}
              layout
              className={"sframe st-" + f.status + (i === 0 ? " is-top" : "")}
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
            >
              <span className="sframe-name">{f.label}</span>
              <span className="sframe-note">{f.note || "executando…"}</span>
              <span className="sframe-status">{f.status === "waiting" ? "aguardando" : f.status === "returning" ? "retornando" : "executando"}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {s.stack.length === 0 && <div className="callstack-empty">{s.result ? `Pilha vazia · resultado = ${s.result}` : "Pilha vazia"}</div>}
      </div>
      <div className="callstack-floor">base da pilha (main)</div>
      {s.phase === "estouro" && <div className="overflow-banner">StackOverflowError</div>}
    </div>
  );
}
