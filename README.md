# rnracing.org

Minimal static site for [rnracing.org](https://rnracing.org), built with [Astro](https://astro.build).

## Development

```bash
npm install
npm run dev
```

Build output goes to `docs/` for GitHub Pages:

```bash
npm run build
```

## Deploy

1. Run `npm run build` and commit the updated `docs/` folder to `main`.
2. In GitHub **Settings → Pages**, set source to `main` / `/docs`.
3. Custom domain `rnracing.org` is configured via `public/CNAME`.

## Structure

```
src/
├── components/       # NavBar, Footer, HomeScroll, PageHeader, etc.
│   └── crew/         # Crew page modal
├── data/             # Site constants (site.ts) and crew roster (crew.ts)
├── layouts/          # BaseLayout
├── lib/              # Theme toggle and home scroll helpers
├── pages/            # index, timeline, crew, who-we-are
└── styles/
    ├── global.css
    ├── home-scroll.css
    └── pages/        # Per-page styles (timeline, crew)
public/               # Static assets (frames, CNAME)
docs/                 # Built site (committed for GitHub Pages)
```
