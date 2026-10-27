"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { parseVideoUrl } from "@/lib/sharks/video";
import { cn } from "@/lib/utils";

/**
 * A vertical (9:16) reel. Until the visitor taps play, only a still is on the
 * page: no iframe, no video download, no sound. After the tap the provider's
 * own player (or a native <video> with controls) takes over.
 */
export default function ReelPlayer({
  url,
  poster,
  title,
  playLabel,
  className,
}: {
  url: string;
  poster: string | null;
  title: string;
  playLabel: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const video = parseVideoUrl(url);
  if (!video) return null;
  const still = poster ?? video.thumbnail;

  return (
    <div className={cn("relative aspect-9/16 w-full overflow-hidden rounded-[32px] bg-[#1d1d1f]", className)}>
      {playing ? (
        video.kind === "file" ? (
          <video src={video.src} poster={still ?? undefined} controls autoPlay playsInline preload="metadata" className="absolute inset-0 size-full bg-black object-contain">
            <track kind="captions" />
          </video>
        ) : (
          <iframe
            src={video.embedUrl}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        )
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full focus-visible:outline-none">
          {still && <Image src={still} alt="" fill sizes="(min-width: 768px) 420px, 80vw" className="object-cover" />}
          <span aria-hidden className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/30" />
          <span className="al-glass absolute left-1/2 top-1/2 grid size-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[#1d1d1f] transition-transform duration-300 ease-[cubic-bezier(0.28,0.11,0.32,1)] group-hover:scale-105 group-active:scale-95 group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-white dark:text-white">
            <Play className="ms-1 size-7 fill-current" strokeWidth={0} />
            <span className="sr-only">
              {playLabel}: {title}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
