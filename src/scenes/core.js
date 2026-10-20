// Ops core card: the wall board everyone works from, the week's schedule and the price list pinned side by side.
// A booking slides into a free slot, a second one for the same slot bounces off, the matching price gets ticked.
import { AMBER, FG, PAGE, ellipse, pen, poly } from '../sketch.js';

const GRID = { x: 62, y: 118, cw: 34, ch: 32, cols: 5, rows: 8 };
const FREE = [2, 4];
const cell = (c, r) => [GRID.x + c * GRID.cw, GRID.y + r * GRID.ch];

function geometry(p) {
  const head = p.script(64, 150, 88, 1.8);
  const days = Array.from({ length: GRID.cols }, (_, c) => p.script(GRID.x + c * GRID.cw + 6, GRID.x + c * GRID.cw + 24, GRID.y - 10, 1));
  const taken = [];
  for (let c = 0; c < GRID.cols; c++) for (let r = 0; r < GRID.rows; r++) {
    if ((c === FREE[0] && r === FREE[1]) || p.r() < 0.5) continue;
    taken.push({ c, r, text: p.script(cell(c, r)[0] + 7, cell(c, r)[0] + 16 + p.r() * 10, cell(c, r)[1] + GRID.ch / 2, 0.9) });
  }
  const prices = [0, 1, 2, 3, 4, 5].map((i) => ({ y: 132 + i * 26, name: p.script(282, 304 + p.r() * 10, 132 + i * 26, 1), cost: p.script(334, 350, 132 + i * 26, 1) }));
  const [fx, fy] = cell(...FREE);
  const card = { x: fx + 3, y: fy + 3, w: GRID.cw - 6, h: GRID.ch - 6 };
  const cardText = p.script(card.x + 4, card.x + card.w - 5, card.y + card.h / 2, 0.9).flat();
  const tick = [[270, prices[2].y], [274, prices[2].y + 4], [282, prices[2].y - 6]];
  return { head, days, taken, prices, card, cardText, tick };
}

const G = geometry(pen(33));

