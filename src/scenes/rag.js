// Knowledge-base card: a clinic reception counter from above, the policy binder open.
// A question lands on a sticky note, a finger runs down the page to the answer, it gets highlighted and linked to the note.
import { AMBER, FG, PAGE, length, pen, poly, quad, rotate } from '../sketch.js';

const W = 400, H = 460;
const BINDER = { x: 186, y: 262, a: -4 };
const NOTE = { x: 308, y: 84, a: 9 };

// a pointing hand, fingertip at 0,0, arm going off to the lower right; drawn along (u, v) and laid along the pencil angle
const lay = (pts) => pts.map(([u, v]) => [u * 0.79 - v * 0.62, u * 0.62 + v * 0.79]);
const FINGER = {
  hand: lay([[0, -4], [3, -6], [55, -8], [75, -14], [105, -14], [130, -8], [150, -2], [150, 40], [120, 44], [95, 40], [78, 30], [60, 18], [52, 8], [3, 6]]),
  sleeve: lay([[146, -6], [260, -24], [270, 70], [146, 42]]),
  curls: [[[60, 8], [82, 12]], [[64, 18], [88, 24]], [[72, 28], [94, 34]]].map(lay),
  nail: lay([[2, -3], [11, -4], [11, 3], [2, 3]]),
  cuff: [[[146, -6], [146, 42]], [[156, -8], [156, 46]]].map(lay),
};

function geometry(p) {
  // typed text: steady short dashes for words, one heading per block
  const typed = (x0, x1, y) => {
    const out = [];
    for (let x = x0; x < x1 - 8;) {
      const wl = 6 + p.r() * 18, e = Math.min(x + wl, x1);
      out.push([[x, y], [e, y]]);
      x = e + 4;
    }
    return out;
  };
  const page = (x0, blocks) => blocks.flatMap(({ y, n, head }) => [
    ...(head ? [[[x0, y - 14], [x0 + 46 + p.r() * 30, y - 14]]] : []),
    ...Array.from({ length: n }, (_, i) => typed(x0, x0 + 124 - (i === n - 1 ? 40 + p.r() * 40 : p.r() * 8), y + i * 10)).flat(),
  ]);
  const heads = (x0, blocks) => blocks.filter((b) => b.head).map(({ y }) => [[x0, y - 14], [x0 + 50, y - 14]]);
  const leftBlocks = [{ y: -78, n: 5, head: true }, { y: -14, n: 4 }, { y: 40, n: 6, head: true }];
  const rightBlocks = [{ y: -78, n: 4, head: true }, { y: -26, n: 3 }, { y: 24, n: 3, head: true }, { y: 70, n: 3 }];
  const textL = page(-142, leftBlocks), textR = page(14, rightBlocks);
  const headings = [...heads(-142, leftBlocks), ...heads(14, rightBlocks)];

  // the answer: the third block of the right page
  const lines = [24, 34, 44].map((y) => [[14, y + 2], [136, y + 2]]);
  const rest = [150, 170];
  const path = [rest, [10, -86], [10, -30], [10, 26], ...lines.flat(), rest];
  const legs = [[rest, [10, -86]], [[10, -86], [10, -30]], [[10, -30], [10, 26]], [[10, 26], lines[0][0]], lines[0], [lines[0][1], lines[1][0]], lines[1], [lines[1][1], lines[2][0]], lines[2]];
  let acc = 0;
  const at = legs.map((l) => ((acc += length(l)) / length(path)) * 100);

  // the arrow from the note to the end of the answer, in page coords of the counter
  const to = rotate([[142, 30]], (BINDER.a * Math.PI) / 180, BINDER.x, BINDER.y)[0];
  // out around the right margin, then back in to the answer
  const from = [NOTE.x + 6, NOTE.y + 42];
  const arrow = quad(from, [to[0] + 78, (from[1] + to[1]) / 2], [to[0] + 10, to[1] + 2], 24);
  const end = arrow.at(-1), prev = arrow.at(-4), ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const head = [rotate([[-10, -6]], ang, ...end)[0], end, rotate([[-10, 6]], ang, ...end)[0]];
  return { textL, textR, headings, lines, path, at, arrow, head };
}

