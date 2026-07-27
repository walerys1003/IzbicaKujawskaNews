import type { FC } from 'hono/jsx'

/**
 * A5 — formularz wgrywania mediow do biblioteki.
 *
 * Wysyla multipart/form-data na POST /api/v1/media2. Nazwa pola musi byc
 * dokladnie `file`, bo tak czyta ja handler w src/routes/v1/media-v2.ts.
 * `accept` ogranicza wybor w okienku systemowym, ale to tylko wygoda —
 * prawdziwa weryfikacja typu odbywa sie po stronie serwera na sygnaturze
 * bajtow, bo Content-Type z przegladarki wynika z rozszerzenia pliku
 * i wystarczy zmienic nazwe, zeby go podrobic.
 *
 * Formularz dziala rowniez bez JavaScriptu (method/action/enctype sa
 * ustawione), a skrypt /static/js/admin-media-upload.js podmienia go na
 * wysylke w tle z paskiem postepu i podgladem.
 */
export const MediaUploader: FC<{ maxImageMb?: number }> = ({ maxImageMb = 25 }) => (
  <section class="admin-panel admin-uploader" id="media-uploader">
    <h2>Dodawanie mediów</h2>

    <form
      class="admin-upload-box"
      id="media-upload-form"
      method="post"
      action="/api/v1/media2"
      enctype="multipart/form-data"
      accept-charset="UTF-8"
    >
      <div class="admin-field">
        <label class="admin-label" for="media-file">
          Plik <span class="admin-required">*</span>
        </label>
        <input
          class="admin-input"
          type="file"
          id="media-file"
          name="file"
          required
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,application/pdf"
        />
        <p class="admin-hint">
          Zdjęcia do {maxImageMb} MB. Dopuszczone: JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MP3, WAV, PDF.
        </p>
      </div>

      <div class="admin-field">
        <label class="admin-label" for="media-alt">
          Opis alternatywny (alt) <span class="admin-required">*</span>
        </label>
        <input
          class="admin-input"
          type="text"
          id="media-alt"
          name="alt"
          maxlength={300}
          required
          placeholder="Co widać na zdjęciu — dla osób korzystających z czytnika ekranu"
        />
        <p class="admin-hint">
          Bez opisu zdjęcie zablokuje publikację galerii. Opisz treść, nie plik —
          „Strażacy gaszą pożar stodoły w Śmielniku”, nie „zdjęcie 1”.
        </p>
      </div>

      <div class="admin-field">
        <label class="admin-label" for="media-caption">Podpis pod zdjęciem</label>
        <input class="admin-input" type="text" id="media-caption" name="caption" maxlength={500} />
      </div>

      <fieldset class="admin-fieldset">
        <legend>Pochodzenie i licencja</legend>
        <p class="admin-hint">
          Wypełnij, jeśli zdjęcie nie jest nasze. Bez tych danych nie da się
          później udowodnić, że mamy prawo je publikować.
        </p>

        <div class="admin-field">
          <label class="admin-label" for="media-author">Autor / fotograf</label>
          <input class="admin-input" type="text" id="media-author" name="author" maxlength={200} />
        </div>

        <div class="admin-field">
          <label class="admin-label" for="media-license">Licencja</label>
          <select class="admin-input" id="media-license" name="license">
            <option value="own">Własne — redakcja Izbica24</option>
            <option value="CC0">CC0 (domena publiczna)</option>
            <option value="CC-BY-4.0">CC BY 4.0</option>
            <option value="CC-BY-SA-4.0">CC BY-SA 4.0</option>
            <option value="permission">Zgoda autora (pisemna)</option>
            <option value="press">Materiał prasowy</option>
          </select>
        </div>

        <div class="admin-field">
          <label class="admin-label" for="media-source">Źródło (nazwa)</label>
          <input class="admin-input" type="text" id="media-source" name="source" maxlength={200} />
        </div>

        <div class="admin-field">
          <label class="admin-label" for="media-source-url">Źródło (adres)</label>
          <input
            class="admin-input"
            type="url"
            id="media-source-url"
            name="sourceUrl"
            maxlength={500}
            placeholder="https://"
          />
        </div>
      </fieldset>

      <div class="admin-field">
        <label class="admin-label" for="media-credit">Podpis licencyjny wyświetlany publicznie</label>
        <input
          class="admin-input"
          type="text"
          id="media-credit"
          name="credit"
          maxlength={200}
          placeholder="fot. Jan Kowalski / UM Izbica Kujawska"
        />
      </div>

      <button class="admin-button" type="submit" id="media-upload-submit">
        Wyślij do biblioteki
      </button>

      <p class="admin-upload-status" id="media-upload-status" role="status" aria-live="polite"></p>
      <div class="admin-upload-progress" id="media-upload-progress" hidden>
        <progress id="media-upload-bar" max="100" value="0"></progress>
      </div>
      <div class="admin-upload-preview" id="media-upload-preview" hidden></div>
    </form>

    <script src="/static/js/admin-media-upload.js" defer></script>
  </section>
)
