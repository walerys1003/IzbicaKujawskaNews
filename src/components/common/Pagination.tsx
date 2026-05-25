export type PaginationLink = { label: string; href?: string; active?: boolean }

export const Pagination = ({ links }: { links: PaginationLink[] }) => (
  <nav aria-label="Pagination" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:28px;">
    {links.map((link) => (
      link.href ? (
        <a
          href={link.href}
          style={`padding:10px 14px; border:1px solid ${link.active ? '#8b1d2a' : '#d1d5db'}; background:${link.active ? '#8b1d2a' : '#fff'}; color:${link.active ? '#fff' : '#111827'}; text-decoration:none; border-radius:999px; font:600 13px Inter, sans-serif;`}
        >
          {link.label}
        </a>
      ) : (
        <span style="padding:10px 14px; border:1px solid #e5e7eb; color:#9ca3af; border-radius:999px; font:600 13px Inter, sans-serif;">{link.label}</span>
      )
    ))}
  </nav>
)
