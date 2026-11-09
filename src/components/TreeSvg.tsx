import type { BstState, BTree } from "../algos/tree";
import { heightOf, layoutBinary } from "../algos/tree";

/* ---------------- Árvore binária em SVG ---------------- */

export function BinaryTreeSvg({
  tree,
  nodeClass,
  ghost,
  nullOf,
  edgeClass,
  caption,
  levels,
}: {
  tree: BTree;
  nodeClass: (id: number) => string;
  ghost?: BstState["ghost"];
  nullOf?: { id: number; side: "esq" | "dir" } | null;
  edgeClass?: (from: number, to: number) => string;
  /** texto pequeno abaixo do nó (ex.: a condição de uma árvore de decisão) */
  caption?: (id: number) => string | null;
  /** mostra "nível 0, 1, 2…" à esquerda */
  levels?: boolean;
}) {
  const pos = layoutBinary(tree);
  const ids = Object.keys(pos).map(Number);
  const cols = Math.max(ids.length, 1) + (ghost ? 1 : 0);
  const h = Math.max(heightOf(tree), 0) + (ghost ? 1 : 0);
  const step = caption ? 112 : 58;
  const pad = caption ? 60 : 34;
  const sx = (x: number) => pad + x * step;
  const sy = (y: number) => 34 + y * (caption ? 92 : 74);
  let ghostPos: { x: number; y: number } | null = null;
  if (ghost) {
    const p = pos[ghost.parent];
    ghostPos = { x: p.x + (ghost.side === "left" ? -0.5 : 0.5), y: p.y + 1 };
  }
  const nullPos = nullOf ? { x: pos[nullOf.id].x + (nullOf.side === "esq" ? -0.45 : 0.45), y: pos[nullOf.id].y + 0.75 } : null;
  return (
    <div className="svg-wrap">
      <svg viewBox={`0 0 ${sx(cols - 1) + pad} ${sy(h) + (caption ? 56 : 36)}`} className="tree-svg binary" role="img" aria-label="Árvore binária">
        {levels &&
          Array.from({ length: h + 1 }, (_, l) => (
            <text key={"lvl" + l} x={4} y={sy(l) + 4} className="lvl-label">
              nível {l}
            </text>
          ))}
        {ids.flatMap((id) =>
          (["left", "right"] as const)
            .map((side) => tree.nodes[id][side])
            .filter((c): c is number => c !== null)
            .map((c) => <line key={id + "-" + c} x1={sx(pos[id].x)} y1={sy(pos[id].y)} x2={sx(pos[c].x)} y2={sy(pos[c].y)} className={"edge " + (edgeClass?.(id, c) ?? "")} />),
        )}
        {ghost && ghostPos && (
          <g className="tnode n-ghost">
            <line x1={sx(pos[ghost.parent].x)} y1={sy(pos[ghost.parent].y)} x2={sx(ghostPos.x)} y2={sy(ghostPos.y)} className="edge edge-ghost" />
            <circle cx={sx(ghostPos.x)} cy={sy(ghostPos.y)} r={19} />
            <text x={sx(ghostPos.x)} y={sy(ghostPos.y) + 5} textAnchor="middle">
              {ghost.value}
            </text>
          </g>
        )}
        {nullPos && nullOf && (
          <g className="null-mark">
            <line x1={sx(pos[nullOf.id].x)} y1={sy(pos[nullOf.id].y)} x2={sx(nullPos.x)} y2={sy(nullPos.y)} className="edge edge-ghost" />
            <text x={sx(nullPos.x)} y={sy(nullPos.y) + 14} textAnchor="middle">
              null
            </text>
          </g>
        )}
        {ids.map((id) => (
          <g key={id} className={"tnode " + nodeClass(id)}>
            <circle cx={sx(pos[id].x)} cy={sy(pos[id].y)} r={19} />
            <text x={sx(pos[id].x)} y={sy(pos[id].y) + 5} textAnchor="middle">
              {tree.nodes[id].label}
            </text>
            {caption?.(id) && (
              <text x={sx(pos[id].x)} y={sy(pos[id].y) + 36} textAnchor="middle" className="node-caption">
                {caption(id)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
