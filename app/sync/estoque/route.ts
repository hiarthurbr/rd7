import { getTokenNoLocal } from "@/lib/pda";

export async function GET() {
  const authorization = await getTokenNoLocal();
  return fetch("https://api.pdahub.com.br/api/Relatorio/ArmazenagemEstoque", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "pt-BR,pt;q=0.9",
      authorization,
      "cache-control": "no-cache",
      "content-type": "application/json",
      pragma: "no-cache",
      priority: "u=1, i",
    },
    referrer: "https://wms.pdahub.com.br/",
    body: JSON.stringify({
      CodigoCliente: 30,
      User: 1297,
      endereco: null,
      codigoDeposito: [96, 156].join(","),
      seller: null,
      produto: null,
      codigoPedido: null,
      codigoMarca: null,
      Op: null,
      PedidoVenda: null,
      TipoPedido: null,
      CodigoUsuario: null,
      NotaFiscal: null,
      Gaiola: null,
      DepositoErp: null,
      Cliente: null,
      descricaoPalete: null,
      descricaoCaixa: null,
      CodigoCodigoNivel1: null,
      CodigoCodigoNivel2: null,
      CodigoCodigoNivel3: null,
      CodigoCodigoNivel4: null,
      CodigoCodigoNivel5: null,
      CodigoLoja: null,
      lote: null,
      serie: null,
      enderecoVazio: false,
    }),
    method: "PATCH",
  }).then(r => r.json()).then(Response.json);
}
