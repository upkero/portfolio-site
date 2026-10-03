// Demo shell: checks the service, then lazy-loads the demo module into the case dialog.
import { health } from '../live.js';
import { COPY } from './copy.js';
import { esc, html } from './ui.js';

const REPO = { voice: 'voice-agent-service', sales: 'sales-agent-service', rag: 'rag-chat-service', mcp: 'mcp-ops-agent', core: 'ops-core-api' };
const LOADERS = {
  rag: () => import('./rag.js'),
  sales: () => import('./sales.js'),
  mcp: () => import('./mcp.js'),
  voice: () => import('./voice.js'),
  core: () => import('./core.js'),
};

export function mountDemo(root, id, { lang, reduced }) {
  const c = COPY[lang];
  const ac = new AbortController();
  let inner = null;
  let dead = false;

  const el = html(`
    <section class="demo" aria-label="${esc(c.common.label)}">
      <header class="demo__head">
        <span class="demo__label">${esc(c.common.label)}</span>
        <span class="demo__status" data-state="checking">${esc(c.common.checking)}</span>
        <p class="demo__note">${esc(c.common.note(REPO[id]))}</p>
      </header>
      <div class="demo__body"></div>
    </section>`);
  root.replaceChildren(el);
  const status = el.querySelector('.demo__status');
  const body = el.querySelector('.demo__body');

  const setStatus = (state) => {
    status.dataset.state = state;
    status.textContent = c.common[state];
  };

  const offline = (state) => {
    const degraded = state === 'degraded';
    body.innerHTML = `
      <div class="demo__off">
        <h4>${esc(degraded ? c.common.degradedTitle : c.common.offTitle)}</h4>
        <p>${esc(degraded ? c.common.degradedBody : c.common.offBody)}</p>
        <div class="demo__off-actions">
          <button class="pill pill--sm" type="button" data-retry>${esc(c.common.retry)}</button>
          <a class="pill pill--sm pill--solid" href="#contact" data-close-case>${esc(c.common.write)}</a>
        </div>
        <code class="demo__hint">${esc(c.common.hint(REPO[id]))}</code>
      </div>`;
    body.querySelector('[data-retry]').addEventListener('click', start);
  };

  async function start() {
    setStatus('checking');
    // liveness, not readiness: /health/ready pings the LLM and would hold the demo back for seconds
    const h = await health(id, ac.signal).catch(() => null);
    if (dead || !h) return;
    setStatus(h.state);
    if (h.state !== 'up') return offline(h.state);
    const mod = await LOADERS[id]();
    if (dead) return;
    body.replaceChildren();
    inner = mod.mount(body, { lang, c: c[id], common: c.common, reduced, signal: ac.signal, setStatus });
  }
  start();

  return {
    destroy() {
      dead = true;
      ac.abort();
      inner?.destroy?.();
    },
  };
}
