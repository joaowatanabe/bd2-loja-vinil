// Conexão com o PostgreSQL (driver "pg").
// Pool = conjunto de conexões reaproveitadas, em vez de abrir uma por consulta.
import pg from "pg";

export const pool = new pg.Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Sempre parâmetros ($1, $2...) em vez de concatenar strings: evita SQL injection.
export function query(sql, params = []) {
  return pool.query(sql, params);
}
