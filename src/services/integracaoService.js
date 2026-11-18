// Parte 3 — Integração: uma funcionalidade que usa dados dos DOIS bancos.
// Ponte: produtos.id (PostgreSQL) = avaliacoes.produto_id (MongoDB).
import * as produtos from "../repositories/produtosRepository.js";
import * as avaliacoesRepo from "../repositories/avaliacoesRepository.js";

// Ficha completa do disco: dados do SQL (preço, estoque, categoria) + média e avaliações do Mongo.
export async function fichaDoProduto(produtoId) {
  // TODO:
  // 1. const produto = await produtos.buscarPorId(produtoId)
  // 2. const resumo  = await avaliacoesRepo.resumoPorProduto(produtoId)
  // 3. const ultimas = await avaliacoesRepo.listarPorProduto(produtoId)
  // 4. return { ...produto, mediaNotas, totalAvaliacoes, ultimas }
  throw new Error("fichaDoProduto: não implementado");
}

// Catálogo ranqueado: todos os discos ordenados pela nota média.
export async function catalogoRanqueado() {
  // TODO: listar produtos no SQL, buscar médias no Mongo ($group por produto_id) e juntar na aplicação
  throw new Error("catalogoRanqueado: não implementado");
}
