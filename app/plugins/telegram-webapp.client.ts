export default defineNuxtPlugin(() => {
  const WebApp = window.Telegram?.WebApp

  if (WebApp) {
    // Signal that the app is ready
    WebApp.ready()

    // Expand to full screen
    WebApp.expand()

    // Enable closing confirmation if needed
    // WebApp.enableClosingConfirmation()
  }
})
