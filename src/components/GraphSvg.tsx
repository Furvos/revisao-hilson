import type { Graph } from "../algos/graph";

/* ---------------- Desenho do grafo ---------------- */

export interface Hl {
  vertex?: (id: string) => string;
  edge?: (a: string, b: string, index: number) => string;
  /** rótulo opcional de cada aresta */
  edgeLabel?: (index: number) => string | null;
  onVertex?: (id: string) => void;
  onEdge?: (index: number) => void;
}

const R = 6.2;

export function GraphSvg({ g, hl }: { g: Graph; hl: Hl }) {
  const P = Object.fromEntries(g.vertices.map((v) => [v.id, v]));
  // agrupa arestas paralelas para desenhar curvas
  const groups = new Map<string, number[]>();
  g.edges.forEach(([a, b], i) => {
    const k = [a, b].sort().join("|");
    groups.set(k, [...(groups.get(k) ?? []), i]);
  });
  return (
    <svg viewBox="-10 -10 120 120" className="graph-svg" role="img" aria-label="Grafo">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
        </marker>
      </defs>
      {g.edges.map(([a, b], i) => {
        const A = P[a];
        const B = P[b];
        if (!A || !B) return null;
        const cls = "gedge " + (hl.edge?.(a, b, i) ?? "");
        const lab = hl.edgeLabel?.(i);
        const click = hl.onEdge ? () => hl.onEdge!(i) : undefined;
        if (a === b) {
          return (
            <g key={i} onClick={click} className={click ? "clickable" : ""}>
              <circle cx={A.x} cy={A.y - R - 3.6} r={4} className={cls} fill="none" />
              <circle cx={A.x} cy={A.y - R - 3.6} r={6} className="hit" />
              {lab && (
                <text x={A.x} y={A.y - R - 9.5} textAnchor="middle" className="edge-label">
                  {lab}
                </text>
              )}
            </g>
          );
        }
        const k = [a, b].sort().join("|");
        const grp = groups.get(k)!;
        const idx = grp.indexOf(i);
        const off = grp.length === 1 ? 0 : (idx - (grp.length - 1) / 2) * 18;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        const sign = a < b ? 1 : -1;
        const cx = (A.x + B.x) / 2 + nx * off * sign;
        const cy = (A.y + B.y) / 2 + ny * off * sign;
        // encurta a ponta para a seta não ficar dentro do círculo
        const tx = B.x - cx;
        const ty = B.y - cy;
        const tl = Math.hypot(tx, ty);
        const ex = B.x - (tx / tl) * (R + 0.6);
        const ey = B.y - (ty / tl) * (R + 0.6);
        const d = `M${A.x},${A.y} Q${cx},${cy} ${g.directed ? ex : B.x},${g.directed ? ey : B.y}`;
        return (
          <g key={i} onClick={click} className={click ? "clickable" : ""}>
            <path d={d} className={cls} fill="none" markerEnd={g.directed ? "url(#arrow)" : undefined} />
            <path d={d} className="hit" fill="none" />
            {lab && (
              <text x={(A.x + 2 * cx + B.x) / 4} y={(A.y + 2 * cy + B.y) / 4 - 1.6} textAnchor="middle" className="edge-label">
                {lab}
              </text>
            )}
          </g>
        );
      })}
      {g.vertices.map((v) => (
        <g
          key={v.id}
          className={"gvertex " + (hl.vertex?.(v.id) ?? "") + (hl.onVertex ? " clickable" : "")}
          onClick={hl.onVertex ? () => hl.onVertex!(v.id) : undefined}
          tabIndex={hl.onVertex ? 0 : undefined}
          role={hl.onVertex ? "button" : undefined}
          aria-label={`Vértice ${v.id}`}
          onKeyDown={(e) => hl.onVertex && (e.key === "Enter" || e.key === " ") && hl.onVertex(v.id)}
        >
          <circle cx={v.x} cy={v.y} r={R} />
          <text x={v.x} y={v.y + 1.7} textAnchor="middle">
            {v.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
