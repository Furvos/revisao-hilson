import { useEffect, useState } from "react";
import type { PlayerApi } from "../engine/usePlayer";
import type { CodeSample } from "../engine/types";

const SPEED_LABELS = ["Bem devagar", "Devagar", "Normal", "Rápido", "Muito rápido"];

export function Controls<S>({ p, onNewData, newDataLabel = "Novos dados" }: { p: PlayerApi<S>; onNewData?: () => void; newDataLabel?: string }) {
  // Atalhos: espaço = rodar/pausar, setas = passo a passo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
      if (e.key === " ") {
        if (t && t.tagName === "BUTTON") return; // espaço já "clica" no botão focado
        e.preventDefault();
        p.toggle();
      } else if (e.key === "ArrowRight") p.next();
      else if (e.key === "ArrowLeft") p.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  const atEnd = p.index >= p.total - 1;
  return (
    <div className="controls" role="group" aria-label="Controles da animação">
      <div className="controls-buttons">
        <button className="btn" onClick={p.reset} title="Voltar ao primeiro passo" disabled={p.index === 0}>
          <span aria-hidden>⏮</span> Início
        </button>
        <button className="btn" onClick={p.prev} disabled={p.index === 0} title="Passo anterior (seta ←)">
          <span aria-hidden>◀</span> Voltar
        </button>
        <button className="btn btn-primary" onClick={p.toggle} title="Rodar ou pausar (barra de espaço)">
          {p.playing ? (
            <>
              <span aria-hidden>⏸</span> Pausar
            </>
          ) : (
            <>
              <span aria-hidden>▶</span> {atEnd ? "Repetir" : "Rodar"}
            </>
          )}
        </button>
        <button className="btn" onClick={p.next} disabled={atEnd} title="Próximo passo (seta →)">
          Avançar <span aria-hidden>▶</span>
        </button>
        {onNewData && (
          <button className="btn btn-ghost" onClick={onNewData}>
            <span aria-hidden>⟳</span> {newDataLabel}
          </button>
        )}
      </div>
      <div className="controls-meta">
        <label className="speed">
          <span className="label">Velocidade</span>
          <input id="speed" type="range" min={0} max={4} value={p.speed} onChange={(e) => p.setSpeed(Number(e.target.value))} />
          <span className="speed-name">{SPEED_LABELS[p.speed]}</span>
        </label>
        <label className="scrub">
          <span className="label tabular">
            Passo {p.index + 1} de {p.total}
          </span>
          <input id="scrub" type="range" min={0} max={p.total - 1} value={p.index} onChange={(e) => p.seek(Number(e.target.value))} aria-label="Ir para o passo" />
        </label>
      </div>
    </div>
  );
}

export function StepNote({ desc, children }: { desc: string; children?: React.ReactNode }) {
  return (
    <section className="note" aria-live="polite">
      <h3 className="eyebrow">O que está acontecendo</h3>
      <p className="note-text">{desc}</p>
      {children && <div className="note-extra">{children}</div>}
    </section>
  );
}

export function CodePanel({ code, line }: { code: CodeSample; line?: string }) {
  const [lang, setLang] = useState<"java" | "python">(() => {
    try {
      return (localStorage.getItem("lang") as "java" | "python") || "java";
    } catch {
      return "java";
    }
  });
  const choose = (l: "java" | "python") => {
    setLang(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* armazenamento indisponível: tudo bem */
    }
  };
  const lines = code[lang];
  return (
    <section className="code">
      <div className="code-head">
        <h3 className="eyebrow">Código</h3>
        <div className="seg" role="tablist" aria-label="Linguagem">
          <button role="tab" aria-selected={lang === "java"} className={lang === "java" ? "on" : ""} onClick={() => choose("java")}>
            Java
          </button>
          <button role="tab" aria-selected={lang === "python"} className={lang === "python" ? "on" : ""} onClick={() => choose("python")}>
            Python
          </button>
        </div>
      </div>
      <pre className="code-body">
        {lines.map(([tag, text], i) => (
          <div key={i} className={"code-line" + (tag && line && tag === line ? " hot" : "")}>
            <span className="ln">{i + 1}</span>
            <span>{text || " "}</span>
          </div>
        ))}
      </pre>
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value tabular">{value}</span>
    </div>
  );
}

export function Legend({ items }: { items: [string, string][] }) {
  return (
    <ul className="legend">
      {items.map(([cls, label]) => (
        <li key={label}>
          <span className={"swatch " + cls} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function TopicHeader({ title, kicker, lead, source }: { title: string; kicker: string; lead: string; source: string }) {
  return (
    <header className="topic-head">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      <p className="source">{source}</p>
    </header>
  );
}

export function Theory({ items }: { items: { t: string; d: React.ReactNode }[] }) {
  return (
    <details className="theory">
      <summary>Resumo para a prova</summary>
      <dl>
        {items.map((it) => (
          <div key={it.t}>
            <dt>{it.t}</dt>
            <dd>{it.d}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string; extra?: boolean }[] }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.v} role="tab" aria-selected={value === o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>
          {o.label}
          {o.extra && <span className="chip-extra">complementar</span>}
        </button>
      ))}
    </div>
  );
}
