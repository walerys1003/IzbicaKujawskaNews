// SA6: LazyEmbed — consent-based lazy loading for YouTube, Vimeo, Twitter/X embeds
// GDPR-compliant: no third-party requests until user clicks "load"

type EmbedType = 'youtube' | 'vimeo' | 'twitter'

interface LazyEmbedProps {
  type: EmbedType
  id: string // YouTube: video ID, Vimeo: video ID, Twitter: tweet ID
  title?: string
  aspectRatio?: string
}

const embedConfig: Record<EmbedType, { label: string; color: string; icon: string; url: (id: string) => string }> = {
  youtube: {
    label: 'YouTube',
    color: '#ff0000',
    icon: '▶',
    url: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`,
  },
  vimeo: {
    label: 'Vimeo',
    color: '#1ab7ea',
    icon: '▶',
    url: (id) => `https://player.vimeo.com/video/${id}?autoplay=1`,
  },
  twitter: {
    label: 'Twitter / X',
    color: '#1da1f2',
    icon: '🐦',
    url: (id) => `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
  },
}

export const LazyEmbed = ({
  type,
  id,
  title = 'Osadzona treść',
  aspectRatio = type === 'twitter' ? 'auto' : '16 / 9',
}: LazyEmbedProps) => {
  const cfg = embedConfig[type]
  const uniqueId = `lazy-embed-${type}-${id}`

  return (
    <div
      class="lazy-embed"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        background: '#1a1a2e',
        borderRadius: '10px',
        overflow: 'hidden',
        margin: '24px 0',
      }}
    >
      {/* Placeholder overlay */}
      <div
        id={`${uniqueId}-placeholder`}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          cursor: 'pointer',
          zIndex: 1,
          background: `linear-gradient(135deg, ${cfg.color}22 0%, #0a0a1a 100%)`,
        }}
      >
        <span style={{ fontSize: '40px', opacity: 0.9 }}>{cfg.icon}</span>
        <strong style={{ color: '#fff', fontSize: '15px' }}>
          Kliknij, aby załadować treść z {cfg.label}
        </strong>
        <span style={{ color: '#aaa', fontSize: '12px', maxWidth: '280px', textAlign: 'center' }}>
          Po kliknięciu nastąpi połączenie z serwerami {cfg.label}.{cfg.label} może używać plików cookie.{' '}
          <a href="/polityka-prywatnosci" style={{ color: '#e94560' }}>Polityka prywatności</a>
        </span>
        <button
          style={{
            padding: '10px 24px',
            borderRadius: '6px',
            border: 'none',
            background: cfg.color,
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '4px',
          }}
        >
          Załaduj {cfg.label}
        </button>
      </div>

      {/* iframe container (hidden until activated) */}
      <div
        id={`${uniqueId}-content`}
        style={{ position: 'absolute', inset: 0, display: 'none', zIndex: 2 }}
      />

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var placeholder = document.getElementById('${uniqueId}-placeholder');
  var content = document.getElementById('${uniqueId}-content');
  if (!placeholder || !content) return;

  placeholder.addEventListener('click', function() {
    placeholder.style.display = 'none';
    content.style.display = 'block';
    var iframe = document.createElement('iframe');
    iframe.src = '${cfg.url(id)}';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', '${title.replace(/'/g, "\\'")}');
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    content.appendChild(iframe);
  });
})();
          `.trim(),
        }}
      />
    </div>
  )
}

/** Shorthand embed components */
export const YouTubeEmbed = ({ id, title }: { id: string; title?: string }) => (
  <LazyEmbed type="youtube" id={id} title={title} />
)
export const VimeoEmbed = ({ id, title }: { id: string; title?: string }) => (
  <LazyEmbed type="vimeo" id={id} title={title} />
)
export const TwitterEmbed = ({ id }: { id: string }) => (
  <LazyEmbed type="twitter" id={id} />
)
