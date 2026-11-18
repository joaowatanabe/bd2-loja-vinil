// CRUD da tabela produtos (PostgreSQL) + consulta com JOIN.
import { query } from "../db/postgres.js";

// Consulta com JOIN: produto + nome da categoria.
export async function listar() {
  const { rows } = await query(`
    SELECT p.id, p.codigo, p.titulo, p.artista, p.preco, p.estoque, c.nome AS categoria
      FROM produtos p
      JOIN categorias c ON c.id = p.categoria_id
     ORDER BY p.id
  `);
  return rows;
}

export async function buscarPorId(id) {
  // TODO: SELECT com JOIN filtrando por p.id = $1
  throw new Error("buscarPorId: não implementado");
}

export async function inserir({ codigo, titulo, artista, ano, preco, estoque, categoriaId }) {
  // TODO: INSERT ... RETURNING *
  throw new Error("inserir: não implementado");
}

export async function atualizarPreco(id, novoPreco) {
  // TODO: UPDATE produtos SET preco = $1 WHERE id = $2
  throw new Error("atualizarPreco: não implementado");
}

export async function excluir(id) {
  // TODO: DELETE FROM produtos WHERE id = $1 (a FK em itens_pedido impede apagar disco já vendido)
  throw new Error("excluir: não implementado");
}
