import { initFirebase, typedCollection, toPlain } from '@deetravel/firebase'

/**
 * Shared Firestore access for the public site. Reads config from Nuxt
 * runtimeConfig; connects to the local Emulator Suite when useEmulator is set.
 * `toPlain` makes query results SSR-payload safe (Timestamp/GeoPoint -> plain).
 */
export function useFirestore() {
  const cfg = useRuntimeConfig().public
  const { db } = initFirebase({
    config: cfg.firebase,
    emulator: cfg.useEmulator ? { host: '127.0.0.1' } : false,
  })
  return { db, typedCollection, toPlain }
}
