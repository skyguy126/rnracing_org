# rnracing.org

Minimal static site for [rnracing.org](https://rnracing.org), built with [Astro](https://astro.build).

## Stack

- **Astro** — static site generator (zero JS shipped by default)
- **Classic GitHub Pages** — deploy from the `main` branch `/docs` folder
- No GitHub Actions

## Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Build the site (outputs to `docs/`):

   ```bash
   npm run build
   ```

2. Commit and push the updated `docs/` folder to `main`.

3. In the GitHub repo, go to **Settings → Pages** and configure:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/docs`

4. Under **Custom domain**, set `rnracing.org` (the `public/CNAME` file is included in the build).

5. Point your domain's DNS to GitHub Pages:
   - `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Or a `CNAME` record → `<username>.github.io`

## Project structure

```
├── docs/              # Built site (committed for GitHub Pages)
├── public/            # Static assets (CNAME, favicon, etc.)
├── src/
│   ├── layouts/       # Page layouts
│   ├── pages/         # Routes (index.astro → /)
│   └── styles/        # Global CSS
├── astro.config.mjs
└── package.json
```
