import type { FC } from 'hono/jsx'
import type { AdminArticle, ArticleStatus } from './types'

/**
 * FAZA 2 / F-panel — formularz artykułu podłączony do bazy.
 *
 * CO BYŁO NIE TAK
 * ───────────────
 * `action="#"` oznaczało, że „Zapisz” przeładowywał tę samą stronę i gubił
 * wszystko, co redaktor napisał. Formularz wyglądał na działający — miał
 * przycisk, walidację po stronie klienta i licznik słów — więc awaria była
 * widoczna dopiero po utracie tekstu.
 *
 * Druga rzecz: pole treści przy edycji zawierało zaślepkę
 * `<h2>{title}</h2><p>Treść robocza…</p>`, a nie prawdziwy artykuł. Zapis
 * NADPISAŁBY treść tą zaślepką. To nie brak funkcji — to cicha utrata
 * materiału przy pierwszym kliknięciu.
 *
 * KONTROLA RÓWNOCZESNEJ EDYCJI (B4)
 * ─────────────────────────────────
 * Ukryte `expectedUpdatedAt` nosi znacznik czasu z chwili otwarcia. Serwer
 * porównuje go z `articles.updated_at`; różnica oznacza, że ktoś zapisał
 * w międzyczasie i zapis zostaje odrzucony z komunikatem, zamiast po cichu
 * zamazać cudzą pracę.
 */

export type CategoryOption = { slug: string; name: string }

export type ArticleFormProps = {
  article?: Partial<AdminArticle>
  mode?: 'create' | 'edit'
  categories?: CategoryOption[]
  /** Statusy, na które rola zalogowanego użytkownika ma uprawnienie. */
  allowedStatuses?: ArticleStatus[]
  /** Sołectwa gminy — do przypisania materiału do miejscowości. */
  solectwa?: string[]
  errors?: string[]
  /** Informacja o blokadzie edycji założonej przez kogoś innego. */
  lockedBy?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  review: 'Do akceptacji',
  scheduled: 'Zaplanowany',
  published: 'Opublikowany',
  archived: 'Zarchiwizowany',
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { slug: 'wiadomosci', name: 'Wiadomości' },
  { slug: 'samorzad', name: 'Samorząd' },
  { slug: 'kultura', name: 'Kultura' },
  { slug: 'sport', name: 'Sport' },
  { slug: 'ogloszenia', name: 'Ogłoszenia' },
]

