import type { FC } from 'hono/jsx'

export const ConfirmDialog: FC<{ title?: string; text?: string }> = ({ title = 'Potwierdzenie', text = 'Czy na pewno chcesz wykonać tę operację?' }) => (
  <dialog class="admin-dialog" open>
    <h3>{title}</h3>
    <p>{text}</p>
    <div class="admin-row-actions">
      <button type="button" class="admin-button is-ghost">Anuluj</button>
      <button type="button" class="admin-button">Potwierdź</button>
    </div>
  </dialog>
)
