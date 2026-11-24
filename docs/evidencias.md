# Evidências de teste

Saídas **reais** do menu, geradas em 23/11/2026 com os bancos do `docker compose` (PostgreSQL 17 + MongoDB 8) logo após `npm run db:reset`.
A entrada foi enviada por pipe (`printf "1\n2\n..." | npm start`), por isso as respostas aparecem ecoadas depois de cada pergunta.
O menu completo é impresso antes de cada `>`; aqui ele aparece só uma vez para encurtar.

Como reproduzir:

```bash
colima start && npm run db:up && npm run db:reset
npm start
```

## 0. Reset dos bancos

```text
$ npm run db:reset
Coleção avaliacoes criada com $jsonSchema, índice idx_avaliacoes_produto_id e 12 documentos.
```

## Rodada A — conexões, CRUD SQL, JOINs, leitura/cadastro no Mongo

| Item testado | Opção | Resultado esperado |
|---|---|---|
| Conexão aos dois bancos | 1 | versões do PostgreSQL e do MongoDB |
| JOIN disco + categoria | 2 | 5 discos com nome da categoria |
| CREATE (SQL) | 3 | disco 6 (Nevermind) criado |
| UPDATE (SQL) | 4 | preço 199.90, estoque 10 |
| DELETE bloqueado pela FK | 5 → 1 | erro 23503 legível |
| DELETE (SQL) | 5 → 6 | "Excluído: Nevermind" |
| JOIN 4 tabelas | 6 → 1 | pedidos com cliente/total + itens do pedido 1 |
| READ (Mongo) | 7 → 1 | 3 avaliações do disco 1 |
| READ com regex | 8 → `^mui` | "Muito bom" e "Muito bonito" |
| CREATE (Mongo) + checagem no SQL | 9 → disco 2 | avaliação gravada |
| Integridade feita pela aplicação | 9 → disco 99 | recusado: disco não existe no PostgreSQL |

