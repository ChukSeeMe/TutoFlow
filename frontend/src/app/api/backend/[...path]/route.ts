import { type NextRequest, NextResponse } from "next/server";

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  // Read env var per-request — guarantees runtime value in standalone mode
  const backend = (process.env.BACKEND_INTERNAL_URL || "http://backend:8000").replace(/\/$/, "");
  const { path } = await ctx.params;
  // Next.js strips trailing slashes from catch-all params, but FastAPI requires them.
  // Always append "/" to avoid 307 redirects that drop the Authorization header.
  const url = `${backend}/${path.join("/")}/${req.nextUrl.search ?? ""}`;

  // Forward all headers except host
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (k !== "host") headers[k] = v; });

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    });

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
