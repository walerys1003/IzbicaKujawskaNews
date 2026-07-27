// SA6.5: AuthorCard — displays author bio, avatar, social links, article count
export interface AuthorData {
  name: string
  avatar?: string
  role?: string
  bio?: string
  email?: string
  twitter?: string
  facebook?: string
  articleCount?: number
  joinedAt?: string
}

export const AuthorCard = ({ author }: { author: AuthorData }) => {
  const initials = author.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside class="author-card-full" aria-label={`O autorze: ${author.name}`} style={`
      display: flex; gap: 20px; padding: 24px; margin: 32px 0;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px; border: 1px solid #dee2e6;
    `}>
      {/* Avatar */}
      <div class="author-card-avatar" style="flex-shrink: 0;">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            loading="lazy"
            width="80" height="80"
            style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.12);"
          />
        ) : (
          <div class="author-card-avatar-placeholder" aria-hidden="true" style={`
            width: 80px; height: 80px; border-radius: 50%;
            background: linear-gradient(135deg, #0a2540, #1a3a6c);
            color: #c8a951; display: flex; align-items: center; justify-content: center;
            font-size: 28px; font-weight: 700; border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          `}>
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div class="author-card-info" style="flex: 1; min-width: 0;">
        <h4 class="author-card-name" style="margin: 0 0 4px; font-size: 18px; color: #0a2540;">
          {author.name}
        </h4>
        {author.role && (
          <p class="author-card-role" style="margin: 0 0 8px; font-size: 13px; color: #8b1d2a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            {author.role}
          </p>
        )}
        {author.bio && (
          <p class="author-card-bio" style="margin: 0 0 12px; font-size: 14px; color: #495057; line-height: 1.6;">
            {author.bio}
          </p>
        )}

        {/* Stats row */}
        <div class="author-card-stats" style="display: flex; gap: 16px; margin-bottom: 10px; font-size: 12px; color: #6c757d;">
          {author.articleCount !== undefined && (
            <span>
              <strong style="color: #0a2540;">{author.articleCount}</strong> {author.articleCount === 1 ? 'artykuł' : author.articleCount >= 2 && author.articleCount <= 4 ? 'artykuły' : 'artykułów'}
            </span>
          )}
          {author.joinedAt && (
            <span>Od {author.joinedAt}</span>
          )}
        </div>

        {/* Social links + contact */}
        <div class="author-card-links" style="display: flex; gap: 8px; flex-wrap: wrap;">
          {author.email && (
            <a href={`mailto:${author.email}`} class="author-link author-link-email" aria-label={`Email: ${author.email}`} style={`
              display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px;
              font-size: 12px; border-radius: 20px; text-decoration: none;
              background: #0a2540; color: #fff; transition: opacity 0.2s;
            `}>
              ✉️ Email
            </a>
          )}
          {author.twitter && (
            <a href={`https://twitter.com/${author.twitter}`} target="_blank" rel="noopener noreferrer" class="author-link author-link-twitter" aria-label={`Twitter: @${author.twitter}`} style={`
              display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px;
              font-size: 12px; border-radius: 20px; text-decoration: none;
              background: #1da1f2; color: #fff; transition: opacity 0.2s;
            `}>
              𝕏 @{author.twitter}
            </a>
          )}
          {author.facebook && (
            <a href={author.facebook} target="_blank" rel="noopener noreferrer" class="author-link author-link-facebook" aria-label="Facebook" style={`
              display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px;
              font-size: 12px; border-radius: 20px; text-decoration: none;
              background: #1877f2; color: #fff; transition: opacity 0.2s;
            `}>
              📘 Facebook
            </a>
          )}
          <a href={`/szukaj?q=${encodeURIComponent(author.name)}`} class="author-link author-link-articles" style={`
            display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px;
            font-size: 12px; border-radius: 20px; text-decoration: none;
            background: #e9ecef; color: #495057; transition: background 0.2s;
          `}>
            📰 Wszystkie artykuły
          </a>
        </div>
      </div>
    </aside>
  )
}
