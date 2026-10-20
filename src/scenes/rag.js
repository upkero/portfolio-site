// Knowledge-base card: a clinic reception counter from above, the policy binder open.
// A question lands on a sticky note; the receptionist turns the pages, finds the answer, tabs it, and it goes onto the note.
import { AMBER, PAGE, pen, poly } from '../sketch.js';

const W = 400, H = 460;
const BINDER = { x: 186, y: 262, a: -4 };
const NOTE = { x: 308, y: 84, a: 9 };
const FLIPS = 3;

// a pointing hand, fingertip at 0,0, arm going off to the lower right; drawn along (u, v) and laid along the pencil angle
const lay = (pts) => pts.map(([u, v]) => [u * 0.79 - v * 0.62, u * 0.62 + v * 0.79]);
const FINGER = {
  hand: lay([[0, -4], [3, -6], [55, -8], [75, -14], [105, -14], [130, -8], [150, -2], [150, 40], [120, 44], [95, 40], [78, 30], [60, 18], [52, 8], [3, 6]]),
  sleeve: lay([[146, -6], [260, -24], [270, 70], [146, 42]]),
  curls: [[[60, 8], [82, 12]], [[64, 18], [88, 24]], [[72, 28], [94, 34]]].map(lay),
  nail: lay([[2, -3], [11, -4], [11, 3], [2, 3]]),
  cuff: [[[146, -6], [146, 42]], [[156, -8], [156, 46]]].map(lay),
};
const PAGE_L = [[-150, -112], [-6, -108], [-6, 112], [-150, 108]];
const PAGE_R = [[6, -108], [150, -112], [150, 108], [6, 112]];

function geometry(p) {
  // typed text: steady short dashes for words, one heading per block
  const typed = (x0, x1, y) => {
    const out = [];
    for (let x = x0; x < x1 - 8;) {
      const e = Math.min(x + 6 + p.r() * 18, x1);
      out.push([[x, y], [e, y]]);
      x = e + 4;
    }
    return out;
  };
  const page = (x0, blocks) => ({
    text: blocks.flatMap(({ y, n }) => Array.from({ length: n }, (_, i) => typed(x0, x0 + 124 - (i === n - 1 ? 40 + p.r() * 40 : p.r() * 8), y + i * 10)).flat()),
    heads: blocks.filter((b) => b.head).map(({ y }) => [[x0, y - 14], [x0 + 40 + p.r() * 30, y - 14]]),
  });
  const left = page(-142, [{ y: -78, n: 5, head: true }, { y: -14, n: 4 }, { y: 40, n: 6, head: true }]);
  // the page with the answer, and the pages turned before it is found
  const right = page(14, [{ y: -78, n: 4, head: true }, { y: -26, n: 3 }, { y: 24, n: 3, head: true }, { y: 70, n: 3 }]);
  const turned = Array.from({ length: FLIPS }, () => ({
    front: page(14, [{ y: -80, n: 6, head: true }, { y: -6, n: 5, head: true }, { y: 62, n: 4 }]),
    back: page(-142, [{ y: -78, n: 7, head: true }, { y: 14, n: 6, head: true }]),
  }));
  const line = [[14, 47], [122, 47]];
  const answer = [p.script(-26, 24, 24, 1.1), p.script(-26, 8, 31, 1.1)].map((s) => s.flat());
  return { left, right, turned, line, answer };
}

