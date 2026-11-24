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
