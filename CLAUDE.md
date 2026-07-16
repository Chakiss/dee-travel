# Dee Travel — project context

Thai travel-content platform being **rebuilt** (the original source code is
permanently lost; only the Firebase data survived). Full design doc:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## What this is
- A rebuild that **reuses the existing Firebase data 100%** and replaces the lost front-ends.
- Legacy: three **Vue 2** SPAs (public / project / admin), all on one Firebase project.
  The old admin CMS was **Flamelink**.
- Target: **Nuxt 3 monorepo** — `apps/web` (public, SSR/SSG for SEO) + `apps/admin`
  (CMS + Facebook Marketing Toolkit), shared `packages/{types,ui,firebase,marketing}`.

## Firebase
- **Project:** `deetravel-project` (production). Owner: user is Owner/Editor.
  `storageBucket: deetravel-project.appspot.com`. Classic Firebase Auth (email/password).
- A separate `deetravel-dev` project + Emulator Suite is planned — **all dev happens there.**
- Web `apiKey` is public-by-design (safe to commit in client config). **Real secrets**
  (service-account JSON, admin keys) must NEVER be committed — see `.gitignore`.

## Data model (real, from Phase 0 audit)
Collections: `places` (590), `events` (36), `articles` (10), `categories` (12),
geo tree `geographies`(6) > `provinces`(78) > `districts`(145) > `subdistricts`(336),
`users` (0 — admins live in Auth, not Firestore). Types in `@deetravel/types`.
Legacy fields are snake_case; migration is **additive** (add status/SEO/type/marketing,
don't rename). Images are pre-sized: `{cover}/{large,medium,thumbnail,tiny}.jpg`.

## Guardrails (non-negotiable)
- **Never** modify/delete production Firestore data without explicit approval.
- **Never** deploy to production (hosting or rules) without approval.
- **Never** change Firebase security rules without explaining impact first.
- Current deployed rules are wide-open on write; a role-based DRAFT lives in
  `firebase/firestore.rules` — **not deployed** (see `firebase/README.md`).
- Backup before touching prod. Latest: `gs://deetravel-project.appspot.com/backups/2026-07-15/`.
- Never ask for passwords / private keys in chat. Interactive logins run in the
  user's terminal (`! firebase login`).

## Status
**Phase 3 admin started** — `apps/admin` (Nuxt SPA) has: Firebase Auth login (`pages/login.vue`),
async auth plugin + global route guard, sidebar layout, dashboard, places list, and a working
place editor that **writes to Firestore through the role-based rules** (verified end-to-end in a
browser). Dev admin user is seeded into the Auth emulator: `admin@deetravel.local` / `dee12345`
(custom claim `role: admin`) — created by `firebase/seed.mjs` when `FIREBASE_AUTH_EMULATOR_HOST`
is set, so run emulators with auth: `pnpm emulators` (starts auth+firestore+storage) then `pnpm seed`.
Admin dev: `pnpm --filter @deetravel/admin dev`. **Admin is a SPA (ssr:false)** — its public
runtimeConfig must be present at build OR injected by the nitro server at runtime via NUXT_PUBLIC_*
env (the `.env` covers `nuxi dev`; a built preview needs the env passed to `node .output/server`).

Phase 0 (backup + audit) done. Phase 1 (foundation) mostly done: monorepo + `@deetravel/types`
+ `@deetravel/firebase`; `apps/web` (SSR, render verified) + `apps/admin` (SPA) build;
**Emulator-only dev env works** (seed + published-query verified). Dev = offline
`demo-deetravel` project via Emulator Suite (no cloud dev project by choice).
**`apps/web` renders real places from the emulator via SSR** (`useFirestore()` →
`useAsyncData`) using **`@deetravel/ui` (`PlaceCard`, `ImageWithVariants`)** — responsive
srcset + blur-up from the `{cover}/{size}.jpg` convention. Dev reads Firestore from the
emulator but loads cover images from the real public prod bucket (`NUXT_PUBLIC_IMAGE_BUCKET`).
**Full journey works**: home (hero with legacy-style จังหวัด/อำเภอ/keyword search bar) →
`/places` listing with province+district+keyword filters → `/places/[slug]` detail (real
cover + content + address + map) → back, plus a real 404. The emulator enforces the DRAFT
role-based rules, so **every public list query MUST filter `status == 'published'`** (slug-only
denied); detail uses status+slug, listing uses status+provinceId (composite indexes added).
Places carry denormalized `provinceId/provinceName/districtId/districtName` for filtering
(seeded from real geo). Next: articles/events pages, category filter, admin CRUD, deploy rules.

**Nuxt SSR gotchas learned:** (1) don't cache dynamic query pages with routeRules SWR — it
serves stale results ignoring the query; keep `/places` plain SSR (only `/places/:slug` etc.
are SWR-cached). (2) A listing whose data depends on `route.query` needs
`definePageMeta({ key: route => route.fullPath })` to remount on query change, plus
`useAsyncData(..., { watch: [computed refs] })` reading the query via computeds.

Note: `firebase/seed-data.json` holds 6 real places copied read-only from prod (covers +
content) for realistic dev; `pnpm seed` loads it into the emulator.

**Design system** references the legacy site (see memory `deetravel-design-system`): fonts
**Kanit** (body/UI, headings are bold-italic) + **Pattaya** (display/logo wordmark), colors
**#DB9D1B gold** (CTA), **#00AEEF cyan** (labels/links), **#242A3A navy**; full-bleed photo
hero, "Dee___" section eyebrows, dark footer. Tokens live in `apps/web/assets/css/main.css`
(`--dt-*`); `packages/ui` components consume them via `var(--dt-*)`. Legacy logo/favicons are
in `apps/web/public/brand/` + `apps/web/public/`. Google Fonts loaded via `<link>` in nuxt.config.

**SSR gotcha (fixed):** Firestore `Timestamp`/`GeoPoint` are class instances that break Nuxt's
payload serialization → client hydration throws (page 404s in-browser though curl/SSR is 200).
Always pass query results through `toPlain()` (from `@deetravel/firebase`) before returning
from `useAsyncData`.

## Tooling
Node 22, pnpm 11, Turborepo. **firebase-tools is pinned to v13 as a local devDep** because
global v15 requires Java 21 and this machine has Java 11 — run emulator via `pnpm emulators`
(uses the local binary), not the global `firebase`. Build scripts for esbuild/@parcel/watcher/
@firebase/util/protobufjs are allow-listed in `pnpm-workspace.yaml`.

## Local dev
`pnpm install` → `pnpm emulators` (Firestore/Auth/Storage + UI on :4000) → in another shell
`pnpm seed` (sample data) → `pnpm --filter @deetravel/web dev` / `--filter @deetravel/admin dev`.
