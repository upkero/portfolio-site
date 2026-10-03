// Operations core demo: live readiness of all five services + a console of real ops-core-api requests.
import { call, health } from '../live.js';
import { esc, failText, jsonHtml, secs } from './ui.js';

const FLEET = [
  ['core', 'ops-core-api'], ['rag', 'rag-chat-service'], ['sales', 'sales-agent-service'],
  ['mcp', 'mcp-ops-agent'], ['voice', 'voice-agent-service'],
];
const SERVICES = ['Deep Tissue Massage', 'Nutrition Coaching', 'Physiotherapy Assessment', 'Sports Recovery Session', 'Meeting Room Hire'];
const iso = (d) => d.toISOString().slice(0, 10);

export function mount(root, { lang, c, common, signal, setStatus }) {
  const tomorrow = iso(new Date(Date.now() + 864e5));
  const opt = (v, label, sel) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(label)}</option>`;
  const field = (name, label, control) => `<label class="api__field"><span>${esc(label)}</span>${control}</label>`;
  const F = c.fields;
  const ENDPOINTS = {
    slots: {
      fields: () => field('date', F.date, `<input type="date" name="date" value="${tomorrow}" required>`)
        + field('resource_type', F.resource, `<select name="resource_type">${Object.entries(c.resources).map(([k, v]) => opt(k, v, 'table')).join('')}</select>`),
      req: (f) => ({ method: 'GET', path: '/api/v1/booking-slots', query: { date: f.date, resource_type: f.resource_type } }),
    },
    customers: {
      fields: () => field('name', F.name, `<input name="name" value="anna" maxlength="200" required>`),
      req: (f) => ({ method: 'GET', path: '/api/v1/customers', query: { name: f.name } }),
    },
    quote: {
      fields: () => field('service', F.service, `<select name="service">${SERVICES.map((s) => opt(s, s, SERVICES[0])).join('')}</select>`)
        + field('quantity', F.quantity, `<input type="number" name="quantity" value="6" min="1" max="100" required>`),
      req: (f) => ({ method: 'GET', path: '/api/v1/pricing', query: { service: f.service, quantity: f.quantity } }),
    },
    search: {
      fields: () => field('query', F.query, `<input name="query" value="${lang === 'ru' ? 'можно ли отменить запись' : 'can I cancel my appointment'}" maxlength="500" required>`)
        + field('top_k', F.top_k, `<input type="number" name="top_k" value="3" min="1" max="10" required>`),
      req: (f) => ({ method: 'POST', path: '/api/v1/documents/search', body: { query: f.query, top_k: Number(f.top_k) } }),
    },
    conflict: { fields: () => `<p class="api__explain">${esc(c.conflictBody)}</p>` },
  };

  root.innerHTML = `
    <div class="core">
      <p class="demo__intro">${esc(c.intro)}</p>
      <div class="fleet">
        <div class="fleet__head"><span class="demo__kicker">${esc(c.fleet)}</span><span class="fleet__note">${esc(c.fleetNote)}</span></div>
        <ul class="fleet__list">${FLEET.map(([id, repo]) => `
          <li class="fleet__item" data-svc="${id}" data-state="checking"><i></i><strong title="${repo}">${repo.replace(/-service$/, '')}</strong><span>${esc(c.roles[id])}</span><em data-ms>${esc(c.states.checking)}</em></li>`).join('')}
        </ul>
      </div>
      <div class="api">
        <div class="api__tabs" role="tablist">${Object.keys(ENDPOINTS).map((k, i) => `
          <button type="button" role="tab" class="api__tab" data-ep="${k}" aria-selected="${i === 0}">${esc(c.endpoints[k])}</button>`).join('')}
        </div>
        <form class="api__form" data-form></form>
        <div class="api__out" data-out><p class="api__idle">${esc(c.responseIdle)}</p></div>
      </div>
    </div>`;
  const form = root.querySelector('[data-form]');
  const out = root.querySelector('[data-out]');
  let ep = 'slots';
  let busy = false;

  /* ---------- fleet ---------- */
  const probe = () => FLEET.forEach(async ([id]) => {
    const h = await health(id, signal, 'ready').catch(() => null);
    const li = root.querySelector(`[data-svc="${id}"]`);
    if (!h || !li) return;
    li.dataset.state = h.state;
    li.querySelector('[data-ms]').textContent = h.state === 'down' ? c.states.down : `${c.states[h.state]} · ${secs(h.ms)}`;
  });
  probe();
  const timer = setInterval(probe, 10_000);

  /* ---------- console ---------- */
  const renderForm = () => {
    form.innerHTML = `${ENDPOINTS[ep].fields()}
      <button type="submit" class="pill pill--sm pill--solid">${esc(ep === 'conflict' ? c.run : c.send)}</button>`;
  };
  root.querySelector('.api__tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ep]');
    if (!b || busy) return;
    ep = b.dataset.ep;
    root.querySelectorAll('[data-ep]').forEach((t) => t.setAttribute('aria-selected', String(t === b)));
    renderForm();
  });

  // `open: false` folds the response body; the scenario keeps only its key step unfolded
  const exchange = ({ method, path, query, body }, r, step, open = true) => {
    const qs = query ? `?${new URLSearchParams(query)}` : '';
    const code = r.status || '—';
    const tone = r.ok ? 'ok' : r.status >= 400 && r.status < 500 ? 'warn' : 'err';
    return `
      <div class="xch">
        ${step ? `<span class="demo__kicker">${esc(step)}</span>` : ''}
        <pre class="xch__req"><b>${method}</b> ${esc(path + qs)}
