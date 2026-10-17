import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

// Merchant-only (the customization picker): an open route would let anyone
// burn the Unsplash quota.
async function unauthorized() {
  const session = await getCurrentSession();
  return session?.user ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Unsplash's download-tracking links only: https://api.unsplash.com/photos/<id>/download?… */
function isUnsplashDownloadLocation(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "api.unsplash.com" &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/photos\/[^/]+\/download$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const denied = await unauthorized();
  if (denied) return denied;

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!query) return NextResponse.json({ results: [] });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey)
    return NextResponse.json({ error: "Unsplash غير مفعّل" }, { status: 500 });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${accessKey}` } },
  );

  if (!res.ok)
    return NextResponse.json({ error: "فشل البحث" }, { status: res.status });

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const denied = await unauthorized();
  if (denied) return denied;

  const { downloadLocation } = await request.json().catch(() => ({}));
  // Never send the access key to a URL we don't control (SSRF + key leak).
  if (!isUnsplashDownloadLocation(downloadLocation)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return NextResponse.json({ ok: false });

  await fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    redirect: "error",
  });

  return NextResponse.json({ ok: true });
}
