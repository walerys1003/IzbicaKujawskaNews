// SA6.5: TableOfContents — auto-generated from article body headers
export interface TocEntry {
  id: string
  level: number
  text: string
  number?: string
}

export interface TableOfContentsProps {
  entries: TocEntry[]
  title?: string
}

// Extract headings from HTML body paragraphs
export function extractTocEntries(body: string[]): TocEntry[] {
  const entries: TocEntry[] = []
  const headingRegex = /<h([2-3])\b[^>]*?\bid=["']([^"']+)["'][^>]*>(.+?)<\/h\1>/gi
  const counters: Record<string, number> = {}

  for (const para of body) {
    let match: RegExpExecArray | null
    while ((match = headingRegex.exec(para)) !== null) {
      const level = parseInt(match[1])
      const id = match[2]
      const rawText = match[3].replace(/<[^>]+>/g, '')
      const prefix = level === 2 ? 'h2' : 'h3'
      counters[prefix] = (counters[prefix] || 0) + 1
      entries.push({
        id,
        level,
        text: rawText,
      })
    }
  }
  return entries
}

export const TableOfContents = ({ entries, title = 'Spis treści' }: TableOfContentsProps) => {
  if (entries.length === 0) return null

  return (
    <nav class="toc" aria-labelledby="toc-heading" style={`
      background: linear-gradient(135deg, #f8f9fa, #fff);
      border: 1px solid #dee2e6; border-left: 4px solid #c8a951;
      border-radius: 8px; padding: 20px 24px; margin: 24px 0;
      font-family: 'Inter', system-ui, sans-serif;
    `}>
      <header class="toc-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
        <span aria-hidden="true" style="font-size: 18px;">📑</span>
        <h2 id="toc-heading" style="margin: 0; font-size: 16px; font-weight: 700; color: #0a2540; text-transform: uppercase; letter-spacing: 1px;">
          {title}
        </h2>
      </header>
      <ol class="toc-list" style={`
        list-style: none; margin: 0; padding: 0;
        counter-reset: toc-counter;
      `}>
        {entries.map(entry => (
          <li
            key={entry.id}
            class={`toc-item toc-level-${entry.level}`}
            style={`
              counter-increment: toc-counter;
              padding: ${entry.level === 2 ? '6px 0 6px 0' : '4px 0 4px 20px'};
              font-size: ${entry.level === 2 ? '14px' : '13px'};
              border-bottom: 1px solid #f1f3f5;
            `}
          >
            <a
              href={`#${entry.id}`}
              class="toc-link"
              style={`
                color: ${entry.level === 2 ? '#0a2540' : '#495057'};
                text-decoration: none; 
                font-weight: ${entry.level === 2 ? '600' : '400'};
                transition: color 0.15s;
                display: flex; align-items: baseline; gap: 6px;
              `}
            >
              <span class="toc-counter" aria-hidden="true" style={`
                font-size: 11px; color: #8b1d2a; font-weight: 700;
                min-width: 20px; flex-shrink: 0;
              `}>
                {entry.level === 2 ? '' : '•'}
              </span>
              <span>{entry.text}</span>
            </a>
          </li>
        ))}
      </ol>
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          // Smooth scroll for TOC links
          document.querySelectorAll('.toc-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              var target = document.getElementById(this.getAttribute('href').slice(1));
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, '', '#' + target.id);
              }
            });
          });
          // Highlight current section on scroll
          var tocLinks = document.querySelectorAll('.toc-link');
          var headings = [];
          tocLinks.forEach(function(link) {
            var id = link.getAttribute('href').slice(1);
            var el = document.getElementById(id);
            if (el) headings.push({ id: id, el: el, link: link });
          });
          if (headings.length) {
            var observer = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  tocLinks.forEach(function(l) { l.style.color = ''; });
                  var active = document.querySelector('.toc-link[href="#' + entry.target.id + '"]');
                  if (active) active.style.color = '#c8a951';
                }
              });
            }, { rootMargin: '-80px 0px -70% 0px' });
            headings.forEach(function(h) { observer.observe(h.el); });
          }
        })();
      `}} />
    </nav>
  )
}
