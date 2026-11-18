// Pedidos de clientes (PostgreSQL): JOIN entre clientes, pedidos, itens_pedido e produtos.
import { query } from "../db/postgres.js";

export async function listarComCliente() {
  // TODO: JOIN pedidos ↔ clientes ↔ itens_pedido ↔ produtos, com SUM(quantidade * preco_unitario) AS total
  throw new Error("listarComCliente: não implementado");
}
