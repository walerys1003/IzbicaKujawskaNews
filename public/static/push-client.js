(() => {
  const SW_PATH = '/sw.js'
  const SUBSCRIBE_SELECTOR = '[data-push-subscribe]'

  const toUint8Array = (base64) => {
    const padded = `${base64}${'='.repeat((4 - base64.length % 4) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  }

  const ensureRegistration = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
    return navigator.serviceWorker.register(SW_PATH)
  }

  const subscribe = async () => {
    const registration = await ensureRegistration()
    if (!registration) return null
    const vapid = await fetch('/api/push/vapid-public-key').then((response) => response.json())
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(vapid.publicKey),
    })
    return fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys || {},
        categories: ['wiadomosci'],
        segments: ['homepage'],
        locale: document.documentElement.lang || 'pl-PL',
      }),
    }).then((response) => response.json())
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(SUBSCRIBE_SELECTOR).forEach((button) => {
      button.addEventListener('click', async () => {
        button.setAttribute('disabled', 'disabled')
        try {
          await subscribe()
          button.textContent = 'Powiadomienia aktywne'
        } catch (error) {
          console.error('[push-client] subscribe failed', error)
          button.removeAttribute('disabled')
        }
      })
    })
  })
})()
