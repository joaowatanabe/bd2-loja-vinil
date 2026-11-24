# Etapa 07 — Índice e `explain` (IXSCAN × COLLSCAN)

> **Objetivo:** criar um índice que tem motivo e **provar** que ele é usado. Item 8 da apresentação: "índice criado e sua finalidade".

## 1. O índice

Em [`mongo/01_init.js`](../../mongo/01_init.js):

```js
db.avaliacoes.createIndex({ produto_id: 1 }, { name: "idx_avaliacoes_produto_id" });
```

- `{ produto_id: 1 }` = índice **ascendente** no campo `produto_id` (`-1` seria descendente; para busca por igualdade tanto faz).
- É uma árvore B-Tree ordenada por `produto_id`: o Mongo acha "todas as avaliações do disco 3" sem olhar as outras.

## 2. Por que NESSE campo? (resposta que o professor quer ouvir)

> "Porque **toda a integração começa com `find({ produto_id })`**: a ficha do disco, a média (`$match: { produto_id }`) e a listagem de avaliações buscam pelo id que vem do PostgreSQL. É o filtro mais frequente da aplicação, e a coleção de avaliações é a que mais cresce. Sem índice, cada ficha leria a coleção inteira (COLLSCAN); com o índice, lê só os documentos daquele disco (IXSCAN)."

Campos que **não** valeriam um índice agora: `sentimento` (só 3 valores, pouco seletivo), `comentario` (texto longo; para busca textual o certo seria índice `text`).

**Trade-off (Aula 15):** índice acelera leitura seletiva, mas ocupa espaço e deixa cada `insert`/`update`/`delete` um pouco mais lento (o índice também precisa ser atualizado). Por isso não se indexa tudo.

## 3. Provando com `explain("executionStats")`

Menu **12**: lista os índices e roda a **mesma** busca duas vezes:

```text
┌──────────────────────┬──────────────────┬────────────────┬──────────────────┬────────────┐
│ (index)              │ estagio          │ docsExaminados │ chavesExaminadas │ retornados │
├──────────────────────┼──────────────────┼────────────────┼──────────────────┼────────────┤
│ com índice           │ 'FETCH → IXSCAN' │ 3              │ 3                │ 3          │
│ sem índice (forçado) │ 'COLLSCAN'       │ 12             │ 0                │ 3          │
└──────────────────────┴──────────────────┴────────────────┴──────────────────┴────────────┘
```

- **com índice:** `IXSCAN` (percorre o índice) + `FETCH` (busca os documentos). Examinou 3 chaves e 3 documentos para devolver 3. Perfeito: nada desperdiçado.
- **sem índice:** forçamos com `.hint({ $natural: 1 })` ("leia na ordem natural da coleção"), que é o que aconteceria se o índice não existisse. `COLLSCAN` examinou **todos os 12** para achar os mesmos 3.

Com 12 documentos a diferença é pequena; com 100.000 (experimento do Slide 15) seria 100.000 × 3. Como na aula: olhe `totalDocsExamined`, **não os milissegundos** (o tempo varia com cache e CPU; a contagem é determinística).

Código: [`avaliacoesRepository.js`](../../src/repositories/avaliacoesRepository.js) `explicarBusca()`.

### No mongosh (se o professor pedir "mostra no banco")

```js
use loja_vinil
db.avaliacoes.getIndexes()
db.avaliacoes.find({ produto_id: 1 }).explain("executionStats")   // IXSCAN
db.avaliacoes.dropIndex("idx_avaliacoes_produto_id")
db.avaliacoes.find({ produto_id: 1 }).explain("executionStats")   // COLLSCAN
db.avaliacoes.createIndex({ produto_id: 1 }, { name: "idx_avaliacoes_produto_id" })
```

Para abrir o mongosh do container: `docker compose exec mongo mongosh loja_vinil`.

---

## Sua vez

**Exercício 1.** "Crie um índice que impeça o mesmo cliente de avaliar o mesmo disco duas vezes."

<details>
<summary>Resposta</summary>

Índice **composto e único**:

```js
db.avaliacoes.createIndex({ produto_id: 1, cliente_email: 1 }, { unique: true, name: "uk_avaliacao_cliente_disco" })
```

Colocar em `mongo/01_init.js` depois do outro `createIndex` e rodar `npm run db:reset`. Tentar avaliar o disco 1 de novo com `ana@email.com` → erro `E11000 duplicate key`. Bônus: esse índice também serve para buscas só por `produto_id` (é o prefixo), então daria até para remover o antigo.
</details>

**Exercício 2.** "Crie um índice para listar as avaliações mais recentes de um disco."

<details>
<summary>Resposta</summary>

`db.avaliacoes.createIndex({ produto_id: 1, criado_em: -1 })`. Ele atende o `find({ produto_id }).sort({ criado_em: -1 })` de `listarPorProduto` sem precisar ordenar na memória (no explain, some o estágio `SORT`).
</details>

## Perguntas de checagem

1. **O que significa IXSCAN e COLLSCAN?** IXSCAN = varredura do índice (vai direto às chaves que interessam); COLLSCAN = varredura da coleção inteira, documento por documento.
2. **Se o índice é bom, por que não criar índice em todos os campos?** Cada índice ocupa espaço e precisa ser atualizado em toda escrita; índices em campos pouco usados ou pouco seletivos só custam.
3. **Por que comparar `totalDocsExamined` e não o tempo?** Porque o tempo depende de cache, CPU e máquina; o número de documentos examinados mostra o algoritmo escolhido e não varia.
