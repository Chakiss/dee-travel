# Deployment Runbook

> ⚠️ Nothing here runs automatically. Production changes (creating projects,
> deploying rules, deploying hosting) require explicit approval. **Back up before
> touching prod** (see Phase 0). Never deploy rules before the checklist passes.

## Environments

| Project | Role | Notes |
|---|---|---|
| `deetravel-project` | **production** (existing data) | Do not test against it |
| `deetravel-dev` | development / staging (to create) | All dev + emulator seeding |
| `demo-deetravel` | offline emulator project | Local only, no cloud |

## 0. One-time dev project setup (when ready)

```bash
# Create a dev project (or via Firebase Console)
firebase projects:create deetravel-dev --display-name "Dee Travel Dev"
firebase use --add            # alias it, e.g. "dev"
# Enable Firestore, Auth (email/password), Storage in the Console.
```

## 1. AI generation — Cloud Function

Dev uses the Nitro route `apps/admin/server/api/fb-generate`. Production uses the
callable Function `generateFbContent` in `functions/` (auth-gated: editor claim;
key stored as a Secret).

```bash
cd functions && npm install && cd ..

# Store the Anthropic key as a Secret (prompts for the value — not echoed)
firebase functions:secrets:set ANTHROPIC_API_KEY

# Test locally with the Functions emulator
firebase emulators:start --only functions,firestore,auth

# Deploy (prod or dev)
firebase deploy --only functions --project <dev|prod>
```

Then point the admin at the callable: use `httpsCallable(getFunctions(app,
'asia-southeast1'), 'generateFbContent')` in `generateAI()` instead of the Nitro
`$fetch`, when running on a real (non-demo) project.

## 2. Security rules — role-based (gated)

The DRAFT role-based rules live in `firebase/firestore.rules` / `storage.rules`.
**Before deploying** (see `firebase/README.md`):

1. Every editor account has its `role` custom claim set:
   ```js
   // one-off admin script (firebase-admin)
   await getAuth().setCustomUserClaims(uid, { role: 'admin' })
   ```
2. All existing content has a `status` field — backfill legacy docs to `published`
   (otherwise `isPublished()` hides everything from the public site).
3. Deploy to `deetravel-dev` and test both apps first.

```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes --project <dev>
```

## 3. Hosting

- **apps/web** (SSR) → Firebase App Hosting (or Cloud Run via Nitro firebase preset).
- **apps/admin** (SPA) → classic Firebase Hosting (static). Its Nitro API routes do
  NOT exist there — AI generation must go through the Cloud Function (step 1).

```bash
pnpm --filter @deetravel/web build
pnpm --filter @deetravel/admin build
firebase deploy --only hosting --project <dev|prod>
```

## Rollback

- Firestore: import the latest export (`gs://deetravel-project.appspot.com/backups/…`).
- Rules: re-deploy the snapshot in `firebase/deployed-snapshot-2026-07-15/`.
- Sign-up: currently disabled (`disabledUserSignup: true`) — re-enable in Console if needed.
