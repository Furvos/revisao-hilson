/**
 * Todo algoritmo da aplicação é "gravado" como uma lista de quadros (frames).
 * Cada quadro é uma fotografia do estado + uma explicação em português
 * + a linha do código que está sendo executada naquele momento.
 * O Player só navega por essa lista: avançar, voltar, rodar e pausar.
 */
export interface Frame<S> {
  state: S;
  /** Explicação curta do que acontece neste passo. */
  desc: string;
  /** Etiqueta da(s) linha(s) do código que ficam destacadas. */
  line?: string;
}

/** Uma linha de código: [etiqueta ou null, texto]. */
export type CodeLine = [string | null, string];

export interface CodeSample {
  java: CodeLine[];
  python: CodeLine[];
}

/** Item de vetor com id estável, para a animação acompanhar o elemento quando ele troca de lugar. */
export interface Item {
  id: number;
  v: number;
}

export const toItems = (vals: number[]): Item[] => vals.map((v, id) => ({ id, v }));

export function randomValues(n: number, min = 1, max = 60): number[] {
  const out: number[] = [];
  while (out.length < n) {
    const x = min + Math.floor(Math.random() * (max - min + 1));
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

export function parseValues(text: string, maxLen = 12): number[] | null {
  const parts = text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > maxLen) return null;
  const nums = parts.map(Number);
  if (nums.some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return null;
  return nums;
}
