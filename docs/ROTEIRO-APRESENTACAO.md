# Roteiro da apresentação (02/12/2026)

**Tempo estimado:** ~12 minutos de demonstração + perguntas.
**Antes de entrar (5 min antes):**

```bash
colima start
npm run db:up && npm run db:reset    # dados limpos, iguais aos das evidências
npm start
```

Deixe abertos no editor: `mongo/01_init.js`, `src/services/integracaoService.js`, `src/repositories/produtosRepository.js`.
Numa segunda aba do terminal, deixe pronto: `docker compose exec mongo mongosh loja_vinil`.

| # | Item da Parte 5 | Digite no menu | O que falar (1–2 frases) | Onde está no código | Tempo |
|---|---|---|---|---|---|
| 0 | Contexto | — | "Loja de vinil: catálogo, estoque e pedidos no PostgreSQL; avaliações no MongoDB. A integração junta preço e estoque com a nota média." Mostre o `docs/modelo-er.png`. | `docs/modelo-er.png` | 1 min |
| 1 | Acesso ao banco relacional | `1` | "A aplicação conecta ao PostgreSQL por um pool do driver `pg`." | `src/db/postgres.js:5`, `src/index.js:14` | 0,5 min |
| 2 | Acesso ao MongoDB | (mesma tela do `1`) | "E ao MongoDB pelo driver oficial; os comandos são os mesmos do mongosh." | `src/db/mongo.js:7` | 0,5 min |
| 3a | Operações no SQL (CRUD + JOIN) | `2` → `3` (VIN-0006, Nevermind, Nirvana, 1991, 259.9, 4, 1) → `4` (6, 199.9, 10) → `5` (1) → `5` (6) → `6` (1) | "Listagem com JOIN em categorias; insert, update e delete com SQL parametrizado `$1, $2`. O delete do disco 1 é bloqueado pela FK `ON DELETE RESTRICT` porque ele já foi vendido. O menu 6 é um JOIN de 4 tabelas com `SUM` e `GROUP BY`." | `src/repositories/produtosRepository.js:6` (JOIN), `:29` (INSERT), `:40` (UPDATE), `:49` (DELETE), `src/repositories/pedidosRepository.js:6` | 2,5 min |
| 3b | Operações no Mongo (CRUD) | `7` (1) → `8` (`^mui`) → `9` (2, bruno@email.com, 5, Obra-prima da MPB, Enter, positivo) → `7` (2, copie o `_id`) → `10` (`_id`, 4, Enter) → `11` (`_id`) | "find, find com `$regex`, insertOne, updateOne com `$set`, deleteOne. No cadastro, a aplicação confere no Postgres se o disco existe, porque o Mongo não tem FK." | `src/repositories/avaliacoesRepository.js:13`, `:19`, `:25`, `:32`, `:39`; `src/services/integracaoService.js:8` | 2,5 min |
| 4 | Integração entre os bancos | `13` (1) → `14` | "A ficha pega título, preço e estoque do PostgreSQL e nota média e opiniões do MongoDB, ligando `produtos.id` com `avaliacoes.produto_id`. O ranking ordena os discos do SQL pela média calculada com `$group` no Mongo." | `src/services/integracaoService.js:20` e `:30`; `src/repositories/avaliacoesRepository.js:46` | 1,5 min |
| 5 | Validação `$jsonSchema` | (mostrar o arquivo) | "A coleção foi criada com `$jsonSchema`: `required`, `bsonType`, `minimum/maximum` na nota, `minLength/maxLength` no título, `enum` no sentimento e `pattern` no código e no e-mail. Quem valida é o servidor do Mongo." | `mongo/01_init.js:9` (createCollection), `:15` (required), `:35` (maximum), `:40` (minLength), `:48` (enum), `:65` (validationAction) | 1 min |
| 6 | Tentativa de documento inválido | `15` | "Mando nota 7, código DISCO-1, título de 2 letras, sentimento fora do enum e sem e-mail. O Mongo recusa com erro 121 e eu mostro cada regra quebrada." | `src/index.js:138` (documento), `:192` (tratamento), `src/cli/erros.js:21` (formatador) | 1 min |
| 7 | Expressão regular | `16` (VIN-0001) → `16` (VIN-12345) | "`^VIN-[0-9]{4}$`: começa com VIN-, exatamente 4 dígitos e termina. As âncoras `^` e `$` obrigam o texto inteiro a seguir o padrão." | `mongo/01_init.js:24`, `src/cli/erros.js:17` | 1 min |
| 8 | Índice e finalidade | `12` (1) | "Índice em `produto_id` porque toda integração busca avaliações por esse campo. Com índice: IXSCAN, 3 documentos examinados; forçando sem índice: COLLSCAN, 12 documentos." | `mongo/01_init.js:70`, `src/repositories/avaliacoesRepository.js:79` | 1 min |

## Se sobrar tempo / se o professor pedir "mostra no banco"

```js
// no mongosh (segunda aba)
db.avaliacoes.getIndexes()
db.avaliacoes.find({ produto_id: 1 }).explain("executionStats").queryPlanner.winningPlan
db.avaliacoes.insertOne({ produto_id: 1, codigo_produto: "X", nota: 9, titulo: "a", cliente_email: "a@b.com", criado_em: new Date() })
// → MongoServerError: Document failed validation
```

## Plano B

- **Docker não sobe:** use o Postgres.app (porta 5432) e o Mongo do brew (`brew services run mongodb-community@8.0`), ajuste o `.env` (5432 / 27017) e rode os scripts conforme o README ("Sem Docker").
- **Dados bagunçados:** `npm run db:reset` (3 segundos).
- **Esqueceu um `_id`:** menu `7` com o id do disco mostra os `_id`.

## Ao terminar

```bash
npm run db:down && colima stop
```
