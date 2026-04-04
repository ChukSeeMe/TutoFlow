import { type NextRequest, NextResponse } from "next/server";

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  // Read env var per-request — guarantees runtime value in standalone mode
  const backend = (process.env.BACKEND_INTERNAL_URL || "http://backend:8000").replace(/\/$/, "");
  const { path } = await ctx.params;
  const url = `${backend}/${path.join("/")}${req.nextUrl.search ?? ""}`;

  // Forward headers, stripping hop-by-hop headers that must not be proxied.
  // Forwarding "connection: keep-alive" to an upstream HTTPS fetch causes
  // Node.js undici to fail with "fetch failed" on POST/PATCH/DELETE requests.
  const HOP_BY_HOP = new Set(["host", "connection", "keep-alive", "te", "trailer", "transfer-encoding", "upgrade", "proxy-authorization", "proxy-authenticate"]);
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (!HOP_BY_HOP.has(k)) headers[k] = v; });

  // Read body once upfront (GET/HEAD have no body)
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();

  async function doFetch(targetUrl: string): Promise<Response> {
    return fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // Never auto-follow — Node.js drops Authorization on redirect
      redirect: "manual",
    });
  }

  try {
    let upstream = await doFetch(url);

    // FastAPI redirects /foo → /foo/ (or vice versa) and Node.js drops the
    // Authorization header when following redirects. Re-issue manually.
    if ([301, 302, 307, 308].includes(upstream.status)) {
      const location = upstream.headers.get("location");
      if (location) {
        const redirectUrl = location.startsWith("http")
          ? location
          : `${backend}${location}`;
        upstream = await doFetch(redirectUrl);
      }
    }

    const outHeaders: Record<string, string> = {};
    upstream.headers.forEach((v, k) => { if (k !== "transfer-encoding") outHeaders[k] = v; });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[proxy] ${req.method} ${url} →`, msg);
    return NextResponse.json({ detail: `Proxy error: ${msg}` }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxy(req, ctx); }
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxy(req, ctx); }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxy(req, ctx); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxy(req, ctx); }
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxy(req, ctx); }
