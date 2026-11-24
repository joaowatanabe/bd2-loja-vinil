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

// A MESMA regex do pattern de codigo_produto em mongo/01_init.js.
// Se mudar uma, mude a outra (o menu 16 usa esta para testar textos).
export const REGEX_CODIGO = /^VIN-[0-9]{4}$/;

// Erro 121 do MongoDB = "Document failed validation".
// err.errInfo.details.schemaRulesNotSatisfied diz QUAIS regras do $jsonSchema falharam.
export function formatarErroValidacao(err) {
  const regras = err.errInfo?.details?.schemaRulesNotSatisfied ?? [];
  const linhas = [];
  for (const regra of regras) {
    if (regra.operatorName === "required") {
      linhas.push(`✗ faltando campos obrigatórios (required): ${regra.missingProperties.join(", ")}`);
    } else if (regra.operatorName === "properties") {
      for (const campo of regra.propertiesNotSatisfied) {
        for (const d of campo.details) {
          const valor = d.consideredValue !== undefined ? ` — valor enviado: ${JSON.stringify(d.consideredValue)}` : "";
          linhas.push(`✗ campo "${campo.propertyName}": viola ${d.operatorName} (regra: ${JSON.stringify(d.specifiedAs)})${valor}`);
        }
      }
    } else {
      linhas.push(`✗ ${regra.operatorName}: ${JSON.stringify(regra)}`);
    }
  }
  return linhas;
}
