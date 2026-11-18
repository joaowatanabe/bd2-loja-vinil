// Atividade Final BD2 — Loja de Discos de Vinil
// MongoDB: coleção "avaliacoes" com validação $jsonSchema, índice e dados de exemplo.
// Executar: mongosh "mongodb://localhost:27017/loja_vinil" mongo/01_init.js

db = db.getSiblingDB("loja_vinil");

db.avaliacoes.drop();

db.createCollection("avaliacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Avaliação de um disco",
      required: ["produto_id", "codigo_produto", "cliente_email", "nota", "titulo", "criado_em"],
      properties: {
        produto_id: {
          bsonType: "int",
          minimum: 1,
          description: "id do produto na tabela produtos (PostgreSQL) — ponte da integração"
        },
        codigo_produto: {
          bsonType: "string",
          pattern: "^VIN-[0-9]{4}$",
          description: "código do disco no formato VIN-0000"
        },
        cliente_email: {
          bsonType: "string",
          pattern: "^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$",
          description: "e-mail de quem avaliou"
        },
        nota: {
          bsonType: "int",
          minimum: 1,
          maximum: 5,
          description: "nota inteira de 1 a 5"
        },
        titulo: {
          bsonType: "string",
          minLength: 3,
          maxLength: 80
        },
        comentario: {
          bsonType: "string",
          maxLength: 1000
        },
        sentimento: {
          enum: ["positivo", "neutro", "negativo"]
        },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" }
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
  validationLevel: "strict",
  validationAction: "error"
});

// Índice no campo usado como chave de busca da integração:
// toda "Ficha do produto" busca as avaliações por produto_id, então sem índice seria COLLSCAN.
db.avaliacoes.createIndex({ produto_id: 1 }, { name: "idx_avaliacoes_produto_id" });

db.avaliacoes.insertMany([
  {
    produto_id: NumberInt(1), codigo_produto: "VIN-0001", cliente_email: "ana@email.com",
    nota: NumberInt(5), titulo: "Prensagem impecável", comentario: "Som limpo, capa perfeita.",
    sentimento: "positivo", tags: ["prensagem", "capa"], estado_midia: "novo", criado_em: new Date()
  },
  {
    produto_id: NumberInt(1), codigo_produto: "VIN-0001", cliente_email: "bruno@email.com",
    nota: NumberInt(4), titulo: "Muito bom", sentimento: "positivo", criado_em: new Date()
  },
  {
    produto_id: NumberInt(3), codigo_produto: "VIN-0003", cliente_email: "carla@email.com",
    nota: NumberInt(3), titulo: "Chiado no lado B", comentario: "Leve chiado na segunda faixa.",
    sentimento: "neutro", estado_midia: "seminovo", criado_em: new Date()
  }
]);

print("Coleção avaliacoes criada com $jsonSchema, índice idx_avaliacoes_produto_id e 3 documentos.");