const G = geometry(pen(8));
// fingertip stops, in binder coords: rest, the page corner, near the spine, the answer line, the tab
const R = [170, 182], C = [146, 98], S = [16, 98], A0 = G.line[0], A1 = G.line[1], T = [152, 36];
const at = (pct, [x, y], ease = 'cubic-bezier(.5,0,.3,1)') => `${pct} { transform: translate(${x}px, ${y}px); animation-timing-function: ${ease}; }`;
// a page turn in two halves: the front narrows into the spine, then its back opens out over the left page
const turn = (i) => {
  const a = 12 + i * 10;
  return `@keyframes rag-front${i} {
      0% { transform: none; opacity: 0; } 4% { opacity: 1; }
      ${a}% { transform: none; animation-timing-function: cubic-bezier(.5,0,.9,.6); }
      ${a + 3}%, 99% { transform: scaleX(0); opacity: 1; }
      100% { transform: none; opacity: 0; }
    }
    @keyframes rag-back${i} {
      0%, ${a + 3}% { transform: scaleX(0); animation-timing-function: cubic-bezier(.1,.4,.5,1); }
      ${a + 6}%, 92% { transform: none; opacity: 1; }
      99% { transform: none; opacity: 0; } 100% { transform: scaleX(0); opacity: 0; }
    }`;
};
const drawn = (name, a, b) => `@keyframes rag-${name} { 0%, ${a}% { stroke-dashoffset: 1; } ${b}%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }`;

