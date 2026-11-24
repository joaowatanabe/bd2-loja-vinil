// Traduz erros dos bancos para mensagens que dá para ler (e explicar) na apresentação.

// Códigos de erro do PostgreSQL (SQLSTATE) que as regras do schema podem gerar.
const ERROS_PG = {
  23503: "Viola chave estrangeira (FK): o disco já aparece em pedidos (itens_pedido.produto_id, ON DELETE RESTRICT) ou a categoria não existe",
  23505: "Viola UNIQUE: esse código já está cadastrado",
  23514: "Viola uma regra CHECK (preço/estoque não podem ser negativos, ano entre 1900 e 2100)",
  22001: "Texto maior que o tamanho da coluna (ex.: codigo é VARCHAR(8))",
};

export function mensagemErroPg(err) {
  return ERROS_PG[err.code] ? `${ERROS_PG[err.code]}. [${err.code}] ${err.message}` : null;
}
