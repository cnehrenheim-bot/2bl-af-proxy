
import type { Config } from "@netlify/functions";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-AF-Client-Id, X-AF-Client-Secret",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS });
  }

  const url = new URL(req.url);
  const clientId = req.headers.get("X-AF-Client-Id");
  const clientSecret = req.headers.get("X-AF-Client-Secret");

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Missing credentials" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Support next_url parameter for pagination
  const nextUrl = url.searchParams.get("next_url");
  let afUrl: string;

  if (nextUrl) {
    // Use the full AppFolio next_page_url directly
    afUrl = nextUrl;
  } else {
    const endpoint = url.searchParams.get("endpoint") || "work_order_list.json";
    const afBase = new URL(`https://twobliving.appfolio.com/api/v1/reports/${endpoint}`);
    url.searchParams.forEach((val, key) => {
      if (key !== "endpoint" && key !== "next_url") afBase.searchParams.set(key, val);
    });
    afUrl = afBase.toString();
  }

  try {
    const afRes = await fetch(afUrl, {
      headers: {
        "Authorization": "Basic " + btoa(`${clientId}:${clientSecret}`),
        "Accept": "application/json",
      },
    });
    const data = await afRes.text();
    return new Response(data, {
      status: afRes.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/af-proxy",
  method: ["GET", "POST", "OPTIONS"],
};
