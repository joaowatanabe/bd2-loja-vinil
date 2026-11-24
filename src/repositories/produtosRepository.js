// CRUD da tabela produtos (PostgreSQL) + consultas com JOIN.
// Regra da casa: SQL puro e SEMPRE parametrizado ($1, $2...) — nunca concatenar valores no texto.
import { query } from "../db/postgres.js";

// READ (lista) — JOIN: cada disco com o NOME da sua categoria.
export async function listar() {
  const { rows } = await query(`
    SELECT p.id, p.codigo, p.titulo, p.artista, p.preco, p.estoque, c.nome AS categoria
      FROM produtos p
      JOIN categorias c ON c.id = p.categoria_id
     ORDER BY p.id
  `);
  return rows;
}

// READ (um) — mesmo JOIN, filtrando pelo id. Usado também pela integração.
export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT p.id, p.codigo, p.titulo, p.artista, p.ano, p.preco, p.estoque, c.nome AS categoria
       FROM produtos p
       JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = $1`,
    [id]
  );
  return rows[0] ?? null; // null = não existe
}

// CREATE — RETURNING * devolve a linha criada (com o id gerado pelo SERIAL).
export async function inserir({ codigo, titulo, artista, ano, preco, estoque, categoriaId }) {
  const { rows } = await query(
    `INSERT INTO produtos (codigo, titulo, artista, ano, preco, estoque, categoria_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [codigo, titulo, artista, ano, preco, estoque, categoriaId]
  );
  return rows[0];
}

// UPDATE — muda preço e estoque. Os CHECK do schema recusam valores negativos.
export async function atualizarPrecoEstoque(id, preco, estoque) {
  const { rows } = await query(
    `UPDATE produtos SET preco = $1, estoque = $2 WHERE id = $3 RETURNING *`,
    [preco, estoque, id]
  );
  return rows[0] ?? null;
}

// DELETE — a FK de itens_pedido (ON DELETE RESTRICT) impede apagar disco já vendido.
export async function excluir(id) {
  const { rows } = await query(`DELETE FROM produtos WHERE id = $1 RETURNING id, titulo`, [id]);
  return rows[0] ?? null;
}

// Apoio ao cadastro: mostra as categorias para escolher a FK.
export async function listarCategorias() {
  const { rows } = await query(`SELECT id, nome FROM categorias ORDER BY id`);
  return rows;
}
