import { useEffect, useState } from "react";
import { TOPICS } from "./topics";
import HomePage from "./topics/HomePage";
import RecursionPage from "./topics/RecursionPage";
import TreePage from "./topics/TreePage";
import GraphPage from "./topics/GraphPage";
import BubblePage from "./topics/BubblePage";
import QuickPage from "./topics/QuickPage";
import MergePage from "./topics/MergePage";
import ExamPage, { QUESTIONS, type QId } from "./topics/ExamPage";

const PAGES: Record<string, () => JSX.Element> = {
  inicio: HomePage,
  recursividade: RecursionPage,
  arvores: TreePage,
  grafos: GraphPage,
  bubble: BubblePage,
  quick: QuickPage,
  merge: MergePage,
};

const readHash = () => {
  const h = window.location.hash.replace("#", "");
  if (h === "resolucao") return "q1";
  if (QUESTIONS.some((q) => q.id === h)) return h;
  return h in PAGES ? h : "inicio";
};

export default function App() {
  const [page, setPage] = useState(readHash);
  useEffect(() => {
    const on = () => {
      setPage(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const isExam = QUESTIONS.some((q) => q.id === page);
  const Page = isExam ? null : PAGES[page];
  const idx = TOPICS.findIndex((t) => t.id === page);
  const prev = idx > 0 ? TOPICS[idx - 1] : null;
  const next = idx >= 0 && idx < TOPICS.length - 1 ? TOPICS[idx + 1] : idx === -1 ? TOPICS[0] : null;

  return (
    <div className="shell">
      <nav className="nav" aria-label="Assuntos">
        <a href="#inicio" className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="3" />
              <circle cx="5" cy="18" r="3" />
              <circle cx="19" cy="18" r="3" />
              <path d="M10.5 7.5 6.5 15.5M13.5 7.5l4 8" />
            </svg>
          </span>
          <span>
            <span className="brand-name">Lab AED</span>
            <span className="brand-sub">Revisão · 2ª prova</span>
          </span>
        </a>
        <ol className="nav-list">
          {TOPICS.map((t, i) => (
            <li key={t.id}>
              <a href={"#" + t.id} className={page === t.id ? "on" : ""} aria-current={page === t.id ? "page" : undefined}>
                <span className="nav-n tabular">{i + 1}</span>
                {t.title}
              </a>
            </li>
          ))}
        </ol>
        <div className="nav-sep">
          <span className="nav-group">Lista do professor</span>
          <a href="#q1" className={"nav-exam" + (isExam ? " on" : "")} aria-current={isExam ? "page" : undefined}>
            <span className="nav-n" aria-hidden>
              ✓
            </span>
            Resolução da revisão
          </a>
        </div>
        <p className="nav-foot">Monitoria · base: slides do Prof. Hilson Silva</p>
      </nav>
      <main className="main">
        {isExam ? <ExamPage q={page as QId} /> : Page && <Page key={page} />}
        {!isExam && (
          <footer className="pager">
            {prev ? (
              <a href={"#" + prev.id} className="pager-link">
                ← {prev.title}
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={"#" + next.id} className="pager-link next">
                {idx === -1 ? "Começar: " : ""}
                {next.title} →
              </a>
            )}
          </footer>
        )}
      </main>
    </div>
  );
}
