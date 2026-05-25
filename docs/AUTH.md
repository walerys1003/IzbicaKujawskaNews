# Auth

## Zakres

- JWT access / refresh
- profile i sessions
- 2FA enable / verify
- reset hasła, change password, verify email
- provider hooks: Google, Facebook

## Przepływ

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. klient zapisuje access token bezpiecznie
4. `POST /api/v1/auth/refresh` odnawia sesję
5. chronione endpointy używają middleware `require-auth` i `require-role`

## Hashowanie

Hasła są obsługiwane przez PBKDF2 w helperach auth.
