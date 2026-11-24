# Etapa 02 — Conexões e docker compose

> **Objetivo:** subir os dois bancos com um comando e fazer a aplicação Node conversar com eles. É o item 1 e 2 da apresentação: "acesso ao banco relacional" e "acesso ao MongoDB".

## 1. Por que docker compose?

Na sua máquina já existe um Postgres (Postgres.app, porta 5432). Para não misturar, o `docker-compose.yml` sobe **bancos limpos em container**:

| Serviço | Imagem | Porta no Mac → container |
|---|---|---|
| `postgres` | `postgres:17` | **5433** → 5432 |
| `mongo` | `mongo:8` | **27018** → 27017 |

A pasta `sql/` é montada em `/docker-entrypoint-initdb.d` do Postgres, e a `mongo/` no Mongo. Essas imagens rodam **sozinhas** os scripts dessa pasta **na primeira vez** que o container é criado. Ou seja: `docker compose up` já cria as tabelas, a coleção com `$jsonSchema`, o índice e os dados de exemplo.

O `healthcheck` pergunta ao banco "você está pronto?" (`pg_isready` / `db.adminCommand('ping')`). Com `docker compose up -d --wait` o comando só termina quando os dois estão prontos.

### Comandos do dia a dia (`package.json`)

```bash
colima start          # liga a "máquina" do docker no Mac (M1 8 GB: desligue depois!)
npm run db:up         # sobe Postgres + Mongo e espera ficarem saudáveis
npm run db:reset      # roda de novo sql/*.sql e mongo/01_init.js (volta os dados ao início)
npm start             # abre o menu
npm run db:down       # derruba os containers
colima stop           # desliga a VM e devolve a memória
```

`db:reset` é ótimo antes da apresentação: se você bagunçou os dados testando, volta tudo ao estado inicial.

## 2. Como a aplicação conecta

As senhas e portas ficam no `.env` (copiado de `.env.example`), e o Node lê com `node --env-file=.env` (nativo do Node 20+, sem a biblioteca `dotenv`).

**PostgreSQL** — [`src/db/postgres.js`](../../src/db/postgres.js):

```js
export const pool = new pg.Pool({ host, port, user, password, database });
export function query(sql, params = []) { return pool.query(sql, params); }
```

- **Pool** = um conjunto de conexões abertas que são reaproveitadas. Abrir conexão é caro; o pool evita abrir uma por consulta.
- `query(sql, params)` sempre recebe os valores **separados** do SQL (`$1`, `$2`…). Isso é o que evita **SQL injection** (etapa 03).

**MongoDB** — [`src/db/mongo.js`](../../src/db/mongo.js):

```js
const client = new MongoClient(process.env.MONGO_URI);
export async function connectMongo() { await client.connect(); return client.db("loja_vinil"); }
```

- O `MongoClient` também mantém um pool internamente. `connectMongo()` conecta só uma vez e guarda o `db`.
- Os comandos do driver são **os mesmos do mongosh** que você usou nas aulas: `insertOne`, `find`, `updateOne`, `deleteOne`, `aggregate`, `createIndex`.

**Teste de conexão** (menu **1**) — em [`src/index.js`](../../src/index.js): roda `SELECT version()` no Postgres e `buildInfo` no Mongo. Se aparecer as duas versões, os dois acessos estão funcionando.

## 3. O menu e a entrada de dados

[`src/cli/menu.js`](../../src/cli/menu.js) tem `perguntar(texto)` e `perguntarNumero(texto)`. Usamos um **iterador de linhas** do `readline`; isso permite tanto você digitar quanto mandar respostas prontas por pipe:

```bash
printf "1\n0\n" | npm start    # escolhe 1 (testar conexões) e depois 0 (sair)
```

Foi assim que geramos o arquivo `docs/evidencias.md`.

---

## Sua vez

**Exercício 1.** O professor diz: "a porta 5433 está ocupada no meu notebook, sobe o Postgres na 5440".

<details>
<summary>Resposta</summary>

1. `docker-compose.yml`: em `postgres.ports`, trocar `"5433:5432"` por `"5440:5432"` (só o lado esquerdo, que é a porta do Mac; o container continua na 5432).
2. `.env`: `PG_PORT=5440`.
3. `npm run db:down && npm run db:up`, depois menu **1**.
</details>

**Exercício 2.** "Mostra a versão do banco e também o nome do banco atual no teste de conexão."

<details>
<summary>Resposta</summary>

Em `testarConexoes()` no `src/index.js`, trocar a consulta por `SELECT version(), current_database()` e imprimir `rows[0].current_database`. No Mongo: `console.log("Banco Mongo:", db.databaseName)`.
</details>

## Perguntas de checagem

1. **O que acontece se eu rodar `docker compose up` de novo? Os scripts rodam outra vez?**
   Não: o `initdb.d` só roda quando o banco é criado pela primeira vez. Para reaplicar, use `npm run db:reset` (ou `docker compose down` e `up`, já que não há volume persistente).
2. **Por que usar um pool de conexões?**
   Porque abrir conexão é lento; o pool mantém algumas abertas e reaproveita entre as consultas.
3. **Onde ficam usuário e senha do banco? Por que não no código?**
   No `.env` (que está no `.gitignore`). Assim a senha não vai para o GitHub e cada máquina usa a sua configuração; o `.env.example` mostra o formato.
