import { onAuthStateChanged } from 'firebase/auth'

// Wait for the first auth state before the app renders, so route middleware
// sees a settled user. Keeps listening for later changes.
export default defineNuxtPlugin(async () => {
  const { auth } = useFirebase()
  const user = useState<AdminUser | null>('admin-user', () => null)
  const ready = useState<boolean>('admin-auth-ready', () => false)

  await new Promise<void>((resolve) => {
    let first = true
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        const token = await u.getIdTokenResult()
        user.value = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          role: (token.claims.role as string) ?? null,
        }
      } else {
        user.value = null
      }
      ready.value = true
      if (first) {
        first = false
        resolve()
      }
    })
  })
})
