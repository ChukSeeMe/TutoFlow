/**
 * Runtime proxy for /api/backend/* → BACKEND_INTERNAL_URL/*
 *
 * next.config rewrites() are evaluated at build time in standalone mode —
 * BACKEND_INTERNAL_URL is not available then. This API route reads it
 * fresh on every request (true runtime env var access).
 *
 * Note: Next.js 15 makes params a Promise — must be awaited.
 */
import { type NextRequest, NextResponse } from "next/server";

const BACKEND = (
  process.env.BACKEND_INTERNAL_URL || "http://backend:8000"
).replace(/\/$/, "");

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const search = req.nextUrl.search ?? "";
  const url = `${BACKEND}/${pathStr}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
    });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[proxy] Failed to reach backend:", url, err);
    return NextResponse.json(
      { detail: "Backend unreachable" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
