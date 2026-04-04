/**
 * Runtime proxy for /api/backend/* → BACKEND_INTERNAL_URL/*
 *
 * next.config.ts rewrites are compiled at build time in standalone mode,
 * so BACKEND_INTERNAL_URL cannot be injected at runtime via rewrites.
 * This API route reads the env var fresh on every request.
 */
import { type NextRequest, NextResponse } from "next/server";

const BACKEND = (
  process.env.BACKEND_INTERNAL_URL || "http://backend:8000"
).replace(/\/$/, "");

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const search = req.nextUrl.search ?? "";
  const url = `${BACKEND}/${path}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Don't forward host header — backend sees its own host
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : req.body;

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
      // @ts-expect-error — Node.js fetch supports duplex
      duplex: "half",
    });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      // Don't forward transfer-encoding — Next.js handles it
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

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
