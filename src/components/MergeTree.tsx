import type { MergeState, MNode } from "../algos/merge";

/** Árvore de divisões do Merge Sort (mesmo formato do diagrama do slide). */
export function MergeTree({ s, levelLabels }: { s: MergeState; levelLabels?: boolean }) {
  const m = s.merge;
  const cellTone = (node: MNode, k: number): string => {
    if (!m) return "";
    if (node.key === m.left) return k < m.i ? "used" : k === m.i ? "ptr" : "";
    if (node.key === m.right) return k < m.j ? "used" : k === m.j ? "ptr" : "";
    return "";
  };

  return (
    <div className="mtree-wrap">
      {levelLabels && (
        <div className="mtree-levels" aria-hidden>
          {Array.from({ length: s.maxDepth + 1 }, (_, l) => (
            <span key={l} style={{ top: `calc(${l} * var(--row))` }}>
              N{l}
            </span>
          ))}
        </div>
      )}
      <div className="mtree" style={{ ["--rows" as string]: s.maxDepth + 1 }}>
        {s.nodes
          .filter((nd) => nd.status !== "hidden")
          .map((nd) => {
            const size = nd.hi - nd.lo + 1;
            const isMerging = m?.key === nd.key;
            const shown = isMerging ? [...nd.vals, ...Array(size - nd.vals.length).fill(null)] : nd.vals;
            return (
              <div
                key={nd.key}
                className={"mnode st-" + nd.status + (m && (nd.key === m.left || nd.key === m.right) ? " src" : "")}
                style={{ left: `${(nd.lo / s.n) * 100}%`, width: `${(size / s.n) * 100}%`, top: `calc(${nd.depth} * var(--row))` }}
              >
                <div className="mnode-cells">
                  {shown.map((v, k) => (
                    <span key={k} className={"mcell " + (v === null ? "empty " : "") + cellTone(nd, k)}>
                      {v ?? ""}
                    </span>
                  ))}
                </div>
                {m && nd.key === m.left && <span className="mlabel">A</span>}
                {m && nd.key === m.right && <span className="mlabel">B</span>}
              </div>
            );
          })}
      </div>
    </div>
  );
}
