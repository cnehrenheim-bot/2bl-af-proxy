import type { Config } from "@netlify/functions";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-AF-Client-Id, X-AF-Client-Secret",
};

export default async (req: Request) => {
  // Always handle OPTIONS preflight
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

  const endpoint = url.searchParams.get("endpoint") || "work_order_list.json";
  const afUrl = new URL(`https://twobliving.appfolio.com/api/v1/reports/${endpoint}`);
  
  url.searchParams.forEach((val, key) => {
    if (key !== "endpoint") afUrl.searchParams.set(key, val);
  });

  try {
    const afRes = await fetch(afUrl.toString(), {
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
