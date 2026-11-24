# Treino ao vivo: 5 alterações antes da apresentação

Faça cada uma **sozinho**, cronometrando (meta: até 5 min cada). Depois desfaça com `git checkout -- .` e `npm run db:reset`.
Ordem: do mais fácil ao mais difícil.

---

### 1. Mudar a regra da nota para 0 a 10 ⏱️ fácil

O professor: "Agora a nota vai de 0 a 10."

<details>
<summary>Gabarito</summary>

1. `mongo/01_init.js`, em `nota`: `minimum: 0`, `maximum: 10`.
2. `src/index.js`, em `cadastrarAvaliacao()`: trocar o texto `"nota (1 a 5): "` por `"nota (0 a 10): "`.
3. `npm run db:reset`.
4. Testar: menu 9, nota 8 → aceita; menu 15 (nota 7) → a linha do `maximum` **some** (7 agora é válido). Bom para explicar que a regra está no banco.
</details>

---

### 2. Mostrar o ano do disco na listagem com JOIN ⏱️ fácil

"Coloca o ano na listagem de discos."

<details>
<summary>Gabarito</summary>

`src/repositories/produtosRepository.js`, `listar()`: acrescentar `p.ano` no `SELECT`:

```sql
SELECT p.id, p.codigo, p.titulo, p.artista, p.ano, p.preco, p.estoque, c.nome AS categoria
```

Sem reset (não mudou o banco). `npm start` → menu 2.
</details>

---

### 3. Aceitar código com prefixo `CD-` além de `VIN-` ⏱️ médio

"A loja vai vender CDs também: o código pode ser `VIN-0000` ou `CD-0000`."

<details>
<summary>Gabarito</summary>

Alternância com grupo (Aula 13): `^(VIN|CD)-[0-9]{4}$`.

1. `mongo/01_init.js` (pattern do `codigo_produto`): `pattern: "^(VIN|CD)-[0-9]{4}$"`.
2. `src/cli/erros.js`: `export const REGEX_CODIGO = /^(VIN|CD)-[0-9]{4}$/;`.
3. `npm run db:reset`.
4. Menu 16: `CD-0001` → casa, `DVD-0001` → não casa, `VIN-0001` → continua casando.
</details>

---

### 4. Novo campo obrigatório no `$jsonSchema` ⏱️ médio

"Toda avaliação precisa dizer se o cliente recomenda o disco (`recomenda`: true/false)."

<details>
<summary>Gabarito</summary>

1. `mongo/01_init.js`:
   - no `required`, acrescentar `"recomenda"`;
   - em `properties`: `recomenda: { bsonType: "bool" },`
   - no seed, a função `av` precisa gravar o campo: dentro do objeto, `recomenda: nota >= 4,` (senão o `insertMany` do seed falha).
2. `src/index.js`, em `cadastrarAvaliacao()`, no objeto `dados`:
   `recomenda: (await perguntar("recomenda? (s/n): ")) === "s",`
3. `npm run db:reset` → menu 9 → aceita. Menu 15 → agora aparece `faltando campos obrigatórios (required): cliente_email, recomenda`.
</details>

---

### 5. Novo índice + mudar a consulta da integração ⏱️ difícil

"Na ficha, mostre só as avaliações com nota ≥ 4, as mais recentes primeiro, e crie um índice que atenda essa consulta. Prove com explain."

<details>
<summary>Gabarito</summary>

1. Consulta — `src/repositories/avaliacoesRepository.js`, `listarPorProduto`:

   ```js
   return col.find({ produto_id: produtoId, nota: { $gte: 4 } }).sort({ criado_em: -1 }).limit(limite).toArray();
   ```

2. Índice composto — `mongo/01_init.js`, depois do índice existente:

   ```js
   db.avaliacoes.createIndex({ produto_id: 1, nota: 1 }, { name: "idx_avaliacoes_produto_nota" });
   ```

3. Explain — em `explicarBusca`, trocar os dois `find({ produto_id: produtoId })` por `find({ produto_id: produtoId, nota: { $gte: 4 } })`.
4. `npm run db:reset` → menu 12 (disco 3): aparecem os dois índices; "com índice" mostra `IXSCAN` (o otimizador escolhe entre os dois índices; com o composto examina só os 2 documentos do disco 3 com nota ≥ 4, com o simples examina os 3 do disco e filtra a nota depois); "sem índice" continua com `COLLSCAN` e 12 documentos. Menu 13 (disco 3) não mostra mais o "Chiado no lado B" (nota 3) nas últimas opiniões. A média continua considerando todas, porque vem do `resumoPorProduto` (que você não mudou).

Explicação para o professor: a regra de índice composto é "igualdade primeiro (`produto_id`), depois faixa (`nota`)".
</details>
