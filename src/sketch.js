// Hand-drawn SVG scenes for the project cards: fine etched lines, one warm accent, a short story told in CSS motion.
// A scene is { id, viewBox, css, draw(pen) → svg markup, live?(svg, value) }; files in ./scenes are picked up by visuals.js.

export const FG = '#f1efe9';
export const AMBER = '#d6aa70';
export const PAGE = '#10110e';

const f = (n) => n.toFixed(1);

/** Polyline → "M x y L …", exact, for paths that something else has to follow. */
export const poly = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
export const length = (pts) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

export const quad = (a, c, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => {
  const u = i / n, v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
});
export const ellipse = (cx, cy, rx, ry, n = 30) =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);
export const rotate = (pts, a, ox = 0, oy = 0) =>
  pts.map(([x, y]) => [ox + x * Math.cos(a) - y * Math.sin(a), oy + x * Math.sin(a) + y * Math.cos(a)]);

/** A pen with a steady but human hand. Seeded, so a scene looks the same on every load. */
export function pen(seed) {
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // subdivide, nudge each point a little, smooth with quadratic midpoints
  function line(pts, j = 0.6, step = 12, closed = false) {
    if (closed) pts = [...pts, pts[0]];
    const p = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (let k = 0; k < n; k++) {
        const u = k / n;
        p.push([ax + (bx - ax) * u + (r() - 0.5) * j, ay + (by - ay) * u + (r() - 0.5) * j]);
      }
    }
    const last = pts.at(-1);
    p.push(closed ? p[0] : [last[0] + (r() - 0.5) * j, last[1] + (r() - 0.5) * j]);
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 1; i < p.length - 1; i++) {
      d += ` Q${f(p[i][0])} ${f(p[i][1])} ${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2)}`;
    }
    return `${d} L${f(p.at(-1)[0])} ${f(p.at(-1)[1])}`;
  }

  /** One stroke. o: { c, w, a, j, step, closed, fill, fa, cls, attrs } */
  function stroke(pts, o = {}) {
    const { c = FG, w = 0.8, a = 0.5, j = 0.6, step = 12, closed = false, fill = 'none', fa = 1, cls = '', attrs = '' } = o;
    const fillAttr = fill === 'none' ? 'fill="none"' : `fill="${fill}" fill-opacity="${fa}"`;
    return `<path${cls ? ` class="${cls}"` : ''} d="${line(pts, j, step, closed)}" ${fillAttr} stroke="${c}" stroke-width="${w}" stroke-opacity="${a}"${attrs ? ` ${attrs}` : ''}/>`;
  }

  /** Parallel hatching over a box, for tone; clip it to a shape to shade that shape. */
  function hatch(x0, y0, x1, y1, gap = 4, angle = -0.8, o = {}) {
    const out = [], dx = Math.cos(angle), dy = Math.sin(angle);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
    for (let s = -R; s <= R; s += gap * (0.8 + r() * 0.4)) {
      const px = cx - dy * s, py = cy + dx * s;
      out.push(stroke([[px - dx * R, py - dy * R], [px + dx * R, py + dy * R]], { a: 0.2, w: 0.6, j: 0.5, step: 30, ...o }));
    }
    return out.join('');
  }

  // handwriting as quiet loops and gaps, never real letters
  function script(x0, x1, y, size = 1.6) {
    const strokes = [];
    let pts = [], x = x0, word = 6 + r() * 14;
    while (x < x1) {
      const amp = size * (0.6 + r() * 0.7);
      pts.push([x, y + Math.sin(x * 1.3) * amp - (r() < 0.1 ? amp * 1.4 : 0)]);
      x += 1.6;
      if ((word -= 1.6) < 0) {
        strokes.push(pts);
        pts = [];
        x += 5 + r() * 4;
        word = 8 + r() * 18;
      }
    }
    if (pts.length > 1) strokes.push(pts);
    return strokes.filter((s) => s.length > 1);
  }

  return { r, line, stroke, hatch, script };
}

/** Puts a scene's SVG in place of the card canvas; pauses it off-screen and keeps it still for reduced motion. */
export function mountScene(canvas, scene, { reduced }) {
  const tmp = document.createElement('div');
  tmp.innerHTML = `<svg class="scene scene--${scene.id}" viewBox="${scene.viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <style>${scene.css}</style>${scene.draw()}</svg>`;
  const svg = tmp.firstElementChild;
  if (reduced) svg.classList.add('is-still');
  canvas.replaceWith(svg);

  const io = new IntersectionObserver(([e]) => svg.classList.toggle('is-paused', !e.isIntersecting));
  io.observe(svg);
  // demos drive a scene by assigning state.live, as they did with the canvas drawers
  const state = {};
  if (scene.live) Object.defineProperty(state, 'live', { set: (v) => scene.live(svg, v), configurable: true });
  return {
    state,
    destroy() {
      io.disconnect();
      if (svg.isConnected) svg.replaceWith(canvas);
    },
  };
}
