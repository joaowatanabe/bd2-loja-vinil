# Etapa 04 — JOIN

> **Objetivo:** juntar dados de várias tabelas numa consulta só. É o requisito "pelo menos uma consulta com JOIN" — temos três.

## 1. A ideia do JOIN

As tabelas guardam **ids** umas das outras (as FKs). O JOIN "cola" as linhas cujo id bate:

```text
produtos.categoria_id = 1   ─┐
                             ├─► JOIN ON c.id = p.categoria_id  ─►  "Abbey Road | Rock"
categorias.id = 1, "Rock"   ─┘
```

`JOIN` (= `INNER JOIN`) só traz linhas que têm par dos dois lados. `LEFT JOIN` traz todas da esquerda mesmo sem par (com `NULL` do lado direito). Lembra do `$lookup` da Aula 12? Ele é o "LEFT JOIN" do Mongo.

## 2. Os JOINs do projeto

### a) Disco + categoria (menu **2**) — [`produtosRepository.js`](../../src/repositories/produtosRepository.js) `listar()`

```sql
SELECT p.id, p.codigo, p.titulo, p.artista, p.preco, p.estoque, c.nome AS categoria
  FROM produtos p
  JOIN categorias c ON c.id = p.categoria_id
 ORDER BY p.id
```

`p` e `c` são **apelidos** (alias) das tabelas. `c.nome AS categoria` renomeia a coluna na saída.

### b) Pedidos com cliente e total — JOIN de 4 tabelas (menu **6**) — [`pedidosRepository.js`](../../src/repositories/pedidosRepository.js) `listarComCliente()`

```sql
SELECT pe.id AS pedido, c.nome AS cliente, pe.status,
       COUNT(*) AS itens,
       SUM(i.quantidade * i.preco_unitario) AS total
  FROM pedidos pe
  JOIN clientes c     ON c.id = pe.cliente_id     -- quem comprou
  JOIN itens_pedido i ON i.pedido_id = pe.id      -- o que comprou
  JOIN produtos pr    ON pr.id = i.produto_id     -- qual disco
 GROUP BY pe.id, c.nome, pe.status
 ORDER BY pe.id
```

- Sem o `GROUP BY`, viria **uma linha por item**. Com ele, os itens do mesmo pedido viram uma linha e `COUNT`/`SUM` resumem.
- Regra do `GROUP BY`: toda coluna do `SELECT` que **não** está dentro de `COUNT/SUM/AVG` precisa estar no `GROUP BY`.
- Ponte com a Aula 15: isso é igualzinho ao `$group` do Mongo — `_id` = colunas do `GROUP BY`, `{ $sum: ... }` = `SUM(...)`, `{ $sum: 1 }` = `COUNT(*)`.

### c) Itens de um pedido (menu **6**, depois digite o nº do pedido) — `itensDoPedido(pedidoId)`

```sql
SELECT pr.codigo, pr.titulo, i.quantidade, i.preco_unitario,
       i.quantidade * i.preco_unitario AS subtotal
  FROM itens_pedido i
  JOIN produtos pr ON pr.id = i.produto_id
 WHERE i.pedido_id = $1
```

## 3. Conferindo à mão

Pedido 1 (Ana): Abbey Road 289,90 + Kind of Blue 199,90 = **489,80** — é o que o menu 6 mostra. Pedido 2 (Bruno): 2 × Clube da Esquina 249,90 = **499,80**.

---

## Sua vez

**Exercício 1.** "Mostre só os pedidos com status `pago`."

<details>
<summary>Resposta</summary>

Em `listarComCliente()`, antes do `GROUP BY`: `WHERE pe.status = 'pago'`. Melhor ainda, parametrizado: receber `status` na função e usar `WHERE pe.status = $1` com `query(sql, [status])`.
</details>

**Exercício 2.** "Faça um relatório de quanto cada **categoria** vendeu."

<details>
<summary>Resposta</summary>

```sql
SELECT c.nome AS categoria, SUM(i.quantidade * i.preco_unitario) AS vendido
  FROM itens_pedido i
  JOIN produtos pr  ON pr.id = i.produto_id
  JOIN categorias c ON c.id = pr.categoria_id
 GROUP BY c.nome
 ORDER BY vendido DESC
```

Criar uma função `vendasPorCategoria()` em `pedidosRepository.js` com esse SQL e uma opção no menu com `console.table(...)`.
</details>

## Perguntas de checagem

1. **Por que a categoria "Eletrônica" não some da listagem de discos?** Porque existe disco com essa categoria (Discovery). Uma categoria **sem** discos sumiria num `JOIN`; para aparecer, seria `categorias LEFT JOIN produtos`.
2. **O que acontece se eu tirar o `GROUP BY` da consulta de pedidos?** Dá erro: `COUNT`/`SUM` misturados com colunas normais exigem `GROUP BY`. Se tirar também o `COUNT`/`SUM`, volta uma linha por item.
3. **Qual a relação entre `JOIN` e as FKs?** O `ON` usa exatamente as colunas FK → PK (`pe.cliente_id = c.id`). A FK garante que o par existe; o JOIN usa esse par para juntar.
