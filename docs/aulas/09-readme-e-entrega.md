# Etapa 09 — README e entrega

> **Objetivo:** conferir que tudo o que o enunciado pede (Parte 4) está no repositório e saber onde está cada item.

## 1. O que entregar e onde está

| Entregável (Parte 4) | Arquivo |
|---|---|
| Código-fonte | `src/` |
| Script SQL de criação | `sql/01_schema.sql` (+ dados em `sql/02_seed.sql`) |
| Script Mongo (coleção + validação + índice) | `mongo/01_init.js` |
| Modelo ER | `docs/modelo-er.png` (fonte Mermaid em `docs/modelo-er.md`) |
| README | `README.md` |

## 2. Os 7 itens obrigatórios do README

| # | Item | Seção do README |
|---|---|---|
| 1 | Integrantes | "1. Integrantes" (TODO para colegas, se houver) |
| 2 | Tema | "2–4. Tema, linguagem e SGBD" |
| 3 | Linguagem | idem |
| 4 | SGBD relacional | idem |
| 5 | Como executar | "5. Como executar" |
| 6 | Como os dois bancos são usados | "6. Como os dois bancos são usados" |
| 7 | **Por que cada dado em cada banco** | "7. Por que cada dado está em cada banco?" |

O item 7 é o que mais mostra domínio. Treine dizer em voz alta: *"transacional e relacionado no SQL; flexível e de conteúdo do usuário no Mongo"* e dar **um exemplo concreto de cada lado** (estoque com `CHECK` × avaliação com tags opcionais).

## 3. Os documentos de estudo

| Arquivo | Para quê |
|---|---|
| `docs/aulas/01..09` | entender cada parte, com exercícios "Sua vez" |
| `docs/ROTEIRO-APRESENTACAO.md` | o que digitar e falar, item por item da Parte 5, com arquivo:linha |
| `docs/PERGUNTAS-DO-PROFESSOR.md` | respostas curtas para as perguntas prováveis |
| `docs/TREINO-AO-VIVO.md` | 5 alterações para praticar sozinho |
| `docs/evidencias.md` | saídas reais de todas as opções do menu |

## 4. Checklist final (véspera)

1. `colima start && npm run db:up && npm run db:reset && npm start` → menu 1 mostra as duas versões.
2. Percorrer o roteiro inteiro uma vez, cronometrando.
3. Fazer pelo menos os exercícios 1, 3 e 4 do treino sem olhar o gabarito.
4. Preencher integrantes no README (se houver colegas).
5. `git push` (quando decidir entregar) e conferir no GitHub que `docs/modelo-er.png` aparece.
6. `npm run db:down && colima stop`.

---

## Sua vez

**Exercício 1.** "Onde, no README, você justifica o uso do MongoDB?"

<details>
<summary>Resposta</summary>

Na seção **7** (tabela "Dado | Banco | Motivo"), linha "Avaliações": conteúdo do usuário, campos opcionais que variam, documento autocontido, volume que cresce, esquema que evolui sem `ALTER TABLE`, com `$jsonSchema` garantindo o mínimo.
</details>

**Exercício 2.** "Adicione ao README uma linha explicando o novo campo `formato` (se você fez o exercício da etapa 03)."

<details>
<summary>Resposta</summary>

Na tabela da seção 6 (PostgreSQL), linha `produtos`: "disco: código, preço, estoque, formato (LP/EP/Single, `CHECK`)". E no `docs/modelo-er.md`, acrescentar `varchar formato "LP|EP|Single"` em `PRODUTOS`; regerar o PNG (ou colar o Mermaid em mermaid.live e exportar).
</details>

## Perguntas de checagem

1. **Quais são os 5 entregáveis?** Código, script SQL, script Mongo (coleção + validação + índice), modelo ER e README.
2. **Como alguém roda o projeto do zero?** `npm install`, `cp .env.example .env`, `npm run db:up`, `npm start`.
3. **Onde estão as provas de que tudo funciona?** `docs/evidencias.md`, com as saídas reais do menu.
