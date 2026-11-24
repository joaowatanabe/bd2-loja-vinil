# Etapa 03 — SQL: tabelas, PK/FK e CRUD

> **Objetivo:** entender o `sql/01_schema.sql` linha por linha e fazer o CRUD (Create, Read, Update, Delete) de discos com SQL puro e parametrizado.

## 1. As tabelas ([`sql/01_schema.sql`](../../sql/01_schema.sql))

São 5 tabelas (o mínimo exigido é 3):

```sql
CREATE TABLE produtos (
    id            SERIAL PRIMARY KEY,                       -- PK: número automático e único
    codigo        VARCHAR(8)    NOT NULL UNIQUE,            -- "VIN-0001", não pode repetir
    titulo        VARCHAR(120)  NOT NULL,
    artista       VARCHAR(120)  NOT NULL,
    ano           SMALLINT      CHECK (ano BETWEEN 1900 AND 2100),
    preco         NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    estoque       INTEGER       NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    categoria_id  INTEGER       NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT  -- FK
);
```

| Conceito | O que é | Exemplo no projeto |
|---|---|---|
| **PK** (chave primária) | identifica cada linha, única e não nula | `produtos.id` (`SERIAL` = gera 1, 2, 3…) |
| **PK composta** | a PK é a combinação de 2 colunas | `itens_pedido (pedido_id, produto_id)` |
| **FK** (chave estrangeira) | coluna que aponta para a PK de outra tabela; o banco **garante** que o valor existe | `produtos.categoria_id → categorias.id` |
| `ON DELETE RESTRICT` | proíbe apagar o "pai" se houver "filhos" | não dá para apagar um disco que está em `itens_pedido` |
| `ON DELETE CASCADE` | apagar o pai apaga os filhos junto | apagar um pedido apaga seus itens |
| `CHECK` | regra de valor | `preco >= 0`, `status IN ('aberto','pago',...)` |
| `UNIQUE` | não repete | `produtos.codigo`, `clientes.email` |
| `NUMERIC(10,2)` | número exato com 2 casas (dinheiro!) | `preco` — nunca use `float` para dinheiro |

Os `DROP TABLE` no início estão na ordem **filhos → pais** (`itens_pedido` antes de `pedidos`…), senão a FK impediria apagar.

## 2. O CRUD ([`src/repositories/produtosRepository.js`](../../src/repositories/produtosRepository.js))

| Letra | SQL | Função | Menu |
|---|---|---|---|
| **C**reate | `INSERT INTO produtos (...) VALUES ($1..$7) RETURNING *` | `inserir()` | 3 |
| **R**ead | `SELECT ... FROM produtos p JOIN categorias c ...` | `listar()`, `buscarPorId()` | 2 |
| **U**pdate | `UPDATE produtos SET preco = $1, estoque = $2 WHERE id = $3` | `atualizarPrecoEstoque()` | 4 |
| **D**elete | `DELETE FROM produtos WHERE id = $1` | `excluir()` | 5 |

### Por que `$1, $2` e não concatenar?

```js
// ERRADO (SQL injection): se o usuário digitar  1; DROP TABLE produtos
query("DELETE FROM produtos WHERE id = " + id);

// CERTO: o valor vai separado, o banco trata como DADO e nunca como comando
query("DELETE FROM produtos WHERE id = $1", [id]);
```

### `RETURNING *`

Recurso do PostgreSQL: o `INSERT`/`UPDATE`/`DELETE` devolve a linha afetada. Assim pegamos o `id` gerado sem fazer outro `SELECT`. Se a linha não existia, volta vazio → a função devolve `null` → o menu diz "não encontrado".

### Erros do banco viram mensagens legíveis

O banco é quem garante as regras; a aplicação só traduz o código do erro ([`src/cli/erros.js`](../../src/cli/erros.js)):

| Código | Quando acontece | Teste no menu |
|---|---|---|
| `23503` | FK: excluir disco que já foi vendido | 5 → id `1` |
| `23505` | UNIQUE: cadastrar código repetido | 3 → código `VIN-0001` |
| `23514` | CHECK: preço negativo | 4 → preço `-5` |

Isso é ótimo para a apresentação: mostra que **a integridade está no banco**, não só no código.

---

## Sua vez

**Exercício 1.** "Adicione uma coluna `formato` em produtos, que só aceita `'LP'`, `'EP'` ou `'Single'`, padrão `'LP'`."

<details>
<summary>Resposta</summary>

No `sql/01_schema.sql`, dentro de `CREATE TABLE produtos`:

```sql
formato VARCHAR(10) NOT NULL DEFAULT 'LP' CHECK (formato IN ('LP', 'EP', 'Single')),
```

Rodar `npm run db:reset`. Para mostrar na listagem, acrescentar `p.formato` no `SELECT` de `listar()`. (Sem reset, ao vivo: `ALTER TABLE produtos ADD COLUMN formato VARCHAR(10) NOT NULL DEFAULT 'LP' CHECK (formato IN ('LP','EP','Single'));`)
</details>

**Exercício 2.** "Faça a exclusão de um pedido apagar também os itens dele — isso já acontece? E se eu quisesse que apagar um disco apagasse os itens?"

<details>
<summary>Resposta</summary>

Já acontece: `itens_pedido.pedido_id ... REFERENCES pedidos(id) ON DELETE CASCADE`. Para o disco, trocar em `itens_pedido.produto_id` o `ON DELETE RESTRICT` por `ON DELETE CASCADE` e rodar `npm run db:reset`. **Mas não é boa ideia**: apagaria o histórico de vendas. Por isso escolhemos `RESTRICT`.
</details>

## Perguntas de checagem

1. **Qual a diferença entre PK e FK?** PK identifica a linha na própria tabela; FK é uma coluna que referencia a PK de outra tabela, e o banco impede valores que não existem lá.
2. **Por que `excluir` o disco 1 dá erro e o disco novo não?** O disco 1 aparece em `itens_pedido` e a FK é `ON DELETE RESTRICT`; o disco novo não foi vendido, então nada o referencia.
3. **Por que `preco` é `NUMERIC(10,2)` e vem como texto `'289.90'` no Node?** `NUMERIC` é exato (não tem erro de arredondamento de `float`). O driver `pg` devolve como string justamente para não perder precisão ao converter para número do JavaScript.
