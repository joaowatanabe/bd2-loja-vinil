// Pedidos (PostgreSQL): consultas com JOIN entre 4 tabelas.
import { query } from "../db/postgres.js";

// Cada pedido com o nome do cliente, quantos itens tem e o valor total.
// JOIN liga as tabelas pelas FKs; GROUP BY junta os itens de um mesmo pedido numa linha só.
export async function listarComCliente() {
  const { rows } = await query(`
    SELECT pe.id AS pedido, c.nome AS cliente, pe.status,
           COUNT(*) AS itens,
           SUM(i.quantidade * i.preco_unitario) AS total
      FROM pedidos pe
      JOIN clientes c     ON c.id = pe.cliente_id
      JOIN itens_pedido i ON i.pedido_id = pe.id
      JOIN produtos pr    ON pr.id = i.produto_id
     GROUP BY pe.id, c.nome, pe.status
     ORDER BY pe.id
  `);
  return rows;
}

// Os discos de UM pedido (itens_pedido JOIN produtos), filtrando por $1.
export async function itensDoPedido(pedidoId) {
  const { rows } = await query(
    `SELECT pr.codigo, pr.titulo, i.quantidade, i.preco_unitario,
            i.quantidade * i.preco_unitario AS subtotal
       FROM itens_pedido i
       JOIN produtos pr ON pr.id = i.produto_id
      WHERE i.pedido_id = $1`,
    [pedidoId]
  );
  return rows;
}
