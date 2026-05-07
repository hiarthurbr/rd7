import { z } from "zod";

const _debug = false;
function debug(...data: any[]): void {
  if (_debug) console.debug(...data);
}

const TOKEN_KEY = "PDA:TOKEN";

const token_schema = z.object({
  authenticated: z.boolean(),
  created: z.coerce.date(),
  expiration: z.coerce.date(),
  accessToken: z.string(),
  refreshToken: z.uuidv4(),
});

export async function getToken() {
  const curr_token = token_schema.parse(localStorage.getItem(TOKEN_KEY));
  if (new Date() > new Date(curr_token.expiration)) {
    console.log("Refreshing token...");
    await fetch("https://api.pdahub.com.br/api/Autenticacao", {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ Login: "arthur.bufalo" }),
      method: "POST",
    })
      .then((r) => r.json())
      .then((token) => {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
      });
  }
  return `Bearer ${curr_token.accessToken}`;
}
