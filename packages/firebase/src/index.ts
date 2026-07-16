/**
 * @deetravel/firebase — shared Firebase client init + typed Firestore helpers.
 *
 * Framework-agnostic: apps pass in their config (from Nuxt runtimeConfig) and
 * whether to connect to the local Emulator Suite. Safe to call repeatedly
 * (memoised + reuses an already-initialised app).
 */
import {
  initializeApp,
  getApps,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app'
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  collection,
  type Firestore,
  type CollectionReference,
  type FirestoreDataConverter,
} from 'firebase/firestore'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from 'firebase/storage'
import type { Collections, CollectionId } from '@deetravel/types'

export interface EmulatorOptions {
  host?: string
  firestorePort?: number
  authPort?: number
  storagePort?: number
}

export interface InitFirebaseOptions {
  config: FirebaseOptions
  emulator?: EmulatorOptions | false
}

export interface FirebaseClients {
  app: FirebaseApp
  db: Firestore
  auth: Auth
  storage: FirebaseStorage
}

let clients: FirebaseClients | null = null
let emulatorConnected = false

export function initFirebase(opts: InitFirebaseOptions): FirebaseClients {
  if (clients) return clients

  const app = getApps()[0] ?? initializeApp(opts.config)
  // Force long-polling against the emulator so Firestore works under Node SSR
  // (the default WebChannel transport can hang there).
  const db = opts.emulator
    ? initializeFirestore(app, { experimentalForceLongPolling: true })
    : getFirestore(app)
  const auth = getAuth(app)
  const storage = getStorage(app)

  if (opts.emulator && !emulatorConnected) {
    const host = opts.emulator.host ?? '127.0.0.1'
    connectFirestoreEmulator(db, host, opts.emulator.firestorePort ?? 8080)
    connectAuthEmulator(auth, `http://${host}:${opts.emulator.authPort ?? 9099}`, {
      disableWarnings: true,
    })
    connectStorageEmulator(storage, host, opts.emulator.storagePort ?? 9199)
    emulatorConnected = true
  }

  clients = { app, db, auth, storage }
  return clients
}

/** Identity converter that stamps the doc id onto the returned object. */
function idConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model) {
      const { id: _omit, ...rest } = model as T
      return rest as Record<string, unknown>
    },
    fromFirestore(snap) {
      return { id: snap.id, ...snap.data() } as T
    },
  }
}

/**
 * Typed collection reference:
 *   typedCollection(db, 'places') -> CollectionReference<Place>
 */
export function typedCollection<K extends CollectionId>(
  db: Firestore,
  name: K,
): CollectionReference<Collections[K]> {
  return collection(db, name).withConverter(
    idConverter<Collections[K]>(),
  ) as CollectionReference<Collections[K]>
}

/**
 * Deep-convert Firestore values (Timestamp, GeoPoint) into plain JSON-safe data
 * so query results survive Nuxt's SSR payload serialization and client hydration.
 * Firestore class instances (GeoPoint/Timestamp) otherwise break the payload.
 */
export function toPlain<T>(data: unknown): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>
        if (typeof v.toDate === 'function') return (v.toDate as () => Date)().toISOString()
        if (typeof v.latitude === 'number' && typeof v.longitude === 'number') {
          return { latitude: v.latitude, longitude: v.longitude }
        }
      }
      return value
    }),
  ) as T
}

export type { Collections, CollectionId } from '@deetravel/types'
