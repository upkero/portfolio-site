// Voice card: the host desk of a restaurant on a full evening, seen from above.
// The phone rings, a hand writes the new booking into an almost full book and ticks it. Light falls from the top right.
import { AMBER, FG, PAGE, ellipse, length, pen, poly, quad, rotate } from '../sketch.js';

const W = 400, H = 460;
const BOOK = { x: 196, y: 268, a: -7 };
const HS = { x: 112, y: 92, a: 0.52 };

function geometry(p) {
  // book, in its own coords: spine at 0,0, pages -150..150 by -105..105
  const pageL = [...quad([-150, -96], [-80, -108], [-4, -100]), ...quad([-4, 100], [-80, 106], [-148, 98])];
  const pageR = [...quad([4, -100], [80, -108], [150, -96]), ...quad([148, 98], [80, 106], [4, 100])];
  const rows = (x0) => Array.from({ length: 11 }, (_, i) => ({ x0, y: -72 + i * 15.5 }));
  const left = rows(-138), right = rows(14);
  const NEW = 6;
  const textL = left.map(({ x0, y }) => [...p.script(x0, x0 + 14, y, 1.2), ...p.script(x0 + 22, x0 + 60 + p.r() * 60, y)]);
  const textR = right.slice(0, NEW).map(({ x0, y }) => [...p.script(x0, x0 + 14, y, 1.2), ...p.script(x0 + 22, x0 + 50 + p.r() * 64, y)]);
  const row = right[NEW];
  const booking = p.script(row.x0, row.x0 + 104, row.y, 2.2).flat();
  const tx = booking.at(-1)[0] + 10;
  const tick = [[tx, row.y - 1], [tx + 4, row.y + 4], [tx + 13, row.y - 9]];

  // the hand with a pencil, pencil tip at 0,0, arm going off to the lower right
  const hand = [[16, 10], [30, 8], [52, 18], [82, 26], [112, 40], [150, 66], [180, 92], [150, 150], [120, 126], [96, 110], [70, 96], [52, 76], [40, 52], [26, 36], [20, 22]];
  const sleeve = [[150, 66], [260, 150], [230, 230], [124, 128]];
  const pencil = [[0, 0], [9, 4], [74, 58], [68, 66], [4, 9]];
  const rest = [row.x0 + 118, row.y + 62];
  const handPath = [rest, ...booking, ...tick, rest];
  const legs = [[rest, booking[0]], booking, [booking.at(-1), tick[0]], tick];
  let acc = 0;
  const at = legs.map((l) => ((acc += length(l)) / length(handPath)) * 100);

  // handset off the hook and its coiled cord down the left of the desk
  const handset = rotate([[-82, -10], [-66, -18], [66, -18], [82, -10], [92, 18], [58, 24], [52, 6], [-52, 6], [-58, 24], [-92, 18]], HS.a, HS.x, HS.y);
  const cups = [-74, 74].map((cx) => rotate(ellipse(cx, 14, 14, 5), HS.a, HS.x, HS.y));
  const ear = rotate([[-80, 22]], HS.a, HS.x, HS.y)[0];
  const lead = quad(ear, [-40, 330], [70, 480], 40);
  const cord = Array.from({ length: 321 }, (_, i) => {
    const u = i / 320, k = u * (lead.length - 1), a = Math.min(Math.floor(k), lead.length - 2), t = k - a;
    const ph = u * Math.PI * 2 * 34;
    return [lead[a][0] + (lead[a + 1][0] - lead[a][0]) * t + Math.cos(ph) * 4.5, lead[a][1] + (lead[a + 1][1] - lead[a][1]) * t + Math.sin(ph) * 4.5];
  });
  const bell = [[[96, -30], [104, -42]], [[108, -22], [120, -30]], [[112, -8], [126, -10]]].map((l) => rotate(l, HS.a, HS.x, HS.y));

  return { pageL, pageR, left, right, textL, textR, row, booking, tick, hand, sleeve, pencil, rest, handPath, at, handset, cups, ear, cord, bell };
}

