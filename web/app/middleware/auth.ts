// Route guard — redirects unauthenticated users to the login page.
// Pages opt in by adding: definePageMeta({ middleware: 'auth' })
// The redirect query param lets the login page send the user back after they log in.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo(`/auth/connexion?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
