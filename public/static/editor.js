(() => {
  const textarea = document.getElementById('editor-content');
  const mount = document.getElementById('newsroom-editor');
  if (!textarea || !mount) return;

  const wordsEl = document.querySelector('[data-editor-words]');
  const readingEl = document.querySelector('[data-editor-reading]');
  const autosaveEl = document.querySelector('[data-editor-autosave]');
  const toolbar = document.querySelector('[data-editor-toolbar]');
  const form = textarea.closest('form');

  const slash = document.createElement('div');
  slash.className = 'editor-slash';
  slash.innerHTML = [
    ['heading','Nagłówek'],['blockquote','Cytat'],['bulletList','Lista'],['table','Tabela'],['horizontalRule','Separator'],['image','Obraz'],['youtube','YouTube']
  ].map(([cmd,label]) => `<button type="button" data-cmd="${cmd}">${label}</button>`).join('');
  document.body.appendChild(slash);

  const metricUpdate = (html) => {
    const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').length : 0;
    const reading = Math.max(1, Math.ceil(words / 180));
    if (wordsEl) wordsEl.textContent = `Słowa: ${words}`;
    if (readingEl) readingEl.textContent = `Czas czytania: ${reading} min`;
  };

  const state = { editor: null, autosaveTimer: null };

  const setAutosave = (label) => { if (autosaveEl) autosaveEl.textContent = label; };

  const saveDraft = () => {
    const html = state.editor ? state.editor.getHTML() : mount.innerHTML;
    textarea.value = html;
    try { localStorage.setItem('izbica24-editor-draft', html); } catch (e) {}
    setAutosave(`Autosave: ${new Date().toLocaleTimeString('pl-PL', { hour:'2-digit', minute:'2-digit' })}`);
    metricUpdate(html);
  };

  const validatePublish = () => {
    const html = state.editor ? state.editor.getHTML() : mount.innerHTML;
    const text = html.replace(/<[^>]+>/g, ' ').trim();
    const title = form?.querySelector('input[name="title"]')?.value?.trim() || '';
    const seoTitle = form?.querySelector('input[name="seoTitle"]')?.value?.trim() || '';
    const issues = [];
    if (title.length < 12) issues.push('Tytuł powinien mieć min. 12 znaków.');
    if (text.length < 320) issues.push('Treść jest za krótka do publikacji.');
    if (!seoTitle) issues.push('Brak SEO title.');
    let box = document.querySelector('.editor-validation');
    if (!box) {
      box = document.createElement('div');
      box.className = 'editor-validation';
      mount.parentElement?.appendChild(box);
    }
    box.innerHTML = issues.length ? `<strong>Walidacja publikacji</strong><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>` : '<strong>Walidacja publikacji</strong><p>Brak blokad — wpis gotowy do publikacji.</p>';
  };

  const toggleFullscreen = () => document.body.classList.toggle('editor-shell-fullscreen');

  const openSlash = (rect) => {
    slash.style.left = `${rect.left + window.scrollX}px`;
    slash.style.top = `${rect.bottom + window.scrollY + 8}px`;
    slash.classList.add('is-open');
  };
  const closeSlash = () => slash.classList.remove('is-open');

  const cmdFallback = (cmd) => {
    const simple = { bold:'bold', italic:'italic', undo:'undo', redo:'redo', insertHorizontalRule:'insertHorizontalRule' };
    if (cmd === 'horizontalRule') document.execCommand('insertHorizontalRule');
    else if (cmd === 'heading') document.execCommand('formatBlock', false, 'h2');
    else if (cmd === 'blockquote') document.execCommand('formatBlock', false, 'blockquote');
    else if (cmd === 'bulletList') document.execCommand('insertUnorderedList');
    else if (cmd === 'codeBlock') document.execCommand('formatBlock', false, 'pre');
    else if (cmd === 'link') {
      const url = prompt('URL linku');
      if (url) document.execCommand('createLink', false, url);
    } else if (cmd === 'image') {
      const url = prompt('URL obrazu');
      if (url) document.execCommand('insertImage', false, url);
    } else if (cmd === 'table') {
      document.execCommand('insertHTML', false, '<table><tr><th>Nagłówek</th><th>Nagłówek</th></tr><tr><td>Treść</td><td>Treść</td></tr></table>');
    } else if (cmd === 'youtube') {
      const url = prompt('URL YouTube');
      if (url) document.execCommand('insertHTML', false, `<p><a href="${url}">YouTube embed</a></p>`);
    } else if (cmd && simple[cmd]) document.execCommand(simple[cmd]);
  };

  const wireToolbar = () => {
    toolbar?.addEventListener('click', (event) => {
      const btn = event.target.closest('button');
      if (!btn) return;
      const cmd = btn.getAttribute('data-cmd');
      const action = btn.getAttribute('data-editor-action');
      if (action === 'validate') return validatePublish();
      if (action === 'fullscreen') return toggleFullscreen();
      if (!cmd) return;
      if (state.editor) {
        const chain = state.editor.chain().focus();
        const map = {
          bold: () => chain.toggleBold().run(),
          italic: () => chain.toggleItalic().run(),
          heading: () => chain.toggleHeading({ level: 2 }).run(),
          bulletList: () => chain.toggleBulletList().run(),
          blockquote: () => chain.toggleBlockquote().run(),
          codeBlock: () => chain.toggleCodeBlock().run(),
          horizontalRule: () => chain.setHorizontalRule().run(),
          undo: () => chain.undo().run(),
          redo: () => chain.redo().run(),
          link: () => { const url = prompt('URL linku'); if (url) chain.extendMarkRange('link').setLink({ href: url }).run(); },
          image: () => { const url = prompt('URL obrazu'); if (url) chain.setImage({ src: url }).run(); },
          table: () => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          youtube: () => { const url = prompt('URL YouTube'); if (url) chain.setYoutubeVideo({ src: url, width: 640, height: 360 }).run(); },
        };
        if (map[cmd]) map[cmd]();
      } else {
        cmdFallback(cmd);
      }
      saveDraft();
    });
  };

  const startAutosave = () => {
    clearInterval(state.autosaveTimer);
    state.autosaveTimer = setInterval(saveDraft, 30000);
    setAutosave('Autosave: co 30 s');
  };

  const cached = (() => { try { return localStorage.getItem('izbica24-editor-draft'); } catch (e) { return null; } })();
  const initialHTML = cached || textarea.value || '<p></p>';

  if (window.tiptap && window.tiptapStarterKit) {
    const { Editor } = window.tiptap;
    const StarterKit = window.tiptapStarterKit.default || window.tiptapStarterKit.StarterKit || window.tiptapStarterKit;
    const Link = window.tiptapExtensionLink?.default || window.tiptapExtensionLink?.Link;
    const Image = window.tiptapExtensionImage?.default || window.tiptapExtensionImage?.Image;
    const Table = window.tiptapExtensionTable?.default || window.tiptapExtensionTable?.Table;
    const TableRow = window.tiptapExtensionTableRow?.default || window.tiptapExtensionTableRow?.TableRow;
    const TableCell = window.tiptapExtensionTableCell?.default || window.tiptapExtensionTableCell?.TableCell;
    const TableHeader = window.tiptapExtensionTableHeader?.default || window.tiptapExtensionTableHeader?.TableHeader;
    const Youtube = window.tiptapExtensionYoutube?.default || window.tiptapExtensionYoutube?.Youtube;
    state.editor = new Editor({
      element: mount,
      content: initialHTML,
      extensions: [StarterKit, Link, Image, Table, TableRow, TableCell, TableHeader, Youtube].filter(Boolean),
      onUpdate: ({ editor }) => { textarea.value = editor.getHTML(); metricUpdate(editor.getHTML()); },
    });
  } else {
    mount.contentEditable = 'true';
    mount.innerHTML = initialHTML;
    mount.addEventListener('input', () => { textarea.value = mount.innerHTML; metricUpdate(mount.innerHTML); });
  }

  mount.addEventListener('keyup', (event) => {
    if (event.key === '/') openSlash(mount.getBoundingClientRect());
    else if (event.key === 'Escape') closeSlash();
  });
  slash.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    const cmd = btn.getAttribute('data-cmd');
    closeSlash();
    toolbar?.querySelector(`[data-cmd="${cmd}"]`)?.click();
  });
  document.addEventListener('click', (event) => {
    if (!slash.contains(event.target) && !mount.contains(event.target)) closeSlash();
  });
  form?.addEventListener('submit', saveDraft);
  wireToolbar();
  metricUpdate(initialHTML);
  startAutosave();
})();