export default {
  id: 'core',
  // cropped in on the board, same 4:4.6 shape as the card
  viewBox: '28 48 344 396',
  // 10 s: the booking slides in and settles, a second booking for the same slot bumps and falls away, the price is ticked
  css: `
    .scene--core .c-in, .scene--core .c-out { transform-box: fill-box; transform-origin: 50% 50%; }
    .scene--core .c-in { animation: core-in 10s cubic-bezier(.3,.7,.3,1) infinite; }
    .scene--core .c-out { opacity: 0; animation: core-out 10s cubic-bezier(.4,0,.4,1) infinite; }
    .scene--core .c-tick { animation: core-tick 10s linear infinite; }
    .scene--core .c-pin { transform-box: fill-box; transform-origin: 50% 50%; animation: core-pin 10s cubic-bezier(.3,.7,.3,1) infinite; }
    .scene--core.is-paused * { animation-play-state: paused; }
    .scene--core.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--core * { animation: none !important; } }
    @keyframes core-in {
      0%, 8% { transform: translate(250px, 120px) rotate(14deg); opacity: 0; }
      11% { opacity: 1; }
      24% { transform: translate(-2px, 1px) rotate(-2deg); }
      28%, 92% { transform: none; opacity: 1; }
      100% { transform: none; opacity: 0; }
    }
    @keyframes core-out {
      0%, 32% { transform: translate(250px, 150px) rotate(18deg); opacity: 0; }
      35% { opacity: 1; }
      44% { transform: translate(7px, -3px) rotate(3deg); }
      46% { transform: translate(18px, -1px) rotate(7deg); }
      48% { transform: translate(13px, -2px) rotate(5deg); opacity: 1; }
      60% { transform: translate(110px, 190px) rotate(32deg); opacity: 0; }
      100% { transform: translate(110px, 190px) rotate(32deg); opacity: 0; }
    }
    @keyframes core-pin { 0%, 25% { transform: translate(-6px, -10px) scale(1.7); opacity: 0; } 28% { opacity: 1; } 31% { transform: scale(0.94); } 33%, 92% { transform: none; opacity: 1; } 100% { transform: none; opacity: 0; } }
    @keyframes core-tick { 0%, 62% { stroke-dashoffset: 1; } 68%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
  `,
  draw() {
    const p = pen(33);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    // pinned paper casts a short shadow down and to the left
    const shadow = (id, x, y, w, h) => `<clipPath id="core-${id}"><path d="M${x - 8} ${y + 6} L${x} ${y} L${x} ${y + h} L${x + w} ${y + h} L${x + w - 6} ${y + h + 8} L${x - 8} ${y + h + 8} Z"/></clipPath>
      <g clip-path="url(#core-${id})">${p.hatch(x - 10, y, x + w, y + h + 10, 3, 0.9, { a: 0.2 })}</g>`;
    const pin = (x, y) => `<clipPath id="core-pin-${x}"><path d="M${x - 9} ${y - 2} a7 7 0 0 0 12 6 l-4 6 a9 9 0 0 1 -10 -10 Z"/></clipPath>
      <g clip-path="url(#core-pin-${x})">${p.hatch(x - 12, y - 4, x + 4, y + 14, 2, 0.9, { a: 0.3 })}</g>
      ${s(ellipse(x, y, 6, 6, 18), { closed: true, fill: PAGE, fa: 1, a: 0.65, w: 0.9, step: 3, j: 0.2 })}
      ${s([[x + 1, y - 4], [x + 3.5, y - 2.5], [x + 4, y]], { a: 0.6, w: 0.8, step: 2, j: 0.1 })}`;

    const board = [
      s(box(20, 30, 360, 404), { closed: true, a: 0.5, w: 0.9, step: 16 }),
      s(box(32, 42, 336, 380), { closed: true, a: 0.4, w: 0.8, step: 16 }),
      // the frame's inner bevel in the shade: left and bottom
      `<clipPath id="core-bevel"><path d="M20 30 L32 42 L32 422 L368 422 L380 434 L20 434 Z"/></clipPath>`,
      `<g clip-path="url(#core-bevel)">${p.hatch(18, 28, 382, 436, 2.6, 0.9, { a: 0.24 })}</g>`,
      `<clipPath id="core-felt"><path d="M32 42 H368 V422 H32 Z"/></clipPath>`,
      `<g clip-path="url(#core-felt)">${p.hatch(32, 42, 368, 422, 9, 1.1, { a: 0.04 })}</g>`,
    ];

    const sched = [
      shadow('sched', 50, 66, 196, 384 - 66),
      s(box(50, 66, 196, 384 - 66), { closed: true, fill: PAGE, fa: 0.7, a: 0.6, w: 0.9, step: 14 }),
      ...G.head.map((st) => s(st, { a: 0.5, w: 0.9, j: 0.2, step: 2.2 })),
      ...G.days.flat().map((st) => s(st, { a: 0.4, w: 0.7, j: 0.2, step: 2.2 })),
      ...Array.from({ length: GRID.cols + 1 }, (_, c) => s([cell(c, 0), cell(c, GRID.rows)], { a: 0.14, w: 0.6, step: 30 })),
      ...Array.from({ length: GRID.rows + 1 }, (_, r) => s([cell(0, r), cell(GRID.cols, r)], { a: 0.14, w: 0.6, step: 30 })),
      ...G.taken.map(({ c, r, text }) => {
        const [x, y] = cell(c, r);
        return s(box(x + 3, y + 3, GRID.cw - 6, GRID.ch - 6), { closed: true, fill: PAGE, fa: 0.9, a: 0.4, w: 0.7, step: 8, j: 0.3 }) +
          text.map((st) => s(st, { a: 0.32, w: 0.7, j: 0.15, step: 2.2 })).join('');
      }),
      pin(62, 76), pin(234, 76),
    ];

    const list = [
      shadow('list', 266, 96, 94, 196),
      s(box(266, 96, 94, 196), { closed: true, fill: PAGE, fa: 0.7, a: 0.6, w: 0.9, step: 12 }),
      s([[278, 112], [318, 112]], { a: 0.45, w: 1.3, step: 8 }),
      ...G.prices.flatMap(({ y, name, cost }) => [
        ...name.map((st) => s(st, { a: 0.34, w: 0.7, j: 0.15, step: 2.2 })),
        s([[310, y + 2], [330, y + 2]], { a: 0.2, w: 0.7, step: 30, attrs: 'stroke-dasharray="1 4"' }),
        ...cost.map((st) => s(st, { a: 0.45, w: 0.8, j: 0.15, step: 2.2 })),
      ]),
      pin(313, 104),
    ];

    const { x, y, w, h } = G.card;
    const bookingCard = (cls, c, a) => `<g class="${cls}">
      ${s(box(x, y, w, h), { closed: true, fill: PAGE, fa: 1, c, a, w: 1.1, step: 8, j: 0.3 })}
      ${s(G.cardText, { c, a: a * 0.8, w: 0.8, j: 0.15, step: 2.2 })}</g>`;

    return `<g stroke-linecap="round" stroke-linejoin="round">${board.join('')}
      <g transform="rotate(-1.5 148 225)">${sched.join('')}</g>
      <g transform="rotate(2 313 194)">${list.join('')}
        <path class="c-tick" d="${poly(G.tick)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${AMBER}" stroke-width="1.5"/></g>
      <g transform="rotate(-1.5 148 225)">${bookingCard('c-out', FG, 0.6)}${bookingCard('c-in', AMBER, 1)}
        <g class="c-pin">${pin(x + w / 2, y + 2)}</g></g></g>`;
  },
};
