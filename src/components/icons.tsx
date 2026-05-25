// Inline SVG icons (Heroicons outline style) — Reuters-tier monochrome
// All icons 24x24 viewBox, stroke="currentColor", line-style

type IconProps = { size?: number; className?: string }

const base = (size = 16, className = 'svg-icon') => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.75',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  class: className,
  'aria-hidden': 'true',
})

export const Icon = {
  Fire: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M15.36 5.214C12.5 7 11 9.5 11 12.5 9.5 11.5 8.5 10 8.5 8.5 6 10.5 5 13 5 15.5 5 19.09 8.13 22 12 22s7-2.91 7-6.5c0-4.18-2-7.5-3.64-10.286z" />
    </svg>
  ),
  Ambulance: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 17V8a2 2 0 0 1 2-2h9v11M14 11h4l3 3v3M3 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M9 8v3M7.5 9.5h3" />
    </svg>
  ),
  Shield: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
    </svg>
  ),
  Drop: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M12 2.5C8 7 5.5 11 5.5 14.5A6.5 6.5 0 0 0 12 21a6.5 6.5 0 0 0 6.5-6.5C18.5 11 16 7 12 2.5z" />
    </svg>
  ),
  Bolt: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="m13 2-9 12h7l-1 8 9-12h-7z" />
    </svg>
  ),
  Government: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-7h6v7M9 14h6" />
    </svg>
  ),
  Soccer: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 6 4 3-1.5 5h-5L8 9zM12 6V3M16 9l3-2M14.5 14l2 3M9.5 14l-2 3M8 9 5 7" />
    </svg>
  ),
  Theater: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M4 5h16v9a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5zM9 10v.01M15 10v.01M9 14c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
    </svg>
  ),
  Book: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6z" />
    </svg>
  ),
  Users: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21v-1a6 6 0 0 1 12 0v1M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM15 21v-1a5 5 0 0 1 6-5" />
    </svg>
  ),
  Home: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 12 12 3l9 9M5 10v10h5v-6h4v6h5V10" />
    </svg>
  ),
  Newspaper: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM7 7h6M7 11h6M7 15h6M16 7h2v8h-2z" />
    </svg>
  ),
  Calendar: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  ),
  Map: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />
    </svg>
  ),
  Camera: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 7h4l2-3h6l2 3h4v12H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Video: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <rect x="2" y="6" width="14" height="12" rx="1" />
      <path d="m22 8-6 4 6 4z" />
    </svg>
  ),
  Audio: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 12V8a9 9 0 0 1 18 0v4M21 14v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2zM3 14v3a2 2 0 0 0 2 2h1v-7H5a2 2 0 0 0-2 2z" />
    </svg>
  ),
  Search: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Phone: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 7 9 7 9-7" />
    </svg>
  ),
  Megaphone: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 11v2a2 2 0 0 0 2 2h2l4 4V7L7 11H5a2 2 0 0 0-2 2zM14 7v10M18 4v16M22 8v8" />
    </svg>
  ),
  Clock: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  Cart: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 4h2l3 13h12l3-9H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  ),
  Car: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M5 17H3v-6l3-6h12l3 6v6h-2M5 17v2h2v-2M17 17v2h2v-2M5 17h14" />
      <circle cx="7" cy="14" r="1" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  ),
  Briefcase: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </svg>
  ),
  Tag: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.83 0L3 13V5l8 .01 9.59 9.6a2 2 0 0 1 .01 2.79z" />
      <circle cx="7" cy="9" r="1.5" />
    </svg>
  ),
  Play: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M6 4v16l13-8z" fill="currentColor" />
    </svg>
  ),
  Pin: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  Sun: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  ),
  Cloud: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 12a4 4 0 0 1-4 6z" />
    </svg>
  ),
  CloudRain: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M7 14a5 5 0 1 1 1-9.9A6 6 0 0 1 20 8a4 4 0 0 1-4 6M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
    </svg>
  ),
  Star: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="m12 3 2.6 6 6.4.5-5 4.3 1.6 6.2L12 16.8 6.4 20l1.6-6.2-5-4.3 6.4-.5z" />
    </svg>
  ),
  Clipboard: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <rect x="6" y="4" width="12" height="17" rx="1" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 10h6M9 14h6M9 18h4" />
    </svg>
  ),
  Hospital: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M4 21V8l8-5 8 5v13M9 21v-7h6v7M12 8v4M10 10h4" />
    </svg>
  ),
  Wheat: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 13c0-2 2-4 5-4-1 2-2 4-5 4zM12 13c0-2-2-4-5-4 1 2 2 4 5 4zM12 18c0-2 2-4 5-4-1 2-2 4-5 4zM12 18c0-2-2-4-5-4 1 2 2 4 5 4z" />
    </svg>
  ),
  Graduation: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M2 9.5 12 5l10 4.5L12 14zM6 12v4c0 1.5 3 3 6 3s6-1.5 6-3v-4M20 11v5" />
    </svg>
  ),
  Wrench: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M14.7 6.3a4 4 0 0 1-5.5 5.5L3 18l3 3 6.2-6.2a4 4 0 0 1 5.5-5.5l-2.5 2.5L14 9.5l1.7-1.7z" />
    </svg>
  ),
  Building: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <rect x="5" y="3" width="14" height="18" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-4h4v4" />
    </svg>
  ),
  Dove: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M2 16c4 3 11 4 16 0 3-2 4-6 4-9-2 1-4 2-6 2-3 0-5-3-9-3S0 9 2 16z" />
      <path d="M12 11v3" />
    </svg>
  ),
  Cake: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <path d="M3 21h18M5 21v-8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8M3 17c2 1 3-1 4 0s2-1 4 0 3-1 4 0 3-1 4 0M9 8V5a1 1 0 0 1 1-1 1 1 0 0 1 1 1v3M13 8V5a1 1 0 0 1 1-1 1 1 0 0 1 1 1v3" />
    </svg>
  ),
  CloudSun: (p: IconProps = {}) => (
    <svg {...base(p.size, p.className)}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3" />
      <path d="M14 16a4 4 0 1 1 1-7.9A5 5 0 0 1 23 11a3 3 0 0 1-3 5z" />
    </svg>
  ),
}

