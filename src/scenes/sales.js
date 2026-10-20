// Sales card: a clinic counter from above, a gift voucher for the six-session package.
// The seller writes the package price, stamps the voucher paid and it slides across to the customer. Light from the top right.
import { AMBER, FG, PAGE, ellipse, length, pen, poly, rotate } from '../sketch.js';

const W = 400, H = 460;
const VOUCHER = { x: 200, y: 226, a: -4, s: 1.28 };
const MARK = { x: 52, y: -18, a: -9 };

// a hand holding a pencil, tip at 0,0, arm going off along +x+y; turned by `a` so the arm points where it comes from
function handShape(a) {
  const t = (pts) => rotate(pts, a);
  return {
    hand: t([[16, 10], [30, 8], [52, 18], [82, 26], [112, 40], [150, 66], [180, 92], [150, 150], [120, 126], [96, 110], [70, 96], [52, 76], [40, 52], [26, 36], [20, 22]]),
    sleeve: t([[150, 66], [260, 150], [230, 230], [124, 128]]),
    knuckles: [[[54, 20], [62, 34]], [[70, 24], [80, 40]], [[86, 31], [94, 46]]].map(t),
    thumb: t([[26, 36], [44, 44], [62, 58], [70, 74]]),
    cuff: [[[150, 66], [124, 128]], [[160, 74], [134, 136]]].map(t),
    pencil: t([[0, 0], [9, 4], [74, 58], [68, 66], [4, 9]]),
    tip: t([[0, 0], [9, 4], [4, 9]]),
  };
}

function geometry(p) {
  const head = p.script(-50, 30, -40, 1.8);
  const sub = p.script(-50, 10, -26, 1.1);
  const stub = [p.script(-110, -92, -30, 1), p.script(-110, -96, -16, 1)].flat();
  const terms = [p.script(-50, 4, 22, 1), p.script(-50, -10, 34, 1)].flat();
  const price = p.script(38, 98, 34, 2.6).flat();
  const markText = p.script(-20, 20, 0, 1.6).flat();
  const rest = [150, -160];
  const writer = [rest, ...price, rest];
  const at = [length([rest, price[0]]), length([rest, ...price])].map((d) => (d / length(writer)) * 100);
  return { head, sub, stub, terms, price, markText, writer, at };
}

const G = geometry(pen(21));
const k = (at, dist, ease = 'linear') => `${at} { offset-distance: ${dist.toFixed(1)}%; animation-timing-function: ${ease}; }`;
const MOVE = 'cubic-bezier(.5,0,.3,1)';