const G = geometry(pen(8));
const k = (at, dist, ease = 'linear') => `${at} { offset-distance: ${dist.toFixed(1)}%; animation-timing-function: ${ease}; }`;
const MOVE = 'cubic-bezier(.5,0,.3,1)';
const draw = (name, a, b) => `@keyframes rag-${name} { 0%, ${a}% { stroke-dashoffset: 1; } ${b}%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }`;

export default {
  id: 'rag',
  viewBox: `0 0 ${W} ${H}`,
  // 10 s: the question lands, the finger finds the answer and marks it line by line, the note gets linked to it
  css: `
    .scene--rag .r-note { transform-box: fill-box; transform-origin: 50% 50%; animation: rag-note 10s cubic-bezier(.3,.7,.3,1) infinite; }
    .scene--rag .r-hand { offset-path: path('${poly(G.path)}'); offset-rotate: 0deg; offset-anchor: 0 0; transform-box: view-box; offset-distance: 100%; animation: rag-hand 10s infinite; }
    .scene--rag .r-mark0 { animation: rag-mark0 10s linear infinite; }
    .scene--rag .r-mark1 { animation: rag-mark1 10s linear infinite; }
    .scene--rag .r-mark2 { animation: rag-mark2 10s linear infinite; }
    .scene--rag .r-arrow { animation: rag-arrow 10s linear infinite; }
    .scene--rag .r-head { animation: rag-head 10s linear infinite; }
    .scene--rag.is-paused * { animation-play-state: paused; }
    .scene--rag.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--rag * { animation: none !important; } }
    @keyframes rag-note { 0% { transform: translate(14px, -40px) rotate(-12deg); opacity: 0; } 4% { opacity: 1; } 9% { transform: translate(0, 2px) rotate(1deg); } 12%, 92% { transform: none; opacity: 1; } 100% { transform: none; opacity: 0; } }
    @keyframes rag-hand {
      ${k('0%, 10%', 0, MOVE)} ${k('17%', G.at[0])} ${k('23%', G.at[1])} ${k('27%', G.at[1])} ${k('33%', G.at[2])}
      ${k('38%', G.at[3])} ${k('44%', G.at[4])} ${k('45%', G.at[5])} ${k('51%', G.at[6])} ${k('52%', G.at[7])}
      ${k('58%', G.at[8], MOVE)} ${k('66%, 100%', 100)}
    }
    ${draw('mark0', 38, 44)} ${draw('mark1', 45, 51)} ${draw('mark2', 52, 58)} ${draw('arrow', 68, 80)} ${draw('head', 80, 83)}
  `,
  draw() {
    const p = pen(8);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const ink = (cls, pts, c, w, a = 1) =>
      `<path class="${cls}" d="${poly(pts)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${a}"/>`;
    const pageL = [[-150, -112], [-6, -108], [-6, 112], [-150, 108]];
    const pageR = [[6, -108], [150, -112], [150, 108], [6, 112]];

    const counter = Array.from({ length: 16 }, (_, i) => {
      const y0 = 10 + i * 29, ph = p.r() * 6;
      return s(Array.from({ length: 41 }, (_, k) => [k * 10 - 4, y0 + Math.sin(k * 0.25 + ph) * 2 + Math.sin(k * 0.09) * 5]), { a: 0.05, w: 0.7, step: 10 });
    });

    const binder = [
      `<clipPath id="rag-shadow"><path d="M-162 -104 L-150 -112 L-150 108 L150 108 L156 122 L-162 122 Z"/></clipPath>`,
      `<g clip-path="url(#rag-shadow)">${p.hatch(-170, -110, 160, 130, 3, 0.9, { a: 0.2 })}</g>`,
      s(pageL, { closed: true, fill: PAGE, fa: 0.7, a: 0.6, w: 0.9, step: 14 }),
      s(pageR, { closed: true, fill: PAGE, fa: 0.5, a: 0.6, w: 0.9, step: 14 }),
      `<clipPath id="rag-left"><path d="${poly(pageL)}"/></clipPath>`,
      `<g clip-path="url(#rag-left)">${p.hatch(-150, -112, -6, 112, 5, 1.2, { a: 0.07 })}</g>`,
      // the binder rings across the spine
      ...[-72, 0, 72].map((y) => s([[-12, y - 3], [-4, y - 6], [4, y - 6], [12, y - 3], [12, y + 3], [4, y + 6], [-4, y + 6], [-12, y + 3]], { closed: true, a: 0.55, w: 0.9, step: 4, j: 0.2 })),
      ...G.headings.map((l) => s(l, { a: 0.45, w: 1.4, j: 0.3, step: 10 })),
      ...[...G.textL, ...G.textR].map((l) => s(l, { a: 0.28, w: 0.8, j: 0.25, step: 10 })),
      // marker under the text, so the words stay readable
      ...G.lines.map((l, i) => ink(`r-mark${i}`, l, AMBER, 6, 0.22)),
      `<g class="r-hand">`,
      s(FINGER.sleeve, { closed: true, fill: PAGE, fa: 0.85, a: 0.55, w: 0.9, step: 14 }),
      `<clipPath id="rag-sl"><path d="${poly(FINGER.sleeve)}"/></clipPath>`,
      `<g clip-path="url(#rag-sl)">${p.hatch(60, 60, 250, 240, 3, 0.7, { a: 0.18 })}${p.hatch(60, 60, 250, 240, 5, -0.7, { a: 0.1 })}</g>`,
      s(FINGER.hand, { closed: true, fill: PAGE, fa: 0.92, a: 0.62, w: 0.9, step: 8 }),
      `<clipPath id="rag-h"><path d="${poly(FINGER.hand)}"/></clipPath>`,
      `<g clip-path="url(#rag-h)">${p.hatch(30, 30, 140, 140, 3.4, 0.6, { a: 0.13 })}</g>`,
      ...FINGER.curls.map((l) => s(l, { a: 0.4, w: 0.8, step: 6 })),
      s(FINGER.nail, { closed: true, a: 0.4, w: 0.7, step: 3, j: 0.2 }),
      ...FINGER.cuff.map((l) => s(l, { a: 0.45, w: 0.8 })),
      `</g>`,
    ];

    const note = [
      `<clipPath id="rag-note-sh"><path d="M-36 -30 L-42 -26 L-42 42 L30 42 L36 36 L-36 36 Z"/></clipPath>`,
      `<g clip-path="url(#rag-note-sh)">${p.hatch(-44, -32, 38, 44, 3, 0.9, { a: 0.22 })}</g>`,
      s([[-36, -36], [36, -36], [36, 18], [18, 36], [-36, 36]], { closed: true, fill: PAGE, fa: 0.9, a: 0.6, w: 0.9, step: 10 }),
      // the curled corner, in the shade
      s([[36, 18], [22, 22], [18, 36]], { closed: true, fill: PAGE, fa: 1, a: 0.5, w: 0.8, step: 5, j: 0.2 }),
      `<clipPath id="rag-curl"><path d="M36 18 L22 22 L18 36 Z"/></clipPath><g clip-path="url(#rag-curl)">${p.hatch(16, 16, 38, 38, 2.4, 0.9, { a: 0.3 })}</g>`,
      // a question mark, written quickly
      s([[-10, -14], [-8, -22], [0, -25], [9, -21], [10, -12], [3, -5], [0, 2], [0, 8]], { a: 0.8, w: 1.6, step: 4, j: 0.5 }),
      s([[0, 15], [0.8, 16.5]], { a: 0.85, w: 2.4, step: 2, j: 0.1 }),
    ];

    return `<g stroke-linecap="round" stroke-linejoin="round">${counter.join('')}
      <g transform="translate(${BINDER.x} ${BINDER.y}) rotate(${BINDER.a})">${binder.join('')}</g>
      <g transform="translate(${NOTE.x} ${NOTE.y}) rotate(${NOTE.a})"><g class="r-note">${note.join('')}</g></g>
      ${ink('r-arrow', G.arrow, AMBER, 1.3)}${ink('r-head', G.head, AMBER, 1.3)}</g>`;
  },
};
