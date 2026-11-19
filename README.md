# Neon Coast — Duo Hero Cover Studio

A free offline web app that turns any photo into GTA-style poster cover art:
a big duo hero photo, a strip of panels, bold gradient lettering and a
sunset-or-neon colour grade — exported as a PNG to share.

Made for the make.fun bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## What it does

- **5 one-click poster presets** — Sunset Duo (the default), Neon Harbour,
  Sunset Chase, Gold Hour, Vice Nights. Each is its own poster: own hero
  photo, title, tagline and grade.
- **7 layouts** — Poster Hero, Hero + 8, Hero + 3, 9-Panel Grid, Full-Bleed,
  Tilted Snaps, Classic Poster.
- **6 colour grades** — Sunset, Neon, Gold Hour, Vice Nights, Teal Dusk,
  Warm Mono, applied as soft-light washes over the photos.
- **Any photo** — 17 built-in sample photos, or add your own from your
  machine. Click a panel to select it, drag it to move the photo, scroll on
  it to zoom, or use the crop sliders. One photo can fill several panels.
- **Words** — edit the title, tagline and script line; heat stars, corner
  badge, film grain and vignette toggles.
- **Undo / redo, shuffle**, and **PNG export** in 1080×1080, 1080×1350,
  1920×1080 and 1080×1920.
- **Offline** — static files under `app/`, no network request, photos never
  leave the machine.

## The art

All 17 sample photos were made with an image model for this app. The people
in them are fictional originals — not characters from any game, and no names
or claims about game characters appear anywhere in the app. No Rockstar
Games logo, artwork or font is used. Lettering is Anton and Pacifico,
shipped under the SIL Open Font License (see `app/fonts/`).

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the kit's vendored
`buildDossier` library.

## License

MIT — see `LICENSE`.
