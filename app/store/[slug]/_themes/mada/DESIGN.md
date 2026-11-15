# Mada (مدى) — design notes

Premium, modular commerce: chalk canvas, pine green with a chartreuse signal (`--accent`, a second color the merchant changes under advanced colors — it does not follow the primary), softly rounded media, pill controls, Alexandria display type. Scoped to `.theme-mada` / `.md-portal` in `mada.css`.

## The Studio drives the layout

Mada's own look is what its preset sets: navbar `default`, hero `fullscreen`, card `default`, categories `square`, buttons `pill`, density `default`.

| Studio setting | Effect |
|---|---|
| Navbar `default` (own) / `centered` / `compact` | mark · links · actions / links · mark · actions / mark · shop menu + a wide search field · actions (phones get the field under the bar) |
| Hero `fullscreen` (own) / `compact` / `split` / `minimal` | the banner slideshow / the same at a band's height / the pine panel beside the lead banner's photo / type on the canvas. No banners → the pine panel with a collage of real products |
| Product card `default` (own) / `minimal` / `bold` / `elegant` | the tile as built / photo, name, price (sale and sold-out badges only) / a raised surface tile, display name, price on a signal chip / centered quiet copy (`[data-card]`, hooks `.md-card*`) |
| Category shape `square` (own) / `circle` / `pill` | the bento / round photos in a row / image chips |
| Buttons | `--md-btn-r` ← `--store-btn-radius` |
| Image ratio, grid columns | `--store-img-ratio`, `--store-grid-cols` (listing); the home's curated grids keep their layout |
| Density | `[data-density]` → `--md-section`, `.md-grid` gaps |
| Motion `none` | `[data-motion="none"]` drops slides, the marquee, reveals and image swaps (`shared/motion.ts` for the slideshow) |
