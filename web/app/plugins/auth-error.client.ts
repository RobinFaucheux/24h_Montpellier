export default defineNuxtPlugin((nuxtApp) => {
  const { clear, loggedIn } = useUserSession()

  nuxtApp.hook('app:error', (error: any) => {
    if (error?.statusCode === 401 || error?.response?.status === 401 || error?.data?.statusCode === 401) {
      if (loggedIn.value) {
        clear().then(() => {
          navigateTo('/auth/connexion')
        })
      }
    }
  })
})
