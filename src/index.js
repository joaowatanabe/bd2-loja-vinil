// Loja de Discos de Vinil — Atividade Final BD2
// Ponto de entrada: menu no terminal com operações nos dois bancos.
// Cada opção chama uma função curta; quem fala com os bancos são os repositories/services.
import { pool } from "./db/postgres.js";
import { connectMongo, closeMongo } from "./db/mongo.js";
import { rl, perguntar, perguntarNumero } from "./cli/menu.js";
import { mensagemErroPg, formatarErroValidacao, REGEX_CODIGO } from "./cli/erros.js";
import * as produtos from "./repositories/produtosRepository.js";
import * as pedidos from "./repositories/pedidosRepository.js";
import * as avaliacoes from "./repositories/avaliacoesRepository.js";
import * as integracao from "./services/integracaoService.js";

// ---------- Conexões ----------
async function testarConexoes() {
  const { rows } = await pool.query("SELECT version()");
  console.log("PostgreSQL OK:", rows[0].version.split(",")[0]);
  const db = await connectMongo();
  const info = await db.command({ buildInfo: 1 });
  console.log("MongoDB OK:", info.version);
}

// ---------- PostgreSQL: CRUD de discos + JOIN ----------
async function listarDiscos() {
  console.table(await produtos.listar());
}

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

// ---------- MongoDB: CRUD de avaliações ----------
// Deixa a avaliação "enxuta" para caber na tabela do terminal.
function resumir(a) {
  return { _id: String(a._id), produto_id: a.produto_id, nota: a.nota, titulo: a.titulo, cliente_email: a.cliente_email, sentimento: a.sentimento ?? "-" };
}

async function listarAvaliacoes() {
  const id = await perguntarNumero("id do disco: ");
  console.table((await avaliacoes.listarPorProduto(id)).map(resumir));
}

async function buscarAvaliacoesPorTitulo() {
  const trecho = await perguntar("trecho do título (regex, ex.: ^mui): ");
  console.table((await avaliacoes.buscarPorTitulo(trecho)).map(resumir));
}

async function cadastrarAvaliacao() {
  const dados = {
    produtoId: await perguntarNumero("id do disco (PostgreSQL): "),
    cliente_email: await perguntar("e-mail: "),
    nota: await perguntarNumero("nota (1 a 5): "),
    titulo: await perguntar("título: "),
  };
  const comentario = await perguntar("comentário (Enter = sem): ");
  if (comentario) dados.comentario = comentario; // campo opcional: só grava se tiver
  const sentimento = await perguntar("sentimento positivo/neutro/negativo (Enter = sem): ");
  if (sentimento) dados.sentimento = sentimento;
  const { id, disco } = await integracao.cadastrarAvaliacao(dados);
  console.log(`Avaliação ${id} gravada para "${disco.titulo}" (${disco.codigo}).`);
}

async function alterarAvaliacao() {
  const id = await perguntar("_id da avaliação: ");
  const campos = {};
  const nota = await perguntar("nova nota (Enter = mantém): ");
  if (nota) campos.nota = Number(nota);
  const titulo = await perguntar("novo título (Enter = mantém): ");
  if (titulo) campos.titulo = titulo;
  const r = await avaliacoes.atualizar(id, campos);
  console.log(r.matchedCount ? `Alterada (${r.modifiedCount} documento modificado).` : "Avaliação não encontrada.");
}

async function excluirAvaliacao() {
  const id = await perguntar("_id da avaliação: ");
  const apagados = await avaliacoes.excluir(id);
  console.log(apagados ? "Avaliação excluída." : "Avaliação não encontrada.");
}

async function mostrarIndiceExplain() {
  console.log("Índices da coleção avaliacoes:");
  for (const i of await avaliacoes.listarIndices()) console.log(`  ${i.name}: ${JSON.stringify(i.key)}`);
  const id = await perguntarNumero("id do disco para o find({ produto_id }): ");
  const r = await avaliacoes.explicarBusca(id);
  console.table({ "com índice": r.comIndice, "sem índice (forçado)": r.semIndice });
  console.log("Por quê: toda integração busca avaliações por produto_id; com o índice o Mongo");
  console.log("lê só os documentos daquele disco (IXSCAN) em vez da coleção inteira (COLLSCAN).");
}

