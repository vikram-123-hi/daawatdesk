# DaawatDesk — Project Rules

## Deployment Workflow
- **Do NOT push to git / deploy unless the user explicitly says "deploy"** (or similar).
- When the user says "deploy": run `git add`, `git commit`, `git push` to `main`. GitHub Actions auto-builds and deploys to Cloudflare Pages (`daawatdesk-76b.pages.dev`).
- Otherwise: only make local changes and run the app locally (`npm run dev`).

## Build Verification
- After code changes, verify with `npm run build` before claiming work is complete.

## Environment
- Secrets live in local `.env` (gitignored): `VITE_GROQ_KEY`, `VITE_IMGBB_KEY`.
- Cloudflare build runs from GitHub, so env vars needed at runtime must be set in Cloudflare dashboard → Settings → Environment variables.
