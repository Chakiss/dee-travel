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
Phase 0 (backup + audit) done. Phase 1 (foundation) mostly done: monorepo + `@deetravel/types`
+ `@deetravel/firebase`; `apps/web` (SSR, render verified) + `apps/admin` (SPA) build;
**Emulator-only dev env works** (seed + published-query verified). Dev = offline
`demo-deetravel` project via Emulator Suite (no cloud dev project by choice).
**`apps/web` renders real places from the emulator via SSR** (`useFirestore()` →
`useAsyncData`) using **`@deetravel/ui` (`PlaceCard`, `ImageWithVariants`)** — responsive
srcset + blur-up from the `{cover}/{size}.jpg` convention. Dev reads Firestore from the
emulator but loads cover images from the real public prod bucket (`NUXT_PUBLIC_IMAGE_BUCKET`).
Verified end-to-end. Next: place detail pages (`/places/[slug]`), listing/filter pages,
admin CRUD, then role-based rules (deploy-gated).

## Tooling
Node 22, pnpm 11, Turborepo. **firebase-tools is pinned to v13 as a local devDep** because
global v15 requires Java 21 and this machine has Java 11 — run emulator via `pnpm emulators`
(uses the local binary), not the global `firebase`. Build scripts for esbuild/@parcel/watcher/
@firebase/util/protobufjs are allow-listed in `pnpm-workspace.yaml`.

## Local dev
`pnpm install` → `pnpm emulators` (Firestore/Auth/Storage + UI on :4000) → in another shell
`pnpm seed` (sample data) → `pnpm --filter @deetravel/web dev` / `--filter @deetravel/admin dev`.
