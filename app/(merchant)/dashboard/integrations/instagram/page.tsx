import { redirect } from "next/navigation";

/** Connecting Instagram moved into the single Instagram page; keeps `?success` / `?error` from older OAuth redirects. */
export default async function InstagramIntegrationRedirect({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries((await searchParams) ?? {})) {
    if (typeof value === "string") query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/instagram?${qs}` : "/instagram");
}
