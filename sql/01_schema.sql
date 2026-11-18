-- Atividade Final BD2 — Loja de Discos de Vinil
-- Banco relacional: PostgreSQL
-- Dados estruturados e transacionais: catálogo, preço, estoque, clientes e pedidos.

DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS categorias;

CREATE TABLE categorias (
    id      SERIAL PRIMARY KEY,
    nome    VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE produtos (
    id            SERIAL PRIMARY KEY,
    codigo        VARCHAR(8)    NOT NULL UNIQUE,          -- ex.: VIN-0001 (mesmo código usado no MongoDB)
    titulo        VARCHAR(120)  NOT NULL,
    artista       VARCHAR(120)  NOT NULL,
    ano           SMALLINT      CHECK (ano BETWEEN 1900 AND 2100),
    preco         NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    estoque       INTEGER       NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    categoria_id  INTEGER       NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT
);

CREATE TABLE clientes (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    criado_em   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE pedidos (
    id          SERIAL PRIMARY KEY,
    cliente_id  INTEGER     NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    data        TIMESTAMP   NOT NULL DEFAULT NOW(),
    status      VARCHAR(20) NOT NULL DEFAULT 'aberto'
                CHECK (status IN ('aberto', 'pago', 'enviado', 'cancelado'))
);

CREATE TABLE itens_pedido (
    pedido_id       INTEGER       NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id      INTEGER       NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade      INTEGER       NOT NULL CHECK (quantidade > 0),
    preco_unitario  NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
    PRIMARY KEY (pedido_id, produto_id)
);
