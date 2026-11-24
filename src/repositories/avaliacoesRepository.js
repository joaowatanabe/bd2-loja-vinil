// CRUD da coleção avaliacoes (MongoDB) + agregações.
// Os comandos são os mesmos do mongosh: insertOne, find, updateOne, deleteOne, aggregate.
import { ObjectId } from "mongodb";
import { avaliacoes } from "../db/mongo.js";

// Converte o texto digitado no _id do Mongo (ObjectId = 24 caracteres hexadecimais).
function paraObjectId(id) {
  if (!ObjectId.isValid(id)) throw new Error("id inválido: precisa ser um ObjectId de 24 caracteres hexadecimais");
  return new ObjectId(id);
}

// READ — avaliações de um disco. Usa o índice idx_avaliacoes_produto_id (etapa 07).
export async function listarPorProduto(produtoId, limite = 0) {
  const col = await avaliacoes();
  return col.find({ produto_id: produtoId }).sort({ criado_em: -1 }).limit(limite).toArray();
}

// READ com regex (Aula 13): título contendo o trecho, sem diferenciar maiúsculas ("i").
export async function buscarPorTitulo(trecho) {
  const col = await avaliacoes();
  return col.find({ titulo: { $regex: trecho, $options: "i" } }).toArray();
}

// CREATE — o $jsonSchema valida NO SERVIDOR; se o documento for inválido, dá erro 121.
export async function inserir(doc) {
  const col = await avaliacoes();
  const { insertedId } = await col.insertOne({ ...doc, criado_em: new Date() });
  return insertedId;
}

// UPDATE — $set muda só os campos informados. O $jsonSchema também vale no update.
export async function atualizar(id, campos) {
  const col = await avaliacoes();
  const { matchedCount, modifiedCount } = await col.updateOne({ _id: paraObjectId(id) }, { $set: campos });
  return { matchedCount, modifiedCount };
}

// DELETE — apaga um documento pelo _id.
export async function excluir(id) {
  const col = await avaliacoes();
  const { deletedCount } = await col.deleteOne({ _id: paraObjectId(id) });
  return deletedCount;
}

// Média e total de UM disco: $match (WHERE) + $group (GROUP BY com AVG/COUNT) — Aula 15.
export async function resumoPorProduto(produtoId) {
  const col = await avaliacoes();
  const [r] = await col.aggregate([
    { $match: { produto_id: produtoId } },
    { $group: { _id: "$produto_id", media: { $avg: "$nota" }, total: { $sum: 1 } } },
  ]).toArray();
  return r ? { media: Math.round(r.media * 10) / 10, total: r.total } : { media: null, total: 0 };
}

// Média e total de TODOS os discos (um grupo por produto_id) — usado no ranking.
export async function resumoDeTodos() {
  const col = await avaliacoes();
  return col.aggregate([
    { $group: { _id: "$produto_id", media: { $avg: "$nota" }, total: { $sum: 1 } } },
  ]).toArray();
}
