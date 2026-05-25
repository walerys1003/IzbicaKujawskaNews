import type { FC } from 'hono/jsx'
import type { AdminArticle } from './types'

export const ArticleForm: FC<{ article?: Partial<AdminArticle>; mode?: 'create' | 'edit' }> = ({ article, mode = 'create' }) => (
  <form class="admin-editor-form" method="post" action="#">
    <section class="admin-panel admin-editor-main">
      <div class="admin-panel-head">
        <h2>{mode === 'create' ? 'Nowy artykuł' : 'Edycja artykułu'}</h2>
        <div class="admin-row-actions">
          <button type="button" class="admin-button is-ghost" data-editor-action="validate">Waliduj publikację</button>
          <button type="submit" class="admin-button">Zapisz</button>
        </div>
      </div>
      <div class="admin-form-grid">
        <label>
          <span>Tytuł</span>
          <input class="admin-input" type="text" name="title" value={article?.title || ''} placeholder="Tytuł artykułu" />
        </label>
        <label>
          <span>Slug</span>
          <input class="admin-input" type="text" name="slug" value={article?.slug || ''} placeholder="slug-artykulu" />
        </label>
        <label>
          <span>Kategoria</span>
          <select class="admin-select" name="category">
            <option value="wiadomosci">Wiadomości</option>
            <option value="samorzad">Samorząd</option>
            <option value="kultura">Kultura</option>
            <option value="sport">Sport</option>
            <option value="ogloszenia">Ogłoszenia</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select class="admin-select" name="status">
            <option value="draft">Szkic</option>
            <option value="review">Do akceptacji</option>
            <option value="scheduled">Zaplanowany</option>
            <option value="published">Opublikowany</option>
          </select>
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
          <textarea name="content" id="editor-content" class="admin-textarea is-hidden">{article?.title ? `<h2>${article.title}</h2><p>Treść robocza…</p>` : '<p></p>'}</textarea>
          <div class="editor-meta-row">
            <span data-editor-words>Słowa: 0</span>
            <span data-editor-reading>Czas czytania: 0 min</span>
            <span data-editor-autosave>Autosave: gotowy</span>
          </div>
        </div>
        <aside class="editor-sidebar">
          <section class="admin-panel">
            <h3>SEO</h3>
            <label><span>SEO title</span><input class="admin-input" type="text" name="seoTitle" /></label>
            <label><span>SEO description</span><textarea class="admin-textarea" name="seoDescription"></textarea></label>
            <label><span>Słowa kluczowe</span><input class="admin-input" type="text" name="seoKeywords" placeholder="izbica kujawska, portal, samorząd" /></label>
          </section>
          <section class="admin-panel">
            <h3>Embed cards</h3>
            <div class="editor-embeds">
              <button type="button" class="admin-button is-ghost" data-cmd="embed-facebook">Facebook</button>
              <button type="button" class="admin-button is-ghost" data-cmd="embed-instagram">Instagram</button>
              <button type="button" class="admin-button is-ghost" data-cmd="embed-x">X / Twitter</button>
            </div>
          </section>
          <section class="admin-panel">
            <h3>Slash commands</h3>
            <p>Napisz „/” w edytorze, aby wstawić nagłówek, cytat, tabelę, box SEO lub embed.</p>
          </section>
        </aside>
      </div>
    </section>
  </form>
)
