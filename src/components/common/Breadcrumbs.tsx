export type BreadcrumbItem = { label: string; href?: string }

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumbs" style="margin:0 0 18px 0; font:600 12px/1.4 Inter, sans-serif; color:#6b7280; text-transform:uppercase; letter-spacing:.06em;">
    {items.map((item, index) => (
      <span>
        {item.href ? <a href={item.href} style="color:#8b1d2a; text-decoration:none;">{item.label}</a> : <span>{item.label}</span>}
        {index < items.length - 1 ? <span style="margin:0 8px; color:#9ca3af;">/</span> : null}
      </span>
    ))}
  </nav>
)
