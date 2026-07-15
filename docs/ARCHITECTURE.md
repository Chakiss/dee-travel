# Dee Travel — Target Architecture & Rebuild Plan

> Source of truth for the rebuild. A rendered/shareable version exists as a
> Claude artifact; this markdown is the in-repo canonical copy.
> Last updated: 2026-07-15 (Phase 0 verified).

---

## 1. Situation

The original **source code is permanently lost** — no repo, no backup. Only the
Firebase **data** survived. So this is a **rebuild that reuses the existing data**,
not a code refresh. "Reuse code" is impossible; "reuse content/data" is the goal.

Legacy system: three **Vue 2 / Vue CLI** SPAs (built 2019–2020), all reading **one**
Firebase project `deetravel-project`, all on Firebase Hosting:

| Site | Role | Built |
|---|---|---|
| `deetravel-public.web.app` | content browser | 2020 |
| `deetravel-project.web.app` | brand site deetravel.co (PWA) | 2019 |
| `deetravel-admin.web.app` | CMS (built on **Flamelink**) | 2019 |

### What survived → decision

| Asset | State | Decision |
|---|---|---|
| Firestore data (9 collections) | intact | **Keep** — reuse, extend schema |
| Storage images | intact (2.45 GB) | **Keep** — re-serve, add CDN |
| Security/Storage rules | wide-open on write | **Improve** — role-based |
| Vue 2 front-end code ×3 | lost | **Rebuild** — Nuxt 3 |
| public + project sites | two overlapping front-ends | **Rebuild** — merge into one |
| Admin CMS | lost | **Rebuild** + Facebook toolkit |
| Facebook marketing pipeline | never existed | **New** — core of this project |

---

## 2. Target architecture

One **Nuxt 3 monorepo**, two deployable apps, a shared type/UI layer, Firebase kept
as the backend. The biggest win: **SSR/SSG fixes the SEO black hole** that a
client-only SPA created for a search-dependent travel site.

### Why Nuxt 3 (not a from-scratch React move)
- Team already knows Vue → lowest re-learning cost.
- SSR / SSG / ISR built in → solves SEO.
- First-class TypeScript → the type-safety requirement.
- Still deploys on Firebase; keeps Firestore & Storage.
- **Alternative (Next.js):** larger ecosystem but forces a full React re-skill with
  no offsetting benefit. Revisit only on an org-wide React standardisation.

### Monorepo layout
```
dee-travel/                 # pnpm workspaces + Turborepo
├─ apps/
│  ├─ web/                  # Nuxt 3 · SSR+SSG · public site (merges public+project)
│  └─ admin/                # Nuxt 3 · SPA · CMS + Facebook Marketing Toolkit
├─ packages/
│  ├─ types/                # TS types + (later) Zod schemas for every Firestore doc
│  ├─ ui/                   # shared Vue components
│  ├─ firebase/             # init, typed converters, query helpers
│  └─ marketing/            # caption/hashtag template engine (framework-free)
└─ firebase/                # rules, indexes, functions — per environment
```

### Runtime topology
- **Clients:** public web (visitors + crawler, SSR/SSG), admin (auth-gated SPA).
- **Edge/server:** Nitro SSR + server routes, rendering via Firebase Admin SDK, ISR cache.
- **Backend (kept):** Firestore, Storage, Auth (roles via custom claims), Cloud Functions
  (thumbnails, denormalisation, scheduled publish, AI in Phase 5).

### Rendering strategy
| Surface | Mode | Why |
|---|---|---|
| Place / Article / Event detail | SSG + ISR | max SEO + instant load |
| Listings, province, category | SSR (cached) | fresh, crawlable |
| Home | SSR or ISR | featured, crawlable |
| Admin (all) | SPA (`ssr:false`) | app-like, behind auth |

### Environments
Legacy ran everything against **one prod project, no staging**. Target:
`deetravel-project` (prod, existing data) + new `deetravel-dev` + **Emulator Suite**
for local work. Nothing is tested against live data.

---

## 3. Media & storage strategy

**Firebase Storage already *is* a GCS bucket** (`deetravel-project.appspot.com`).
The files are on GCP now — the real decision is the delivery/transform layer.

**Cost mechanics:** storage at rest is negligible (~$0.02/GB/mo); **egress (~$0.12/GB)
is the driver**. Levers that matter: CDN cache + resized WebP/AVIF instead of originals.

**Phase 0 verified:** bucket is **2.45 GB / 11,337 objects** — tiny. Prefixes:
`images/` (2,836, app covers), `media/` (7,744, Flamelink library), `flamelink/` (757).
**Images are already pre-sized** into `large / medium / thumbnail / tiny.jpg` per cover
(tiny = blur placeholder). Public HTTPS read works.

### Recommendation
**Don't migrate storage.** Keep the bucket on Google and add delivery + transform in front:
- **Now (Phase 2):** `@nuxt/image` + Firebase **Resize Images** extension for *new*
  uploads (existing content already has variants), served through Firebase Hosting /
  Cloud CDN edge cache. Published media = public-read, long-cache, no token. Security
  rules keep working; no new vendor.