```text
=== Loja de Vinil — PostgreSQL + MongoDB ===
-- Conexões --
 1. Testar conexões (PostgreSQL + MongoDB)
-- PostgreSQL --
 2. Listar discos (JOIN com categoria)
 3. Cadastrar disco
 4. Alterar preço/estoque de um disco
 5. Excluir disco
 6. Pedidos com cliente e total (JOIN 4 tabelas)
-- MongoDB --
 7. Listar avaliações de um disco
 8. Buscar avaliações por título (regex)
 9. Cadastrar avaliação
10. Alterar avaliação
11. Excluir avaliação
12. Índices e explain (IXSCAN × COLLSCAN)
-- Integração --
13. Ficha completa do disco (SQL + Mongo)
14. Catálogo ranqueado por nota (SQL + Mongo)
-- Demonstrações --
15. Tentar inserir avaliação INVÁLIDA ($jsonSchema)
16. Testar a regex do código (VIN-0000)
 0. Sair
> 1
PostgreSQL OK: PostgreSQL 17.11 (Debian 17.11-1.pgdg13+2) on aarch64-unknown-linux-gnu
MongoDB OK: 8.3.17

> 2
┌─────────┬────┬────────────┬────────────────────┬─────────────────────┬──────────┬─────────┬──────────────┐
│ (index) │ id │ codigo     │ titulo             │ artista             │ preco    │ estoque │ categoria    │
├─────────┼────┼────────────┼────────────────────┼─────────────────────┼──────────┼─────────┼──────────────┤
│ 0       │ 1  │ 'VIN-0001' │ 'Abbey Road'       │ 'The Beatles'       │ '289.90' │ 5       │ 'Rock'       │
│ 1       │ 2  │ 'VIN-0002' │ 'Clube da Esquina' │ 'Milton Nascimento' │ '249.90' │ 3       │ 'MPB'        │
│ 2       │ 3  │ 'VIN-0003' │ 'Kind of Blue'     │ 'Miles Davis'       │ '199.90' │ 4       │ 'Jazz'       │
│ 3       │ 4  │ 'VIN-0004' │ 'Discovery'        │ 'Daft Punk'         │ '319.90' │ 2       │ 'Eletrônica' │
│ 4       │ 5  │ 'VIN-0005' │ 'Acabou Chorare'   │ 'Novos Baianos'     │ '229.90' │ 6       │ 'MPB'        │
└─────────┴────┴────────────┴────────────────────┴─────────────────────┴──────────┴─────────┴──────────────┘

> 3
┌─────────┬────┬──────────────┐
│ (index) │ id │ nome         │
├─────────┼────┼──────────────┤
│ 0       │ 1  │ 'Rock'       │
│ 1       │ 2  │ 'MPB'        │
│ 2       │ 3  │ 'Jazz'       │
│ 3       │ 4  │ 'Eletrônica' │
└─────────┴────┴──────────────┘
código (VIN-0000): VIN-0006
título: Nevermind
artista: Nirvana
ano: 1991
preço: 259.9
estoque: 4
id da categoria: 1
Disco cadastrado: {
  id: 6,
  codigo: 'VIN-0006',
  titulo: 'Nevermind',
  artista: 'Nirvana',
  ano: 1991,
  preco: '259.90',
  estoque: 4,
  categoria_id: 1
}

> 4
id do disco: 6
Atual: Nevermind — R$ 259.90, estoque 4
novo preço: 199.9
novo estoque: 10
Atualizado: {
  id: 6,
  codigo: 'VIN-0006',
  titulo: 'Nevermind',
  artista: 'Nirvana',
  ano: 1991,
  preco: '199.90',
  estoque: 10,
  categoria_id: 1
}

> 5
id do disco: 1
Erro: Viola chave estrangeira (FK): o disco já aparece em pedidos (itens_pedido.produto_id, ON DELETE RESTRICT) ou a categoria não existe. [23503] update or delete on table "produtos" violates foreign key constraint "itens_pedido_produto_id_fkey" on table "itens_pedido"

> 5
id do disco: 6
Excluído: Nevermind

> 6
┌─────────┬────────┬──────────────┬───────────┬───────┬──────────┐
│ (index) │ pedido │ cliente      │ status    │ itens │ total    │
├─────────┼────────┼──────────────┼───────────┼───────┼──────────┤
│ 0       │ 1      │ 'Ana Souza'  │ 'pago'    │ '2'   │ '489.80' │
│ 1       │ 2      │ 'Bruno Lima' │ 'aberto'  │ '1'   │ '499.80' │
│ 2       │ 3      │ 'Ana Souza'  │ 'enviado' │ '1'   │ '319.90' │
└─────────┴────────┴──────────────┴───────────┴───────┴──────────┘
ver itens de qual pedido? (Enter = nenhum): 1
┌─────────┬────────────┬────────────────┬────────────┬────────────────┬──────────┐
│ (index) │ codigo     │ titulo         │ quantidade │ preco_unitario │ subtotal │
├─────────┼────────────┼────────────────┼────────────┼────────────────┼──────────┤
│ 0       │ 'VIN-0001' │ 'Abbey Road'   │ 1          │ '289.90'       │ '289.90' │
│ 1       │ 'VIN-0003' │ 'Kind of Blue' │ 1          │ '199.90'       │ '199.90' │
└─────────┴────────────┴────────────────┴────────────┴────────────────┴──────────┘

> 7
id do disco: 1
┌─────────┬────────────────────────────┬────────────┬──────┬───────────────────────┬───────────────────┬────────────┐
│ (index) │ _id                        │ produto_id │ nota │ titulo                │ cliente_email     │ sentimento │
├─────────┼────────────────────────────┼────────────┼──────┼───────────────────────┼───────────────────┼────────────┤
│ 0       │ '6b04f16d026993e62dd94530' │ 1          │ 5    │ 'Prensagem impecável' │ 'ana@email.com'   │ 'positivo' │
│ 1       │ '6b04f16d026993e62dd94531' │ 1          │ 4    │ 'Muito bom'           │ 'bruno@email.com' │ 'positivo' │
│ 2       │ '6b04f16d026993e62dd94532' │ 1          │ 5    │ 'Clássico absoluto'   │ 'carla@email.com' │ '-'        │
└─────────┴────────────────────────────┴────────────┴──────┴───────────────────────┴───────────────────┴────────────┘

> 8
trecho do título (regex, ex.: ^mui): ^mui
┌─────────┬────────────────────────────┬────────────┬──────┬────────────────┬───────────────────┬────────────┐
│ (index) │ _id                        │ produto_id │ nota │ titulo         │ cliente_email     │ sentimento │
├─────────┼────────────────────────────┼────────────┼──────┼────────────────┼───────────────────┼────────────┤
│ 0       │ '6b04f16d026993e62dd94531' │ 1          │ 4    │ 'Muito bom'    │ 'bruno@email.com' │ 'positivo' │
│ 1       │ '6b04f16d026993e62dd9453b' │ 5          │ 4    │ 'Muito bonito' │ 'carla@email.com' │ '-'        │
└─────────┴────────────────────────────┴────────────┴──────┴────────────────┴───────────────────┴────────────┘

> 9
id do disco (PostgreSQL): 2
e-mail: bruno@email.com
nota (1 a 5): 5
título: Obra-prima da MPB
comentário (Enter = sem): Lado A perfeito.
sentimento positivo/neutro/negativo (Enter = sem): positivo
Avaliação 6b04f16ea85b65f98523dcd3 gravada para "Clube da Esquina" (VIN-0002).

> 9
id do disco (PostgreSQL): 99
e-mail: x@email.com
nota (1 a 5): 4
título: Teste
comentário (Enter = sem): 
sentimento positivo/neutro/negativo (Enter = sem): 
Erro: Disco 99 não existe no PostgreSQL — o Mongo não tem FK, então a aplicação confere

> 0
```

