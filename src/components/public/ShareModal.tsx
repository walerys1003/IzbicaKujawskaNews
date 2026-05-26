// SA6: Share modal component
export const ShareModal = ({ title, url }: { title: string; url: string }) => {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const shareLinks = [
    { name: 'Facebook', icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'X (Twitter)', icon: '🐦', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { name: 'WhatsApp', icon: '💬', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { name: 'Email', icon: '📧', href: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}` },
    { name: 'LinkedIn', icon: '💼', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ]

  return (
    <div id="share-modal" class="share-modal-overlay" style="display: none; position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div class="share-modal-content" style="background: #fff; border-radius: 12px; padding: 32px; max-width: 480px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 id="share-title" style="margin: 0; font-size: 20px;">Udostępnij artykuł</h2>
          <button onclick="document.getElementById('share-modal').style.display='none'" style="background: none; border: none; font-size: 24px; cursor: pointer; line-height: 1;" aria-label="Zamknij">&times;</button>
        </div>

        <p style="color: #555; margin-bottom: 20px; font-size: 14px;">{title}</p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          {shareLinks.map(link => (
            <a href={link.href} target="_blank" rel="noopener noreferrer" class="share-link-btn" style="display: flex; flex-direction: column; align-items: center; padding: 16px 8px; border: 1px solid #e0e0e0; border-radius: 8px; text-decoration: none; color: #333; transition: background 0.2s;"
               onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
              <span style="font-size: 28px;">{link.icon}</span>
              <span style="margin-top: 6px; font-size: 12px; font-weight: 500;">{link.name}</span>
            </a>
          ))}
        </div>

        <div style="margin-top: 20px; display: flex; gap: 8px;">
          <input type="text" value={url} readonly id="share-url-input" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; background: #f9f9f9;" />
          <button onclick={`navigator.clipboard.writeText('${url}').then(() => alert('Skopiowano link!'))`} style="padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; white-space: nowrap;">
            Kopiuj link
          </button>
        </div>
      </div>
    </div>
  )
}

// Share button component (inline)
export const ShareButton = ({ title, url }: { title: string; url: string }) => (
  <div class="share-buttons" style="display: flex; gap: 8px; align-items: center;">
    <button onclick={`document.getElementById('share-modal').style.display='flex'`} class="share-trigger-btn" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1a1a2e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">
      <span>📤</span> Udostępnij
    </button>
    <button onclick={`navigator.clipboard.writeText('${url}')`} class="copy-link-btn" style="padding: 8px 12px; background: transparent; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 20px;" aria-label="Kopiuj link" title="Kopiuj link do schowka">
      🔗
    </button>
  </div>
)
