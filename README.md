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
├── components/   # NavBar, Footer, PageHeader, ActionCard, etc.
├── data/         # Site constants and team roster
├── layouts/      # BaseLayout
├── lib/          # Theme toggle helpers
├── pages/        # Routes
└── styles/       # Global CSS
public/           # Static assets copied to build output
docs/             # Built site (committed for GitHub Pages)
```