## Rodada B — UPDATE/DELETE no Mongo, índice, integração e validação

| Item testado | Opção | Resultado esperado |
|---|---|---|
| UPDATE (Mongo) | 10 | nota 4, título novo |
| UPDATE inválido | 10 → nota 9 | recusado pelo `$jsonSchema` (maximum) |
| DELETE (Mongo) | 11 | avaliação excluída (lista do disco 2 volta a ter só as 2 do seed) |
| Índice + explain | 12 → 1 | `FETCH → IXSCAN` (3 docs) × `COLLSCAN` (12 docs) |
| Integração: ficha | 13 → 1 | dados [PostgreSQL] + [MongoDB] |
| Integração: ranking | 14 | discos do SQL ordenados pela média do Mongo |
| Documento inválido | 15 | 5 violações listadas de forma legível |
| Regex | 16 | `VIN-0001` casa, `VIN-12345` não |

```text
> 10
_id da avaliação: 6b04f16ea85b65f98523dcd3
nova nota (Enter = mantém): 4
novo título (Enter = mantém): Muito boa prensagem
Alterada (1 documento modificado).

> 10
_id da avaliação: 6b04f16ea85b65f98523dcd3
nova nota (Enter = mantém): 9
novo título (Enter = mantém): 
MongoDB recusou: Document failed validation
  ✗ campo "nota": viola maximum (regra: {"maximum":5}) — valor enviado: 9

> 7
id do disco: 2
┌─────────┬────────────────────────────┬────────────┬──────┬───────────────────────┬───────────────────┬────────────┐
│ (index) │ _id                        │ produto_id │ nota │ titulo                │ cliente_email     │ sentimento │
├─────────┼────────────────────────────┼────────────┼──────┼───────────────────────┼───────────────────┼────────────┤
│ 0       │ '6b04f16ea85b65f98523dcd3' │ 2          │ 4    │ 'Muito boa prensagem' │ 'bruno@email.com' │ 'positivo' │
│ 1       │ '6b04f16d026993e62dd94533' │ 2          │ 5    │ 'Obra-prima'          │ 'ana@email.com'   │ 'positivo' │
│ 2       │ '6b04f16d026993e62dd94534' │ 2          │ 4    │ 'Capa linda'          │ 'diego@email.com' │ '-'        │
└─────────┴────────────────────────────┴────────────┴──────┴───────────────────────┴───────────────────┴────────────┘

> 11
_id da avaliação: 6b04f16ea85b65f98523dcd3
Avaliação excluída.

> 7
id do disco: 2
┌─────────┬────────────────────────────┬────────────┬──────┬──────────────┬───────────────────┬────────────┐
│ (index) │ _id                        │ produto_id │ nota │ titulo       │ cliente_email     │ sentimento │
├─────────┼────────────────────────────┼────────────┼──────┼──────────────┼───────────────────┼────────────┤
│ 0       │ '6b04f16d026993e62dd94533' │ 2          │ 5    │ 'Obra-prima' │ 'ana@email.com'   │ 'positivo' │
│ 1       │ '6b04f16d026993e62dd94534' │ 2          │ 4    │ 'Capa linda' │ 'diego@email.com' │ '-'        │
└─────────┴────────────────────────────┴────────────┴──────┴──────────────┴───────────────────┴────────────┘

> 12
Índices da coleção avaliacoes:
  _id_: {"_id":1}
  idx_avaliacoes_produto_id: {"produto_id":1}
id do disco para o find({ produto_id }): 1
┌──────────────────────┬──────────────────┬────────────────┬──────────────────┬────────────┐
│ (index)              │ estagio          │ docsExaminados │ chavesExaminadas │ retornados │
├──────────────────────┼──────────────────┼────────────────┼──────────────────┼────────────┤
│ com índice           │ 'FETCH → IXSCAN' │ 3              │ 3                │ 3          │
│ sem índice (forçado) │ 'COLLSCAN'       │ 12             │ 0                │ 3          │
└──────────────────────┴──────────────────┴────────────────┴──────────────────┴────────────┘
Por quê: toda integração busca avaliações por produto_id; com o índice o Mongo
lê só os documentos daquele disco (IXSCAN) em vez da coleção inteira (COLLSCAN).

> 13
id do disco: 1

💿 Abbey Road — The Beatles (1969)
   [PostgreSQL] código VIN-0001 · Rock · R$ 289.90 · estoque 5
   [MongoDB]    nota média 4.7 ★★★★★ · 3 avaliação(ões)
   [MongoDB]    "Prensagem impecável" (5/5) — ana@email.com
   [MongoDB]    "Muito bom" (4/5) — bruno@email.com
   [MongoDB]    "Clássico absoluto" (5/5) — carla@email.com

> 14
┌─────────┬────────────┬────────────────────┬─────────────────────┬──────────┬─────────┬───────┬────────────┐
│ (index) │ codigo     │ titulo             │ artista             │ preco    │ estoque │ media │ avaliacoes │
├─────────┼────────────┼────────────────────┼─────────────────────┼──────────┼─────────┼───────┼────────────┤
│ 0       │ 'VIN-0001' │ 'Abbey Road'       │ 'The Beatles'       │ '289.90' │ 5       │ 4.7   │ 3          │
│ 1       │ 'VIN-0002' │ 'Clube da Esquina' │ 'Milton Nascimento' │ '249.90' │ 3       │ 4.5   │ 2          │
│ 2       │ 'VIN-0005' │ 'Acabou Chorare'   │ 'Novos Baianos'     │ '229.90' │ 6       │ 4.5   │ 2          │
│ 3       │ 'VIN-0003' │ 'Kind of Blue'     │ 'Miles Davis'       │ '199.90' │ 4       │ 4     │ 3          │
│ 4       │ 'VIN-0004' │ 'Discovery'        │ 'Daft Punk'         │ '319.90' │ 2       │ 3     │ 2          │
└─────────┴────────────┴────────────────────┴─────────────────────┴──────────┴─────────┴───────┴────────────┘

> 15
Tentando inserir: {
  produto_id: 1,
  codigo_produto: 'DISCO-1',
  nota: 7,
  titulo: 'Oi',
  sentimento: 'furioso'
}
MongoDB recusou: Document failed validation
  ✗ campo "codigo_produto": viola pattern (regra: {"pattern":"^VIN-[0-9]{4}$"}) — valor enviado: "DISCO-1"
  ✗ campo "nota": viola maximum (regra: {"maximum":5}) — valor enviado: 7
  ✗ campo "titulo": viola minLength (regra: {"minLength":3}) — valor enviado: "Oi"
  ✗ campo "sentimento": viola enum (regra: {"enum":["positivo","neutro","negativo"]}) — valor enviado: "furioso"
  ✗ faltando campos obrigatórios (required): cliente_email

> 16
texto para testar contra /^VIN-[0-9]{4}$/: VIN-0001
"VIN-0001" CASA com o padrão ✓

> 16
texto para testar contra /^VIN-[0-9]{4}$/: VIN-12345
"VIN-12345" NÃO casa ✗

> 0
```
