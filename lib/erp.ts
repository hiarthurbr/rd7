import { uuidv7 } from "uuidv7";
import z from "zod";
import { produto_titanium_schema, status_proposta_pda_schema } from "./schemas";
import { fmt_date } from "./utils";

import { webcrypto } from "node:crypto";

const { subtle, getRandomValues } = webcrypto;

function base64url(bytes: Uint8Array) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBase64url(length: number) {
  return base64url(getRandomValues(new Uint8Array(length)));
}

async function sha256Base64url(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(hash));
}

async function generateDpopJkt() {
  // Gera uma nova chave DPoP a cada execução
  const { publicKey } = await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign", "verify"],
  );

  const jwk = await subtle.exportKey("jwk", publicKey);

  const { kty, crv, x, y } = jwk;

  if (!kty || !crv || !x || !y) {
    throw new Error("Chave DPoP sem os campos EC esperados.");
  }

  // Mantém exatamente a representação usada pela função original
  const publicJwk = JSON.stringify({
    crv,
    kty,
    x,
    y,
  });

  return sha256Base64url(publicJwk);
}

export async function auth() {
  const verifier = randomBase64url(32);

  const challenge = await sha256Base64url(verifier);

  const state = randomBase64url(16);

  const dpop_jkt = await generateDpopJkt();

  return {
    verifier,
    challenge,
    state,
    dpop_jkt,
  };
}

export async function getDisponivel(item: string) {
  const schema = z.object({
    data: z.array(produto_titanium_schema),
    pageNumber: z.int(),
    pageSize: z.int(),
    totalRecords: z.int(),
    totalPages: z.int(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  });

  const now = new Date();
  const past_month = new Date(now.getTime() - 2592000000);
  return fetch(
    `https://api-erp.rainhadassete.com.br/api/Mrp/planning-bom-paged?principalPartNumber=${item}&periodStart=${fmt_date(past_month)}&periodEnd=${fmt_date(now)}&pageNumber=1&pageSize=10`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((r) => r.json())
    .then(schema.parseAsync)
    .then((r) => r.data.find((i) => i.produto === item)?.estoque);
}

export async function getPropostas() {
  return fetch(
    "https://api-erp.rainhadassete.com.br/api/expedicao/propostas-status-pda",
    {
      headers: {
        accept: "application/json, text/plain, */*",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((r) => r.json())
    .then(status_proposta_pda_schema.array().parseAsync);
}

export async function getVendaPerdida() {
  const schema = z.array(
    z
      .object({
        codigoProduto: z.int(),
        partnumberProduto: z.string(),
        pcp: z.coerce.number(),
        quantidadeItemProposta: z.number(),
        numeroProposta: z.string(),
        nomeMotivo: z.string(),
        dataVendaPerdida: z.string(),
        descricaoHistorico: z.string(),
        horaVendaPerdida: z.string(),
        tipo: z.string(),
        valorUnitario: z.number(),
        valorTotal: z.number(),
      })
      .transform(({ dataVendaPerdida, horaVendaPerdida, ...v }) => ({
        momentoVendaPerdida: new Date(
          `${dataVendaPerdida.trim().split("/").reverse().join("-")}T${horaVendaPerdida.trim()}`,
        ),
        uuid: uuidv7(),
        ...v,
      })),
  );

  return fetch(
    "https://api-erp.rainhadassete.com.br/api/Propostas/vendas/vendas-perdidas?dataInicial=01%2F01%2F2026&dataFinal=31%2F12%2F2026",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((r) => r.json())
    .then(schema.parseAsync);
}
