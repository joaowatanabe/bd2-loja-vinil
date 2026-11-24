# Modelo ER — banco relacional (PostgreSQL)

```mermaid
erDiagram
    CATEGORIAS ||--o{ PRODUTOS : "classifica"
    CLIENTES   ||--o{ PEDIDOS  : "faz"
    PEDIDOS    ||--|{ ITENS_PEDIDO : "contém"
    PRODUTOS   ||--o{ ITENS_PEDIDO : "aparece em"

    CATEGORIAS {
        serial id PK
        varchar nome UK
    }
    PRODUTOS {
        serial id PK
        varchar codigo UK "VIN-0000"
        varchar titulo
        varchar artista
        smallint ano
        numeric preco
        integer estoque
        integer categoria_id FK
    }
    CLIENTES {
        serial id PK
        varchar nome
        varchar email UK
        timestamp criado_em
    }
    PEDIDOS {
        serial id PK
        integer cliente_id FK
        timestamp data
        varchar status "aberto|pago|enviado|cancelado"
    }
    ITENS_PEDIDO {
        integer pedido_id PK,FK
        integer produto_id PK,FK
        integer quantidade
        numeric preco_unitario
    }
```

## Ponte com o MongoDB

A coleção `avaliacoes` não tem FK (MongoDB não tem integridade referencial). Ela guarda `produto_id`, que é o `produtos.id` do PostgreSQL, e `codigo_produto`, igual a `produtos.codigo`. A aplicação faz a junção dos dois lados.

![Modelo ER](modelo-er.png)

> Imagem gerada a partir do Mermaid acima com `@mermaid-js/mermaid-cli` (`mmdc -i er.mmd -o docs/modelo-er.png`).
