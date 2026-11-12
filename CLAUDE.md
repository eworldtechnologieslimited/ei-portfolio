# CLAUDE.md

## What this is
Static multi-page portfolio for Uzoukwu Eric Ikenna on Netlify, backed by Supabase REST (RLS). No framework, no package manager.

## Layout
- Public pages: `index.html`, `cybersecurity`, `webapps`, `qa`, `pm`, `ventures`, `certifications`, `speaking`, `casestudies`, `blog`, `events`, `booking`, `contact`, `cv` (`.html`). **Generated** by `tools/build_pages.py` from `src/` (head, pre, post, `sections/*`) and `assets/`. Edit `src/` or `assets/`, then run `python3 tools/build_pages.py`. Never hand-edit the generated page files.
- `assets/styles.css`, `assets/app.js` (all site JS; contains the Supabase placeholders), `img/` (WebP).
- `admin.html`: single-file admin CMS (served at `/admin` and `/dashboard`).
- `build.js`: Netlify build step; injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into every `.html` and `assets/app.js`.
- `netlify.toml` and `_redirects` both define routes; keep in sync.
- `*.sql`: Supabase setup (`supabase-setup-safe.sql` is idempotent; `COMBINED-first-time-setup.sql` is first run).
- `publish-scheduled.ts/.yml`: scheduled blog publishing (Supabase Edge Function + GitHub Action).
- `next-project/`: archived Next.js rebuild (not deployed). Planned as a separate project.

## Rules
- `admin_users` has no SELECT policy (holds `password_hash`); keep it that way.
- Do not put CV `.docx` files in this repo: the root is public. CVs live in Supabase Storage and are released via the approval flow.
