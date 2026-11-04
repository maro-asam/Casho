import type { StoreThemeId } from "@/constants/store-themes";

// ─── 1. Default ───────────────────────────────────────────────────
function DefaultThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="flex h-7 items-center justify-between border-b bg-white px-2.5">
        <div className="h-3 w-10 rounded-sm bg-blue-500/30" />
        <div className="flex gap-1.5">
          <div className="h-1.5 w-7 rounded-full bg-gray-200" />
          <div className="h-1.5 w-7 rounded-full bg-gray-200" />
        </div>
        <div className="h-5 w-6 rounded-md bg-gray-100" />
      </div>
      <div className="mx-2 mt-2 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700" />
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="aspect-square rounded-xl bg-gray-100" />
            <div className="h-1.5 rounded-full bg-gray-200" />
            <div className="h-1.5 w-2/3 rounded-full bg-blue-400/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. Riwaq ─────────────────────────────────────────────────────
function RiwaqThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f2ece1]">
      <div className="flex h-7 items-center justify-between border-b border-[#1d1a16] px-2.5">
        <div className="h-1.5 w-7 rounded-full bg-[#1d1a16]/30" />
        <div className="h-2.5 w-12 bg-[#1d1a16]" />
        <div className="h-1.5 w-7 rounded-full bg-[#1d1a16]/30" />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2 px-2.5 pt-2">
        <div className="space-y-1 pb-1">
          <div className="h-2.5 w-4/5 bg-[#1d1a16]" />
          <div className="h-2.5 w-3/5 bg-[#1d1a16]" />
          <div className="mt-1.5 h-2.5 w-8 bg-[#a8432a]" />
        </div>
        <div className="h-14 w-10 rounded-t-full bg-[#d8c7b0]" />
      </div>
      <div className="mt-2 grid grid-cols-3 border-t border-[#d6ccbb]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1 border-s border-[#d6ccbb] p-1.5 first:border-s-0">
            <div className="aspect-[3/4] bg-[#eae3d6]" />
            <div className="h-1 w-3/4 bg-[#1d1a16]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Mada ──────────────────────────────────────────────────────
function MadaThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f7f7f4]">
      <div className="flex h-7 items-center justify-between bg-white px-2.5">
        <div className="h-2.5 w-10 rounded-full bg-[#123b30]" />
        <div className="flex gap-1">
          <div className="h-1.5 w-6 rounded-full bg-gray-300" />
          <div className="h-1.5 w-6 rounded-full bg-gray-300" />
        </div>
        <div className="h-4 w-8 rounded-full bg-[#123b30]" />
      </div>
      <div className="relative mx-2 mt-2 h-14 overflow-hidden rounded-xl bg-[#2c4a40]">
        <div className="absolute bottom-2 start-2 h-2 w-14 rounded-full bg-white/90" />
        <div className="absolute bottom-2 end-2 h-3 w-8 rounded-full bg-[#d5ee6a]" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="relative aspect-[3/4] rounded-lg bg-[#eceee8]">
              {i === 0 && <div className="absolute start-1 top-1 h-1.5 w-4 rounded-full bg-[#d5ee6a]" />}
            </div>
            <div className="h-1.5 w-3/4 rounded-full bg-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Casho Dune ────────────────────────────────────────────────
function DuneThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f7f7f7]">
      <div className="h-2 bg-[#785c43]" />
      <div className="relative h-16 bg-[#5d5248]">
        <div className="absolute inset-x-2.5 top-1.5 flex items-center justify-between">
          <div className="h-2 w-8 rounded-sm bg-white/90" />
          <div className="flex gap-1">
            <div className="h-1 w-5 rounded-full bg-white/70" />
            <div className="h-1 w-5 rounded-full bg-white/70" />
          </div>
          <div className="size-2 rounded-full bg-white/80" />
        </div>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-1">
          <div className="h-2 w-16 bg-white/90" />
          <div className="h-2.5 w-9 rounded-full bg-white" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative aspect-square w-full bg-[#f0eee9]">
              {i === 0 && <div className="absolute start-0 top-0 h-1.5 w-4 bg-[#8b6f47]" />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#2a2a28]/40" />
            <div className="h-1 w-1/3 rounded-full bg-[#5a4a42]/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Maximize ──────────────────────────────────────────────────
function MaximizeThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="h-2 bg-gradient-to-l from-[#0b7f6f] to-[#075e52]" />
      <div className="flex items-center gap-1.5 px-2.5 pt-2">
        <div className="h-3 w-6 rounded-sm bg-[#0b7f6f]" />
        <div className="h-2 w-8 rounded-sm bg-[#100f0f]/80" />
        <div className="h-3 flex-1 rounded-sm border border-[#e7e7ea] bg-[#f4f4f5]" />
        <div className="size-2 rounded-full bg-[#100f0f]/70" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2.5 pb-1.5">
        <div className="relative col-span-2 h-12 rounded-md bg-[#171a22]">
          <div className="absolute bottom-2 start-2 h-1.5 w-10 rounded-full bg-white/90" />
          <div className="absolute end-2 top-0 h-4 w-3 rounded-b-full bg-[#b3232c]" />
        </div>
        <div className="h-12 rounded-md bg-[#e3f4f1]" />
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-2.5 pb-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="relative aspect-square rounded-md bg-[#f4f4f5]">
              {i === 1 && <div className="absolute start-0.5 top-0.5 h-1.5 w-3 rounded-sm bg-[#fde7ea]" />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#100f0f]/40" />
            <div className={`h-1 w-1/2 rounded-full ${i === 1 ? "bg-[#d0202e]/70" : "bg-[#100f0f]/60"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CelloThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f8f8f8]">
      <div className="h-2 bg-[#0a2a6e]" />
      <div className="flex items-center gap-1.5 bg-white px-2.5 py-2">
        <div className="h-2.5 w-7 rounded-sm bg-[#1447e6]" />
        <div className="h-3 flex-1 rounded-sm bg-[#eceef1]" />
        <div className="h-3 w-5 rounded-sm bg-[#fdc500]" />
      </div>
      <div className="h-12 bg-gradient-to-l from-[#0a2a6e] to-[#1447e6]" />
      <div className="grid grid-cols-4 gap-1.5 p-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-md bg-white p-1">
            <div className="relative aspect-square rounded-sm bg-[#f1f2f4]">
              {i < 2 && <div className={`absolute start-0.5 top-0.5 h-1.5 w-3 rounded-sm ${i === 0 ? "bg-[#d92d20]" : "bg-[#1447e6]"}`} />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#202020]/40" />
            <div className="h-1 w-1/2 rounded-full bg-[#202020]/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7. Casho Medical ─────────────────────────────────────────────
function MedicalThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#f4f8f8]">
      <div className="h-2 bg-[#063c41]" />
      <div className="flex items-center gap-1.5 bg-white px-2.5 py-2">
        <div className="grid size-3 place-items-center rounded-[3px] bg-[#0a6c74]">
          <div className="h-0.5 w-1.5 bg-white" />
        </div>
        <div className="h-3 flex-1 rounded-full border border-[#0a6c74]/30 bg-white" />
        <div className="h-3 w-5 rounded-full bg-[#e3f3f1]" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-2">
        <div className="col-span-2 h-11 rounded-lg bg-gradient-to-l from-[#0a6c74] to-[#0d8f8f]" />
        <div className="h-11 rounded-lg bg-[#063c41]" />
      </div>
      <div className="flex justify-between px-2.5 pt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="size-3.5 rounded-full bg-[#e3f3f1] ring-1 ring-[#0a6c74]/20" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 p-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-md border border-[#d9e6e6] bg-white p-1">
            <div className="relative aspect-square rounded-sm bg-[#eef6f5]">
              {i === 0 && <div className="absolute start-0.5 top-0.5 h-1.5 w-3 rounded-full bg-[#d42a4a]" />}
            </div>
            <div className="h-1 w-3/4 rounded-full bg-[#0f2a2e]/40" />
            <div className="h-1.5 w-full rounded-full bg-[#0a6c74]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 8. Casho Gym ─────────────────────────────────────────────────
function GymThemePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-[#0b0b0d]">
      <div className="h-1.5 bg-[#e10600]" />
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="h-2 w-8 -skew-x-12 bg-white/90" />
        <div className="h-2.5 w-5 -skew-x-12 bg-[#e10600]" />
      </div>
      <div className="relative grid h-16 grid-cols-2 items-center gap-2 overflow-hidden px-2.5">
        <div className="space-y-1">
          <div className="h-2.5 w-full rounded-[1px] bg-[#f5f3ef]" />
          <div className="h-2.5 w-2/3 rounded-[1px] bg-[#f5f3ef]" />
          <div className="mt-1 h-2 w-7 -skew-x-12 bg-[#e10600]" />
        </div>
        <div className="relative h-full">
          <div className="absolute inset-y-[-4px] start-1/3 end-[20%] -skew-x-12 bg-[#e10600]" />
          <div className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-[2px] bg-[#ecebe7]" />
        </div>
      </div>
      <div className="h-2 -rotate-1 scale-105 bg-[#e10600]" />
      <div className="grid grid-cols-4 gap-1.5 p-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-[2px] border border-white/10 bg-[#151518]">
            <div className="aspect-square bg-[#ecebe7]" />
            <div className="mx-1 h-1 rounded-full bg-white/40" />
            <div className="mx-1 mb-1 h-1.5 -skew-x-12 bg-[#e10600]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 9. Casho Market ──────────────────────────────────────────────
function MarketThemePreview() {
  const aisles = ["#34c759", "#ff9230", "#0088ff", "#ff383c"];
  return (
    <div className="relative overflow-hidden rounded-xl border bg-white">
      <div className="mx-2 mt-1.5 flex items-center justify-between rounded-full bg-[#f5f5f7] px-2 py-1">
        <div className="h-1.5 w-7 rounded-full bg-[#1d1d1f]" />
        <div className="size-2.5 rounded-full bg-[#f26a00]" />
      </div>
      <div className="mx-2 mt-1.5 h-12 rounded-[10px] bg-[#1d1d1f] p-2">
        <div className="h-2 w-1/2 rounded-full bg-white/90" />
        <div className="mt-1 h-2 w-8 rounded-full bg-[#f26a00]" />
      </div>
      <div className="flex justify-between gap-1.5 px-2.5 pt-1.5">
        {aisles.map((c) => (
          <div key={c} className="aspect-square flex-1 rounded-[6px]" style={{ background: c }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="relative rounded-[7px] bg-[#f5f5f7] p-1">
            <div className="aspect-square rounded-[5px] bg-white" />
            <div className="absolute bottom-3 end-1.5 size-2.5 rounded-full bg-[#f26a00]" />
            <div className="mt-1 h-1 w-3/4 rounded-full bg-[#1d1d1f]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 10. Casho Stage ──────────────────────────────────────────────
function StageThemePreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-white">
      <div className="flex h-3.5 items-center justify-center gap-1.5 bg-[#fbfbfd]/90 px-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[3px] w-3 rounded-full bg-[#1d1d1f]/45" />
        ))}
      </div>
      <div className="flex flex-col items-center bg-[#f5f5f7] px-2 pt-2">
        <div className="h-2.5 w-2/5 rounded-full bg-[#1d1d1f]" />
        <div className="mt-1 h-1 w-1/3 rounded-full bg-[#1d1d1f]/35" />
        <div className="mt-1.5 flex gap-1">
          <div className="h-2 w-6 rounded-full bg-[#0071e3]" />
          <div className="h-2 w-6 rounded-full border border-[#0071e3]" />
        </div>
        <div className="mt-1.5 h-6 w-1/2 rounded-t-[8px] bg-white shadow-[0_-4px_10px_rgba(0,0,0,.06)]" />
      </div>
      <div className="grid grid-cols-2 gap-1 p-1">
        <div className="flex h-11 flex-col items-center rounded-[6px] bg-black pt-1.5">
          <div className="h-1.5 w-1/2 rounded-full bg-white/90" />
          <div className="mt-1 h-1 w-1/3 rounded-full bg-[#2997ff]" />
        </div>
        <div className="flex h-11 flex-col items-center rounded-[6px] bg-[#f5f5f7] pt-1.5">
          <div className="h-1.5 w-1/2 rounded-full bg-[#1d1d1f]" />
          <div className="mt-1 h-1 w-1/3 rounded-full bg-[#0071e3]" />
        </div>
      </div>
    </div>
  );
}

// ─── 11. Casho Qirat ──────────────────────────────────────────────
function QiratThemePreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-[#fbf9f5]">
      <div className="h-2 bg-[#16120e]" />
      <div className="flex h-6 items-center justify-between border-b border-[#e6dccd] px-2.5">
        <div className="h-1 w-6 rounded-full bg-[#1f1a14]/25" />
        <div className="h-1.5 w-12 rounded-full bg-[#1f1a14]" />
        <div className="flex gap-1">
          <div className="size-1.5 rounded-full bg-[#1f1a14]/40" />
          <div className="size-1.5 rounded-full bg-[#1f1a14]/40" />
        </div>
      </div>
      <div className="relative mx-2 mt-2 flex h-12 flex-col items-center justify-end bg-gradient-to-t from-[#2a2117] to-[#8a7458] pb-1.5">
        <div className="h-1.5 w-1/3 rounded-full bg-white/90" />
        <div className="mt-1 flex items-center gap-1">
          <div className="h-px w-3 bg-[#d8bd8a]" />
          <div className="size-1 rotate-45 bg-[#d8bd8a]" />
          <div className="h-px w-3 bg-[#d8bd8a]" />
        </div>
      </div>
      <div className="flex justify-center gap-2 pt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="size-4 rounded-full bg-[#efe8dd] ring-1 ring-[#b08d57] ring-offset-1 ring-offset-[#fbf9f5]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="aspect-[3/4] w-full bg-[radial-gradient(circle_at_50%_40%,#ffffff,#efe8dd)]" />
            <div className="h-1 w-2/3 rounded-full bg-[#1f1a14]/40" />
            <div className="h-1 w-1/3 rounded-full bg-[#b08d57]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
/** Schematic thumbnail of each theme (no images, so it renders instantly). */
export const THEME_PREVIEWS: Record<StoreThemeId, React.FC> = {
  default: DefaultThemePreview,
  riwaq: RiwaqThemePreview,
  mada: MadaThemePreview,
  dune: DuneThemePreview,
  maximize: MaximizeThemePreview,
  cello: CelloThemePreview,
  medical: MedicalThemePreview,
  gym: GymThemePreview,
  market: MarketThemePreview,
  stage: StageThemePreview,
  qirat: QiratThemePreview,
};
