INSERT INTO users (email, password_hash, name, role, avatar, bio)
VALUES (
  'admin@izbica24.pl',
  '$2b$12$5xV0l6vG8q2S1p3c8a9A0uY0tXzRrV2wQ6kD0eJ8sL9mN1oP2qR3S',
  'Administrator Izbica24',
  'admin',
  'users/admin-avatar.jpg',
  'Konto administracyjne portalu Izbica24'
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  name = excluded.name,
  role = excluded.role,
  avatar = excluded.avatar,
  bio = excluded.bio,
  updated_at = CURRENT_TIMESTAMP;
