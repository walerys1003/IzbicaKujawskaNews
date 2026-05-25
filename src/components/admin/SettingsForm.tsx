import type { FC } from 'hono/jsx'

export const SettingsForm: FC = () => (
  <form class="admin-panel admin-form-stack">
    <h2>Ustawienia redakcji</h2>
    <label><span>Nazwa portalu</span><input class="admin-input" type="text" value="Izbica24" /></label>
    <label><span>Email redakcji</span><input class="admin-input" type="email" value="redakcja@izbica24.local" /></label>
    <label><span>Domyślna rola nowych kont</span><select class="admin-select"><option>editor</option><option>admin</option></select></label>
    <label><span>Tryb moderacji komentarzy</span><select class="admin-select"><option>Premoderacja</option><option>Postmoderacja</option></select></label>
    <label><span>Stopka newslettera</span><textarea class="admin-textarea">Najważniejsze z gminy, raz w tygodniu.</textarea></label>
    <div><button type="submit" class="admin-button">Zapisz ustawienia</button></div>
  </form>
)
