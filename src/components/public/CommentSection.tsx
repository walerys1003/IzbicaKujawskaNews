// SA6: Comment section + CommentForm components
import type { CommentRow } from '../../repository'

interface CommentSectionProps {
  articleSlug: string
  articleTitle: string
  comments: CommentRow[]
}

export const CommentSection = ({ articleSlug, articleTitle, comments }: CommentSectionProps) => (
  <section class="comment-section" id="komentarze" style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e0e0e0;">
    <h2 style="font-size: 22px; margin-bottom: 8px;">
      Komentarze
      {comments.length > 0 && <span style="font-size: 16px; color: #888; margin-left: 8px;">({comments.length})</span>}
    </h2>
    <p style="color: #666; font-size: 13px; margin-bottom: 24px;">
      Komentarze są moderowane przez redakcję. Publikowane są po akceptacji.
    </p>

    <CommentForm articleSlug={articleSlug} />

    {comments.length === 0 ? (
      <div style="padding: 32px; text-align: center; background: #f9f9f9; border-radius: 8px; margin-top: 24px;">
        <p style="color: #888; margin: 0;">Bądź pierwszym komentującym! Podziel się swoją opinią.</p>
      </div>
    ) : (
      <div class="comments-list" style="margin-top: 24px;">
        {comments.map(comment => (
          <CommentCard comment={comment} />
        ))}
      </div>
    )}
  </section>
)

const CommentCard = ({ comment }: { comment: CommentRow }) => (
  <div class="comment-card" style="padding: 16px; background: #fff; border: 1px solid #eee; border-radius: 8px; margin-bottom: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="font-size: 14px; color: #1a1a2e;">{comment.author}</strong>
      <time datetime={comment.created_at} style="font-size: 12px; color: #999;">
        {new Date(comment.created_at).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </time>
    </div>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333;">{comment.content}</p>
  </div>
)

export const CommentForm = ({ articleSlug }: { articleSlug: string }) => (
  <form id="comment-form" class="comment-form" style="display: flex; flex-direction: column; gap: 12px; padding: 20px; background: #fafafa; border-radius: 8px; border: 1px solid #e0e0e0;"
    onsubmit={`event.preventDefault(); submitComment('${articleSlug}')`}>
    <div>
      <label for="comment-author" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #555;">
        Imię / pseudonim <span style="color: #e94560;">*</span>
      </label>
      <input type="text" id="comment-author" name="author" required minlength="2" maxlength="50"
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
        placeholder="Twoje imię lub pseudonim" />
    </div>

    <div>
      <label for="comment-content" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #555;">
        Twój komentarz <span style="color: #e94560;">*</span>
      </label>
      <textarea id="comment-content" name="content" required minlength="10" maxlength="2000" rows={4}
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; resize: vertical;"
        placeholder="Napisz, co myślisz... (minimum 10 znaków)"></textarea>
    </div>

    <div style="display: flex; gap: 16px; align-items: center;">
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; cursor: pointer;">
        <input type="checkbox" required style="accent-color: #e94560;" />
        Akceptuję <a href="/regulamin" style="color: #e94560;" target="_blank">regulamin komentarzy</a>
      </label>
    </div>

    <div id="comment-message" style="display: none; padding: 12px; border-radius: 6px; font-size: 13px;"></div>

    <button type="submit"
      style="align-self: flex-start; padding: 10px 24px; background: #e94560; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
      Wyślij komentarz
    </button>
  </form>
)

// Client-side script for comment submission
export const CommentScript = () => `
<script>
async function submitComment(slug) {
  const form = document.getElementById('comment-form');
  const msg = document.getElementById('comment-message');
  const author = document.getElementById('comment-author').value.trim();
  const content = document.getElementById('comment-content').value.trim();

  if (!author || !content) {
    msg.style.display = 'block';
    msg.style.background = '#fff3cd';
    msg.style.border = '1px solid #ffc107';
    msg.textContent = 'Proszę wypełnić wszystkie wymagane pola.';
    return;
  }

  if (content.length < 10) {
    msg.style.display = 'block';
    msg.style.background = '#fff3cd';
    msg.textContent = 'Komentarz musi mieć co najmniej 10 znaków.';
    return;
  }

  try {
    msg.style.display = 'block';
    msg.style.background = '#e3f2fd';
    msg.style.border = '1px solid #2196f3';
    msg.textContent = 'Wysyłanie...';

    const res = await fetch('/api/v1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_slug: slug, author, content })
    });
    const data = await res.json();

    if (res.ok) {
      msg.style.background = '#d4edda';
      msg.style.border = '1px solid #28a745';
      msg.textContent = 'Dziękujemy! Komentarz został wysłany i czeka na moderację.';
      form.reset();
    } else {
      msg.style.background = '#f8d7da';
      msg.style.border = '1px solid #dc3545';
      msg.textContent = data.error || 'Wystąpił błąd. Spróbuj ponownie później.';
    }
  } catch (err) {
    msg.style.background = '#f8d7da';
    msg.style.border = '1px solid #dc3545';
    msg.textContent = 'Błąd połączenia. Sprawdź internet i spróbuj ponownie.';
  }
}
</script>`