const shake = (a, b) => Array.from({ length: 7 }, (_, i) => `${(a + ((b - a) * i) / 6).toFixed(1)}% { transform: rotate(${i === 6 ? 0 : i % 2 ? -2.6 : 2.6}deg); }`).join(' ');

const G = geometry(pen(3));

export default {
  id: 'voice',
  viewBox: `0 0 ${W} ${H}`,
  // one 10 s story: the phone rings, the hand goes to the empty row, writes the booking, ticks it, rests
  css: `
    .scene--voice .v-ring { transform-box: view-box; transform-origin: ${G.ear[0].toFixed(1)}px ${G.ear[1].toFixed(1)}px; animation: voice-ring 10s linear infinite; }
    .scene--voice .v-bell { opacity: 0; animation: voice-bell 10s linear infinite; }
    .scene--voice .v-hand { offset-path: path('${poly(G.handPath)}'); offset-rotate: 0deg; offset-anchor: 0 0; transform-box: view-box; offset-distance: 100%; animation: voice-hand 10s infinite; }
    .scene--voice .v-ink { animation: voice-ink 10s linear infinite; }
    .scene--voice .v-tick { animation: voice-tick 10s linear infinite; }
    .scene--voice.is-paused * { animation-play-state: paused; }
    .scene--voice.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--voice * { animation: none !important; } }
    @keyframes voice-ring { 0% { transform: none; } ${shake(1, 6)} ${shake(9, 14)} 100% { transform: none; } }
    @keyframes voice-bell { 0%, 1% { opacity: 0; } 2%, 6% { opacity: 1; } 8% { opacity: 0; } 10%, 14% { opacity: 1; } 16%, 100% { opacity: 0; } }
    @keyframes voice-hand {
      0%, 16% { offset-distance: 0%; animation-timing-function: cubic-bezier(.5,0,.3,1); }
      24% { offset-distance: ${G.at[0].toFixed(1)}%; animation-timing-function: linear; }
      64% { offset-distance: ${G.at[1].toFixed(1)}%; animation-timing-function: ease-in-out; }
      67% { offset-distance: ${G.at[2].toFixed(1)}%; animation-timing-function: linear; }
      72% { offset-distance: ${G.at[3].toFixed(1)}%; animation-timing-function: cubic-bezier(.5,0,.3,1); }
      82%, 100% { offset-distance: 100%; }
    }
    @keyframes voice-ink { 0%, 24% { stroke-dashoffset: 1; } 64%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
    @keyframes voice-tick { 0%, 67% { stroke-dashoffset: 1; } 72%, 92% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
  `,
  draw() {
    const p = pen(3);
    geometry(p); // replay the geometry draws so the strokes below get the same jitter on every load
    const s = p.stroke;
    const accent = (cls, pts, w) =>
      `<path class="${cls}" d="${poly(pts)}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${AMBER}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

    const desk = [
      // the faintest wood grain, so the desk has a surface
      ...Array.from({ length: 16 }, (_, i) => {
        const y0 = 8 + i * 29, ph = p.r() * 6;
        return s(Array.from({ length: 41 }, (_, k) => [k * 10 - 4, y0 + Math.sin(k * 0.35 + ph) * 3 + Math.sin(k * 0.11) * 6]), { a: 0.06, w: 0.7, step: 10 });
      }),
      `<g class="v-bell">${G.bell.map((l) => s(l, { c: AMBER, a: 0.9, w: 1.2, step: 6, j: 0.3 })).join('')}</g>`,
      s(G.cord, { a: 0.42, w: 0.8, j: 0.2, step: 2.5 }),
      `<g class="v-ring">`,
      s(G.handset, { closed: true, fill: PAGE, fa: 0.7, a: 0.62, w: 0.9, step: 12 }),
      // the handset is round: shade its lower side, away from the light
      `<clipPath id="voice-hs"><path d="${poly(G.handset)}"/></clipPath>`,
      `<g clip-path="url(#voice-hs)">${p.hatch(40, 40, 200, 160, 3.2, HS.a + 0.9, { a: 0.16 })}</g>`,
      ...G.cups.map((e) => s(e, { a: 0.4, w: 0.7, step: 5, closed: true, j: 0.3 })),
      `</g>`,
    ];

    const book = [
      // cast shadow on the desk, down and left of the book
      `<clipPath id="voice-shadow"><path d="M-160 -90 L-150 -96 L-148 98 L148 98 L150 112 L-160 112 Z"/></clipPath>`,
      `<g clip-path="url(#voice-shadow)">${p.hatch(-170, -100, 160, 120, 3, 0.9, { a: 0.2 })}</g>`,
      s(G.pageL, { closed: true, fill: PAGE, fa: 0.75, a: 0.6, w: 0.9, step: 12 }),
      s(G.pageR, { closed: true, fill: PAGE, fa: 0.5, a: 0.6, w: 0.9, step: 12 }),
      // the left page curves away from the light
      `<clipPath id="voice-left"><path d="${poly(G.pageL)}"/></clipPath>`,
      `<g clip-path="url(#voice-left)">${p.hatch(-150, -110, 0, 110, 5, 1.2, { a: 0.07 })}</g>`,
      s([[0, -100], [0, 100]], { a: 0.3, w: 0.7 }),
      ...[...G.left.map(({ y }) => [[-140, y + 5], [-12, y + 5]]), ...G.right.map(({ y }) => [[12, y + 5], [140, y + 5]])]
        .map((l) => s(l, { a: 0.08, w: 0.6, step: 30, j: 0.4 })),
      ...[...G.textL, ...G.textR].flat().map((st) => s(st, { a: 0.34, w: 0.7, j: 0.2, step: 2.2 })),
      s([[-116, G.left[4].y - 1], [-40, G.left[4].y - 3]], { a: 0.5, w: 0.9, j: 0.8 }),
      s([[-60, -112], [-60, -84], [-52, -78], [-44, -84], [-44, -106], [-50, -110], [-55, -106], [-55, -88]], { a: 0.45, w: 0.9, j: 0.3, step: 4 }),
      accent('v-ink', G.booking, 1.3),
      accent('v-tick', G.tick, 1.5),
      `<g class="v-hand">`,
      s(G.sleeve, { closed: true, fill: PAGE, fa: 0.85, a: 0.55, w: 0.9, step: 14 }),
      `<clipPath id="voice-sleeve"><path d="${poly(G.sleeve)}"/></clipPath>`,
      `<g clip-path="url(#voice-sleeve)">${p.hatch(120, 60, 270, 240, 3, 0.7, { a: 0.18 })}${p.hatch(120, 60, 270, 240, 5, -0.7, { a: 0.1 })}</g>`,
      s(G.hand, { closed: true, fill: PAGE, fa: 0.9, a: 0.62, w: 0.9, step: 9 }),
      `<clipPath id="voice-hand"><path d="${poly(G.hand)}"/></clipPath>`,
      `<g clip-path="url(#voice-hand)">${p.hatch(60, 60, 190, 160, 3.4, 0.6, { a: 0.14 })}</g>`,
      ...[[[54, 20], [62, 34]], [[70, 24], [80, 40]], [[86, 31], [94, 46]]].map((l) => s(l, { a: 0.3, w: 0.7 })),
      s([[26, 36], [44, 44], [62, 58], [70, 74]], { a: 0.45, w: 0.8, step: 8 }),
      ...[[[150, 66], [124, 128]], [[160, 74], [134, 136]]].map((l) => s(l, { a: 0.45, w: 0.8 })),
      s(G.pencil, { closed: true, fill: PAGE, fa: 1, a: 0.7, w: 0.9, j: 0.3, step: 8 }),
      s([[0, 0], [9, 4], [4, 9]], { closed: true, fill: FG, fa: 0.7, a: 0.7, w: 0.6, j: 0.1, step: 4 }),
      `</g>`,
    ];

    return `<g stroke-linecap="round" stroke-linejoin="round">${desk.join('')}
      <g transform="translate(${BOOK.x} ${BOOK.y}) rotate(${BOOK.a})">${book.join('')}</g></g>`;
  },
};
