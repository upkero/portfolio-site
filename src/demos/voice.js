// Voice demo: a real LiveKit call to the voice agent. The token comes from voice-agent-service;
// audio flows browser ⇄ LiveKit over WebRTC. livekit-client is loaded only when the call starts.
import { call } from '../live.js';
import { esc, failText } from './ui.js';

// the worker loads its speech model when a call arrives, so the first join can take ~10 s
const AGENT_GRACE_MS = 20000;
const AMBER = '214,170,112';
const SAGE = '150,165,140';

export function mount(root, { lang, c, common, reduced, signal }) {
  root.innerHTML = `
    <div class="voice">
      <div class="voice__stage"><canvas aria-hidden="true"></canvas><span class="voice__clock" data-clock></span></div>
      <div class="voice__side">
        <p class="demo__intro">${esc(c.who)}</p>
        <div class="voice__controls" data-controls aria-live="polite"></div>
        <div class="voice__try" data-try></div>
        <div class="voice__transcript" data-transcript hidden><span class="demo__kicker">${esc(c.transcript)}</span><ol></ol></div>
      </div>
    </div>`;
  const controls = root.querySelector('[data-controls]');
  const clock = root.querySelector('[data-clock]');
  const transcript = root.querySelector('[data-transcript]');
  const tryBox = root.querySelector('[data-try]');
  const setTry = (label, lines) => {
    tryBox.innerHTML = `<span class="demo__kicker">${esc(label)}</span><ul>${lines.map((l) => `<li>«${esc(l)}»</li>`).join('')}</ul>`;
  };
  setTry(c.tryLabel, c.tryLines);
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  let room = null, phase = 'idle', failure = null, agentHere = false, overdue = false, blocked = false, greeted = false;
  // fetch the WebRTC client while the visitor reads the case, not after they press "call"
  const lkReady = import('livekit-client');
  lkReady.catch(() => {}); // a failed preload is reported when the call starts
  const heard = () => { if (!greeted) { greeted = true; render(); } };
  let leaving = false, startedAt = 0, timers = [], cleanups = [];
  let localVol = () => 0, remoteVol = () => 0;

  /* ---------- controls ---------- */
  const btn = (label, action, solid = true) => `<button type="button" class="pill${solid ? ' pill--solid' : ''}" data-act="${action}">${esc(label)}</button>`;
  const block = (title, body, action) => `<div class="voice__msg"><h4>${esc(title)}</h4>${body ? `<p>${esc(body)}</p>` : ''}</div>${action || ''}`;
  function render() {
    const views = {
      idle: () => btn(c.start, 'start'),
      'asking-mic': () => `<p class="demo__waiting">${esc(c.askingMic)}</p>`,
      'mic-denied': () => block(c.micDeniedTitle, c.micDeniedBody, btn(c.start, 'start')),
      connecting: () => `<p class="demo__waiting">${esc(c.connecting)}</p>`,
      live: () => `
        <div class="voice__live"><span class="voice__dot"></span>${esc(c.live)}</div>
        ${greeted ? `<p class="voice__hint">${esc(c.liveHint)}</p>` : ''}
        ${agentHere ? (greeted ? '' : `<p class="demo__waiting">${esc(c.pickingUp)}</p>`) : overdue ? `<p class="demo__trouble">${esc(c.noAgent)}</p>` : `<p class="demo__waiting">${esc(c.joining)}</p>`}
        ${blocked ? `<p class="voice__hint">${esc(c.audioBlocked)}</p>${btn(c.unlock, 'unlock', false)}` : ''}
        ${btn(c.end, 'end', false)}`,
      ended: () => block(c.endedTitle, c.endedBody, btn(c.again, 'start')),
      dropped: () => block(c.droppedTitle, c.droppedBody, btn(c.again, 'start')),
      failed: () => block(c.failedTitle, failText(common, failure?.kind, failure?.status), btn(c.again, 'start')),
    };
    controls.innerHTML = views[phase]();
  }
  const set = (p) => { phase = p; render(); };
  controls.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'start') start();
    if (act === 'end') stop();
    if (act === 'unlock') room?.startAudio().then(() => { blocked = !room.canPlaybackAudio; render(); });
  });

  /* ---------- transcript: lk.transcription text streams, one line per segment ---------- */
  const lines = new Map();
  function line(seg, mine) {
    if (!lines.has(seg)) {
      transcript.hidden = false;
      const li = document.createElement('li');
      li.className = mine ? 'is-you' : 'is-agent';
      li.innerHTML = `<span>${esc(mine ? c.you : c.agent)}</span><p></p>`;
      transcript.querySelector('ol').append(li);
      lines.set(seg, li.querySelector('p'));
    }
    return lines.get(seg);
  }

  /* ---------- call lifecycle ---------- */
  function cleanup() {
    cleanups.splice(0).forEach((f) => f());
    timers.splice(0).forEach(clearInterval);
    localVol = remoteVol = () => 0;
    clock.textContent = '';
  }

  async function start() {
    if (phase === 'connecting' || phase === 'live') return;
    failure = null; agentHere = false; overdue = false; blocked = false; leaving = false; greeted = false;
    set('asking-mic');
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch {
      return set('mic-denied');
    }
    set('connecting');
    const [lk, tok] = await Promise.all([
      lkReady,
      // the call language follows the site; a server that can't honour it reports its own (or nothing)
      call('voice', '/api/v1/token', { method: 'POST', body: { participant_name: 'guest', language: lang }, signal }),
    ]).catch(() => [null, null]);
    if (!tok) return;
    if (!tok.ok) {
      failure = { kind: tok.failure, status: tok.status };
      return set('failed');
    }
    // an older server ignores `language` and echoes nothing: it runs its configured language (Russian here)
    if (lang !== 'ru' && (tok.data.language ?? 'ru') !== lang) setTry(c.fallbackNote, c.fallbackLines);
    const { Room, RoomEvent, Track, RemoteAudioTrack, createAudioAnalyser } = lk;
    const r = new Room({ adaptiveStream: false, dynacast: false });
    room = r;
    const analyse = (track, slot) => {
      const a = createAudioAnalyser(track, { smoothingTimeConstant: 0.5 });
      if (slot === 'local') localVol = a.calculateVolume; else remoteVol = a.calculateVolume;
      cleanups.push(() => a.cleanup());
    };
    r.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio || !(track instanceof RemoteAudioTrack)) return;
      const el = track.attach();
      cleanups.push(() => track.detach(el));
      analyse(track, 'remote');
      agentHere = true;
      render();
    });
    r.on(RoomEvent.AudioPlaybackStatusChanged, () => { blocked = !r.canPlaybackAudio; render(); });
    r.on(RoomEvent.Disconnected, () => {
      cleanup();
      room = null;
      set(leaving ? 'ended' : 'dropped');
    });
    r.registerTextStreamHandler?.('lk.transcription', async (reader, who) => {
      const seg = reader.info.attributes?.['lk.segment_id'] || reader.info.id;
      const mine = who.identity === r.localParticipant.identity;
      const p = line(seg, mine);
      if (!mine) heard(); // also covers reduced motion, where the volume loop doesn't run
      let text = ''; // a new stream for the same segment replaces the interim text
      for await (const chunk of reader) {
        text += chunk;
        p.textContent = text;
        const list = transcript.querySelector('ol');
        list.scrollTop = list.scrollHeight;
      }
    });
    try {
      await r.connect(tok.data.livekit_url, tok.data.token);
      await r.localParticipant.setMicrophoneEnabled(true);
      const pub = r.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (pub?.audioTrack) analyse(pub.audioTrack, 'local');
      await r.startAudio().catch(() => (blocked = !r.canPlaybackAudio));
      startedAt = performance.now();
      set('live');
      timers.push(setInterval(() => {
        const s = Math.floor((performance.now() - startedAt) / 1000);
        clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 500));
      const t = setTimeout(() => { overdue = true; render(); }, AGENT_GRACE_MS);
      cleanups.push(() => clearTimeout(t));
    } catch {
      cleanup();
      await r.disconnect().catch(() => {});
      room = null;
      // the token came back, so the service is up: what failed is the WebRTC media path
      failure = { kind: 'media' };
      set('failed');
    }
  }

  async function stop() {
    leaving = true;
    const r = room;
    room = null;
    cleanup();
    if (r) await r.disconnect(); else set('ended');
  }

  /* ---------- audio-reactive visual ---------- */
  const hist = [];
  let raf = 0, last = 0, w = 0, h = 0;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const ro = new ResizeObserver(() => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  });
  ro.observe(canvas);
  function glow(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col},${a})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function draw(now) {
    if (!w) return;
    const lv = Math.min(1, localVol() * 2.2), rv = Math.min(1, remoteVol() * 2.2);
    if (rv > 0.05) heard(); // her voice is on the line: the greeting has started
    hist.push([lv, rv]);
    if (hist.length > 72) hist.shift();
    const m = Math.min(w, h), cx = w / 2, cy = h * 0.42, t = now / 1000;
    const on = phase === 'live';
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const k = (t * (on ? 0.5 : 0.25) + i / 4) % 1;
      ctx.beginPath();
      ctx.arc(cx, cy, m * (0.12 + k * 0.3) * (1 + lv * 0.25), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${lv > 0.05 ? SAGE : '241,239,233'},${(1 - k) * (0.12 + lv * 0.6)})`;
      ctx.stroke();
    }
    glow(cx, cy, m * (0.3 + rv * 0.25), AMBER, on ? 0.18 + rv * 0.5 : 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, m * 0.075 * (1 + rv * 0.6 + (on ? 0 : 0.04 * Math.sin(t * 2))), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${AMBER},${on ? 0.95 : 0.5})`;
    ctx.fill();
    const span = w * 0.8, x0 = (w - span) / 2, bw = span / 72, by = h * 0.82;
    hist.forEach(([l, rr], i) => {
      const v = Math.max(l, rr), amp = 1.5 + v * h * 0.1;
      ctx.fillStyle = `rgba(${rr >= l ? AMBER : SAGE},${0.25 + v * 0.75})`;
      ctx.fillRect(x0 + i * bw + bw * 0.25, by - amp, bw * 0.5, amp * 2);
    });
  }
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;
    last = now;
    draw(now);
  };
  if (!reduced) raf = requestAnimationFrame(loop);

  render();
  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      leaving = true;
      cleanup();
      room?.disconnect();
    },
  };
}
