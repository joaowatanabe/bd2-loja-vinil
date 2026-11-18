// Conexão com o MongoDB (driver oficial "mongodb").
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
let db;

export async function connectMongo() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGO_DB);
  }
  return db;
}

export async function avaliacoes() {
  return (await connectMongo()).collection("avaliacoes");
}

export function closeMongo() {
  return client.close();
}
