# Etapa 05 — MongoDB: CRUD de avaliações

> **Objetivo:** inserir, consultar, alterar e excluir documentos na coleção `avaliacoes`, com os mesmos comandos que você usou no `mongosh` nas aulas 12–15.

## 1. Como é um documento de avaliação

```js
{
  _id: ObjectId("6b04eb5d0c9380bc44734848"),   // gerado pelo Mongo
  produto_id: 1,                  // = produtos.id no PostgreSQL (a ponte)
  codigo_produto: "VIN-0001",     // = produtos.codigo
  cliente_email: "ana@email.com",
  nota: 5,
  titulo: "Prensagem impecável",
  comentario: "Som limpo, capa perfeita.",   // opcional
  sentimento: "positivo",                    // opcional
  tags: ["prensagem", "capa"],               // opcional, array
  estado_midia: "novo",                      // opcional
  criado_em: ISODate("2026-11-23T...")
}
```

Repare: nem toda avaliação tem `comentario`, `tags` ou `estado_midia`. **Isso é o esquema flexível** — numa tabela SQL seriam colunas `NULL` (ou uma tabela extra só para tags).

## 2. mongosh × driver Node (é praticamente igual)

| Operação | No mongosh (aulas) | No projeto ([`avaliacoesRepository.js`](../../src/repositories/avaliacoesRepository.js)) | Menu |
|---|---|---|---|
| **C**reate | `db.avaliacoes.insertOne({...})` | `col.insertOne({ ...doc, criado_em: new Date() })` | 9 |
| **R**ead | `db.avaliacoes.find({ produto_id: 1 })` | `col.find({ produto_id }).sort({ criado_em: -1 })` | 7 |
| **R**ead (regex) | `db.avaliacoes.find({ titulo: /mui/i })` | `col.find({ titulo: { $regex: trecho, $options: "i" } })` | 8 |
| **U**pdate | `db.avaliacoes.updateOne({_id}, { $set: {...} })` | `col.updateOne({ _id: new ObjectId(id) }, { $set: campos })` | 10 |
| **D**elete | `db.avaliacoes.deleteOne({_id})` | `col.deleteOne({ _id: new ObjectId(id) })` | 11 |

Diferenças do driver:
- tudo é **assíncrono** (`await`), e o `find` devolve um cursor → `.toArray()`;
- o `_id` digitado é texto; precisa virar `new ObjectId("...")`. Se não tiver 24 caracteres hexadecimais, a função `paraObjectId` recusa antes de ir ao banco.

### `$set` muda só o que você mandar

`updateOne({ _id }, { $set: { nota: 4 } })` muda **só** a nota. Sem o `$set` (`updateOne({_id}, { nota: 4 })`) o driver dá erro; e um `replaceOne` trocaria o documento inteiro, apagando os outros campos.

### Busca com regex (Aula 13)

Menu **8**, digite `^mui` → acha "Muito bom". `^` = começa com; `$options: "i"` = ignora maiúsculas/minúsculas. Teste também `prensagem$` (termina com) ou `chiado`.

## 3. Cadastrar avaliação já é um pouco de integração

O menu **9** **não** pergunta o `codigo_produto`. Ele faz ([`integracaoService.js`](../../src/services/integracaoService.js) `cadastrarAvaliacao`):

1. busca o disco no **PostgreSQL** (`produtos.buscarPorId`);
2. se não existir → recusa ("Disco 99 não existe no PostgreSQL…");
3. se existir → grava no **MongoDB** com `produto_id` e `codigo_produto` copiados do Postgres.

Por quê? A pegadinha da Aula 12: **Mongo não tem FOREIGN KEY**. Quem garante a "integridade referencial" entre os bancos é a aplicação.

## 4. Agregações que vamos usar na integração

```js
// média e total de UM disco (Aula 15: $match = WHERE, $group = GROUP BY)
col.aggregate([
  { $match: { produto_id: 1 } },
  { $group: { _id: "$produto_id", media: { $avg: "$nota" }, total: { $sum: 1 } } },
])
```

`"$nota"` entre aspas com `$` = **valor do campo**; `$avg` fora das aspas = **operador**. `{ $sum: 1 }` conta documentos (o `COUNT(*)`).

---

## Sua vez

**Exercício 1.** "Liste as avaliações de um disco só com nota maior ou igual a 4."

<details>
<summary>Resposta</summary>

Em `listarPorProduto`, trocar o filtro por `{ produto_id: produtoId, nota: { $gte: 4 } }`. No mongosh: `db.avaliacoes.find({ produto_id: 1, nota: { $gte: 4 } })`.
</details>

**Exercício 2.** "Na alteração, permita também mudar o `sentimento`."

<details>
<summary>Resposta</summary>

Em `alterarAvaliacao()` no `src/index.js`, copiar o padrão da nota:

```js
const sentimento = await perguntar("novo sentimento (Enter = mantém): ");
if (sentimento) campos.sentimento = sentimento;
```

O `$set` já aceita qualquer campo. Se digitar um sentimento fora do `enum`, o `$jsonSchema` recusa (etapa 06).
</details>

## Perguntas de checagem

1. **O que o `deleteOne` devolve quando o `_id` não existe?** `deletedCount: 0` — não é erro; o menu mostra "não encontrada".
2. **Por que a nota 9 no update deu "Document failed validation"?** Porque o `$jsonSchema` vale também para updates (`validationLevel: "strict"`), e `nota` tem `maximum: 5`.
3. **Por que o cadastro busca o disco no Postgres antes?** Porque o Mongo aceitaria `produto_id: 99` sem reclamar (não tem FK); a aplicação faz essa checagem.
