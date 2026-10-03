// Generative canvas visuals, one per project. Each drawer gets (ctx, w, h, t, state) in CSS pixels.

const FG = '241,239,233';
const AMBER = '214,170,112';
const SAGE = '150,165,140';
const rgba = (c, a) => `rgba(${c},${a})`;
const MONO = (px) => `${px}px "Geist Mono", ui-monospace, monospace`;
const TAU = Math.PI * 2;

function glow(ctx, x, y, r, c, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function label(ctx, text, x, y, a = 0.55, align = 'left', size = 11) {
  ctx.font = MONO(size);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(FG, a);
  ctx.fillText(text, x, y);
}

// deterministic PRNG so layouts are stable between reloads
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- voice: live call, rings + speech waveform ---------- */
function voice(ctx, w, h, t) {
  const m = Math.min(w, h);
  const cx = w / 2, cy = h * 0.4;
  const turn = Math.floor(t / 3.2) % 2; // 0 agent, 1 caller
  const local = (t % 3.2) / 3.2;
  const talk = Math.sin(Math.min(1, local * 1.25) * Math.PI); // fade in/out per turn
  const col = turn ? SAGE : AMBER;

  glow(ctx, cx, cy, m * 0.28, col, 0.22 * talk + 0.05);

  for (let i = 0; i < 5; i++) {
    const k = (t * 0.35 + i / 5) % 1;
    ctx.beginPath();
    ctx.arc(cx, cy, m * (0.08 + k * 0.32), 0, TAU);
    ctx.strokeStyle = rgba(FG, (1 - k) * 0.22);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, m * 0.05 * (1 + talk * 0.12), 0, TAU);
  ctx.fillStyle = rgba(col, 0.95);
  ctx.fill();

  const n = 56, span = w * 0.76, x0 = (w - span) / 2, by = h * 0.76, bw = span / n;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const hann = Math.sin(u * Math.PI);
    const a = (0.5 + 0.5 * Math.sin(i * 0.55 + t * 7.3)) * (0.45 + 0.55 * Math.sin(i * 0.21 - t * 3.1) ** 2);
    const amp = 2 + hann * talk * a * h * 0.12;
    ctx.fillStyle = rgba(talk > 0.2 ? col : FG, 0.25 + 0.6 * hann * talk);
    ctx.fillRect(x0 + i * bw + bw * 0.25, by - amp, bw * 0.5, amp * 2);
  }

  const sec = Math.floor(t) % 60;
  ctx.beginPath();
  ctx.arc(22, 24, 3, 0, TAU);
  ctx.fillStyle = rgba(AMBER, 0.5 + 0.5 * Math.sin(t * 4));
  ctx.fill();
  label(ctx, `LIVE 00:${String(sec).padStart(2, '0')}`, 32, 24, 0.6);
  label(ctx, turn ? 'caller' : 'agent · Mila', w - 20, 24, 0.45, 'right');
}

