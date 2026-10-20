// MCP card: an operations desk from above, one handwritten request in the middle and the five tools around it.
// The request is a short checklist: each tool gets used (a day circled, a name underlined, a total circled, the envelope sealed)
// and its row is ticked. In the demo, real tool calls drive the same marks and ticks through state.live.
import { AMBER, PAGE, ellipse, pen, poly, rotate } from '../sketch.js';

const W = 400, H = 460;
const NOTE = { x: 196, y: 226, a: -3 };
// in the demo's tool order: calendar, customers, services, quote, notify
// each with the mark its use leaves, in the item's own coords
const ITEMS = [
  { x: 88, y: 94, a: -6, mark: ellipse(17, -9, 11, 8, 30) },
  { x: 314, y: 96, a: 5, mark: [[-12, -14], [10, -15], [36, -13]] },
  { x: 344, y: 250, a: 8, mark: ellipse(19, -16, 16, 5.5, 30) },
  { x: 304, y: 384, a: -5, mark: ellipse(21, 32, 15, 7, 30) },
  { x: 96, y: 372, a: 4, mark: ellipse(0, 0, 6, 6, 20) },
];
const ROWS = [-30, -16, -2, 12, 26];
const to = (it, [x, y]) => rotate([[x, y]], (it.a * Math.PI) / 180, it.x, it.y)[0];
const tickAt = ([x, y]) => [[x - 4, y], [x - 1, y + 4], [x + 6, y - 5]];

function geometry(p) {
  const request = ROWS.map((y, i) => p.script(-28, i === 4 ? 4 : 32 + p.r() * 6, y, 1.4)).flat();
  const marks = ITEMS.map((it) => it.mark.map((q) => to(it, q)));
  const ticks = ROWS.map((y) => tickAt(rotate([[-38, y]], (NOTE.a * Math.PI) / 180, NOTE.x, NOTE.y)[0]));
  const done = rotate([[-40, 38], [40, 37]], (NOTE.a * Math.PI) / 180, NOTE.x, NOTE.y);
  return { request, marks, ticks, done };
}

const G = geometry(pen(14));
const draw = (name, a, b) => `@keyframes mcp-${name} { 0%, ${a}% { stroke-dashoffset: 1; } ${b}%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }`;

