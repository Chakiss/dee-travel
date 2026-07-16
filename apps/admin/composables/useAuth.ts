import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

export interface AdminUser {
  uid: string
  email: string | null
  displayName: string | null
  role: string | null
}

/** Auth state + actions. User state is populated by plugins/auth.client.ts. */
export function useAuth() {
  const user = useState<AdminUser | null>('admin-user', () => null)
  const ready = useState<boolean>('admin-auth-ready', () => false)

  async function login(email: string, password: string) {
    const { auth } = useFirebase()
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    const { auth } = useFirebase()
    await signOut(auth)
    await navigateTo('/login')
  }

  return { user, ready, login, logout }
}