- **Later, only if egress hurts:** Cloudflare R2 (zero egress) + Image Resizing — adds a
  vendor, custom signing, loses Firebase-rules integration. Not worth the debt at this scale.

---

## 4. Firestore schema — evolved, not replaced

Keep the existing collection names; **layer on** publishing workflow, SEO, and marketing.
Migration is **additive** (legacy fields kept, snake_case and all). Canonical types:
[`packages/types/src/index.ts`](../packages/types/src/index.ts).

### Verified counts (Phase 0)
`places` 590 · `events` 36 · `articles` 10 · `categories` 12 · `geographies` 6 ·
`provinces` 78 · `districts` 145 · `subdistricts` 336 · `users` 0.

### Real `places` shape
`name, slug, excerpt, content(HTML), format_address, getting, phone, website, cover,
position(geoPoint), open_hours[], category[refs], province/district/subdistrict/geography(refs),
createdAt, updatedAt`. **Missing** (we add): `status`, SEO fields, `type`, marketing fields.

### New marketing model (powers the Facebook toolkit)
Kept as its own collection so one item can have many posts over time, each with status,
schedule, and performance — and to guard against re-posting too often.
- `marketingAssets/{id}` — captions (short/long/friendly/salesy/engagement), headline,
  highlights, hashtags{th,en}, cta, creativeFormat, recommendedImages, imageSpec,
  suggestedAudience, suggestedPostDate, status, generatedBy, fbPostUrl, performance,
  usageCount/lastUsedAt.
- `contentCalendar/{id}` — scheduling board.

### Indexes to add
`places`(status+type+provinceId), `places`(status+featured+publishedAt↓),
`articles`(status+publishedAt↓), `events`(status+startDate↑),
`marketingAssets`(status+suggestedPostDate).

### Security posture
Target = role-based via custom claims (see `firebase/firestore.rules`, DRAFT):
public read only where `status=='published'`; writes require `editor`/`admin`;
marketing + users never public. **Deploy gated on backfilling `status` and setting
claims first** (see `firebase/README.md`).

---

## 5. Facebook content reuse — pipeline

`Existing content → Enrich → Generate copy → Preview → Copy/Export → Publish → Track`

Phase 4 does this with a **deterministic template engine** (zero API cost) in
`packages/marketing`. Phase 5 swaps in Claude for richer generation, same output schema.

**One click on a place produces:** captions (5 variants), headline + short description +
highlights + image-overlay text + CTA, Thai + English hashtags, suggested date + audience,
creative format + recommended images + size/ratio.

---

## 6. Admin CMS feature set

- **Content:** CRUD places/articles/events; draft→ready→scheduled→published; scheduled
  publish; categories/tags/province; featured; SEO/social meta; gallery + thumbnail +
  focal point; live preview.
- **Facebook toolkit:** "Generate" on any item; pick post type/tone/audience; caption
  variants + hashtags + CTA; one-click copy + CSV/Excel export; content calendar + status
  board; post history + overuse guard; store FB URL + performance.

---

## 7. Risks

| Level | Risk | Note |
|---|---|---|
| ~~Critical~~ → mitigated | Open write rules + open sign-up | Sign-up disabled + backup taken; role-based rules pending (Phase 1) |
| High | Vue 2 EOL | no patches since Dec 2023 — rebuild resolves |
| High | SEO ≈ 0 | client-only SPA serves empty shell — SSR fixes |
| Medium | Two overlapping front-ends | confirm live one, merge |
| Medium | Unknown content/image completeness | audit deeper during migration |

---

## 8. Roadmap

Effort sizes are indicative for one focused dev: **S ≈ days · M ≈ 1–2 wks · L ≈ 2–4 wks**.

- **Phase 0 — Backup & Audit (S) ✅ done.** Firestore export, rules/data/media audit,
  interim security plug (sign-up disabled).
- **Phase 1 — Foundation & Stabilise (M) — in progress.** Monorepo + Nuxt shells,
  `deetravel-dev` + emulators, `@deetravel/types` from real schema, role-based rules
  (approval-gated). Deliverable: CI + "hello" on a *new* hosting target, prod untouched.
- **Phase 2 — Public Web Rebuild (L).** Merge public+project; SSR/SSG for detail pages;
  design system in `packages/ui`; responsive images; sitemap/meta/structured data.
- **Phase 3 — Admin CMS Rebuild (L).** CRUD, workflow, scheduled publish, media, SEO,
  role-based access.
- **Phase 4 — Facebook Marketing Toolkit / template engine (M).** Generate·preview·copy·
  export, calendar, status board, post history, overuse guard, manual performance.
- **Phase 5 — AI Content Generation (M).** Cloud Function → Claude for captions/hashtags,
  same output schema, brand-voice + cost guardrails, human review.
- **Phase 6 — Analytics & Performance (M).** GA4, content dashboard, optional Facebook
  Graph API auto-pull.

---

## 9. Decisions (approved 2026-07-15)

| Decision | Choice |
|---|---|
| Framework | **Nuxt 3** |
| Front-ends | **Merge** public + project into one |
| Environments | **Add `deetravel-dev`** + emulators |
| SSR hosting | **Firebase App Hosting** |
| Storage | **Keep on GCS** + CDN/@nuxt/image (reuse existing variants) |