// ---------- Integração (os dois bancos) ----------
async function mostrarFicha() {
  const f = await integracao.fichaDoProduto(await perguntarNumero("id do disco: "));
  if (!f) return console.log("Disco não encontrado no PostgreSQL.");
  const estrelas = f.media ? "★".repeat(Math.round(f.media)) + "☆".repeat(5 - Math.round(f.media)) : "";
  console.log(`\n💿 ${f.titulo} — ${f.artista} (${f.ano})`);
  console.log(`   [PostgreSQL] código ${f.codigo} · ${f.categoria} · R$ ${f.preco} · estoque ${f.estoque}`);
  console.log(`   [MongoDB]    nota média ${f.media ?? "-"} ${estrelas} · ${f.totalAvaliacoes} avaliação(ões)`);
  for (const a of f.ultimas) console.log(`   [MongoDB]    "${a.titulo}" (${a.nota}/5) — ${a.cliente_email}`);
}

async function mostrarRanking() {
  console.table(await integracao.catalogoRanqueado());
}

// ---------- Demonstrações: $jsonSchema e regex ----------
async function inserirAvaliacaoInvalida() {
  // Documento com várias regras quebradas de propósito (e SEM cliente_email, que é required).
  const doc = {
    produto_id: 1,
    codigo_produto: "DISCO-1", // pattern ^VIN-[0-9]{4}$
    nota: 7,                   // maximum 5
    titulo: "Oi",              // minLength 3
    sentimento: "furioso",     // enum
  };
  console.log("Tentando inserir:", doc);
  await avaliacoes.inserir(doc); // vai lançar o erro 121, tratado no main()
  console.log("(não deveria chegar aqui: o documento foi aceito!)");
}

async function testarRegexCodigo() {
  const texto = await perguntar("texto para testar contra /^VIN-[0-9]{4}$/: ");
  console.log(REGEX_CODIGO.test(texto) ? `"${texto}" CASA com o padrão ✓` : `"${texto}" NÃO casa ✗`);
}

// ---------- Menu ----------
const opcoes = {
  1: ["Testar conexões (PostgreSQL + MongoDB)", testarConexoes, "Conexões"],
  2: ["Listar discos (JOIN com categoria)", listarDiscos, "PostgreSQL"],
  3: ["Cadastrar disco", cadastrarDisco],
  4: ["Alterar preço/estoque de um disco", alterarDisco],
  5: ["Excluir disco", excluirDisco],
  6: ["Pedidos com cliente e total (JOIN 4 tabelas)", listarPedidos],
  7: ["Listar avaliações de um disco", listarAvaliacoes, "MongoDB"],
  8: ["Buscar avaliações por título (regex)", buscarAvaliacoesPorTitulo],
  9: ["Cadastrar avaliação", cadastrarAvaliacao],
  10: ["Alterar avaliação", alterarAvaliacao],
  11: ["Excluir avaliação", excluirAvaliacao],
  12: ["Índices e explain (IXSCAN × COLLSCAN)", mostrarIndiceExplain],
  13: ["Ficha completa do disco (SQL + Mongo)", mostrarFicha, "Integração"],
  14: ["Catálogo ranqueado por nota (SQL + Mongo)", mostrarRanking],
  15: ["Tentar inserir avaliação INVÁLIDA ($jsonSchema)", inserirAvaliacaoInvalida, "Demonstrações"],
  16: ["Testar a regex do código (VIN-0000)", testarRegexCodigo],
};

async function main() {
  while (true) {
    console.log("\n=== Loja de Vinil — PostgreSQL + MongoDB ===");
    for (const [n, [rotulo, , secao]] of Object.entries(opcoes)) {
      if (secao) console.log(`-- ${secao} --`);
      console.log(`${n.padStart(2)}. ${rotulo}`);
    }
    console.log(" 0. Sair");
    const escolha = await perguntar("> ");
    if (escolha === "0") break;
    const opcao = opcoes[escolha];
    if (!opcao) { console.log("Opção inválida."); continue; }
    try {
      await opcao[1]();
    } catch (err) {
      if (err.code === 121) { // MongoDB: Document failed validation ($jsonSchema)
        console.error("MongoDB recusou: Document failed validation");
        for (const linha of formatarErroValidacao(err)) console.error("  " + linha);
        continue;
      }
      console.error("Erro:", mensagemErroPg(err) ?? err.message);
    }
  }
  rl.close();
  await pool.end();
  await closeMongo();
}

main();
