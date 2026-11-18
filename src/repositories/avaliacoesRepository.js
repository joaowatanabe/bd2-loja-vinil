// CRUD da coleção avaliacoes (MongoDB).
import { avaliacoes } from "../db/mongo.js";

export async function listarPorProduto(produtoId) {
  const col = await avaliacoes();
  // Usa o índice idx_avaliacoes_produto_id (confira com .explain("executionStats") → IXSCAN).
  return col.find({ produto_id: produtoId }).sort({ criado_em: -1 }).toArray();
}

export async function inserir(doc) {
  // TODO: insertOne({ ...doc, criado_em: new Date() }) — o $jsonSchema valida no servidor
  throw new Error("inserir: não implementado");
}

export async function atualizar(id, campos) {
  // TODO: updateOne({ _id: new ObjectId(id) }, { $set: campos })
  throw new Error("atualizar: não implementado");
}

export async function excluir(id) {
  // TODO: deleteOne({ _id: new ObjectId(id) })
  throw new Error("excluir: não implementado");
}

export async function resumoPorProduto(produtoId) {
  // TODO: aggregate([{ $match: { produto_id } }, { $group: { _id: "$produto_id", media: { $avg: "$nota" }, total: { $sum: 1 } } }])
  throw new Error("resumoPorProduto: não implementado");
}
