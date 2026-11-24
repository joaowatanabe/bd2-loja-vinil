// Entrada de dados no terminal (node:readline, sem dependência extra).
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

export const rl = readline.createInterface({ input, output });

// Lemos as linhas com um iterador: assim funciona digitando E também com entrada
// por pipe (printf "1\n0\n" | npm start), que usamos para gerar as evidências.
const linhas = rl[Symbol.asyncIterator]();

export async function perguntar(texto) {
  output.write(texto);
  const { value, done } = await linhas.next();
  if (done) return "0"; // acabou a entrada → "0" = sair do menu
  if (!input.isTTY) output.write(value + "\n"); // ecoa o que veio do pipe, para o log
  return value.trim();
}

export async function perguntarNumero(texto) {
  const n = Number(await perguntar(texto));
  if (Number.isNaN(n)) throw new Error("Valor numérico inválido");
  return n;
}
