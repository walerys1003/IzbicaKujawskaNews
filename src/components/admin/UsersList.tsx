import type { FC } from 'hono/jsx'
import type { AdminUser } from './types'

export const UsersList: FC<{ users: AdminUser[] }> = ({ users }) => (
  <section class="admin-panel">
    <div class="admin-panel-head">
      <h2>Użytkownicy</h2>
      <button class="admin-button" type="button">Zaproś użytkownika</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Imię i nazwisko</th><th>Email</th><th>Rola</th><th>Status</th></tr></thead>
        <tbody>
          {users.map(user => (
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td><span class="admin-badge is-review">{user.role}</span></td>
              <td><span class={`admin-badge is-${user.status === 'active' ? 'published' : user.status === 'invited' ? 'scheduled' : 'archived'}`}>{user.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)
