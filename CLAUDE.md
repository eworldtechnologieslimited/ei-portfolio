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

## CV delivery, RSVP, case studies
- `cv-rsvp-setup.sql` creates `cv_requests`, `event_rsvps` and buckets (`cv-files` private, `site-media` public). Run once in Supabase.
- `netlify/functions/cv-access.js` (served at `/api/cv-access`) checks reference+email, and if `approved` returns a 5-minute signed URL. Needs Netlify env `SUPABASE_SERVICE_ROLE_KEY` (never expose client-side) plus `SUPABASE_URL`.
- Upload the CV .docx files (names in `CV_TYPES` in `assets/app.js`) to the `cv-files` bucket. Not in this repo.
- Event modal has an RSVP form (non-past events); DB `case_studies` rows are appended to the case study grid.

## Known security debt (needs owner decision)
- `admin.html` has a hardcoded fallback admin username/password in client JS.
- Most tables use anon `FOR ALL USING (true)` policies, so anyone with the public anon key can read/modify data, including PII (cv_requests, event_rsvps, contact_submissions, newsletter). Proper fix: Supabase Auth for admin + authenticated-only RLS.
