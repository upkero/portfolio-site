// Sales card: a café table from above, a quote sheet between the seller and the customer.
// The seller strikes the old total, writes the package price and circles it; the customer signs. Light from the top right.
import { AMBER, FG, PAGE, ellipse, length, pen, poly, rotate } from '../sketch.js';

const W = 400, H = 460;
const SHEET = { x: 196, y: 214, a: 4 };

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
  const head = p.script(-90, -24, -128, 1.8);
  const items = [-90, -66, -42].map((y) => [...p.script(-90, -40 + p.r() * 50, y, 1.2), ...p.script(54, 88, y, 1.2)]);
  const totalLabel = p.script(-90, -52, -6, 1.6);
  const oldPrice = p.script(40, 92, -6, 2).flat();
  const strike = [[34, -4], [66, -7], [98, -10]];
  const price = p.script(42, 96, 26, 2.8).flat();
  const ring = ellipse(68, 24, 40, 15, 40).map(([x, y], i) => [x + (i > 36 ? 3 : 0), y - i * 0.08]);
  // a cursive flourish: a point running round a circle while sliding right makes the loops
  const sig = Array.from({ length: 120 }, (_, i) => {
    const t = (i / 119) * Math.PI * 7;
    return [-86 + t * 4 + 9 * Math.cos(t + Math.PI) * (0.7 + 0.3 * Math.sin(t * 0.5)), 106 - 7 * Math.sin(t) - t * 0.35];
  });

  const restA = [150, -160], restB = [-170, 190];
  const seller = [restA, ...strike, ...price, ...ring, restA];
  const buyer = [restB, ...sig, restB];
  const pct = (legs, all) => {
    let acc = 0;
    return legs.map((l) => ((acc += length(l)) / length(all)) * 100);
  };
  const atA = pct([[restA, strike[0]], strike, [strike.at(-1), price[0]], price, [price.at(-1), ring[0]], ring], seller);
  const atB = pct([[restB, sig[0]], sig], buyer);
  return { head, items, totalLabel, oldPrice, strike, price, ring, sig, seller, buyer, atA, atB };
}

const G = geometry(pen(21));
const k = (at, dist, ease) => `${typeof at === 'number' ? `${at}%` : at} { offset-distance: ${dist.toFixed(1)}%;${ease ? ` animation-timing-function: ${ease};` : ''} }`;
const MOVE = 'cubic-bezier(.5,0,.3,1)';

