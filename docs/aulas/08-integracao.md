# Etapa 08 — Integração dos dois bancos

> **Objetivo:** uma funcionalidade que **precisa** dos dois bancos para funcionar. Item 4 da apresentação. "Não basta criar dois bancos independentes."

## 1. A ponte

```text
produtos.id (PostgreSQL)  ═══  avaliacoes.produto_id (MongoDB)
```

Não existe "JOIN entre bancos". A junção acontece **na aplicação**, em [`src/services/integracaoService.js`](../../src/services/integracaoService.js): o código pergunta para um banco, pega o id e pergunta para o outro.

## 2. Ficha completa do disco (menu 13)

```js
export async function fichaDoProduto(produtoId) {
  const produto = await produtos.buscarPorId(produtoId);            // [PostgreSQL] JOIN produtos+categorias
  if (!produto) return null;
  const resumo = await avaliacoesRepo.resumoPorProduto(produtoId);  // [MongoDB] $match + $group ($avg, $sum)
  const ultimas = await avaliacoesRepo.listarPorProduto(produtoId, 3); // [MongoDB] find (usa o índice)
  return { ...produto, media: resumo.media, totalAvaliacoes: resumo.total, ultimas };
}
```

Saída real:

```text
💿 Abbey Road — The Beatles (1969)
   [PostgreSQL] código VIN-0001 · Rock · R$ 289.90 · estoque 5
   [MongoDB]    nota média 4.7 ★★★★★ · 3 avaliação(ões)
   [MongoDB]    "Prensagem impecável" (5/5) — ana@email.com
   ...
```

Cada linha diz de qual banco o dado veio — use isso para explicar na apresentação. É exatamente o desenho do enunciado: **produto + preço (SQL) + avaliação média (Mongo)**.

Conta para conferir: Abbey Road tem notas 5, 4 e 5 → (5+4+5)/3 = 4,67 → 4,7.

## 3. Catálogo ranqueado (menu 14)

1. `produtos.listar()` → todos os discos (SQL, com JOIN).
2. `avaliacoesRepo.resumoDeTodos()` → um `$group` por `produto_id` com média e total (Mongo).
3. Um `Map` liga `produto_id → resumo`, e cada disco ganha `media` e `avaliacoes`.
4. Ordena pela média (decrescente); disco sem avaliação fica no fim com `media: null`.

Por que buscar **todos** os resumos de uma vez e não um por disco? Para fazer **2 consultas no total** em vez de 1 + N (uma por disco). Com 5 discos tanto faz; com 5.000, faz muita diferença.

## 4. Cadastro de avaliação (menu 9) também integra

`cadastrarAvaliacao()` confere no Postgres se o disco existe (o Mongo não tem FK) e copia de lá o `codigo_produto`. Assim o `codigo_produto` no Mongo sempre bate com o Postgres — e o `pattern` do `$jsonSchema` é uma segunda barreira.

## 5. E a consistência?

Se alguém excluir um disco no Postgres, as avaliações dele **continuam** no Mongo (órfãs) — não há FK entre bancos. No nosso projeto isso quase não acontece: o Postgres só deixa excluir disco que nunca foi vendido. Uma melhoria possível: ao excluir o disco, a aplicação também fazer `deleteMany({ produto_id })` no Mongo.

---

## Sua vez

**Exercício 1.** "Na ficha, mostre também quantas unidades desse disco já foram vendidas."

<details>
<summary>Resposta</summary>

Em `produtosRepository.js` criar:

```js
export async function totalVendido(id) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(quantidade), 0) AS vendidos FROM itens_pedido WHERE produto_id = $1`, [id]);
  return Number(rows[0].vendidos);
}
```

Em `fichaDoProduto` acrescentar `vendidos: await produtos.totalVendido(produtoId)` no objeto retornado e, em `mostrarFicha()` do `index.js`, imprimir `· vendidos ${f.vendidos}` na linha `[PostgreSQL]`.
</details>

**Exercício 2.** "No ranking, mostre só os discos que têm estoque."

<details>
<summary>Resposta</summary>

Em `catalogoRanqueado()`, antes do `.sort(...)`, acrescentar `.filter((d) => d.estoque > 0)`. Ou filtrar no SQL: criar uma consulta com `WHERE p.estoque > 0`.
</details>

## Perguntas de checagem

1. **Onde acontece o "JOIN" entre Postgres e Mongo?** Na aplicação (`integracaoService.js`), usando `produtos.id = avaliacoes.produto_id`. Nenhum dos dois bancos enxerga o outro.
2. **Quantas consultas o ranking faz?** Duas: uma no Postgres (todos os discos) e uma agregação no Mongo (médias de todos). A junção é um `Map` em memória.
3. **Qual índice ajuda a ficha do disco?** `idx_avaliacoes_produto_id`: o `$match` e o `find` filtram por `produto_id`.
