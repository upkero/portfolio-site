// Sales demo: POST /api/v1/turn; the stage on the rail is whatever the service reports, never guessed here.
import { call } from '../live.js';
import { bindInput, composerHtml, esc, failText, html, pin, secs, trouble, turn, waiting } from './ui.js';

const STAGES = ['greeting', 'qualify', 'present', 'objection_handling', 'upsell', 'close'];

export function mount(root, { c, common, signal, setStatus }) {
  let conversationId = null;
  let stage = null;
  let busy = false;
  let lastReply = '';
  let shownKey = null;
  const said = new Set();
  const answered = new Set(); // option sets the customer has already replied to

  root.innerHTML = `
    <div class="sales">
      <p class="demo__intro">${esc(c.who)}</p>
      <div class="rail" aria-label="${esc(c.rail)}">
        <span class="demo__kicker">${esc(c.rail)}</span>
        <ol class="rail__list">${STAGES.map((s) => `
          <li class="rail__step" data-stage="${s}"><i></i><strong>${esc(c.stages[s][0])}</strong><span>${esc(c.stages[s][1])}</span></li>`).join('')}
        </ol>
      </div>
      <div class="chat chat--tall" data-log></div>
      <div data-next></div>
      <div data-input>${composerHtml(c.placeholder, common.send, common.enter)}</div>
    </div>`;
  const log = root.querySelector('[data-log]');
  const next = root.querySelector('[data-next]');
  const inputWrap = root.querySelector('[data-input]');

  const renderRail = () => {
    const at = STAGES.indexOf(stage);
    root.querySelectorAll('.rail__step').forEach((li, i) => {
      li.classList.toggle('is-done', i < at);
      li.classList.toggle('is-now', i === at);
      if (i === at) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  };
  // Replies follow the funnel: each stage offers lines that move it forward. "present" before
  // Alex has named a number asks for the price instead of objecting to one.
  const renderNext = () => {
    const key = stage === 'present' && !/\d/.test(lastReply) ? 'presentAsk' : stage || 'start';
    const pool = answered.has(key) ? c.again[key] || [] : c.next[key] || [];
    const items = pool.filter((s) => !said.has(s)).slice(0, 2);
    shownKey = key;
    next.innerHTML = items.length ? `
      <div class="suggest suggest--swap"><span class="suggest__label">${esc(c.nextLabel)}</span>
      <div class="suggest__list">${items.map((s) => `<button type="button" class="suggest__item" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>` : '';
  };

  const restart = () => {
    conversationId = null;
    stage = null;
    lastReply = '';
    said.clear();
    answered.clear();
    log.replaceChildren();
    inputWrap.hidden = false;
    renderRail();
    renderNext();
  };

  const input = bindInput(root, async (message) => {
    if (busy) return;
    busy = true;
    said.add(message);
    answered.add(shownKey);
    input.busy(true);
    input.clear();
    root.querySelector('.demo__trouble')?.remove();
    const mine = turn(common.you, message, true);
    log.append(mine);
    const wait = waiting(c.thinking);
    log.append(wait);
    pin(log);

    const r = await call('sales', '/api/v1/turn', {
      method: 'POST',
      body: conversationId ? { message, conversation_id: conversationId } : { message },
      signal,
    }).catch(() => null);
    if (!r) return;
    wait.remove();
    busy = false;
    input.busy(false);

    if (!r.ok) {
      // the turn never reached the conversation: take it back and leave it ready to resend
      mine.remove();
      said.delete(message);
      input.restore(message);
      log.append(trouble(failText(common, r.failure, r.status)));
      return pin(log);
    }
    setStatus('up');
    conversationId = r.data.conversation_id;
    stage = r.data.stage;
    lastReply = r.data.reply;
    log.append(turn('Alex', r.data.reply, false, esc(`${c.stages[stage]?.[0] ?? stage} · ${secs(r.ms)}`)));
    renderRail();
    renderNext();

    if (r.data.handoff) {
      log.append(html(`<div class="demo__card"><h4>${esc(c.handoffTitle)}</h4><p>${esc(c.handoffBody)}</p></div>`));
    }
    if (r.data.done) {
      inputWrap.hidden = true;
      next.innerHTML = `<div class="sales__done"><span class="demo__kicker">${esc(c.done)}</span><button type="button" class="pill pill--sm" data-restart>${esc(common.restart)}</button></div>`;
      next.querySelector('[data-restart]').addEventListener('click', restart);
    }
    pin(log);
  });

  renderRail();
  renderNext();
  return {};
}
