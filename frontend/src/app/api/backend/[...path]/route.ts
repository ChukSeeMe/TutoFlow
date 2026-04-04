import { type NextRequest, NextResponse } from "next/server";

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const backend = (process.env.BACKEND_INTERNAL_URL || "http://backend:8000").replace(/\/$/, "");
  const { path } = await ctx.params;

  // Next.js strips trailing slashes from catch-all params — re-add them so
  // FastAPI routes match exactly and never need to issue a redirect.
  const trailingSlash = req.nextUrl.pathname.endsWith("/") ? "/" : "";
  const url = `${backend}/${path.join("/")}${trailingSlash}${req.nextUrl.search ?? ""}`;

  // Strip hop-by-hop headers that must not be forwarded to an upstream HTTP/2 server.
  const HOP_BY_HOP = new Set([
    "host", "connection", "keep-alive", "te", "trailer",
    "transfer-encoding", "upgrade", "proxy-authorization", "proxy-authenticate",
  ]);
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (!HOP_BY_HOP.has(k)) headers[k] = v; });

  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();

  try {
    // Use follow (default) so Node.js handles any residual redirects automatically.
    // The URL already has the correct trailing slash so FastAPI won't redirect.
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: "follow",
    });

    const outHeaders: Record<string, string> = {};
    upstream.headers.forEach((v, k) => {
      if (k !== "transfer-encoding") outHeaders[k] = v;
    });

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