/* ---------- sales: funnel state machine with a travelling token ---------- */
const STAGES = ['greeting', 'qualify', 'present', 'objection', 'upsell', 'close'];
function salesNodes(w, h) {
  const wide = w > h * 1.15;
  return STAGES.map((name, i) => {
    const u = i / 5, s = i % 2 ? 1 : -1;
    return wide
      ? { name, x: w * (0.1 + 0.8 * u), y: h * (0.5 + 0.17 * s) }
      : { name, x: w * (0.5 + 0.2 * s), y: h * (0.13 + 0.74 * u) };
  });
}
function sales(ctx, w, h, t) {
  const m = Math.min(w, h);
  const nodes = salesNodes(w, h);
  const cycle = 9, ct = t % cycle;
  const skip = Math.floor(t / cycle) % 2 === 1;
  const route = skip ? [0, 1, 2, 4, 5] : [0, 1, 2, 3, 4, 5];
  const seg = (cycle - 1) / (route.length - 1);
  const k = Math.min(route.length - 1, ct / seg);
  const i = Math.min(route.length - 2, Math.floor(k));
  const f = Math.min(1, (k - i) * 1.35);
  const e = f < 0.5 ? 4 * f ** 3 : 1 - (-2 * f + 2) ** 3 / 2;
  const a = nodes[route[i]], b = nodes[route[i + 1]];
  const curve = route[i] === 2 && route[i + 1] === 4;
  const ctrl = (p, q) => ({ x: (p.x + q.x) / 2 + (q.y - p.y) * 0.45, y: (p.y + q.y) / 2 - (q.x - p.x) * 0.45 });


  ctx.lineWidth = 1;
  for (let j = 0; j < 5; j++) {
    ctx.beginPath();
    ctx.moveTo(nodes[j].x, nodes[j].y);
    ctx.lineTo(nodes[j + 1].x, nodes[j + 1].y);
    ctx.strokeStyle = rgba(FG, 0.16);
    ctx.stroke();
  }
  const c = ctrl(nodes[2], nodes[4]);
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(nodes[2].x, nodes[2].y);
  ctx.quadraticCurveTo(c.x, c.y, nodes[4].x, nodes[4].y);
  ctx.strokeStyle = rgba(FG, skip ? 0.35 : 0.14);
  ctx.stroke();
  ctx.setLineDash([]);

  let px, py;
  if (curve) {
    const u = 1 - e;
    px = u * u * a.x + 2 * u * e * c.x + e * e * b.x;
    py = u * u * a.y + 2 * u * e * c.y + e * e * b.y;
  } else {
    px = a.x + (b.x - a.x) * e;
    py = a.y + (b.y - a.y) * e;
  }
  const active = f >= 1 ? route[i + 1] : route[i];
  const visited = new Set(route.slice(0, i + 1));

  nodes.forEach((n, j) => {
    const on = j === active;
    if (on) glow(ctx, n.x, n.y, m * 0.16, AMBER, 0.35);
    ctx.beginPath();
    ctx.arc(n.x, n.y, on ? 7 : 5, 0, TAU);
    ctx.fillStyle = on ? rgba(AMBER, 1) : rgba('12,13,11', 1);
    ctx.fill();
    ctx.strokeStyle = rgba(FG, on ? 0 : visited.has(j) ? 0.7 : 0.3);
    ctx.stroke();
    const right = n.x < w / 2;
    label(ctx, n.name, n.x + (right ? 16 : -16), n.y, on ? 0.95 : 0.5, right ? 'left' : 'right');
  });

  glow(ctx, px, py, 22, AMBER, 0.6);
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, TAU);
  ctx.fillStyle = rgba(FG, 1);
  ctx.fill();
}