export default {
  id: 'sales',
  viewBox: `0 0 ${W} ${H}`,
  // 10 s: strike the old total, write the price, circle it, then the customer signs
  css: `
    .scene--sales .s-seller, .scene--sales .s-buyer { offset-rotate: 0deg; offset-anchor: 0 0; transform-box: view-box; offset-distance: 100%; }
    .scene--sales .s-seller { offset-path: path('${poly(G.seller)}'); animation: sales-seller 10s infinite; }
    .scene--sales .s-buyer { offset-path: path('${poly(G.buyer)}'); animation: sales-buyer 10s infinite; }
    .scene--sales .s-strike { animation: sales-strike 10s linear infinite; }
    .scene--sales .s-price { animation: sales-price 10s linear infinite; }
    .scene--sales .s-ring { animation: sales-ring 10s linear infinite; }
    .scene--sales .s-sig { animation: sales-sig 10s linear infinite; }
    .scene--sales.is-paused * { animation-play-state: paused; }
    .scene--sales.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--sales * { animation: none !important; } }
    @keyframes sales-seller {
      ${k('0%, 8%', 0, MOVE)} ${k(16, G.atA[0], 'linear')} ${k(22, G.atA[1], MOVE)} ${k(25, G.atA[2], 'linear')}
      ${k(42, G.atA[3], MOVE)} ${k(44, G.atA[4], 'linear')} ${k(52, G.atA[5], MOVE)} ${k('60%, 100%', 100)}
    }
    @keyframes sales-buyer { ${k('0%, 60%', 0, MOVE)} ${k(66, G.atB[0], 'linear')} ${k(80, G.atB[1], MOVE)} ${k('88%, 100%', 100)} }
    ${[['strike', 16, 22], ['price', 25, 42], ['ring', 44, 52], ['sig', 66, 80]].map(([n, a, b]) =>
      `@keyframes sales-${n} { 0%, ${a}% { stroke-dashoffset: 1; } ${b}%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }`).join('\n    ')}
  `,
  draw() {
    const p = pen(21);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const ink = (cls, pts, c, w) =>
      `<path class="${cls}" d="${poly(pts)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${c}" stroke-width="${w}"/>`;
    const bbox = (pts) => [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
    const writer = (cls, a, id) => {
      const h = handShape(a);
      return `<g class="${cls}"><clipPath id="sales-${id}-sl"><path d="${poly(h.sleeve)}"/></clipPath><clipPath id="sales-${id}-h"><path d="${poly(h.hand)}"/></clipPath>
        ${s(h.sleeve, { closed: true, fill: PAGE, fa: 0.85, a: 0.55, w: 0.9, step: 14 })}
        <g clip-path="url(#sales-${id}-sl)">${p.hatch(...bbox(h.sleeve), 3, a + 0.7, { a: 0.18 })}</g>
        ${s(h.hand, { closed: true, fill: PAGE, fa: 0.9, a: 0.62, w: 0.9, step: 9 })}
        <g clip-path="url(#sales-${id}-h)">${p.hatch(...bbox(h.hand), 3.4, a + 0.6, { a: 0.12 })}</g>
        ${h.knuckles.map((l) => s(l, { a: 0.3, w: 0.7 })).join('')}${s(h.thumb, { a: 0.45, w: 0.8, step: 8 })}
        ${h.cuff.map((l) => s(l, { a: 0.45, w: 0.8 })).join('')}
        ${s(h.pencil, { closed: true, fill: PAGE, fa: 1, a: 0.7, w: 0.9, j: 0.3, step: 8 })}
        ${s(h.tip, { closed: true, fill: FG, fa: 0.7, a: 0.7, w: 0.6, j: 0.1, step: 4 })}</g>`;
    };

    const table = [
      ...Array.from({ length: 16 }, (_, i) => {
        const y0 = 8 + i * 29, ph = p.r() * 6;
        return s(Array.from({ length: 41 }, (_, k) => [k * 10 - 4, y0 + Math.sin(k * 0.3 + ph) * 3 + Math.sin(k * 0.13) * 5]), { a: 0.06, w: 0.7, step: 10 });
      }),
      // the customer's coffee: saucer, cup off centre, the coffee as tone, a spoon
      `<clipPath id="sales-saucer-sh"><path d="M262 392 a44 44 0 0 0 76 30 l10 6 a52 52 0 0 1 -96 -30 Z"/></clipPath>`,
      `<g clip-path="url(#sales-saucer-sh)">${p.hatch(240, 380, 360, 450, 3, 0.9, { a: 0.22 })}</g>`,
      s(ellipse(306, 398, 44, 44, 40), { closed: true, fill: PAGE, fa: 0.6, a: 0.5, w: 0.8, step: 8, j: 0.4 }),
      s(ellipse(300, 394, 27, 27, 32), { closed: true, fill: PAGE, fa: 0.9, a: 0.62, w: 0.9, step: 6, j: 0.3 }),
      `<clipPath id="sales-coffee"><circle cx="300" cy="394" r="22"/></clipPath>`,
      `<g clip-path="url(#sales-coffee)">${p.hatch(276, 370, 324, 418, 2.4, -0.7, { a: 0.3 })}${p.hatch(276, 370, 324, 418, 3.6, 0.8, { a: 0.16 })}</g>`,
      s([[327, 390], [338, 386], [342, 394], [336, 401], [326, 400]], { a: 0.55, w: 0.9, step: 4, j: 0.3 }),
      s([[262, 430], [280, 418]], { a: 0.5, w: 1.1, j: 0.3 }),
      s(ellipse(255, 435, 7, 4.5, 16).map(([x, y]) => rotate([[x - 255, y - 435]], -0.6, 255, 435)[0]), { closed: true, a: 0.5, w: 0.8, step: 3, j: 0.2 }),
    ];

    const sheet = [
      `<clipPath id="sales-shadow"><path d="M-122 -142 L-110 -150 L-110 150 L110 150 L116 162 L-122 162 Z"/></clipPath>`,
      `<g clip-path="url(#sales-shadow)">${p.hatch(-130, -150, 130, 170, 3, 0.9, { a: 0.2 })}</g>`,
      s([[-110, -150], [110, -150], [110, 150], [-110, 150]], { closed: true, fill: PAGE, fa: 0.55, a: 0.6, w: 0.9, step: 14 }),
      ...G.head.map((st) => s(st, { a: 0.45, w: 0.9, j: 0.2, step: 2.2 })),
      s([[-92, -112], [92, -112]], { a: 0.2, w: 0.7, step: 30 }),
      ...G.items.flat().map((st) => s(st, { a: 0.34, w: 0.7, j: 0.2, step: 2.2 })),
      // dotted leaders between each item and its price
      ...[-90, -66, -42].map((y) => s([[0, y + 3], [46, y + 3]], { a: 0.18, w: 0.7, step: 30, attrs: 'stroke-dasharray="1 4"' })),
      s([[-92, -26], [92, -26]], { a: 0.2, w: 0.7, step: 30 }),
      ...G.totalLabel.map((st) => s(st, { a: 0.45, w: 0.8, j: 0.2, step: 2.2 })),
      s(G.oldPrice, { a: 0.5, w: 0.9, j: 0.2, step: 2.2 }),
      s([[-92, 116], [36, 116]], { a: 0.25, w: 0.7, step: 30 }),
      s([[-96, 108], [-90, 114]], { a: 0.35, w: 0.7, step: 4 }), s([[-90, 108], [-96, 114]], { a: 0.35, w: 0.7, step: 4 }),
      ink('s-strike', G.strike, FG, 1.1),
      ink('s-price', G.price, AMBER, 1.4),
      ink('s-ring', G.ring, AMBER, 1.2),
      ink('s-sig', G.sig, FG, 0.9),
      writer('s-buyer', Math.PI / 2, 'b'),
      writer('s-seller', -Math.PI / 2, 'a'),
    ];

    return `<g stroke-linecap="round" stroke-linejoin="round">${table.join('')}
      <g transform="translate(${SHEET.x} ${SHEET.y}) rotate(${SHEET.a})">${sheet.join('')}</g></g>`;
  },
};
