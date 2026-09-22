import type { NextRequest } from "next/server";
import z from "zod";

const ParamsSchema = z.object({
  challenge: z.string(),
  state: z.string(),
  dpop: z.string(),
});

export async function GET(req: NextRequest) {
  // console.log(req.nextUrl.searchParams);
  // const params = ParamsSchema.safeParse(
  //   Object.fromEntries(Array.from(req.nextUrl.searchParams.entries())),
  // );

  // if (!params.success) return new Response(JSON.stringify(params.error, null, 2), { status: 400 });

  return fetch("https://api-erp.rainhadassete.com.br/api/expedicao/notas-kanban", {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "pt-BR,pt;q=0.9",
      "cache-control": "no-cache",
      dnt: "1",
      origin: "https://rainhaerp.rainhadassete.com.br",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://rainhaerp.rainhadassete.com.br/",
      "sec-ch-ua": `"Google Chrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"`,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
    },
    referrer: "https://rainhaerp.rainhadassete.com.br/",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  })
    .then((r) => r.json())
    .then(Response.json)
    .catch((e) => console.log(e) || new Response(JSON.stringify(e, null, 2), { status: 500 }));
}
