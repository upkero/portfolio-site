// Small shared pieces for the demos. Everything a service returns goes through esc().

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const html = (s) => {
  const t = document.createElement('template');
  t.innerHTML = s.trim();
  return t.content.firstElementChild;
};

export const secs = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

/** JSON → escaped, syntax-highlighted HTML for a <pre>. */
export function jsonHtml(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return esc(text).replace(
    /(&quot;(?:\\(?:&quot;|.)|[^&\\]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/g,
    (m, str, colon, lit) => {
      if (str) return colon ? `<span class="j-key">${str}</span>${colon}` : `<span class="j-str">${str}</span>`;
      if (lit) return `<span class="j-lit">${m}</span>`;
      return `<span class="j-num">${m}</span>`;
    },
  );
}

export const failText = (c, f, status) => (f === 'upstream' ? c.fail.upstream(status) : c.fail[f] || c.fail.unreachable);

export const turn = (who, text, mine, meta = '') => html(`
  <div class="turn${mine ? ' turn--mine' : ''}">
    <span class="turn__who">${esc(who)}</span>
    <p class="turn__text">${esc(text)}</p>
    ${meta ? `<span class="turn__meta">${meta}</span>` : ''}
  </div>`);

export const waiting = (label) => html(`<p class="demo__waiting" role="status">${esc(label)}</p>`);

export const trouble = (text) => html(`<p class="demo__trouble" role="alert">${esc(text)}</p>`);

export const suggestionsHtml = (label, items) => `
  <div class="suggest">
    <span class="suggest__label">${esc(label)}</span>
    <div class="suggest__list">${items.map((s) => `<button type="button" class="suggest__item" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  </div>`;

export const composerHtml = (placeholder, cta, hint) => `
  <form class="composer" data-composer>
    <div class="composer__row">
      <input class="composer__input" name="q" autocomplete="off" maxlength="2000" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">
      <button class="pill pill--sm pill--solid" type="submit">${esc(cta)}</button>
    </div>
    <span class="composer__hint">${esc(hint)}</span>
  </form>`;

/** Wires a composer + suggestion buttons inside root to one submit handler. */
export function bindInput(root, onSubmit) {
  const form = root.querySelector('[data-composer]');
  const input = form.querySelector('input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (v) onSubmit(v);
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-suggest]');
    if (b && !b.disabled) onSubmit(b.dataset.suggest);
  });
  return {
    clear: () => (input.value = ''),
    restore: (v) => (input.value = v),
    busy(on) {
      form.querySelector('button').disabled = on;
      root.querySelectorAll('[data-suggest]').forEach((b) => (b.disabled = on));
    },
  };
}

/** Keeps a scrollable log pinned to its newest entry. */
export const pin = (el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