export default {
  id: 'sales',
  viewBox: `0 0 ${W} ${H}`,
  // 10 s: the price is written, the stamp comes down, PAID stays, the voucher goes over to the customer
  css: `
    .scene--sales .s-writer { offset-path: path('${poly(G.writer)}'); offset-rotate: 0deg; offset-anchor: 0 0; transform-box: view-box; offset-distance: 100%; animation: sales-writer 10s infinite; }
    .scene--sales .s-price { animation: sales-price 10s linear infinite; }
    .scene--sales .s-stamp { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; animation: sales-stamp 10s infinite; }
    .scene--sales .s-mark { animation: sales-mark 10s linear infinite; }
    .scene--sales .s-voucher { animation: sales-voucher 10s cubic-bezier(.5,0,.3,1) infinite; }
    .scene--sales .s-buyer { animation: sales-buyer 10s cubic-bezier(.5,0,.3,1) infinite; }
    .scene--sales.is-paused * { animation-play-state: paused; }
    .scene--sales.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--sales * { animation: none !important; } }
    @keyframes sales-writer { ${k('0%, 6%', 0, MOVE)} ${k('14%', G.at[0])} ${k('30%', G.at[1], MOVE)} ${k('38%, 100%', 100)} }
    @keyframes sales-price { 0%, 14% { stroke-dashoffset: 1; } 30%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
    @keyframes sales-stamp {
      0%, 37% { transform: translate(230px, -230px) scale(1.25) rotate(14deg); opacity: 0; animation-timing-function: cubic-bezier(.4,0,.2,1); }
      40% { opacity: 1; }
      45% { transform: translate(4px, -8px) scale(1.14) rotate(2deg); animation-timing-function: cubic-bezier(.6,0,1,1); }
      48% { transform: scale(0.97); }
      49.5%, 52% { transform: none; opacity: 1; animation-timing-function: cubic-bezier(.4,0,.2,1); }
      61%, 100% { transform: translate(230px, -230px) scale(1.25) rotate(14deg); opacity: 0; }
    }
    @keyframes sales-mark { 0%, 48% { opacity: 0; } 49.5%, 92% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes sales-voucher { 0%, 64% { transform: none; } 76%, 92% { transform: translate(-16px, 22px) rotate(-3deg); } 100% { transform: none; } }
    @keyframes sales-buyer { 0%, 68% { transform: translate(-150px, 170px); } 80%, 90% { transform: none; } 100% { transform: translate(-150px, 170px); } }
  `,
  draw() {
    const p = pen(21);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const bbox = (pts) => [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
    const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const hand = (a, id, pencil) => {
      const h = handShape(a);
      return `<clipPath id="sales-${id}-sl"><path d="${poly(h.sleeve)}"/></clipPath><clipPath id="sales-${id}-h"><path d="${poly(h.hand)}"/></clipPath>
        ${s(h.sleeve, { closed: true, fill: PAGE, fa: 0.85, a: 0.55, w: 0.9, step: 14 })}
        <g clip-path="url(#sales-${id}-sl)">${p.hatch(...bbox(h.sleeve), 3, a + 0.7, { a: 0.18 })}</g>
        ${s(h.hand, { closed: true, fill: PAGE, fa: 0.92, a: 0.62, w: 0.9, step: 9 })}
        <g clip-path="url(#sales-${id}-h)">${p.hatch(...bbox(h.hand), 3.4, a + 0.6, { a: 0.12 })}</g>
        ${h.knuckles.map((l) => s(l, { a: 0.3, w: 0.7 })).join('')}${s(h.thumb, { a: 0.45, w: 0.8, step: 8 })}
        ${h.cuff.map((l) => s(l, { a: 0.45, w: 0.8 })).join('')}
        ${pencil ? s(h.pencil, { closed: true, fill: PAGE, fa: 1, a: 0.7, w: 0.9, j: 0.3, step: 8 }) + s(h.tip, { closed: true, fill: FG, fa: 0.7, a: 0.7, w: 0.6, j: 0.1, step: 4 }) : ''}`;
    };

    const counter = Array.from({ length: 16 }, (_, i) => {
      const y0 = 8 + i * 29, ph = p.r() * 6;
      return s(Array.from({ length: 41 }, (_, k) => [k * 10 - 4, y0 + Math.sin(k * 0.3 + ph) * 3 + Math.sin(k * 0.13) * 5]), { a: 0.06, w: 0.7, step: 10 });
    });

    // the rubber stamp seen from above: wooden knob on a block, shaded away from the light
    const stamp = `<g transform="translate(${MARK.x} ${MARK.y}) rotate(${MARK.a})"><g class="s-stamp">
      <clipPath id="sales-block"><path d="M-36 -20 H36 V20 H-36 Z"/></clipPath>
      ${s(box(-36, -20, 72, 40), { closed: true, fill: PAGE, fa: 1, a: 0.62, w: 0.9, step: 10 })}
      <g clip-path="url(#sales-block)">${p.hatch(-36, -20, 36, 20, 3, 0.9, { a: 0.14 })}</g>
      ${s(box(-30, -14, 60, 28), { closed: true, a: 0.3, w: 0.7, step: 10 })}
      ${s(ellipse(0, 0, 13, 13, 24), { closed: true, fill: PAGE, fa: 1, a: 0.7, w: 0.9, step: 4, j: 0.2 })}
      <clipPath id="sales-knob"><path d="M-13 0 a13 13 0 0 0 26 0 Z"/></clipPath>
      <g clip-path="url(#sales-knob)">${p.hatch(-14, -2, 14, 14, 2.4, 0.9, { a: 0.3 })}</g>
      ${s([[4, -9], [8, -6], [9, -2]], { a: 0.6, w: 0.8, step: 2, j: 0.1 })}</g></g>`;

    // what the stamp leaves: a double frame in slightly broken ink
    const mark = `<g transform="translate(${MARK.x} ${MARK.y}) rotate(${MARK.a})"><g class="s-mark">
      ${s(box(-34, -18, 68, 36), { closed: true, fill: AMBER, fa: 0.08, c: AMBER, a: 0.9, w: 1.4, step: 8, j: 0.6, attrs: 'stroke-dasharray="9 1.2 14 1.6 6 1"' })}
      ${s(box(-29, -13, 58, 26), { closed: true, c: AMBER, a: 0.7, w: 0.8, step: 8, j: 0.5, attrs: 'stroke-dasharray="7 1.5 11 1"' })}
      ${s(G.markText, { c: AMBER, a: 0.9, w: 1.5, j: 0.3, step: 2.2 })}</g></g>`;

    const voucher = [
      `<clipPath id="sales-shadow"><path d="M-128 -60 L-120 -66 L-120 66 L120 66 L126 76 L-128 76 Z"/></clipPath>`,
      `<g clip-path="url(#sales-shadow)">${p.hatch(-130, -66, 130, 80, 3, 0.9, { a: 0.2 })}</g>`,
      s(box(-120, -66, 240, 132), { closed: true, fill: PAGE, fa: 0.85, a: 0.62, w: 0.9, step: 14 }),
      // an engraved border and the tear-off stub
      s(box(-62, -58, 174, 116), { closed: true, a: 0.22, w: 0.6, step: 16 }),
      s(box(-58, -54, 166, 108), { closed: true, a: 0.14, w: 0.6, step: 16 }),
      s([[-74, -66], [-74, 66]], { a: 0.35, w: 0.8, step: 20, attrs: 'stroke-dasharray="2 4"' }),
      ...G.stub.map((st) => s(st, { a: 0.35, w: 0.7, j: 0.15, step: 2.2 })),
      ...G.head.map((st) => s(st, { a: 0.5, w: 1, j: 0.2, step: 2.2 })),
      ...G.sub.map((st) => s(st, { a: 0.32, w: 0.7, j: 0.15, step: 2.2 })),
      // six sessions, six little boxes
      ...Array.from({ length: 6 }, (_, i) => s(box(-50 + i * 14, -6, 9, 9), { closed: true, a: 0.45, w: 0.7, step: 6, j: 0.3 })),
      ...G.terms.map((st) => s(st, { a: 0.3, w: 0.7, j: 0.15, step: 2.2 })),
      s([[36, 42], [102, 42]], { a: 0.25, w: 0.7, step: 30 }),
      `<path class="s-price" d="${poly(G.price)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${AMBER}" stroke-width="1.5"/>`,
      mark,
      stamp,
      `<g class="s-writer">${hand(-Math.PI / 2, 'a', true)}</g>`,
    ];

    return `<g stroke-linecap="round" stroke-linejoin="round">${counter.join('')}
      <g transform="translate(${VOUCHER.x} ${VOUCHER.y}) rotate(${VOUCHER.a}) scale(${VOUCHER.s})"><g class="s-voucher">${voucher.join('')}</g></g>
      <g transform="translate(118 322)"><g class="s-buyer">${hand(Math.PI / 2 + 0.3, 'b', false)}</g></g></g>`;
  },
};
