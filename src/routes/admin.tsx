import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import {
  AdminLayout,
  DashboardCards,
  ArticlesList,
  ArticleForm,
  CommentsList,
  UsersList,
  UserForm,
  MediaGallery,
  MediaUploader,
  ObituariesList,
  JobOffersList,
  RealEstateList,
  EventsList,
  NewslettersList,
  SettingsForm,
  ConfirmDialog,
  Toast,
  Pagination,
  FilterBar,
} from '../components/admin'
import type {
  AdminArticle,
  AdminComment,
  AdminUser,
  MediaItem,
  ObituaryItem,
  JobOfferItem,
  RealEstateItem,
  EventItem,
  NewsletterItem,
} from '../components/admin'

type Env = {
  Bindings: {
    JWT_SECRET?: string
  }
  Variables: {
    adminRole?: string
  }
}

const admin = new Hono<Env>()

const articles: AdminArticle[] = [
  { id: '1', title: 'Remont ul. Kościelnej zakończony przed terminem', slug: 'remont-koscielnej', category: 'Inwestycje', author: 'Anna Kowalska', updatedAt: '2026-05-25 09:10', status: 'published', views: 4287, comments: 41 },
  { id: '2', title: 'Sesja Rady Miejskiej — relacja', slug: 'sesja-rady-relacja', category: 'Samorząd', author: 'Piotr Mazur', updatedAt: '2026-05-24 18:15', status: 'review', views: 2412, comments: 17 },
  { id: '3', title: 'Kujawianka wygrywa 3:1', slug: 'kujawianka-31', category: 'Sport', author: 'Tomasz Lis', updatedAt: '2026-05-24 20:32', status: 'published', views: 3521, comments: 22 },
  { id: '4', title: 'MGCK ogłasza program lata', slug: 'mgck-program-lata', category: 'Kultura', author: 'Ola Nowicka', updatedAt: '2026-05-23 12:00', status: 'scheduled', views: 1938, comments: 6 },
]
const comments: AdminComment[] = [
  { id: '1', author: 'Jan K.', articleTitle: articles[0].title, content: 'Świetnie, że prace zakończono szybciej.', createdAt: '2026-05-25 08:10', status: 'approved' },
  { id: '2', author: 'Maria L.', articleTitle: articles[1].title, content: 'Proszę dodać pełny porządek obrad.', createdAt: '2026-05-25 08:45', status: 'pending' },
  { id: '3', author: 'Gość', articleTitle: articles[2].title, content: 'Podejrzany spam do moderacji.', createdAt: '2026-05-24 21:00', status: 'flagged' },
]
const users: AdminUser[] = [
  { id: '1', name: 'Anna Kowalska', email: 'anna@izbica24.local', role: 'admin', status: 'active' },
  { id: '2', name: 'Piotr Mazur', email: 'piotr@izbica24.local', role: 'editor', status: 'active' },
  { id: '3', name: 'Ewa Nowak', email: 'ewa@izbica24.local', role: 'editor', status: 'invited' },
]
const media: MediaItem[] = [
  { id: '1', title: 'Rynek po remoncie', url: '/static/img/wiadomosci/01-koscielna.jpg', type: 'image', size: '162 KB' },
  { id: '2', title: 'Kujawianka mecz', url: '/static/img/wiadomosci/02-kujawianka.jpg', type: 'image', size: '144 KB' },
  { id: '3', title: 'Piramidy z drona', url: '/static/img/wiadomosci/06-wietrzychowice.jpg', type: 'image', size: '188 KB' },
  { id: '4', title: 'Sesja rady', url: '/static/img/wiadomosci/04-sesja.jpg', type: 'image', size: '137 KB' },
]
const obituaries: ObituaryItem[] = [
  { id: '1', name: 'Ś.P. Stanisław Kowalski', dates: '1942–2026', photo: '/static/img/ogloszenia/nekrolog-1.jpg', notice: 'Msza żałobna 27 maja, godz. 10:00.' },
  { id: '2', name: 'Ś.P. Janina Nowakowa', dates: '1948–2026', photo: '/static/img/ogloszenia/nekrolog-2.jpg', notice: 'Pogrzeb 26 maja, godz. 12:00.' },
]
const jobs: JobOfferItem[] = [
  { id: '1', title: 'Kierowca C+E', company: 'Trans-Pol', salary: '5500–7000 zł', photo: '/static/img/ogloszenia/praca-kierowca.jpg' },
  { id: '2', title: 'Sprzedawca', company: 'PSS Społem', salary: 'do uzgodnienia', photo: '/static/img/ogloszenia/praca-sprzedawca.jpg' },
]
const estates: RealEstateItem[] = [
  { id: '1', title: 'Dom 120 m² · Sadłno', price: '385 000 zł', photo: '/static/img/ogloszenia/nieruchomosc-dom.jpg' },
  { id: '2', title: 'Mieszkanie 48 m² · ul. Kościelna', price: '215 000 zł', photo: '/static/img/ogloszenia/nieruchomosc-mieszkanie.jpg' },
]
const events: EventItem[] = [
  { id: '1', title: 'Sesja komisji budżetowej', date: '2026-05-26 14:00', location: 'Urząd Miejski', category: 'samorząd' },
  { id: '2', title: 'Warsztaty MGCK dla seniorów', date: '2026-05-27 11:00', location: 'MGCK', category: 'kultura' },
]
const newsletters: NewsletterItem[] = [
  { id: '1', subject: 'Najważniejsze z gminy — poniedziałek rano', audience: 'Wszyscy subskrybenci', scheduledAt: '2026-05-26 07:30', status: 'scheduled' },
  { id: '2', subject: 'Top 10 tygodnia + kalendarz MGCK', audience: 'Segment premium', scheduledAt: '2026-05-24 19:00', status: 'sent' },
]

