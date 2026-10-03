// MCP demo: POST /api/v1/invoke streams tool_call → tool_result → … → final as SSE; each frame is rendered as it lands.
import { stream } from '../live.js';
import { mountVisual } from '../visuals.js';
import { bindInput, composerHtml, esc, failText, html, jsonHtml, pin, secs, suggestionsHtml } from './ui.js';

const TOOL_INDEX = { check_calendar_availability: 0, lookup_customer: 1, list_services: 2, calculate_quote: 3, send_notification: 4 };

export function mount(root, { c, common, reduced, signal, setStatus }) {
  root.innerHTML = `
    <div class="mcp">
      <p class="demo__intro">${esc(c.intro)}</p>
      <div class="mcp__grid">
        <div class="mcp__viz"><canvas aria-hidden="true"></canvas></div>
        <div class="console" data-console role="log" aria-live="polite"><p class="console__idle">${esc(c.idle)}</p></div>
      </div>
      ${suggestionsHtml(common.try, c.suggestions)}
      ${composerHtml(c.placeholder, c.cta, common.enter)}
    </div>`;
  const out = root.querySelector('[data-console]');
  const viz = mountVisual(root.querySelector('canvas'), 'mcp', { reduced });
  let running = false;

  const row = (kind, label, ms, content = '') => {
    const el = html(`
      <div class="ev ev--${kind}">
        <div class="ev__head"><span class="ev__kind">${esc(label)}</span>${ms != null ? `<span class="ev__time">+${secs(ms)}</span>` : ''}</div>
        ${content}
      </div>`);
    out.append(el);
    pin(out);
    return el;
  };
  const live = (kind, tool = -1) => (viz.state.live = { kind, tool, at: performance.now() });

  const input = bindInput(root, async (message) => {
    if (running) return;
    running = true;
    input.busy(true);
    input.clear();
    out.querySelector('.console__idle')?.remove();
    row('prompt', '›', null, `<p class="ev__prompt">${esc(message)}</p>`);
    const pending = row('wait', c.running, null);
    live('thinking');
    const t0 = performance.now();
    const at = () => Math.round(performance.now() - t0);

    try {
      for await (const { event, data } of stream('mcp', '/api/v1/invoke', { message }, signal)) {
        out.append(pending); // keep the "working" line last while events arrive
        if (event === 'tool_call') {
          live('call', TOOL_INDEX[data.name] ?? 0);
          row('call', `${c.call} · ${data.name}`, at(), `<pre class="json">${jsonHtml(data.arguments ?? {})}</pre>`);
        } else if (event === 'tool_result') {
          live('result', TOOL_INDEX[data.name] ?? 0);
          let body = data.content;
          try { body = JSON.parse(body); } catch {}
          const flag = data.is_error ? `<span class="ev__flag">${esc(c.toolError)}</span>` : '';
          row(data.is_error ? 'error' : 'result', `${c.result} · ${data.name}`, at(), `${flag}<pre class="json">${jsonHtml(body)}</pre>`);
        } else if (event === 'final') {
          live('final');
          setStatus('up');
          row('final', c.final, at(), `<p class="ev__answer">${esc(data.content)}</p>`);
        } else if (event === 'error') {
          live('final');
          row('error', c.error, at(), `<p>${esc(data.detail || data.error_code)}</p>`);
        } else if (event === 'failure') {
          live('final');
          row('error', c.error, null, `<p>${esc(failText(common, data.failure, data.status))}</p>`);
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      row('error', c.error, null, `<p>${esc(common.fail.unreachable)}</p>`);
    }
    pending.remove();
    running = false;
    input.busy(false);
  });

  return { destroy: () => viz.destroy() };
}