export default {
  id: 'mcp',
  viewBox: `0 0 ${W} ${H}`,
  // 10 s on its own; in the demo .is-live turns the loop off and each call or result switches one piece on
  css: `
    ${G.marks.map((_, i) => `.scene--mcp .m-mark${i} { animation: mcp-mark${i} 10s linear infinite; } .scene--mcp .m-tick${i} { animation: mcp-tick${i} 10s linear infinite; }`).join('\n    ')}
    .scene--mcp .m-done { animation: mcp-done 10s linear infinite; }
    .scene--mcp .m-flap { transform-box: fill-box; transform-origin: 50% 100%; animation: mcp-flap 10s cubic-bezier(.5,0,.3,1) infinite; }
    .scene--mcp.is-paused * { animation-play-state: paused; }
    .scene--mcp.is-still * { animation: none; }
    .scene--mcp.is-still .m-flap { transform: scaleY(-1); }
    .scene--mcp.is-live * { animation: none; }
    .scene--mcp.is-live .m-a { stroke-dashoffset: 1; transition: stroke-dashoffset 0.8s ease; }
    .scene--mcp.is-live .m-a.on { stroke-dashoffset: 0; }
    .scene--mcp.is-live .m-flap { transform: none; transition: transform 0.8s ease; }
    .scene--mcp.is-live .m-flap.on { transform: scaleY(-1); }
    @media (prefers-reduced-motion: reduce) { .scene--mcp * { animation: none !important; } .scene--mcp:not(.is-live) .m-flap { transform: scaleY(-1); } }
    ${G.marks.map((_, i) => `${draw(`mark${i}`, 6 + i * 13 + (i === 4 ? 5 : 0), 11 + i * 13 + (i === 4 ? 4 : 0))} ${draw(`tick${i}`, 12 + i * 13 + (i === 4 ? 4 : 0), 15 + i * 13 + (i === 4 ? 4 : 0))}`).join('\n    ')}
    @keyframes mcp-flap { 0%, 58% { transform: none; } 64%, 94% { transform: scaleY(-1); } 100% { transform: none; } }
    ${draw('done', 76, 81)}
  `,
  draw() {
    const p = pen(14);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const ink = (cls, pts, w) =>
      `<path class="m-a ${cls}" d="${poly(pts)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${AMBER}" stroke-width="${w}"/>`;
    const lines = (x0, x1, ys, a = 0.28) => ys.map((y) => s([[x0, y], [x1 - p.r() * (x1 - x0) * 0.4, y]], { a, w: 0.8, j: 0.25, step: 10 })).join('');
    // a sheet of paper with its shadow down and to the left
    const sheet = (id, pts, fa = 0.7) => {
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const [x0, y0, x1, y1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      return `<clipPath id="mcp-${id}-sh"><path d="M${x0 - 9} ${y0 + 6} L${x0} ${y0} L${x0} ${y1} L${x1} ${y1} L${x1 - 6} ${y1 + 9} L${x0 - 9} ${y1 + 9} Z"/></clipPath>
        <g clip-path="url(#mcp-${id}-sh)">${p.hatch(x0 - 10, y0, x1, y1 + 10, 3, 0.9, { a: 0.2 })}</g>
        ${s(pts, { closed: true, fill: PAGE, fa, a: 0.6, w: 0.9, step: 12 })}`;
    };
    const place = (it, body) => `<g transform="translate(${it.x} ${it.y}) rotate(${it.a})">${body}</g>`;

    const calendar = place(ITEMS[0], [
      sheet('cal', [[-60, -54], [60, -54], [60, 54], [-60, 54]]),
      s([[-60, -36], [60, -36]], { a: 0.45, w: 0.8, step: 20 }),
      ...[-30, 30].map((x) => s([[x - 4, -60], [x - 4, -50], [x + 4, -50], [x + 4, -60]], { a: 0.5, w: 0.9, step: 4, j: 0.2 })),
      s([[-50, -45], [-10, -45]], { a: 0.45, w: 1.3, step: 10 }),
      ...Array.from({ length: 6 }, (_, i) => s([[-60 + i * 17.1 + 17.1, -36], [-60 + i * 17.1 + 17.1, 54]], { a: 0.12, w: 0.6, step: 20 })),
      ...Array.from({ length: 4 }, (_, i) => s([[-60, -36 + (i + 1) * 18], [60, -36 + (i + 1) * 18]], { a: 0.12, w: 0.6, step: 20 })),
      // a few days already taken
      ...[[0, 1], [2, 0], [5, 2], [1, 3], [3, 3]].map(([c, r]) => s([[-56 + c * 17.1, -24 + r * 18], [-46 + c * 17.1, -24 + r * 18]], { a: 0.35, w: 0.9, step: 4 })),
    ].join(''));

    const client = place(ITEMS[1], [
      sheet('card', [[-58, -38], [58, -38], [58, 38], [-58, 38]]),
      // a small portrait: head and shoulders
      s([[-37, -16], [-31, -12], [-31, -4], [-37, 0], [-43, -4], [-43, -12]], { closed: true, a: 0.5, w: 0.8, step: 3, j: 0.2 }),
      s([[-50, 14], [-46, 2], [-37, -1], [-28, 2], [-24, 14]], { a: 0.5, w: 0.8, step: 4, j: 0.2 }),
      s([[-52, -26], [-22, -26], [-22, 20], [-52, 20]], { closed: true, a: 0.25, w: 0.7, step: 10 }),
      lines(-12, 48, [-20, -8, 4, 16, 28]),
    ].join(''));

    const leaflet = place(ITEMS[2], [
      sheet('menu', [[-38, -50], [38, -50], [38, 50], [-38, 50]]),
      s([[0, -50], [0, 50]], { a: 0.3, w: 0.7, step: 20 }),
      `<clipPath id="mcp-fold"><path d="M0 -50 L38 -50 L38 50 L0 50 Z"/></clipPath><g clip-path="url(#mcp-fold)">${p.hatch(0, -50, 38, 50, 5, 1.2, { a: 0.08 })}</g>`,
      ...[-36, 4].map((y) => s([[-32, y], [-12, y]], { a: 0.45, w: 1.2, step: 8 })),
      lines(-32, -6, [-26, -18, -10, 14, 22, 30]),
      lines(6, 32, [-36, -26, -16, -6, 4, 14, 24]),
    ].join(''));

    const zig = Array.from({ length: 9 }, (_, i) => [40 - i * 10, 60 + (i % 2 ? 0 : 5)]);
    const slip = place(ITEMS[3], [
      sheet('slip', [[-40, -60], [40, -60], ...zig], 0.75),
      s([[-30, -48], [0, -48]], { a: 0.45, w: 1.2, step: 8 }),
      ...[-34, -24, -14, -4, 6].map((y) => s([[-30, y], [-4 - p.r() * 10, y]], { a: 0.28, w: 0.8, step: 8 }) + s([[16, y], [30, y]], { a: 0.28, w: 0.8, step: 8 })),
      s([[-30, 20], [30, 20]], { a: 0.25, w: 0.7, step: 20, attrs: 'stroke-dasharray="2 3"' }),
      s([[-30, 32], [-10, 32]], { a: 0.5, w: 1.2, step: 8 }), s([[12, 32], [30, 32]], { a: 0.55, w: 1.4, step: 8 }),
    ].join(''));

    const envelope = place(ITEMS[4], [
      sheet('env', [[-64, -40], [64, -40], [64, 40], [-64, 40]], 0.8),
      s([[-64, 40], [-6, 2]], { a: 0.25, w: 0.7, step: 12 }), s([[64, 40], [6, 2]], { a: 0.25, w: 0.7, step: 12 }),
      // the flap stands open above the envelope and folds down over it
      `<g class="m-flap">${s([[-64, -40], [0, -84], [64, -40]], { closed: true, fill: PAGE, fa: 0.85, a: 0.55, w: 0.9, step: 10 })}</g>`,
    ].join(''));

    const note = `<g transform="translate(${NOTE.x} ${NOTE.y}) rotate(${NOTE.a})">${[
      sheet('note', [[-48, -48], [48, -48], [48, 48], [-48, 48]], 0.92),
      ...G.request.map((st) => s(st, { a: 0.5, w: 0.9, j: 0.2, step: 2.2 })),
    ].join('')}</g>`;

    const desk = Array.from({ length: 16 }, (_, i) => {
      const y0 = 10 + i * 29, ph = p.r() * 6;
      return s(Array.from({ length: 41 }, (_, k) => [k * 10 - 4, y0 + Math.sin(k * 0.33 + ph) * 3 + Math.sin(k * 0.12) * 5]), { a: 0.05, w: 0.7, step: 10 });
    });

    return `<g stroke-linecap="round" stroke-linejoin="round">${desk.join('')}${calendar}${client}${leaflet}${slip}${envelope}${note}
      ${G.marks.map((m, i) => ink(`m-mark${i}`, m, 1.3)).join('')}
      ${G.ticks.map((t, i) => ink(`m-tick${i}`, t, 1.5)).join('')}
      ${ink('m-done', G.done, 1.3)}</g>`;
  },
  // demo events: thinking resets, a call leaves its mark on the tool, a result ticks its row, final underlines the request
  live(svg, v) {
    svg.classList.add('is-live');
    const on = (sel) => svg.querySelector(sel)?.classList.add('on');
    if (v.kind === 'thinking') return svg.querySelectorAll('.on').forEach((el) => el.classList.remove('on'));
    if (v.tool >= 0 && v.kind === 'call') on(`.m-mark${v.tool}`);
    if (v.tool >= 0 && v.kind === 'result') {
      on(`.m-mark${v.tool}`);
      on(`.m-tick${v.tool}`);
      if (v.tool === 4) on('.m-flap');
    }
    if (v.kind === 'final') on('.m-done');
  },
};
