import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-AF-Client-Id, X-AF-Client-Secret",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const clientId     = req.headers.get("X-AF-Client-Id");
    const clientSecret = req.headers.get("X-AF-Client-Secret");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const endpoint = url.searchParams.get("endpoint") || "work_order_list.json";
    const pageSize  = url.searchParams.get("page_size") || "500";
    const page      = url.searchParams.get("page") || "1";

    const afUrl = new URL(`https://twobliving.appfolio.com/api/v1/reports/${endpoint}`);
    afUrl.searchParams.set("paginate_results", "true");
    afUrl.searchParams.set("page_size", pageSize);
    afUrl.searchParams.set("page", page);

    url.searchParams.forEach((val, key) => {
      if (!["endpoint", "page_size", "page"].includes(key)) {
        afUrl.searchParams.set(key, val);
      }
    });

    const credentials = btoa(`${clientId}:${clientSecret}`);
    const afRes = await fetch(afUrl.toString(), {
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json",
      },
    });

    const data = await afRes.text();

    return new Response(data, {
      status: afRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-AF-Client-Id, X-AF-Client-Secret",
      },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};

export const config: Config = {
  path: "/af-proxy",
};
