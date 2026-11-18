# 💿 Loja de Discos de Vinil: PostgreSQL + MongoDB

Atividade Final de **Banco de Dados II**, ADS SENAC Pelotas, 3º semestre. Entrega e apresentação na **Aula 18, 02/12/2026**.

Aplicação de terminal (CLI) de uma loja de discos de vinil. Ela usa **dois bancos ao mesmo tempo**: o **PostgreSQL** guarda o catálogo, o estoque, os clientes e os pedidos, e o **MongoDB** guarda as avaliações dos discos. A integração junta os dois numa ficha completa do disco: preço e estoque vêm do SQL, nota média e opiniões vêm do Mongo.

> Enunciado oficial: <https://github.com/gladimircc/bd2>

---

## 👥 Integrantes

| Nome | GitHub |
|---|---|
| João Vicente Watanabe | [@joaowatanabe](https://github.com/joaowatanabe) |
| _(integrante 2)_ | |
| _(integrante 3)_ | |
| _(integrante 4)_ | |

## 📋 Resumo do projeto

| Item | Escolha |
|---|---|
| **Tema** | Loja de discos de vinil (catálogo, pedidos e avaliações) |
| **Linguagem** | JavaScript (Node.js 20+, ES Modules) |
| **SGBD relacional** | PostgreSQL 17 |
| **Banco não relacional** | MongoDB 8 |
| **Drivers** | [`pg`](https://node-postgres.com/) e [`mongodb`](https://www.mongodb.com/docs/drivers/node/) (oficiais, sem ORM) |
| **Interface** | Menu no terminal (`node:readline`) |

---

## 🗂️ Estrutura

```text
bd2-loja-vinil/
├── README.md
├── package.json
├── .env.example               # modelo das variáveis de conexão
├── docker-compose.yml         # opcional: sobe Postgres + Mongo em container
├── sql/
│   ├── 01_schema.sql          # CREATE TABLE: 5 tabelas, PK, FK e CHECK
│   └── 02_seed.sql            # dados de exemplo
├── mongo/
│   └── 01_init.js             # coleção avaliacoes + $jsonSchema + índice + seed
├── docs/
│   └── modelo-er.md           # modelo ER (Mermaid)
└── src/
    ├── index.js               # menu principal
    ├── cli/menu.js            # helpers de entrada no terminal
    ├── db/
    │   ├── postgres.js        # pool de conexão PostgreSQL
    │   └── mongo.js           # cliente MongoDB
    ├── repositories/
    │   ├── produtosRepository.js    # CRUD + JOIN (SQL)
    │   ├── pedidosRepository.js     # JOIN pedidos ↔ clientes ↔ itens (SQL)
    │   └── avaliacoesRepository.js  # CRUD + aggregate (Mongo)
    └── services/
        └── integracaoService.js     # funcionalidades que usam os DOIS bancos
```

O código fica em camadas: `db/` só conecta, `repositories/` só conversa com um banco cada, e `services/` junta os dois. Assim a regra da integração não se mistura com SQL nem com a sintaxe do Mongo, e fica fácil mexer numa consulta ao vivo na apresentação.

---

## ▶️ Como executar

### Pré-requisitos

- Node.js **20+** (o projeto usa `--env-file`, nativo do Node)
- PostgreSQL **e** MongoDB rodando: local ou pelo `docker-compose.yml`
- `psql` e `mongosh` no PATH (para rodar os scripts)

### 1. Instalar as dependências

```bash
git clone git@github.com:joaowatanabe/bd2-loja-vinil.git
cd bd2-loja-vinil
npm install
cp .env.example .env      # ajuste usuário, senha e portas
```

### 2a. Bancos locais (instalados na máquina)

```bash
# PostgreSQL
createdb loja_vinil
psql -d loja_vinil -f sql/01_schema.sql -f sql/02_seed.sql

# MongoDB (no macOS com Homebrew: brew services run mongodb-community@8.0)
mongosh "mongodb://localhost:27017/loja_vinil" mongo/01_init.js
```

### 2b. Ou via Docker / Colima

```bash
docker compose up -d
```

Os scripts de `sql/` e `mongo/` rodam sozinhos na primeira subida. As portas do host são **5433** (Postgres) e **27018** (Mongo), para não brigar com bancos locais. Ajuste o `.env`:

```env
PG_PORT=5433
PG_USER=postgres
PG_PASSWORD=postgres
MONGO_URI=mongodb://localhost:27018
```

### 3. Rodar a aplicação

```bash
npm start
```

A opção **1 · Testar conexões** confirma que os dois bancos respondem.

---

## 🐘 Parte 1: banco relacional (PostgreSQL)

Modelo ER completo em [`docs/modelo-er.md`](docs/modelo-er.md).

| Tabela | Papel | Chaves |
|---|---|---|
| `categorias` | gênero musical (Rock, MPB...) | PK `id` |
| `produtos` | disco: código, preço, estoque | PK `id`, FK `categoria_id → categorias` |
| `clientes` | quem compra | PK `id`, `email` único |
| `pedidos` | compra de um cliente | PK `id`, FK `cliente_id → clientes` |
| `itens_pedido` | discos de cada pedido (N:N) | PK composta, FKs para `pedidos` e `produtos` |

- **CRUD:** cadastrar, listar, alterar preço e excluir discos (menu 2 a 5).
- **JOIN:** listagem de discos com o nome da categoria (`produtos JOIN categorias`) e pedidos com cliente, itens e total (`pedidos JOIN clientes JOIN itens_pedido JOIN produtos`).
- **Integridade:** a FK com `ON DELETE RESTRICT` impede excluir um disco que já foi vendido, e os `CHECK` impedem preço ou estoque negativos.

## 🍃 Parte 2: MongoDB

Coleção **`avaliacoes`**, criada em [`mongo/01_init.js`](mongo/01_init.js).

| Requisito | Onde está no `$jsonSchema` |
|---|---|
| Campos obrigatórios | `required: [produto_id, codigo_produto, cliente_email, nota, titulo, criado_em]` |
| Validação de tipos | `bsonType` em todos os campos (`int`, `string`, `array`, `date`) |
| `minimum` / `maximum` | `nota` entre **1 e 5** |
| `minLength` / `maxLength` | `titulo` entre 3 e 80 caracteres, `comentario` até 1000 |
| `enum` | `sentimento` ∈ {positivo, neutro, negativo}, `estado_midia` ∈ {novo, seminovo, usado} |
| `pattern` (regex) | `codigo_produto`: `^VIN-[0-9]{4}$` · `cliente_email`: `^[\w.+-]+@[\w-]+(\.[\w-]+)+$` |
| Índice | `idx_avaliacoes_produto_id` em `{ produto_id: 1 }` |

### Por que o índice está em `produto_id`?

Toda funcionalidade de integração começa com "me dê as avaliações do disco X", ou seja, `find({ produto_id })` ou `$match: { produto_id }`. Sem índice, o MongoDB lê a coleção inteira (**COLLSCAN**). Com o índice, ele vai direto aos documentos daquele disco (**IXSCAN**). Para conferir:

```js
db.avaliacoes.find({ produto_id: 1 }).explain("executionStats")
// winningPlan → IXSCAN · totalDocsExamined = só as avaliações do disco 1
```

### Regex explicada: `^VIN-[0-9]{4}$`

`^` marca o início, `VIN-` é literal, `[0-9]{4}` são exatamente 4 dígitos e `$` marca o fim. Aceita `VIN-0001` e recusa `vin-1`, `VIN-12345` e `DISCO-1`.

### Tentativa de inserção inválida (para a apresentação)

O menu **12** tenta inserir uma avaliação com `nota: 7` e `codigo_produto: "DISCO-1"`. O MongoDB recusa com `Document failed validation` e a aplicação mostra quais regras foram quebradas (`errInfo.details`).

## 🔗 Parte 3: integração

A chave da ponte é **`produtos.id` (PostgreSQL) = `avaliacoes.produto_id` (MongoDB)**.

```text
PostgreSQL                         MongoDB
produto + categoria + estoque      avaliações do produto
(JOIN)                             ($match + $group → média, total)
            \                     /
             →  integracaoService  ←
                       ↓
   Ficha do disco: título, artista, preço, estoque,
   categoria + nota média + nº de avaliações + últimas opiniões
```

- **Menu 10 · Ficha completa do disco:** um disco com os dados dos dois bancos.
- **Menu 11 · Catálogo ranqueado:** todos os discos do SQL ordenados pela nota média calculada no Mongo.

## 🤔 Por que cada dado está em cada banco?

| Dado | Banco | Motivo |
|---|---|---|
| Discos, preço, estoque | **PostgreSQL** | Dado estruturado, sempre com os mesmos campos. Preço e estoque precisam de consistência (`CHECK`, transação): vender um disco baixa o estoque, e isso não pode ficar pela metade. |
| Clientes e pedidos | **PostgreSQL** | Relações fortes (cliente → pedido → itens → disco) com integridade garantida por FK. É dado financeiro, então precisa de ACID e de JOINs para relatórios. |
| Avaliações | **MongoDB** | Texto livre, campos opcionais que variam (tags, comentário, estado da mídia) e volume que cresce rápido. Cada avaliação é um documento autocontido, lido sempre junto, e o esquema evolui sem `ALTER TABLE`, enquanto o `$jsonSchema` garante um mínimo de qualidade. |

Resumindo: o que é **transacional e relacionado** vai para o SQL, e o que é **flexível e de conteúdo do usuário** vai para o Mongo.

---

## ✅ Checklist da entrega

- [x] A aplicação conecta ao PostgreSQL.
- [x] A aplicação conecta ao MongoDB.
- [x] O banco relacional tem pelo menos 3 tabelas relacionadas (são 5).
- [ ] A aplicação faz inclusão, consulta, alteração e exclusão (SQL e Mongo).
- [x] Existe pelo menos uma consulta com `JOIN`.
- [x] O MongoDB tem validação com `$jsonSchema`.
- [x] Existe validação com expressão regular (`pattern`).
- [x] Existe pelo menos um índice no MongoDB.
- [ ] Existe uma funcionalidade que usa dados dos dois bancos.
- [ ] Modelo ER exportado como imagem (`docs/modelo-er.png`).
- [x] Scripts SQL e MongoDB incluídos.
- [x] O README explica como executar o projeto.
- [ ] Todos os integrantes conseguem explicar e demonstrar a aplicação.

## 🎤 Roteiro da apresentação (02/12)

1. `npm start` → **1** (as duas conexões OK)
2. **2** listar discos (JOIN) → **3/4/5** CRUD no SQL
3. **6–9** CRUD de avaliações no Mongo
4. **10** ficha do disco (integração) → **11** ranking
5. **12** inserção inválida → explicar o `$jsonSchema` e a regex
6. No `mongosh`: `db.avaliacoes.getIndexes()` e `explain()` mostrando IXSCAN

## 🤖 Uso de IA

Usamos ferramentas de IA como apoio, como o enunciado permite. Todo o código foi revisado, e os integrantes sabem explicar e alterar as consultas, o schema e a integração.
