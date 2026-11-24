# Etapa 06 — `$jsonSchema`, regex e documento inválido

> **Objetivo:** mostrar que o MongoDB, mesmo sendo "sem esquema", **recusa** documentos ruins quando a coleção tem `$jsonSchema`. Cobre os itens 5, 6 e 7 da apresentação.

## 1. Onde está e quando roda

Em [`mongo/01_init.js`](../../mongo/01_init.js), no `db.createCollection("avaliacoes", { validator: { $jsonSchema: {...} } })` — exatamente como no Slide 12 da Aula 15. A validação roda **no servidor do MongoDB** a cada `insert` e `update`: não importa se veio do Node, do mongosh ou do Compass.

- `validationLevel: "strict"` → valida todos os inserts e updates.
- `validationAction: "error"` → recusa (com `"warn"` só registraria no log e gravaria assim mesmo).

## 2. Cada regra exigida no enunciado

| Exigência | No nosso schema | O que recusa |
|---|---|---|
| `required` | `["produto_id", "codigo_produto", "cliente_email", "nota", "titulo", "criado_em"]` | documento sem `cliente_email` |
| `bsonType` | `nota: "int"`, `titulo: "string"`, `tags: "array"`, `criado_em: "date"` | `nota: "cinco"` |
| `minimum`/`maximum` | `nota` de 1 a 5 | `nota: 7` |
| `minLength`/`maxLength` | `titulo` 3–80, `comentario` até 1000 | `titulo: "Oi"` |
| `enum` | `sentimento` ∈ positivo/neutro/negativo; `estado_midia` ∈ novo/seminovo/usado | `sentimento: "furioso"` |
| `pattern` (regex) | `codigo_produto: "^VIN-[0-9]{4}$"` e `cliente_email` | `"DISCO-1"`, `"nao-e-email"` |

> Detalhe da Aula 15: `bsonType: "int"` só aceita inteiro. O driver Node grava números inteiros pequenos como `int32`, então `nota: 4` passa; `nota: 4.5` seria `double` e seria recusado. No mongosh usamos `NumberInt(4)` para garantir.

## 3. A regex do código, peça por peça (Aula 13)

```text
^VIN-[0-9]{4}$
│ │   │     │ └─ $   fim do texto (nada depois)
│ │   │     └─── {4} exatamente 4 vezes
│ │   └───────── [0-9] um dígito
│ └───────────── VIN- texto literal
└─────────────── ^   início do texto (nada antes)
```

| Texto | Casa? | Por quê |
|---|---|---|
| `VIN-0001` | ✓ | VIN- + 4 dígitos |
| `vin-0001` | ✗ | minúsculo (regex diferencia; sem opção `i`) |
| `VIN-12345` | ✗ | 5 dígitos — o `$` não deixa sobrar nada |
| `XVIN-0001` | ✗ | o `^` não deixa ter nada antes |
| `DISCO-1` | ✗ | não começa com VIN- |

Sem o `^` e o `$`, `XVIN-00012` seria aceito (a regex só precisaria **aparecer** em algum lugar). **Âncoras são o que torna a validação exata.**

A regex de e-mail `^[\w.+-]+@[\w-]+(\.[\w-]+)+$`: um ou mais caracteres de "palavra", ponto, + ou -; um `@`; um domínio; e **um ou mais** grupos `.algo` (`.com`, `.com.br`). Dentro da string JS as barras são dobradas (`\\w`, `\\.`) — lembrete da Aula 14.

O menu **16** testa textos contra a mesma regex (constante `REGEX_CODIGO` em [`src/cli/erros.js`](../../src/cli/erros.js)) — ótimo para treinar "mude a regex para aceitar X".

## 4. A tentativa de inserção inválida (menu 15)

[`src/index.js`](../../src/index.js) `inserirAvaliacaoInvalida()` manda um documento com 5 problemas. O MongoDB devolve o erro **código 121** com `errInfo.details` dizendo cada regra quebrada; `formatarErroValidacao()` transforma isso em texto:

```text
MongoDB recusou: Document failed validation
  ✗ campo "codigo_produto": viola pattern (regra: {"pattern":"^VIN-[0-9]{4}$"}) — valor enviado: "DISCO-1"
  ✗ campo "nota": viola maximum (regra: {"maximum":5}) — valor enviado: 7
  ✗ campo "titulo": viola minLength (regra: {"minLength":3}) — valor enviado: "Oi"
  ✗ campo "sentimento": viola enum (regra: {"enum":["positivo","neutro","negativo"]}) — valor enviado: "furioso"
  ✗ faltando campos obrigatórios (required): cliente_email
```

O mesmo formatador aparece quando o erro vem do menu 9 (cadastrar) ou 10 (alterar).

### Como mudar o schema numa coleção que já existe

Duas formas:
1. Editar `mongo/01_init.js` e rodar `npm run db:reset` (recria a coleção — perde avaliações novas).
2. Ao vivo, sem apagar nada (Aula 15): `db.runCommand({ collMod: "avaliacoes", validator: { $jsonSchema: { ...schema inteiro novo... } } })`.

Para ver o schema atual no mongosh: `db.getCollectionInfos({ name: "avaliacoes" })[0].options.validator`.

---

## Sua vez

**Exercício 1.** "Mude a regex do código para aceitar também 5 dígitos (`VIN-12345`)."

<details>
<summary>Resposta</summary>

`[0-9]{4}` → `[0-9]{4,5}`. Trocar em **dois** lugares: `mongo/01_init.js` (`pattern: "^VIN-[0-9]{4,5}$"`) e `REGEX_CODIGO` em `src/cli/erros.js`. Rodar `npm run db:reset`, depois menu 16 com `VIN-12345` → casa. Atenção: no Postgres `codigo` é `VARCHAR(8)`; para guardar `VIN-12345` (9 caracteres) teria que virar `VARCHAR(9)`.
</details>

**Exercício 2.** "Torne o `sentimento` obrigatório e acrescente o valor `misto`."

<details>
<summary>Resposta</summary>

Em `mongo/01_init.js`: incluir `"sentimento"` no array `required` e trocar o enum para `["positivo", "neutro", "negativo", "misto"]`. Atenção: os documentos do seed sem `sentimento` passariam a falhar no `insertMany` — é preciso colocar `sentimento` em todos eles (ou a mudança fica só via `collMod` com `validationLevel: "moderate"`, que não revalida os antigos). No cadastro (menu 9) o sentimento deixaria de ser opcional.
</details>

## Perguntas de checagem

1. **O que acontece se eu tirar o `required`?** Os campos passam a ser opcionais: um documento sem `cliente_email` seria aceito. Mas as regras de `properties` continuam valendo **para os campos que vierem** (se vier `nota: 7`, ainda é recusado).
2. **A validação é feita pelo Node ou pelo MongoDB?** Pelo MongoDB, no servidor. O Node só recebe o erro 121 e formata. Por isso vale para qualquer cliente (mongosh, Compass…).
3. **Por que a regex tem `^` e `$`?** Para obrigar o texto **inteiro** a seguir o padrão. Sem elas, basta o padrão aparecer em algum pedaço (`"lixoVIN-0001lixo"` passaria).
