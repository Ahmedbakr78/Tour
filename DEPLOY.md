# TourMate — Deployment Guide

TourMate is deployed as a **full-stack app on Vercel** (serverless Express API + Angular
frontend, same origin `/api`) with a **Cloudflare Pages mirror** for the frontend that
proxies `/api` to Vercel (Cloudflare Workers cannot open a TCP connection to MongoDB).

```
Browser ──► Cloudflare Pages (tourmate-3cj.pages.dev)
                 │  /api/*  (Pages Function proxy)
                 └─────────► Vercel  (tourmate.vercel.app)  ──► MongoDB Atlas
                 └─────────► static Angular SPA

Browser ──► Vercel (tourmate.vercel.app)  ──► API + static SPA (single origin)
```

## Live URLs
- Cloudflare frontend: https://tourmate-3cj.pages.dev  (also serves the `/api` proxy)
- Vercel backend:    https://tourmate.vercel.app      (deployed separately — see below)

The Cloudflare proxy defaults to `https://tourmate.vercel.app`, so once Vercel is
deployed as project name **`tourmate`** the two connect automatically.

## 1. Vercel (backend + primary frontend)  —  REQUIRES your login / token
Vercel has no stored credentials in the build environment, so this step is run by you:

```bash
# from repo root
vercel login                      # opens a browser; authenticate
vercel env add MONGODB_URI      # paste your MongoDB Atlas connection string (production)
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add CORS_ORIGIN production   # https://tourmate-3cj.pages.dev,https://tourmate.vercel.app
vercel --prod                    # deploy; when prompted name the project "tourmate"
```

Or non-interactively with a token:
```bash
VERCEL_TOKEN=xxxx vercel deploy --prod --token $VERCEL_TOKEN
```
(Set the same env vars via `vercel env add` or the dashboard first.)

`vercel.json` builds the Angular app (`npm run vercel-build`) and rewrites all requests
to `api/index.js`, which serves the API and the static SPA from the same origin.

## 2. Cloudflare Pages (frontend mirror)  —  ALREADY DEPLOYED
Done. Project `tourmate` created and the `browser/` build uploaded, including the
`functions/api/[[route]].js` proxy.

To redeploy after changes:
```bash
npm run build                       # build the Angular app into client/dist/tourmate-client/browser
wrangler pages deploy client/dist/tourmate-client/browser --project-name tourmate --branch main
```
Set the production variable `API_TARGET` in the Cloudflare dashboard (Settings →
Environment variables) only if your Vercel project is NOT named `tourmate` (the function
defaults to `https://tourmate.vercel.app`).

## 3. Prerequisites
- **MongoDB Atlas** cluster + connection string in `MONGODB_URI`. The API will not
  start without it. Whitelist `0.0.0.0/0` (or Vercel's IP ranges) in Atlas Network Access.
- **Auth secrets** `JWT_SECRET` / `JWT_REFRESH_SECRET` (any long random strings).

## 4. Environment variables (reference)
| Var | Purpose | Example |
|-----|---------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://u:p@cluster.x.mongodb.net/tourmate` |
| `JWT_SECRET` | Access-token signing key | random string |
| `JWT_REFRESH_SECRET` | Refresh-token signing key | random string |
| `JWT_EXPIRES_IN` | Access token TTL | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh TTL | `30d` |
| `CORS_ORIGIN` | Comma-separated allowed origins | `https://tourmate-3cj.pages.dev,https://tourmate.vercel.app` |
| `NODE_ENV` | `production` (set by Vercel) | `production` |
| `VERCEL` | Auto-set by Vercel; switches server to serverless mode | `1` |

## 5. Known limitations
- **Uploads are ephemeral** on Vercel (serverless filesystem is read-only at runtime).
  Use Vercel Blob / S3 / Cloudinary for persistent file storage in production.
- The Cloudflare frontend depends on the Vercel backend being live; until Vercel is
  deployed, `/api` calls from Cloudflare return errors.
- `npm run dev` / `npm start` (local) are unaffected and still use `http://localhost:4000`.
