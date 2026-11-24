// Atividade Final BD2 — Loja de Discos de Vinil
// MongoDB: coleção "avaliacoes" com validação $jsonSchema, índice e dados de exemplo.
// Executar: mongosh "mongodb://localhost:27018/loja_vinil" mongo/01_init.js   (ou: npm run db:reset)

db = db.getSiblingDB("loja_vinil");

db.avaliacoes.drop(); // recria do zero (o script pode ser rodado várias vezes)

db.createCollection("avaliacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object", // o documento precisa ser um objeto
      title: "Avaliação de um disco",
      // required: sem QUALQUER um destes campos o insert é recusado
      required: ["produto_id", "codigo_produto", "cliente_email", "nota", "titulo", "criado_em"],
      properties: {
        produto_id: {
          bsonType: "int", // inteiro (o driver Node grava inteiros pequenos como int32)
          minimum: 1,
          description: "id do produto na tabela produtos (PostgreSQL) — ponte da integração"
        },
        codigo_produto: {
          bsonType: "string",
          pattern: "^VIN-[0-9]{4}$", // regex: começa com VIN-, depois exatamente 4 dígitos, e acaba
          description: "código do disco no formato VIN-0000"
        },
        cliente_email: {
          bsonType: "string",
          pattern: "^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$", // regex de e-mail (\\ = barra escapada dentro da string)
          description: "e-mail de quem avaliou"
        },
        nota: {
          bsonType: "int",
          minimum: 1, // regra de faixa: nota de 1...
          maximum: 5, // ...até 5 (inclusive)
          description: "nota inteira de 1 a 5"
        },
        titulo: {
          bsonType: "string",
          minLength: 3, // pelo menos 3 caracteres
          maxLength: 80 // no máximo 80
        },
        comentario: {
          bsonType: "string", // opcional (não está no required), mas se vier tem que ser texto
          maxLength: 1000
        },
        sentimento: {
          enum: ["positivo", "neutro", "negativo"] // lista fechada de valores
        },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" } // cada item do array precisa ser texto
        },
        estado_midia: {
          enum: ["novo", "seminovo", "usado"],
          description: "estado do disco recebido"
        },
        criado_em: {
          bsonType: "date"
        }
      }
    }
  },
  validationLevel: "strict", // valida TODOS os inserts e updates
  validationAction: "error"  // documento inválido é RECUSADO (com "warn" só iria pro log)
});

// Índice no campo usado como chave de busca da integração:
// toda "Ficha do disco" busca as avaliações por produto_id, então sem índice seria COLLSCAN.
db.avaliacoes.createIndex({ produto_id: 1 }, { name: "idx_avaliacoes_produto_id" });

// Dados de exemplo (todos válidos). produto_id/codigo_produto batem com sql/02_seed.sql.
const av = (produto, nota, email, titulo, extra = {}) => ({
  produto_id: NumberInt(produto),
  codigo_produto: "VIN-000" + produto,
  cliente_email: email,
  nota: NumberInt(nota),
  titulo,
  ...extra,
  criado_em: new Date()
});

db.avaliacoes.insertMany([
  av(1, 5, "ana@email.com", "Prensagem impecável", { comentario: "Som limpo, capa perfeita.", sentimento: "positivo", tags: ["prensagem", "capa"], estado_midia: "novo" }),
  av(1, 4, "bruno@email.com", "Muito bom", { sentimento: "positivo" }),
  av(1, 5, "carla@email.com", "Clássico absoluto", { tags: ["classico"] }),
  av(2, 5, "ana@email.com", "Obra-prima", { comentario: "Melhor disco da MPB.", sentimento: "positivo" }),
  av(2, 4, "diego@email.com", "Capa linda", { estado_midia: "seminovo" }),
  av(3, 3, "carla@email.com", "Chiado no lado B", { comentario: "Leve chiado na segunda faixa.", sentimento: "neutro", estado_midia: "seminovo" }),
  av(3, 5, "bruno@email.com", "Jazz perfeito", { tags: ["jazz", "audiofilo"] }),
  av(3, 4, "elisa@email.com", "Ótima mixagem"),
  av(4, 2, "diego@email.com", "Veio empenado", { comentario: "Disco chegou empenado.", sentimento: "negativo", estado_midia: "usado" }),
  av(4, 4, "ana@email.com", "Dançante"),
  av(5, 5, "elisa@email.com", "Brasil raiz", { sentimento: "positivo", tags: ["mpb"] }),
  av(5, 4, "carla@email.com", "Muito bonito")
]);

print("Coleção avaliacoes criada com $jsonSchema, índice idx_avaliacoes_produto_id e " + db.avaliacoes.countDocuments() + " documentos.");
