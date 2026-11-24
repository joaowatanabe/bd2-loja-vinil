// Loja de Discos de Vinil — Atividade Final BD2
// Ponto de entrada: menu no terminal com operações nos dois bancos.
import { pool } from "./db/postgres.js";
import { connectMongo, closeMongo } from "./db/mongo.js";
import { rl, perguntar, perguntarNumero } from "./cli/menu.js";
import { mensagemErroPg } from "./cli/erros.js";
import * as produtos from "./repositories/produtosRepository.js";
import * as pedidos from "./repositories/pedidosRepository.js";
import * as avaliacoes from "./repositories/avaliacoesRepository.js";
import * as integracao from "./services/integracaoService.js";

const opcoes = {
  1: ["Testar conexões (PostgreSQL + MongoDB)", testarConexoes],
  2: ["[SQL] Listar discos (JOIN com categoria)", async () => console.table(await produtos.listar())],
  3: ["[SQL] Cadastrar disco", cadastrarDisco],
  4: ["[SQL] Alterar preço/estoque de um disco", alterarDisco],
  5: ["[SQL] Excluir disco", excluirDisco],
  50: ["[SQL] Pedidos com cliente e total (JOIN 4 tabelas)", listarPedidos],
  6: ["[Mongo] Listar avaliações de um disco", listarAvaliacoes],
  7: ["[Mongo] Cadastrar avaliação", () => avaliacoes.inserir({})],
  8: ["[Mongo] Alterar avaliação", () => avaliacoes.atualizar()],
  9: ["[Mongo] Excluir avaliação", () => avaliacoes.excluir()],
  10: ["[Integração] Ficha completa do disco", () => integracao.fichaDoProduto()],
  11: ["[Integração] Catálogo ranqueado por nota", () => integracao.catalogoRanqueado()],
  12: ["[Demo] Tentar inserir avaliação inválida ($jsonSchema)", inserirInvalida],
};

async function testarConexoes() {
  const { rows } = await pool.query("SELECT version()");
  console.log("PostgreSQL OK:", rows[0].version.split(",")[0]);
  const db = await connectMongo();
  const info = await db.command({ buildInfo: 1 });
  console.log("MongoDB OK:", info.version);
}

// ---------- PostgreSQL: CRUD de discos ----------
async function cadastrarDisco() {
  console.table(await produtos.listarCategorias());
  const novo = await produtos.inserir({
    codigo: await perguntar("código (VIN-0000): "),
    titulo: await perguntar("título: "),
    artista: await perguntar("artista: "),
    ano: await perguntarNumero("ano: "),
    preco: await perguntarNumero("preço: "),
    estoque: await perguntarNumero("estoque: "),
    categoriaId: await perguntarNumero("id da categoria: "),
  });
  console.log("Disco cadastrado:", novo);
}

async function alterarDisco() {
  const id = await perguntarNumero("id do disco: ");
  const atual = await produtos.buscarPorId(id);
  if (!atual) return console.log(`Disco ${id} não encontrado.`);
  console.log(`Atual: ${atual.titulo} — R$ ${atual.preco}, estoque ${atual.estoque}`);
  const alterado = await produtos.atualizarPrecoEstoque(
    id, await perguntarNumero("novo preço: "), await perguntarNumero("novo estoque: ")
  );
  console.log("Atualizado:", alterado);
}

async function excluirDisco() {
  const id = await perguntarNumero("id do disco: ");
  const apagado = await produtos.excluir(id);
  console.log(apagado ? `Excluído: ${apagado.titulo}` : `Disco ${id} não encontrado.`);
}

async function listarPedidos() {
  console.table(await pedidos.listarComCliente());
  const id = await perguntar("ver itens de qual pedido? (Enter = nenhum): ");
  if (id) console.table(await pedidos.itensDoPedido(Number(id)));
}

async function listarAvaliacoes() {
  const id = Number(await perguntar("id do disco: "));
  console.table(await avaliacoes.listarPorProduto(id));
}

async function inserirInvalida() {
  const db = await connectMongo();
  try {
    // nota 7 (> maximum 5) e código fora do pattern ^VIN-[0-9]{4}$
    await db.collection("avaliacoes").insertOne({
      produto_id: 1, codigo_produto: "DISCO-1", cliente_email: "x@x.com",
      nota: 7, titulo: "Teste", criado_em: new Date(),
    });
  } catch (err) {
    console.log("Rejeitado pelo $jsonSchema:", err.message);
    console.dir(err.errInfo?.details, { depth: null });
  }
}

async function main() {
  while (true) {
    console.log("\n=== Loja de Vinil — PostgreSQL + MongoDB ===");
    for (const [n, [rotulo]] of Object.entries(opcoes)) console.log(`${n.padStart(2)}. ${rotulo}`);
    console.log(" 0. Sair");
    const escolha = await perguntar("> ");
    if (escolha === "0") break;
    const opcao = opcoes[escolha];
    if (!opcao) { console.log("Opção inválida."); continue; }
    try {
      await opcao[1]();
    } catch (err) {
      console.error("Erro:", mensagemErroPg(err) ?? err.message);
    }
  }
  rl.close();
  await pool.end();
  await closeMongo();
}

main();
