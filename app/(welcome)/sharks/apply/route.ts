import { NextResponse, type NextRequest } from "next/server";

/**
 * "Apply" from the marketing site → the application inside the merchant app
 * (app.casho.store/sharks, which the proxy serves from /dashboard/sharks and
 * sends to /login first when there's no session). Dev mirrors the proxy: the
 * session cookie lives on app.localhost.
 */
export function GET(req: NextRequest) {
  const root = process.env.ROOT_DOMAIN || "casho.store";
  if (process.env.NODE_ENV !== "production") {
    const port = req.nextUrl.port ? `:${req.nextUrl.port}` : "";
    return NextResponse.redirect(`http://app.localhost${port}/sharks`);
  }
  return NextResponse.redirect(`https://app.${root}/sharks`);
}