<span class="xch__h">X-API-Key: •••••••• </span><span class="xch__note">${esc(c.keyNote)}</span>${body ? `\n\n${jsonHtml(body)}` : ''}</pre>
        <div class="xch__status xch__status--${tone}"><strong>${code}</strong><span>${!r.ok && r.failure !== 'upstream' ? esc(failText(common, r.failure, r.status)) : ''}</span><em>${secs(r.ms)}</em></div>
        ${r.data ? `<details${open ? ' open' : ''}><summary>response</summary><pre class="json xch__res">${jsonHtml(r.data)}</pre></details>` : ''}
      </div>`;
  };
  const send = (req) => call('core', req.path, { method: req.method, query: req.query, body: req.body, signal });

  async function conflict() {
    out.innerHTML = '';
    const log = (req, r, step, open = false) => out.insertAdjacentHTML('beforeend', exchange(req, r, step, open));
    const find = { method: 'GET', path: '/api/v1/booking-slots', query: { resource_type: 'table', limit: 1 } };
    const slots = await send(find);
    log(find, slots, `1 · ${c.steps[0]}`);
    const slot = slots.data?.items?.[0];
    if (!slots.ok || !slot) {
      if (slots.ok) out.insertAdjacentHTML('beforeend', `<p class="demo__trouble">${esc(c.noSlot)}</p>`);
      return;
    }
    const book = { method: 'POST', path: '/api/v1/bookings', body: { guest_name: 'Portfolio demo', slot_id: slot.id, party_size: 2 } };
    const first = await send(book);
    log(book, first, `2 · ${c.steps[1]}`);
    if (!first.ok) return;
    const second = await send(book);
    log(book, second, `3 · ${c.steps[2]}`, true);
    // always give the slot back, even if step 3 behaved unexpectedly
    const cancel = { method: 'DELETE', path: `/api/v1/bookings/${first.data.id}` };
    log(cancel, await send(cancel), `4 · ${c.steps[3]}`);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    form.querySelector('button').disabled = true;
    try {
      if (ep === 'conflict') await conflict();
      else {
        const req = ENDPOINTS[ep].req(Object.fromEntries(new FormData(form)));
        const r = await send(req);
        if (r.ok) setStatus('up');
        out.innerHTML = exchange(req, r);
      }
    } catch (err) {
      if (err.name !== 'AbortError') out.innerHTML = `<p class="demo__trouble">${esc(common.fail.unreachable)}</p>`;
    }
    busy = false;
    form.querySelector('button').disabled = false;
  });

  renderForm();
  return { destroy: () => clearInterval(timer) };
}
