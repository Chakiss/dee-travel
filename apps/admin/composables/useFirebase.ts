import { initFirebase, typedCollection, toPlain } from '@deetravel/firebase'

/** Firebase clients for the admin app (db + auth), emulator-aware. */
export function useFirebase() {
  const cfg = useRuntimeConfig().public
  const clients = initFirebase({
    config: cfg.firebase,
    emulator: cfg.useEmulator ? { host: '127.0.0.1' } : false,
  })
  return { ...clients, typedCollection, toPlain }
}
