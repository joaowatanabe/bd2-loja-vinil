// Menu do terminal (node:readline, sem dependência extra).
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export const rl = readline.createInterface({ input, output });

export async function perguntar(texto) {
  return (await rl.question(texto)).trim();
}