// Map dla emoji → ikona (do użycia w danych)
export const emojiToIconKey: Record<string, keyof typeof Icon> = {
  '🚒': 'Fire',
  '🚑': 'Ambulance',
  '🚔': 'Shield',
  '💧': 'Drop',
  '⚡': 'Bolt',
  '🏛️': 'Government',
  '🏛': 'Government',
  '⚽': 'Soccer',
  '🎭': 'Theater',
  '📚': 'Book',
  '👥': 'Users',
  '🏘️': 'Home',
  '🏘': 'Home',
  '🏠': 'Home',
  '🏡': 'Home',
  '📰': 'Newspaper',
  '📅': 'Calendar',
  '🗺️': 'Map',
  '🗺': 'Map',
  '📷': 'Camera',
  '📹': 'Video',
  '🎙️': 'Audio',
  '🎙': 'Audio',
  '🔍': 'Search',
  '📞': 'Phone',
  '✉️': 'Mail',
  '📨': 'Mail',
  '📢': 'Megaphone',
  '📣': 'Megaphone',
  '🕐': 'Clock',
  '⏱': 'Clock',
  '⏱️': 'Clock',
  '🛒': 'Cart',
  '🚗': 'Car',
  '💼': 'Briefcase',
  '🏷️': 'Tag',
  '🏷': 'Tag',
  '▶️': 'Play',
  '▶': 'Play',
  '📍': 'Pin',
  '☀️': 'Sun',
  '☀': 'Sun',
  '☁️': 'Cloud',
  '☁': 'Cloud',
  '⛅': 'CloudSun',
  '🌤': 'CloudSun',
  '🌤️': 'CloudSun',
  '🌧️': 'CloudRain',
  '🌧': 'CloudRain',
  '⭐': 'Star',
  '🔥': 'Fire',
  '🚨': 'Megaphone',
  '📋': 'Clipboard',
  '🏥': 'Hospital',
  '🌾': 'Wheat',
  '🎓': 'Graduation',
  '🛡️': 'Shield',
  '🛡': 'Shield',
  '🔧': 'Wrench',
  '🏢': 'Building',
  '🕊️': 'Dove',
  '🕊': 'Dove',
  '🎂': 'Cake',
  '✦': 'Star',
}

// Helper: render icon by emoji string (fallback do tekstu)
export function IconForEmoji({ emoji, size = 16, className = 'svg-icon' }: { emoji: string; size?: number; className?: string }) {
  const key = emojiToIconKey[emoji]
  if (!key) return null
  const C = Icon[key]
  return <C size={size} className={className} />
}
