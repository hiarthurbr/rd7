import { auth } from "@/lib/erp";

export async function GET() {
  console.log(await auth());
  // return fetch(`https://api-erp.rainhadassete.com.br/api/Propostas/vendas/vendas-perdidas?dataInicial=01%2F01%2F${new Date().getFullYear()}&dataFinal=31%2F12%2F${new Date().getFullYear()}&tipo=0`, {
  //   "headers": {
  //     "accept": "application/json, text/plain, */*",
  //     "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  //     "authorization": await auth(),
  //     "priority": "u=1, i",
  //     "Referer": "https://rainhaerp.rainhadassete.com.br/"
  //   },
  //   "body": null,
  //   "method": "GET"
  // })
  //   .then((r) => r.json())
  //   .then(Response.json).catch(console.log);
}
