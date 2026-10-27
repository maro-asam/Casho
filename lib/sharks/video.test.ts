import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "./video";

describe("parseVideoUrl", () => {
  it("reads YouTube Shorts, watch and short links into a no-cookie embed", () => {
    for (const url of ["https://www.youtube.com/shorts/abcDEF12345", "https://youtube.com/watch?v=abcDEF12345", "https://youtu.be/abcDEF12345"]) {
      const v = parseVideoUrl(url);
      expect(v?.kind).toBe("youtube");
      expect(v && v.kind === "youtube" && v.embedUrl).toContain("youtube-nocookie.com/embed/abcDEF12345");
    }
  });

  it("reads Vimeo and direct files", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789")?.kind).toBe("vimeo");
    expect(parseVideoUrl("https://res.cloudinary.com/demo/video/upload/v1/reel.mp4")?.kind).toBe("file");
  });

  it("rejects anything else", () => {
    expect(parseVideoUrl("http://youtube.com/shorts/abcDEF12345")).toBeNull(); // not https
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseVideoUrl("https://example.com/page")).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/shorts/<script>")).toBeNull();
    expect(parseVideoUrl("")).toBeNull();
  });
});
