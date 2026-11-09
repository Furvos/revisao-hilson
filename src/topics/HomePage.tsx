import { TOPICS } from "../topics";

export default function HomePage() {
  return (
    <article className="topic home">
      <header className="topic-head">
        <p className="kicker">Algoritmos e Estrutura de Dados I · Engenharia de Software · iCEV</p>
        <h1>Revisão da 2ª prova, passo a passo</h1>
        <p className="lead">
          Seis assuntos, cada um com uma animação que você controla: avance um passo de cada vez, volte, rode no automático ou troque os dados. O código ao lado acende a linha que
          está sendo executada.
        </p>
      </header>

      <section>
        <h2 className="h2">Ordem sugerida de estudo</h2>
        <p className="muted-p">As setas indicam pré-requisitos. Recursividade vem primeiro porque percursos em árvore, DFS, Quick Sort e Merge Sort são todos recursivos.</p>
        <ol className="roadmap">
          {TOPICS.map((t, i) => (
            <li key={t.id}>
              <a href={"#" + t.id} className="road-card">
                <span className="road-n tabular">{i + 1}</span>
                <span className="road-body">
                  <span className="road-title">{t.title}</span>
                  <span className="road-sub">{t.blurb}</span>
                  {t.needs && <span className="road-needs">precisa de: {t.needs}</span>}
                </span>
                <span className="road-big">{t.bigO}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <a href="#q1" className="exam-callout">
        <span className="exam-callout-k">Lista de revisão P2 do Prof. Hilson</span>
        <span className="exam-callout-t">Resolução das 7 questões, com animação passo a passo →</span>
      </a>

      <section>
        <h2 className="h2">Comparando os algoritmos de ordenação</h2>
        <div className="table-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>Algoritmo</th>
                <th>Família (slide)</th>
                <th>Melhor caso</th>
                <th>Caso médio</th>
                <th>Pior caso</th>
                <th>Memória extra</th>
                <th>Recursivo?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bubble Sort</td>
                <td>Troca</td>
                <td>O(n)*</td>
                <td>O(n²)</td>
                <td>O(n²)</td>
                <td>O(1)</td>
                <td>Não</td>
              </tr>
              <tr>
                <td>Quick Sort</td>
                <td>Troca</td>
                <td>O(n log n)</td>
                <td>O(n log n)</td>
                <td>O(n²)</td>
                <td>pilha de recursão</td>
                <td>Sim</td>
              </tr>
              <tr>
                <td>Merge Sort</td>
                <td>Intercalação</td>
                <td>O(n log n)</td>
                <td>O(n log n)</td>
                <td>O(n log n)</td>
                <td>O(n) · vetor auxiliar</td>
                <td>Sim</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="footnote">* com a verificação “se não houve troca na passada, para”.</p>
      </section>

      <section className="howto">
        <h2 className="h2">Como usar</h2>
        <ul>
          <li>
            <kbd>Espaço</kbd> roda ou pausa · <kbd>←</kbd> <kbd>→</kbd> voltam e avançam um passo.
          </li>
          <li>A barra “Passo X de Y” permite pular para qualquer ponto da animação.</li>
          <li>Os botões verdes com uma bolinha (ex.: “Slide: vetor A”) carregam os mesmos exemplos dos slides do Prof. Hilson.</li>
          <li>
            Partes marcadas como <span className="chip-extra">complementar</span> não aparecem nos slides da disciplina.
          </li>
        </ul>
      </section>
    </article>
  );
}
