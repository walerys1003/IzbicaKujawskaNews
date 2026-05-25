import type { FC } from 'hono/jsx'

export const MediaUploader: FC = () => (
  <section class="admin-panel admin-uploader">
    <h2>Dodawanie mediów</h2>
    <form class="admin-upload-box">
      <input type="file" name="files" multiple />
      <button class="admin-button" type="submit">Wyślij do biblioteki</button>
    </form>
  </section>
)
