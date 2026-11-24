# Perguntas prováveis do professor (com respostas curtas)

## Modelagem e escolha dos bancos

**1. Por que as avaliações estão no Mongo e não no Postgres?**
Porque são conteúdo do usuário: texto livre, campos opcionais que variam (comentário, tags, estado da mídia), volume que cresce rápido e formato que pode mudar. Cada avaliação é um documento autocontido, lido inteiro. No SQL viraria colunas cheias de `NULL` e tabelas extras para tags.

**2. E por que preço e estoque não estão no Mongo?**
Porque são dados financeiros: precisam de `CHECK`, FK, `NUMERIC` exato e transação ACID. Uma venda baixa o estoque e grava o pedido, tudo ou nada.

**3. Como os dois bancos se ligam?**
Pelo `produto_id` da avaliação, que é o `produtos.id` do Postgres. A junção é feita na aplicação (`src/services/integracaoService.js`), não há JOIN entre bancos.

**4. O Mongo garante que o `produto_id` existe?**
Não, o MongoDB não tem chave estrangeira (Aula 12). Por isso o cadastro de avaliação consulta o Postgres antes de gravar (`cadastrarAvaliacao`). Teste: menu 9 com disco 99 → recusado.

**5. Por que referenciar e não embutir as avaliações no disco?**
Pela regra da Aula 12: a lista cresce sem limite (limite de 16 MB por documento), cada avaliação é editada separadamente, e o disco nem mora no Mongo.

## SQL

**6. Onde está o JOIN? Explique.**
`src/repositories/produtosRepository.js` `listar()`: `produtos p JOIN categorias c ON c.id = p.categoria_id`, junta cada disco com o nome da categoria pela FK. E `pedidosRepository.js` junta 4 tabelas com `SUM` e `GROUP BY` para o total de cada pedido.

**7. Por que dá erro ao excluir o disco 1?**
Ele aparece em `itens_pedido`, cuja FK `produto_id` é `ON DELETE RESTRICT`. O Postgres devolve o erro 23503 e a aplicação mostra a mensagem. Isso protege o histórico de vendas.

**8. Por que `$1, $2` e não montar a string?**
Para evitar SQL injection: o valor vai separado do comando e o banco o trata sempre como dado.

## $jsonSchema e regex

**9. O que acontece se eu tirar o `required`?**
Os campos passam a ser opcionais: um documento sem `cliente_email` (ou até sem `nota`) seria aceito. Mas as regras de `properties` continuam valendo para os campos que vierem: `nota: 7` ainda é recusada.
*Para demonstrar:* em `mongo/01_init.js`, apagar a linha `required: [...]`, `npm run db:reset`, menu 15 → a linha "faltando campos obrigatórios" some; as outras 4 violações continuam.

**10. Quem valida, o Node ou o Mongo?**
O servidor do MongoDB. O Node só recebe o erro 121 e formata. Inserir pelo mongosh ou pelo Compass também seria recusado.

**11. Mude a regex para aceitar X.** (exemplo: códigos com 5 dígitos, `VIN-12345`)
1. `mongo/01_init.js:24`: `pattern: "^VIN-[0-9]{4,5}$"`.
2. `src/cli/erros.js:17`: `REGEX_CODIGO = /^VIN-[0-9]{4,5}$/`.
3. `npm run db:reset`.
4. Menu 16 com `VIN-12345` → casa; `VIN-123` → não casa.
5. (Se for guardar esse disco no Postgres, `codigo VARCHAR(8)` precisa virar `VARCHAR(9)` no `sql/01_schema.sql`.)

Outras variações rápidas: aceitar minúsculas → `^[Vv][Ii][Nn]-[0-9]{4}$`; aceitar prefixo VIN ou CD → `^(VIN|CD)-[0-9]{4}$`.

**12. Para que serve o `^` e o `$` na regex?**
São âncoras de início e fim: obrigam o texto inteiro a seguir o padrão. Sem elas, `"xxVIN-0001yy"` seria aceito.

**13. Por que `bsonType: "int"` e não `"number"`?**
Porque a nota é inteira (1 a 5). O driver Node grava inteiros como `int32`, então passa. Se quiséssemos aceitar 4.5, trocaríamos para `"number"` (aceita int e double, dica da Aula 15).

## Índice

**14. Por que esse índice?**
Porque `produto_id` é o filtro de todas as buscas da integração (`find({ produto_id })`, `$match: { produto_id }`) e a coleção de avaliações é a que mais cresce. Com o índice: IXSCAN, examina só os documentos do disco; sem ele: COLLSCAN, a coleção inteira. Menu 12: 3 × 12 documentos examinados.

**15. Como provar que o índice é usado?**
`find({ produto_id: 1 }).explain("executionStats")`: `winningPlan` com `IXSCAN` e `totalDocsExamined` = número de resultados. O menu 12 mostra lado a lado com a versão forçada `hint({ $natural: 1 })`, que dá `COLLSCAN`.

**16. Índice só tem vantagem?**
Não: ocupa espaço e deixa cada escrita um pouco mais lenta, porque o índice também precisa ser atualizado. Por isso só indexamos o campo mais consultado.

## Integração

**17. Mostre uma funcionalidade que usa os dois bancos.**
Menu 13: a ficha do disco tem as linhas `[PostgreSQL]` (código, categoria, preço, estoque, vindos de um JOIN) e `[MongoDB]` (média e total vindos de `$group`, últimas opiniões vindas de `find`). Código: `integracaoService.js` `fichaDoProduto`.

**18. Se eu excluir um disco no Postgres, o que acontece com as avaliações dele?**
Ficam órfãs no Mongo, porque não existe FK entre bancos. Na prática o Postgres só deixa excluir disco nunca vendido. Melhoria: em `excluirDisco`, chamar também `deleteMany({ produto_id })` no Mongo.