/* ---------- rag: vector space, nearest neighbours, confidence gate ---------- */
function rag(ctx, w, h, t, s) {
  const m = Math.min(w, h);
  if (!s.pts) {
    const r = rng(7);
    const centers = [[0.3, 0.32], [0.7, 0.4], [0.45, 0.72]];
    s.pts = Array.from({ length: 170 }, (_, i) => {
      const [cx, cy] = centers[i % 3];
      const g = () => (r() + r() + r() - 1.5) * 0.22;
      return { x: cx + g(), y: cy + g(), p: r() * TAU, sp: 0.2 + r() * 0.5 };
    });
  }

  const qx = w * (0.5 + 0.28 * Math.sin(t * 0.31)), qy = h * (0.5 + 0.26 * Math.sin(t * 0.47 + 1));
  const R = m * 0.2;
  const pts = s.pts.map((p) => {
    const x = (p.x + 0.012 * Math.sin(t * p.sp + p.p)) * w;
    const y = (p.y + 0.012 * Math.cos(t * p.sp + p.p)) * h;
    return { x, y, d: Math.hypot(x - qx, y - qy) };
  });
  const near = [...pts].sort((a, b) => a.d - b.d).slice(0, 6);
  const score = Math.max(0, Math.min(0.99, 1 - near[0].d / (m * 0.32)));
  const pass = score >= 0.5;

  for (const p of pts) {
    const inR = p.d < R;
    ctx.beginPath();
    ctx.arc(p.x, p.y, inR ? 1.8 : 1.3, 0, TAU);
    ctx.fillStyle = inR ? rgba(SAGE, 0.9) : rgba(FG, 0.22);
    ctx.fill();
  }
  near.forEach((p, i) => {
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = rgba(pass ? AMBER : FG, (pass ? 0.75 : 0.3) * (1 - i / 7));
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.arc(qx, qy, R, 0, TAU);
  ctx.strokeStyle = rgba(FG, 0.28);
  ctx.stroke();
  ctx.setLineDash([]);

  glow(ctx, qx, qy, 30, AMBER, pass ? 0.7 : 0.25);
  ctx.beginPath();
  ctx.arc(qx, qy, 4, 0, TAU);
  ctx.fillStyle = rgba(pass ? AMBER : FG, 1);
  ctx.fill();
  label(ctx, `score ${score.toFixed(2)}`, qx + 14, qy - 14, 0.8);
  label(ctx, pass ? 'answer · with sources' : 'below threshold · ask a human', 20, h - 22, pass ? 0.6 : 0.45);
}

/* ---------- mcp: hub, orbiting tools, JSON-RPC packets ---------- */
const TOOLS = ['calendar', 'customers', 'services', 'quote', 'notify'];
// s.live = { tool, kind: 'call' | 'result' | 'thinking' | 'final', at } lets real SSE events drive the packets
function mcp(ctx, w, h, t, s = {}) {
  const m = Math.min(w, h);
  const cx = w / 2, cy = h / 2, orbit = m * 0.32;

  ctx.beginPath();
  ctx.arc(cx, cy, orbit, 0, TAU);
  ctx.strokeStyle = rgba(FG, 0.08);
  ctx.stroke();

  const tools = TOOLS.map((name, i) => {
    const a = t * 0.12 + (i / TOOLS.length) * TAU - Math.PI / 4;
    return { name, x: cx + Math.cos(a) * orbit, y: cy + Math.sin(a) * orbit };
  });
  let target, ph, packet = true;
  const live = s.live;
  if (live) {
    const el = performance.now() - live.at;
    target = Math.max(0, live.tool);
    packet = live.kind === 'call' || live.kind === 'result';
    ph = live.kind === 'call' ? Math.min(0.5, el / 1400) : Math.min(1, 0.5 + el / 1800);
  } else {
    const period = 1.6;
    ph = (t % period) / period;
    target = (Math.floor(t / period) * 3) % TOOLS.length;
  }

  tools.forEach((tl, i) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tl.x, tl.y);
    ctx.strokeStyle = rgba(FG, 0.12);
    ctx.stroke();
    const hit = packet && i === target && ph > 0.4 && ph < 0.6;
    if (hit) glow(ctx, tl.x, tl.y, m * 0.12, SAGE, 0.5);
    ctx.beginPath();
    ctx.arc(tl.x, tl.y, 5, 0, TAU);
    ctx.fillStyle = hit ? rgba(SAGE, 1) : rgba('12,13,11', 1);
    ctx.fill();
    ctx.strokeStyle = rgba(FG, 0.55);
    ctx.stroke();
    label(ctx, tl.name, tl.x, tl.y + 18, packet && i === target ? 0.85 : 0.45, 'center');
  });

  const tl = tools[target];
  const out = ph < 0.5;
  const u = out ? ph * 2 : (ph - 0.5) * 2;
  const e = 1 - (1 - u) ** 3;
  const [ax, ay, bx, by] = out ? [cx, cy, tl.x, tl.y] : [tl.x, tl.y, cx, cy];
  const px = ax + (bx - ax) * e, py = ay + (by - ay) * e;
  if (packet) {
    glow(ctx, px, py, 18, out ? AMBER : SAGE, 0.7);
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, TAU);
    ctx.fillStyle = rgba(FG, 1);
    ctx.fill();
  }

  const thinking = live?.kind === 'thinking';
  glow(ctx, cx, cy, m * 0.2, AMBER, thinking ? 0.3 + 0.2 * Math.sin(t * 5) : live?.kind === 'final' ? 0.5 : 0.25);
  ctx.beginPath();
  ctx.arc(cx, cy, m * 0.085, 0, TAU);
  ctx.fillStyle = rgba('12,13,11', 0.9);
  ctx.fill();
  ctx.strokeStyle = rgba(AMBER, 0.8);
  ctx.stroke();
  label(ctx, 'MCP', cx, cy, 0.9, 'center', 12);
  const status = !live || packet ? (out ? `→ tools/call ${tl.name}` : '← result') : live.kind === 'final' ? '✓ final answer' : 'thinking…';
  label(ctx, status, 20, h - 22, 0.55);
}

