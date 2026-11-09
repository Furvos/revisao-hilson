import type { CodeSample, Frame } from "../engine/types";

export interface CallFrame {
  id: number;
  label: string; // ex.: fatorial(3)
  status: "running" | "waiting" | "returning";
  note: string; // ex.: "3 * fatorial(2)"
}

export interface RecState {
  stack: CallFrame[];
  phase: "ida" | "volta" | "fim" | "estouro";
  result: string | null;
  depth: number;
  maxDepth: number;
  /** registro textual de tudo que já retornou */
  log: string[];
}

export type RecMode = "fatorial" | "semBase" | "parImpar";

export const recCode: Record<RecMode, CodeSample> = {
  fatorial: {
    java: [
      ["call", "public static int fatorial(int n) {"],
      ["test", "    if (n <= 1)                  // 1. caso base"],
      ["base", "        return 1;"],
      ["rec", "    return n * fatorial(n - 1);  // 2. passo recursivo"],
      [null, "}"],
    ],
    python: [
      ["call", "def fatorial(n: int) -> int:"],
      ["test", "    if n <= 1:                  # 1. caso base"],
      ["base", "        return 1"],
      ["rec", "    return n * fatorial(n - 1)  # 2. passo recursivo"],
      [null, ""],
      [null, "print(fatorial(5))  # Saída: 120"],
    ],
  },
  semBase: {
    java: [
      ["call", "public static int fatorial(int n) {"],
      [null, "    // ERRO: esquecemos o caso base!"],
      ["rec", "    return n * fatorial(n - 1);"],
      [null, "}"],
      [null, "// Resultado: StackOverflowError"],
    ],
    python: [
      ["call", "def fatorial(n):"],
      [null, "    # ERRO: esquecemos o caso base!"],
      ["rec", "    return n * fatorial(n - 1)"],
      [null, ""],
      [null, "# Resultado: RecursionError"],
    ],
  },
  parImpar: {
    java: [
      ["par", "static boolean ehPar(int n) {"],
      ["parBase", "    if (n == 0) return true;"],
      ["parRec", "    return ehImpar(n - 1);   // chama a OUTRA função"],
      [null, "}"],
      ["impar", "static boolean ehImpar(int n) {"],
      ["imparBase", "    if (n == 0) return false;"],
      ["imparRec", "    return ehPar(n - 1);     // chama a OUTRA função"],
      [null, "}"],
    ],
    python: [
      ["par", "def eh_par(n):"],
      ["parBase", "    if n == 0:"],
      ["parBase", "        return True"],
      ["parRec", "    return eh_impar(n - 1)  # chama a outra função"],
      [null, ""],
      ["impar", "def eh_impar(n):"],
      ["imparBase", "    if n == 0:"],
      ["imparBase", "        return False"],
      ["imparRec", "    return eh_par(n - 1)    # chama a outra função"],
    ],
  },
};

const STACK_LIMIT = 9;

