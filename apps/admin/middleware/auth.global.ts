// Gate every route behind auth; /login is the only public page.
export default defineNuxtRouteMiddleware((to) => {
  const user = useState<AdminUser | null>('admin-user')
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