export const ArticleForm: FC<ArticleFormProps> = ({
  article,
  mode = 'create',
  categories = DEFAULT_CATEGORIES,
  allowedStatuses = ['draft', 'review'],
  solectwa = [],
  errors = [],
  lockedBy,
}) => {
  const action = mode === 'edit' && article?.id ? `/admin/articles/${article.id}` : '/admin/articles'
  const currentStatus = (article?.status ?? 'draft') as string
  const content = article?.contentHtml ?? '<p></p>'

  return (
    <form class="admin-editor-form" method="post" action={action}>
      {/*
        Znacznik czasu z chwili otwarcia formularza. Bez niego dwie osoby
        edytujące ten sam artykuł nadpisują się wzajemnie bez ostrzeżenia.
      */}
      {mode === 'edit' && article?.expectedUpdatedAt && (
        <input type="hidden" name="expectedUpdatedAt" value={article.expectedUpdatedAt} />
      )}

      {lockedBy && (
        <p class="admin-login-error" role="alert">
          Artykuł jest w tej chwili edytowany przez: {lockedBy}. Zapis nadpisze zmiany tej osoby.
        </p>
      )}

      {errors.length > 0 && (
        <section class="admin-panel admin-form-errors" role="alert">
          <h2>Nie udało się zapisać</h2>
          <ul>
            {errors.map(error => (
              <li>{error}</li>
            ))}
          </ul>
        </section>
      )}

      <section class="admin-panel admin-editor-main">
        <div class="admin-panel-head">
          <h2>{mode === 'create' ? 'Nowy artykuł' : 'Edycja artykułu'}</h2>
          <div class="admin-row-actions">
            <button type="button" class="admin-button is-ghost" data-editor-action="validate">Waliduj publikację</button>
            {mode === 'edit' && article?.slug && (
              <a href={`/${article.slug}`} class="admin-button is-ghost" target="_blank" rel="noreferrer">Podgląd</a>
            )}
            <button type="submit" class="admin-button">Zapisz</button>
          </div>
        </div>

        <div class="admin-form-grid">
          <label>
            <span>Tytuł *</span>
            <input class="admin-input" type="text" name="title" value={article?.title || ''} placeholder="Tytuł artykułu" required maxlength={200} />
          </label>
          <label>
            <span>Slug (pusty = z tytułu)</span>
            <input class="admin-input" type="text" name="slug" value={article?.slug || ''} placeholder="slug-artykulu" maxlength={200} />
          </label>
          <label class="admin-form-wide">
            <span>Lid — zapowiedź widoczna na listach *</span>
            <textarea class="admin-textarea" name="lead" required maxlength={600} placeholder="Dwa–trzy zdania streszczenia.">{article?.lead || ''}</textarea>
          </label>
          <label>
            <span>Kategoria *</span>
            <select class="admin-select" name="category" required>
              {categories.map(category => (
                <option value={category.slug} selected={article?.category === category.slug || article?.category === category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select class="admin-select" name="status">
              {allowedStatuses.map(status => (
                <option value={status} selected={currentStatus === status}>{STATUS_LABELS[status] ?? status}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sołectwo (opcjonalnie)</span>
            <select class="admin-select" name="solectwo">
              <option value="">— cała gmina —</option>
              {solectwa.map(name => (
                <option value={name} selected={article?.solectwo === name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Zdjęcie główne — adres</span>
            <input class="admin-input" type="text" name="heroImage" value={article?.heroImage || ''} placeholder="/static/img/…" />
          </label>
          <label>
            <span>Opis alternatywny zdjęcia</span>
            <input class="admin-input" type="text" name="heroAlt" value={article?.heroAlt || ''} placeholder="Co widać na zdjęciu" maxlength={300} />
          </label>
        </div>

        <div class="editor-toolbar" data-editor-toolbar>
          <button type="button" data-cmd="bold">B</button>
          <button type="button" data-cmd="italic">I</button>
          <button type="button" data-cmd="heading">H</button>
          <button type="button" data-cmd="bulletList">• Lista</button>
          <button type="button" data-cmd="blockquote">❝ Cytat</button>
          <button type="button" data-cmd="link">Link</button>
          <button type="button" data-cmd="image">Obraz</button>
          <button type="button" data-cmd="table">Tabela</button>
          <button type="button" data-cmd="youtube">YouTube</button>
          <button type="button" data-cmd="codeBlock">Kod</button>
          <button type="button" data-cmd="horizontalRule">HR</button>
          <button type="button" data-cmd="undo">↶</button>
          <button type="button" data-cmd="redo">↷</button>
          <button type="button" data-editor-action="fullscreen">⛶</button>
        </div>

        <div class="editor-grid">
          <div class="editor-stage">
            <div id="newsroom-editor" class="editor-surface" data-placeholder="Wpisz treść artykułu…"></div>
            {/*
              Pole jest widoczne, dopóki edytor JS nie przejmie treści
              (`editor.js` dokłada klasę `is-hidden`). Dzięki temu redaktor
              bez działających skryptów nadal napisze artykuł — HTML
              w textarea przechodzi przez ten sam konwerter i tę samą
              sanityzację, co treść z TipTapa.
            */}
            <textarea name="content" id="editor-content" class="admin-textarea">{content}</textarea>
            <div class="editor-meta-row">
              <span data-editor-words>Słowa: 0</span>
              <span data-editor-reading>Czas czytania: 0 min</span>
              <span data-editor-autosave>Autosave: gotowy</span>
            </div>
          </div>

          <aside class="editor-sidebar">
            <section class="admin-panel">
              <h3>Tagi</h3>
              <label>
                <span>Rozdzielone przecinkami</span>
                <input class="admin-input" type="text" name="tags" value={(article?.tags || []).join(', ')} placeholder="rada miejska, budżet" />
              </label>
            </section>
            <section class="admin-panel">
              <h3>SEO</h3>
              <label><span>SEO title</span><input class="admin-input" type="text" name="seoTitle" value={article?.seoTitle || ''} maxlength={200} /></label>
              <label><span>SEO description</span><textarea class="admin-textarea" name="seoDescription" maxlength={400}>{article?.seoDescription || ''}</textarea></label>
            </section>
            <section class="admin-panel">
              <h3>Oznaczenie AI</h3>
              <label class="admin-check">
                <input type="checkbox" name="aiAssisted" value="1" checked={!!article?.aiAssisted} />
                <span>Materiał powstał z udziałem AI</span>
              </label>
              <p class="admin-hint">
                Oznaczenie jest wymagane, jeśli tekst albo jego część wygenerował model.
                Publikacja bez niego to wprowadzenie czytelnika w błąd.
              </p>
            </section>
            <section class="admin-panel">
              <h3>Embed cards</h3>
              <div class="editor-embeds">
                <button type="button" class="admin-button is-ghost" data-cmd="embed-facebook">Facebook</button>
                <button type="button" class="admin-button is-ghost" data-cmd="embed-instagram">Instagram</button>
                <button type="button" class="admin-button is-ghost" data-cmd="embed-x">X / Twitter</button>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </form>
  )
}
