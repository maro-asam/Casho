# Classic — design notes

The default storefront theme (preset `default`): neutral, product-first, the merchant's colors on plain surfaces. Everything is scoped to `.theme-classic` in `classic.css`.

## The Studio drives the layout

Classic's own look is what its preset sets: navbar `default`, hero `fullscreen`, card `default`, categories `square`, buttons `rounded`, density `default`.

| Studio setting | Effect |
|---|---|
| Navbar `default` / `centered` / `compact` | `header/ClassicHeader.tsx` |
| Hero `fullscreen` / `split` / `compact` / `minimal` | `home/HeroCarousel.tsx`; `minimal` (or no banners) is the type + product collage block in `ClassicHome` |
| Product card `default` / `minimal` / `bold` / `elegant` | the card as built / square photo, one quiet line / a raised tile with the price in the brand color / centered, add button on hover (`[data-card]`, hooks `.c-card*`) |
| Category shape | `home/CategoryRail.tsx` |
| Buttons | `--c-btn-radius` ← `--store-btn-radius` |
| Image ratio, grid columns | `--store-img-ratio`, `--store-grid-cols` |
| Density | `[data-density]` → `--c-section-y`, `--c-grid-x/y` |
| Motion `none` | `[data-motion="none"]` stops transitions and the card zoom; the slideshow doesn't autoplay (`shared/motion.ts`) |
| Colors | the primary also re-tints `--accent` (`brandAccent` preset) for shared sections |