const requireAdmin = async (c: any, next: any) => {
  const secret = c.env?.JWT_SECRET
  if (!secret) {
    c.set('adminRole', 'admin')
    return next()
  }
  const header = c.req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : (getCookie(c, 'admin_token') || '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload: any = await verify(token, secret)
    const role = payload?.role
    if (role !== 'admin' && role !== 'editor') return c.json({ error: 'Forbidden' }, 403)
    c.set('adminRole', role)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

admin.use('*', requireAdmin)

const page = (title: string, activePath: string, content: any, opts: { subtitle?: string; editor?: boolean } = {}) =>
  (<AdminLayout title={title} subtitle={opts.subtitle} activePath={activePath} role={'admin'} showEditorAssets={!!opts.editor} pageActions={<span class="admin-badge is-published">Tryb roboczy</span>} toast={{ message: 'Zmiany zapisują się lokalnie' }}>
    {content}
  </AdminLayout>)

admin.get('/', c => c.html(page('Dashboard', '/admin', <>
  <DashboardCards stats={[
    { label: 'Opublikowane dziś', value: 12, delta: '+3 vs wczoraj', tone: 'success' },
    { label: 'Komentarze do moderacji', value: 14, delta: '4 pilne', tone: 'warning' },
    { label: 'Aktywni redaktorzy', value: 6, delta: '2 online', tone: 'neutral' },
    { label: 'Alerty AI newsroom', value: 3, delta: '1 duplikat, 2 follow-upy', tone: 'danger' },
  ]} />
  <div class="admin-grid-two">
    <ArticlesList articles={articles} />
    <CommentsList comments={comments} />
  </div>
  <div class="admin-grid-two">
    <EventsList items={events} />
    <NewslettersList items={newsletters} />
  </div>
  <Pagination current={1} total={8} />
</>, { subtitle: 'Przegląd newsroomu, moderacji, publikacji i automatyzacji redakcyjnej.' })))

admin.get('/articles', c => c.html(page('Artykuły', '/admin/articles', <>
  <FilterBar searchPlaceholder="Szukaj po tytule lub slug" filters={[
    { name: 'status', options: [{ label: 'Wszystkie statusy', value: '' }, { label: 'Szkice', value: 'draft' }, { label: 'Do akceptacji', value: 'review' }, { label: 'Opublikowane', value: 'published' }] },
    { name: 'category', options: [{ label: 'Wszystkie kategorie', value: '' }, { label: 'Wiadomości', value: 'wiadomosci' }, { label: 'Samorząd', value: 'samorzad' }, { label: 'Sport', value: 'sport' }] },
  ]} />
  <ArticlesList articles={articles} />
  <Pagination current={1} total={12} />
</>, { subtitle: 'Lista wpisów, statusów i ścieżek publikacji.' })))

admin.get('/articles/new', c => c.html(page('Nowy artykuł', '/admin/articles', <ArticleForm mode="create" />, { subtitle: 'Tworzenie wpisu z pełnym workflow redakcyjnym.', editor: true })))
admin.get('/articles/:id/edit', c => {
  const article = articles.find(item => item.id === c.req.param('id')) || articles[0]
  return c.html(page('Edycja artykułu', '/admin/articles', <ArticleForm mode="edit" article={article} />, { subtitle: 'Edycja treści, SEO i embedy.', editor: true }))
})
admin.get('/comments', c => c.html(page('Komentarze', '/admin/comments', <>
  <FilterBar searchPlaceholder="Szukaj po autorze lub treści" filters={[{ name: 'status', options: [{ label: 'Wszystkie', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' }, { label: 'Flagged', value: 'flagged' }] }]} />
  <CommentsList comments={comments} />
</>, { subtitle: 'Moderacja komentarzy i sygnałów community.' })))
admin.get('/users', c => c.html(page('Użytkownicy', '/admin/users', <>
  <div class="admin-grid-two">
    <UsersList users={users} />
    <UserForm user={users[1]} />
  </div>
</>, { subtitle: 'Uprawnienia, role i onboardowanie redakcji.' })))
admin.get('/media', c => c.html(page('Media', '/admin/media', <>
  <MediaUploader />
  <MediaGallery items={media} />
</>, { subtitle: 'Biblioteka obrazów, wideo i dokumentów.' })))
admin.get('/ogloszenia', c => c.html(page('Ogłoszenia', '/admin/ogloszenia', <>
  <div class="admin-grid-two"><ObituariesList items={obituaries} /><JobOffersList items={jobs} /></div>
  <div class="admin-grid-two"><RealEstateList items={estates} /><EventsList items={events} /></div>
  <ConfirmDialog title="Publikacja ogłoszenia" text="Zweryfikuj dane, zdjęcie i kategorię przed publikacją." />
</>, { subtitle: 'Obsługa nekrologów, ofert pracy, nieruchomości i wydarzeń.' })))
admin.get('/settings', c => c.html(page('Ustawienia', '/admin/settings', <>
  <div class="admin-grid-two"><SettingsForm /><NewslettersList items={newsletters} /></div>
</>, { subtitle: 'Konfiguracja portalu, newslettera i preferencji newsroomu.' })))

export default admin
