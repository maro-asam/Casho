// Provider-neutral video references for Sharks stories. Videos live on an
// external host (YouTube, Vimeo, or a direct file URL such as Cloudinary) —
// never in the repo. The player only mounts after the visitor taps play.

export type ParsedVideo =
  | { kind: "youtube"; id: string; embedUrl: string; thumbnail: string }
  | { kind: "vimeo"; id: string; embedUrl: string; thumbnail: null }
  | { kind: "file"; src: string; thumbnail: null };

const FILE_EXT = /\.(mp4|webm|m4v|mov)(\?.*)?$/i;

export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    else if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
      id = m?.[2] ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return {
      kind: "youtube",
      id,
      // No cookies until play; modest branding; no related videos from other channels.
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,12})/)?.[1];
    if (!id) return null;
    return { kind: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1&dnt=1`, thumbnail: null };
  }

  if (FILE_EXT.test(url.pathname)) return { kind: "file", src: url.toString(), thumbnail: null };

  return null;
}
