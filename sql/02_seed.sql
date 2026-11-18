-- Dados iniciais para a demonstração

INSERT INTO categorias (nome) VALUES
    ('Rock'), ('MPB'), ('Jazz'), ('Eletrônica');

INSERT INTO produtos (codigo, titulo, artista, ano, preco, estoque, categoria_id) VALUES
    ('VIN-0001', 'Abbey Road',            'The Beatles',     1969, 289.90, 5, 1),
    ('VIN-0002', 'Clube da Esquina',      'Milton Nascimento', 1972, 249.90, 3, 2),
    ('VIN-0003', 'Kind of Blue',          'Miles Davis',     1959, 199.90, 4, 3),
    ('VIN-0004', 'Discovery',             'Daft Punk',       2001, 319.90, 2, 4),
    ('VIN-0005', 'Acabou Chorare',        'Novos Baianos',   1972, 229.90, 6, 2);

INSERT INTO clientes (nome, email) VALUES
    ('Ana Souza',    'ana@email.com'),
    ('Bruno Lima',   'bruno@email.com'),
    ('Carla Mendes', 'carla@email.com');

INSERT INTO pedidos (cliente_id, status) VALUES
    (1, 'pago'), (2, 'aberto'), (1, 'enviado');

INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES
    (1, 1, 1, 289.90),
    (1, 3, 1, 199.90),
    (2, 2, 2, 249.90),
    (3, 4, 1, 319.90);
