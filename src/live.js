// Browser side of the /live bridge (server/live.js). Failures are sorted into the few kinds the UI has words for.

const failureOf = (res, data) => {
  if (res.ok) return null;
  if (data?.bridge) return data.error === 'not_found' ? 'upstream' : data.error; // unreachable | timeout
  if (res.status === 429) return 'rate_limited';
  return 'upstream';
};

export async function call(service, path, { method = 'GET', body, query, signal } = {}) {
  const qs = query ? `?${new URLSearchParams(query)}` : '';
  const t0 = performance.now();
  let res;
  try {
    res = await fetch(`/live/${service}${path}${qs}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return { ok: false, status: 0, data: null, ms: 0, failure: 'unreachable' };
  }
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data, ms: Math.round(performance.now() - t0), failure: failureOf(res, data) };
}

/**
 * up | degraded (process answers, a dependency doesn't) | down (nothing listening).
 * Default probe is /health/live: instant and free. /health/ready also pings each
 * service's LLM, so it takes seconds and costs a call — only the fleet monitor uses it.
 */
export async function health(service, signal, probe = 'live') {
  const r = await call(service, `/health/${probe}`, { signal });
  return { state: r.ok ? 'up' : r.failure === 'upstream' ? 'degraded' : 'down', ms: r.ms };
}

/** POST and read a text/event-stream; yields { event, data } with data JSON-parsed when possible. */
export async function* stream(service, path, body, signal) {
  let res;
  try {
    res = await fetch(`/live/${service}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    yield { event: 'failure', data: { failure: 'unreachable' } };
    return;
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    yield { event: 'failure', data: { failure: failureOf(res, data), status: res.status } };
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const parse = (raw) => {
    let event = 'message';
    const lines = [];
    for (const line of raw.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /, ''));
    }
    if (!lines.length) return null;
    const text = lines.join('\n');
    try { return { event, data: JSON.parse(text) }; } catch { return { event, data: text }; }
  };
  for (;;) {
    const { done, value } = await reader.read();
    buf += decoder.decode(value, { stream: !done });
    // a network chunk is not a frame: split only on the blank line that ends one
    let m;
    while ((m = buf.match(/\r?\n\r?\n/))) {
      const frame = parse(buf.slice(0, m.index));
      buf = buf.slice(m.index + m[0].length);
      if (frame) yield frame;
    }
    if (done) break;
  }
  const tail = buf.trim() && parse(buf);
  if (tail) yield tail;
}
