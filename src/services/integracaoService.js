// Parte 3 — Integração: funcionalidades que usam dados dos DOIS bancos.
// Ponte: produtos.id (PostgreSQL) = avaliacoes.produto_id (MongoDB).
import * as produtos from "../repositories/produtosRepository.js";
import * as avaliacoesRepo from "../repositories/avaliacoesRepository.js";

// Cadastrar avaliação: o Mongo não tem FK (Aula 12), então a APLICAÇÃO confere no
// PostgreSQL se o disco existe e copia de lá o codigo_produto.
export async function cadastrarAvaliacao({ produtoId, ...dados }) {
  const disco = await produtos.buscarPorId(produtoId); // [PostgreSQL]
  if (!disco) throw new Error(`Disco ${produtoId} não existe no PostgreSQL — o Mongo não tem FK, então a aplicação confere`);
  const id = await avaliacoesRepo.inserir({ // [MongoDB]
    produto_id: disco.id,
    codigo_produto: disco.codigo,
    ...dados,
  });
  return { id, disco };
}

// Ficha completa do disco: SQL (JOIN com categoria: preço, estoque) + Mongo ($group: média, total).
export async function fichaDoProduto(produtoId) {
  const produto = await produtos.buscarPorId(produtoId); // [PostgreSQL]
  if (!produto) return null;
  const resumo = await avaliacoesRepo.resumoPorProduto(produtoId); // [MongoDB] $match + $group
  const ultimas = await avaliacoesRepo.listarPorProduto(produtoId, 3); // [MongoDB] find (usa o índice)
  return { ...produto, media: resumo.media, totalAvaliacoes: resumo.total, ultimas };
}

// Catálogo ranqueado: todos os discos do SQL ordenados pela nota média calculada no Mongo.
// A "junção" entre os bancos é feita AQUI, na aplicação, com um Map por produto_id.
export async function catalogoRanqueado() {
  const discos = await produtos.listar(); // [PostgreSQL]
  const resumos = await avaliacoesRepo.resumoDeTodos(); // [MongoDB]
  const notaPorId = new Map(resumos.map((r) => [r._id, r]));
  return discos
    .map((d) => {
      const r = notaPorId.get(d.id);
      return {
        codigo: d.codigo, titulo: d.titulo, artista: d.artista, preco: d.preco, estoque: d.estoque,
        media: r ? Math.round(r.media * 10) / 10 : null,
        avaliacoes: r ? r.total : 0,
      };
    })
    .sort((a, b) => (b.media ?? -1) - (a.media ?? -1)); // sem avaliação vai para o fim
}
