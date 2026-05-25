import { Breadcrumbs, type BreadcrumbItem } from '../common/Breadcrumbs'
import { Pagination, type PaginationLink } from '../common/Pagination'

export type InfoSection = {
  heading: string
  body: string[]
  bullets?: string[]
}

export const PublicPageLayout = ({
  title,
  lead,
  breadcrumbs,
  sections,
  sidebarTitle,
  sidebarItems,
  pager,
}: {
  title: string
  lead: string
  breadcrumbs: BreadcrumbItem[]
  sections: InfoSection[]
  sidebarTitle?: string
  sidebarItems?: string[]
  pager?: PaginationLink[]
}) => (
  <section class="subpage-shell" style="padding-bottom:48px;">
    <div style="max-width:1180px; margin:0 auto; padding:32px 20px;">
      <Breadcrumbs items={breadcrumbs} />
      <div style="display:grid; grid-template-columns:minmax(0, 1.65fr) minmax(280px, .85fr); gap:28px; align-items:start;">
        <article style="background:#fff; border:1px solid #e5e7eb; box-shadow:0 20px 40px rgba(15,23,42,.06); padding:32px;">
          <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background:#f5efe7; color:#8b1d2a; font:700 11px Inter, sans-serif; text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px;">izbica24.pl</div>
          <h1 style="font:700 clamp(32px,5vw,52px)/1.05 'Playfair Display',serif; margin:0 0 16px 0; color:#111827;">{title}</h1>
          <p style="font:500 18px/1.75 Lora, serif; color:#374151; margin:0 0 28px 0; max-width:58ch;">{lead}</p>
          <div style="display:grid; gap:24px;">
            {sections.map((section) => (
              <section style="padding-top:18px; border-top:1px solid #f1f5f9;">
                <h2 style="font:700 24px/1.2 'Playfair Display',serif; margin:0 0 12px 0; color:#0a2540;">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p style="font:400 16px/1.8 Lora, serif; color:#334155; margin:0 0 12px 0;">{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul style="margin:8px 0 0 18px; color:#334155; font:400 15px/1.7 Inter, sans-serif;">
                    {section.bullets.map((bullet) => <li style="margin-bottom:8px;">{bullet}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
          {pager?.length ? <Pagination links={pager} /> : null}
        </article>
        <aside style="display:grid; gap:16px; position:sticky; top:24px;">
          <div style="background:#0a2540; color:#fff; padding:24px; box-shadow:0 20px 40px rgba(10,37,64,.18);">
            <div style="font:700 11px Inter, sans-serif; text-transform:uppercase; letter-spacing:.08em; color:#c8a951; margin-bottom:10px;">Panel informacyjny</div>
            <h3 style="font:700 22px/1.15 'Playfair Display',serif; margin:0 0 12px 0;">{sidebarTitle || 'Najważniejsze informacje'}</h3>
            <ul style="margin:0; padding-left:18px; font:400 14px/1.7 Inter, sans-serif; color:#e5e7eb;">
              {(sidebarItems || ['Adres redakcji: ul. Piłsudskiego 32, 87-865 Izbica Kujawska', 'Kontakt: redakcja@izbica24.pl', 'Godziny odpowiedzi: dni robocze 8:00–16:00']).map((item) => <li style="margin-bottom:8px;">{item}</li>)}
            </ul>
          </div>
          <div style="background:#fff; border:1px solid #e5e7eb; padding:20px;">
            <div style="font:700 11px Inter, sans-serif; text-transform:uppercase; letter-spacing:.08em; color:#8b1d2a; margin-bottom:8px;">Nawigacja</div>
            <a href="/kontakt" style="display:block; color:#111827; text-decoration:none; margin-bottom:8px;">Kontakt redakcji</a>
            <a href="/redakcja" style="display:block; color:#111827; text-decoration:none; margin-bottom:8px;">Zespół i standardy</a>
            <a href="/polityka-prywatnosci" style="display:block; color:#111827; text-decoration:none; margin-bottom:8px;">Prywatność i cookies</a>
            <a href="/reklama" style="display:block; color:#111827; text-decoration:none;">Oferta reklamowa</a>
          </div>
        </aside>
      </div>
    </div>
  </section>
)
