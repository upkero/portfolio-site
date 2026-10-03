// RAG demo: rag-chat-service answers; ops-core-api's search supplies the passage texts behind each source.
import { call } from '../live.js';
import { bindInput, composerHtml, esc, failText, html, pin, secs, suggestionsHtml, trouble, turn, waiting } from './ui.js';

export function mount(root, { c, common, signal, setStatus }) {
  root.innerHTML = `
    <div class="rag">
      <div class="rag__chat">
        <div class="chat" data-log>
          <div class="demo__empty"><h4>${esc(c.emptyTitle)}</h4><p>${esc(c.emptyBody)}</p></div>
        </div>
        ${suggestionsHtml(common.try, c.suggestions)}
        ${composerHtml(c.placeholder, c.cta, common.enter)}
      </div>
      <aside class="sources">
        <h5 class="demo__kicker">${esc(c.sourcesTitle)}</h5>
        <p class="sources__lede">${esc(c.sourcesLede)}</p>
        <div data-sources><p class="sources__idle">${esc(c.sourcesIdle)}</p></div>
      </aside>
    </div>`;
  const log = root.querySelector('[data-log]');
  const panel = root.querySelector('[data-sources]');
  let busy = false;

  const input = bindInput(root, async (question) => {
    if (busy) return;
    busy = true;
    input.busy(true);
    input.clear();
    log.querySelector('.demo__empty')?.remove();
    log.append(turn(common.you, question, true));
    const wait = waiting(c.thinking);
    log.append(wait);
    pin(log);

    // Both requests are real: the answer from rag-chat-service, the passage texts from ops-core-api.
    const [ans, passages] = await Promise.all([
      call('rag', '/api/v1/ask', { method: 'POST', body: { question }, signal }),
      call('core', '/api/v1/documents/search', { method: 'POST', body: { query: question, top_k: 15 }, signal }).catch(() => null),
    ]).catch(() => [null, null]);
    if (!ans) return;
    wait.remove();
    busy = false;
    input.busy(false);

    if (!ans.ok) {
      log.append(trouble(failText(common, ans.failure, ans.status)));
      return pin(log);
    }
    setStatus('up');
    const sources = ans.data.sources || [];
    const refused = sources.length === 0;
    const meta = refused ? c.metaRefused(secs(ans.ms)) : c.metaAnswer(secs(ans.ms), sources.length);
    const reply = turn(c.answer, ans.data.answer, false, esc(meta));
    if (refused) reply.classList.add('turn--refused');
    log.append(reply);
    pin(log);
    renderSources(sources, passages?.ok ? passages.data.matches : []);
  });

  function renderSources(sources, matches) {
    if (!sources.length) {
      panel.innerHTML = `<p class="sources__refused">${esc(c.refused)}</p>`;
      return;
    }
    const text = (s) => matches.find((m) => m.document_title === s.document_title && m.chunk_index === s.chunk_index)?.chunk_text;
    panel.replaceChildren(html(`<ol class="sources__list">${sources.map((s, i) => {
      const pct = Math.round(Math.max(0, Math.min(1, s.score)) * 100);
      const passage = text(s);
      return `
        <li class="source" style="--d:${i * 70}ms">
          <div class="source__top"><span class="source__title">${esc(s.document_title)}</span><span class="source__score">${pct}%</span></div>
          <div class="source__bar"><i style="width:${pct}%"></i></div>
          ${passage
            ? `<details${i === 0 ? ' open' : ''}><summary>${esc(c.chunk(s.chunk_index))}</summary><p>${esc(passage)}</p></details>`
            : `<span class="source__chunk">${esc(c.chunk(s.chunk_index))}</span>`}
        </li>`;
    }).join('')}</ol>`));
  }

  return {};
}