export function recFrames(mode: RecMode, n: number): Frame<RecState>[] {
  const frames: Frame<RecState>[] = [];
  const stack: CallFrame[] = [];
  const log: string[] = [];
  let maxDepth = 0;
  let id = 0;
  const snap = (desc: string, line: string, phase: RecState["phase"], result: string | null = null) => {
    maxDepth = Math.max(maxDepth, stack.length);
    frames.push({
      desc,
      line,
      state: { stack: stack.map((f) => ({ ...f })), phase, result, depth: stack.length, maxDepth, log: [...log] },
    });
  };

  if (mode === "fatorial") {
    snap(`Vamos calcular fatorial(${n}). Cada chamada empilha um "quadro" (stack frame) na pilha de execução — exatamente a pilha LIFO da 1ª prova.`, "call", "ida");
    const go = (k: number): number => {
      const f: CallFrame = { id: id++, label: `fatorial(${k})`, status: "running", note: "" };
      stack.push(f);
      snap(`Empilha fatorial(${k}). Pilha com ${stack.length} chamada(s).`, "call", "ida");
      f.note = `${k} <= 1 ?`;
      if (k <= 1) {
        f.note = `${k} <= 1 → verdadeiro`;
        snap(`Testa o caso base: ${k} <= 1 é VERDADEIRO. Chegamos ao caso base — a recursão para de descer.`, "test", "ida");
        f.status = "returning";
        f.note = `retorna 1`;
        snap(`fatorial(${k}) retorna 1 diretamente. Agora começa a fase de VOLTA (desempilhamento).`, "base", "volta");
        stack.pop();
        log.push(`fatorial(${k}) = 1`);
        return 1;
      }
      f.note = `${k} <= 1 → falso`;
      snap(`Testa o caso base: ${k} <= 1 é FALSO. Então precisa do passo recursivo.`, "test", "ida");
      f.status = "waiting";
      f.note = `${k} * fatorial(${k - 1})`;
      snap(`fatorial(${k}) precisa de fatorial(${k - 1}) para terminar. Ela fica ESPERANDO na pilha e chama a si mesma com um problema menor.`, "rec", "ida");
      const sub = go(k - 1);
      f.status = "returning";
      f.note = `${k} * ${sub} = ${k * sub}`;
      snap(`fatorial(${k - 1}) devolveu ${sub}. fatorial(${k}) volta a executar e calcula ${k} * ${sub} = ${k * sub}.`, "rec", "volta");
      stack.pop();
      log.push(`fatorial(${k}) = ${k * sub}`);
      if (stack.length) snap(`Desempilha fatorial(${k}) e devolve ${k * sub} para quem chamou.`, "rec", "volta");
      return k * sub;
    };
    const r = go(n);
    snap(`Pilha vazia. Resultado final: fatorial(${n}) = ${r}. Maior profundidade da pilha: ${maxDepth} chamadas.`, "rec", "fim", String(r));
  }

  if (mode === "semBase") {
    snap(`Mesmo fatorial, mas SEM caso base. Vamos ver o que acontece com a pilha.`, "call", "ida");
    let k = n;
    while (stack.length < STACK_LIMIT) {
      if (stack.length) stack[stack.length - 1].status = "waiting";
      const f: CallFrame = { id: id++, label: `fatorial(${k})`, status: "running", note: `${k} * fatorial(${k - 1})` };
      stack.push(f);
      snap(
        k <= 0 ? `fatorial(${k}): n já passou de 1, mas nada manda parar. Continua chamando fatorial(${k - 1})...` : `Empilha fatorial(${k}) → chama fatorial(${k - 1}).`,
        "rec",
        "ida",
      );
      k--;
    }
    snap(
      `A pilha de execução tem tamanho limitado. Sem caso base, as chamadas nunca param, a memória da pilha acaba e o programa quebra: StackOverflowError (Java) / RecursionError (Python).`,
      "rec",
      "estouro",
      "Estouro de pilha",
    );
  }

  if (mode === "parImpar") {
    snap(`Recursividade INDIRETA: ehPar chama ehImpar, que chama ehPar... Vamos testar ehPar(${n}).`, "par", "ida");
    const go = (k: number, par: boolean): boolean => {
      const name = par ? "ehPar" : "ehImpar";
      const f: CallFrame = { id: id++, label: `${name}(${k})`, status: "running", note: "" };
      stack.push(f);
      snap(`Empilha ${name}(${k}).`, par ? "par" : "impar", "ida");
      if (k === 0) {
        const r = par;
        f.status = "returning";
        f.note = `n == 0 → retorna ${r}`;
        snap(`Caso base: n == 0, então ${name}(0) retorna ${r ? "true" : "false"}. Começa a volta.`, par ? "parBase" : "imparBase", "volta");
        stack.pop();
        log.push(`${name}(0) = ${r}`);
        return r;
      }
      f.status = "waiting";
      f.note = `${par ? "ehImpar" : "ehPar"}(${k - 1})`;
      snap(`n = ${k} não é 0. ${name}(${k}) chama a OUTRA função: ${par ? "ehImpar" : "ehPar"}(${k - 1}).`, par ? "parRec" : "imparRec", "ida");
      const r = go(k - 1, !par);
      f.status = "returning";
      f.note = `retorna ${r}`;
      snap(`${name}(${k}) recebe ${r} e repassa o mesmo valor para quem chamou.`, par ? "parRec" : "imparRec", "volta");
      stack.pop();
      log.push(`${name}(${k}) = ${r}`);
      return r;
    };
    const r = go(n, true);
    snap(`Resultado: ehPar(${n}) = ${r}. ${n} é ${r ? "par" : "ímpar"}.`, "par", "fim", String(r));
  }

  return frames;
}