/* ---------- core: layered architecture, requests falling through ---------- */
const LAYERS = ['api/v1', 'services', 'interfaces', 'repositories', 'pgvector'];
function core(ctx, w, h, t) {
  const m = Math.min(w, h);
  const cx = w * 0.42;
  const a = Math.min(w * 0.28, h * 0.42), b = a * 0.42;
  const gap = Math.min(b * 1.35, (h * 0.78) / LAYERS.length);
  const top = h / 2 - (gap * (LAYERS.length - 1)) / 2;

  const fall = (t * 0.32) % 1;
  const rise = (t * 0.32 + 0.5) % 1;
  const span = gap * (LAYERS.length - 1);
  const fy = top + fall * span, ry = top + (1 - rise) * span;

  for (let i = LAYERS.length - 1; i >= 0; i--) {
    const y = top + i * gap + Math.sin(t * 0.8 + i) * 2;
    const heat = Math.max(0, 1 - Math.abs(fy - y) / (gap * 0.6)) + Math.max(0, 1 - Math.abs(ry - y) / (gap * 0.6)) * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - a, y);
    ctx.lineTo(cx, y - b);
    ctx.lineTo(cx + a, y);
    ctx.lineTo(cx, y + b);
    ctx.closePath();
    ctx.fillStyle = rgba('11,12,10', 0.92);
    ctx.fill();
    ctx.strokeStyle = rgba(heat > 0.05 ? AMBER : FG, 0.18 + 0.6 * Math.min(1, heat));
    ctx.lineWidth = 1;
    ctx.stroke();
    label(ctx, LAYERS[i], cx + a + 14, y, 0.35 + 0.5 * Math.min(1, heat));
  }
  glow(ctx, cx - 6, fy, 20, AMBER, 0.8);
  glow(ctx, cx + 6, ry, 16, SAGE, 0.7);
  ctx.fillStyle = rgba(FG, 1);
  ctx.fillRect(cx - 7, fy - 1.5, 3, 3);
  ctx.fillRect(cx + 5, ry - 1.5, 3, 3);
  label(ctx, 'POST /api/v1/bookings', 20, 24, 0.55);
}

const DRAWERS = { voice, sales, rag, mcp, core };

export function mountVisual(canvas, id, { reduced }) {
  const draw = DRAWERS[id];
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const state = {};
  const offset = { voice: 0.4, sales: 0, rag: 3, mcp: 1, core: 0.6 }[id] ?? 0;
  const t0 = performance.now();
  let w = 0, h = 0, raf = 0, visible = false, last = 0;

  const frame = (now = performance.now()) => {
    if (!w || !h) return;
    const t = reduced ? 4 + offset : (now - t0) / 1000 + offset;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h, t, state);
  };
  // 30fps is plenty for these slow motions and halves the cost of several canvases on screen
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 30) return;
    last = now;
    frame(now);
  };
  const ro = new ResizeObserver(() => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    frame();
  });
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible && !reduced) raf = requestAnimationFrame(loop);
  });
  ro.observe(canvas);
  io.observe(canvas);
  return {
    state,
    destroy() {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}
