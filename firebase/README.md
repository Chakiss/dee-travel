# Firebase — rules & config

## Current state (Phase 0, 2026-07-15)

- **Deployed rules** are snapshotted in [`deployed-snapshot-2026-07-15/`](./deployed-snapshot-2026-07-15/).
  They allow **any authenticated user to write/delete everything** — a Critical gap.
- **Interim mitigation applied:** public sign-up disabled
  (`client.permissions.disabledUserSignup = true`, reversible). This blocks
  "register → wipe data" but does **not** restrict existing signed-in users.
- **Backup exists:** `gs://deetravel-project.appspot.com/backups/2026-07-15/`.

## Target rules (this folder's `firestore.rules` / `storage.rules`) — NOT yet deployed

Role-based via Firebase Auth **custom claims** (`role: 'admin' | 'editor' | 'viewer'`).

### ⚠️ Do NOT deploy until this checklist passes
1. Every real editor account has its `role` custom claim set (else they lock themselves out).
2. All existing content has a `status` field; legacy docs backfilled to `published`
   (otherwise the `isPublished()` read guard hides everything from the public site).
3. Impact reviewed and explicitly approved.
4. Deploy to `deetravel-dev` and test both apps before prod.

Until then the app should keep reading via the current permissive rules.

## Environments
- `deetravel-project` — production (existing data). **Do not test against this.**
- `deetravel-dev` — to be created in Phase 1; used for all development + emulator seeding.
