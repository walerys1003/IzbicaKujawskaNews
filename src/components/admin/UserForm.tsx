import type { FC } from 'hono/jsx'
import type { AdminUser } from './types'

export const UserForm: FC<{ user?: Partial<AdminUser> }> = ({ user }) => (
  <form class="admin-panel admin-form-stack">
    <h2>Użytkownik</h2>
    <label><span>Imię i nazwisko</span><input class="admin-input" type="text" value={user?.name || ''} /></label>
    <label><span>Email</span><input class="admin-input" type="email" value={user?.email || ''} /></label>
    <label><span>Rola</span><select class="admin-select"><option>editor</option><option>admin</option></select></label>
    <label><span>Status</span><select class="admin-select"><option>active</option><option>invited</option><option>blocked</option></select></label>
    <div><button class="admin-button" type="submit">Zapisz użytkownika</button></div>
  </form>
)