export default {
  id: 'rag',
  viewBox: `0 0 ${W} ${H}`,
  // 10 s: the question lands, three pages are turned, the answer is underlined and tabbed, then written onto the note
  css: `
    .scene--rag .r-note { transform-box: fill-box; transform-origin: 50% 50%; animation: rag-note 10s cubic-bezier(.3,.7,.3,1) infinite; }
    ${Array.from({ length: FLIPS }, (_, i) => `.scene--rag .r-front${i} { transform-box: view-box; transform-origin: 0 0; animation: rag-front${i} 10s infinite; }
    .scene--rag .r-back${i} { transform-box: view-box; transform-origin: 0 0; transform: scaleX(0); animation: rag-back${i} 10s infinite; }`).join('\n    ')}
    .scene--rag .r-hand { transform: translate(${R[0]}px, ${R[1]}px); animation: rag-hand 10s infinite; }
    .scene--rag .r-under { animation: rag-under 10s linear infinite; }
    .scene--rag .r-tab { transform-box: fill-box; transform-origin: 0 50%; animation: rag-tab 10s cubic-bezier(.3,.7,.3,1) infinite; }
    .scene--rag .r-answer0 { animation: rag-answer0 10s linear infinite; }
    .scene--rag .r-answer1 { animation: rag-answer1 10s linear infinite; }
    .scene--rag.is-paused * { animation-play-state: paused; }
    .scene--rag.is-still * { animation: none; }
    .scene--rag.is-still [class^='r-front'] { transform: scaleX(0); }
    .scene--rag.is-still [class^='r-back'] { transform: none; }
    @media (prefers-reduced-motion: reduce) { .scene--rag * { animation: none !important; } .scene--rag [class^='r-front'] { transform: scaleX(0); } .scene--rag [class^='r-back'] { transform: none; } }
    @keyframes rag-note { 0% { transform: translate(14px, -40px) rotate(-12deg); opacity: 0; } 4% { opacity: 1; } 9% { transform: translate(0, 2px) rotate(1deg); } 12%, 92% { transform: none; opacity: 1; } 100% { transform: none; opacity: 0; } }
    ${Array.from({ length: FLIPS }, (_, i) => turn(i)).join('\n    ')}
    @keyframes rag-hand {
      ${at('0%, 8%', R)} ${Array.from({ length: FLIPS }, (_, i) => `${at(`${11 + i * 10}%, ${12 + i * 10}%`, C, 'cubic-bezier(.5,0,.9,.6)')} ${at(`${15 + i * 10}%`, S)} ${at(`${19 + i * 10}%`, C)}`).join(' ')}
      ${at('44%', A0, 'linear')} ${at('52%', A1)} ${at('56%', T)} ${at('58%', T)} ${at('66%, 100%', R)}
    }
    ${drawn('under', 44, 52)} ${drawn('answer0', 66, 74)} ${drawn('answer1', 74, 80)}
    @keyframes rag-tab { 0%, 55% { transform: translate(18px, -4px) rotate(8deg); opacity: 0; } 57% { opacity: 1; } 60%, 92% { transform: none; opacity: 1; } 100% { transform: none; opacity: 0; } }
  `,
  draw() {
    const p = pen(8);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const ink = (cls, pts, w, a = 1) =>
      `<path class="${cls}" d="${poly(pts)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${AMBER}" stroke-width="${w}" stroke-opacity="${a}"/>`;
    const text = (pg, a = 0.28) => [...pg.heads.map((l) => s(l, { a: a + 0.17, w: 1.4, j: 0.3, step: 10 })), ...pg.text.map((l) => s(l, { a, w: 0.8, j: 0.25, step: 10 }))].join('');

    const counter = Array.from({ length: 16 }, (_, i) => {
      const y0 = 10 + i * 29, ph = p.r() * 6;
      return s(Array.from({ length: 41 }, (_, k) => [k * 10 - 4, y0 + Math.sin(k * 0.25 + ph) * 2 + Math.sin(k * 0.09) * 5]), { a: 0.05, w: 0.7, step: 10 });
    });

    const binder = [
      `<clipPath id="rag-shadow"><path d="M-162 -104 L-150 -112 L-150 108 L150 108 L156 122 L-162 122 Z"/></clipPath>`,
      `<g clip-path="url(#rag-shadow)">${p.hatch(-170, -110, 160, 130, 3, 0.9, { a: 0.2 })}</g>`,
      s(PAGE_L, { closed: true, fill: PAGE, fa: 0.7, a: 0.6, w: 0.9, step: 14 }),
      s(PAGE_R, { closed: true, fill: PAGE, fa: 0.5, a: 0.6, w: 0.9, step: 14 }),
      `<clipPath id="rag-left"><path d="${poly(PAGE_L)}"/></clipPath>`,
      `<g clip-path="url(#rag-left)">${p.hatch(-150, -112, -6, 112, 5, 1.2, { a: 0.07 })}</g>`,
      text(G.left), text(G.right),
      ink('r-under', G.line, 1.3),
      // the amber tab, stuck to the edge of the answer page
      `<g class="r-tab">${s([[146, 28], [168, 30], [168, 44], [146, 44]], { closed: true, fill: AMBER, fa: 0.28, c: AMBER, a: 0.9, w: 1, step: 6, j: 0.3 })}</g>`,
      // the pages turned before the answer: opaque, so the one under shows only once they are gone;
      // each has a front on the right and a back that lands on the left pile
      ...G.turned.map((pg, i) => `<g transform="translate(${-1.6 * (i + 1)} ${0.8 * (i + 1)})"><g class="r-back${i}">${s(PAGE_L, { closed: true, fill: PAGE, fa: 1, a: 0.55, w: 0.9, step: 14 })}${text(pg.back, 0.22)}</g></g>`),
      ...G.turned.map((pg, i) => `<g class="r-front${i}">${s(PAGE_R, { closed: true, fill: PAGE, fa: 1, a: 0.55, w: 0.9, step: 14 })}${text(pg.front, 0.22)}</g>`).reverse(),
      // the binder rings across the spine
      ...[-72, 0, 72].map((y) => s([[-12, y - 3], [-4, y - 6], [4, y - 6], [12, y - 3], [12, y + 3], [4, y + 6], [-4, y + 6], [-12, y + 3]], { closed: true, a: 0.55, w: 0.9, step: 4, j: 0.2 })),
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
      // a question mark, written quickly, moved up to leave room for the answer
      `<g transform="translate(0 -8) scale(0.85)">`,
      s([[-10, -14], [-8, -22], [0, -25], [9, -21], [10, -12], [3, -5], [0, 2], [0, 8]], { a: 0.8, w: 1.7, step: 4, j: 0.5 }),
      s([[0, 15], [0.8, 16.5]], { a: 0.85, w: 2.6, step: 2, j: 0.1 }),
      `</g>`,
      ...G.answer.map((l, i) => ink(`r-answer${i}`, l, 1.1)),
    ];

    return `<g stroke-linecap="round" stroke-linejoin="round">${counter.join('')}
      <g transform="translate(${BINDER.x} ${BINDER.y}) rotate(${BINDER.a})">${binder.join('')}</g>
      <g transform="translate(${NOTE.x} ${NOTE.y}) rotate(${NOTE.a})"><g class="r-note">${note.join('')}</g></g></g>`;
  },
};
