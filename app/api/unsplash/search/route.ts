import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
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
  const { downloadLocation } = await request.json();
  if (!downloadLocation) return NextResponse.json({ ok: false });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return NextResponse.json({ ok: false });

  await fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  return NextResponse.json({ ok: true });
}
