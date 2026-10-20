// Ops core card: the card-index cabinet in the back office, where slots, customers, prices and documents are kept.
// Drawers open in turn and a card is filed in each, the price card in amber; a second card for the full slots drawer pops back out.
import { AMBER, FG, PAGE, ellipse, pen } from '../sketch.js';

const W = 400, H = 460;
// index cards are a shade lighter than the cabinet, so they read as paper against the wood
const CARD = '#1b1c18';
const X0 = 62, Y0 = 70, DW = 136, DH = 66, GAP = 8;
const drawer = (c, r) => ({ x: X0 + c * (DW + GAP), y: Y0 + r * (DH + GAP) });
// small drawings on the label holders, in a 30 x 16 box
const ICONS = {
  slots: [[[-9, -6], [9, -6], [9, 6], [-9, 6]], [[-9, -2], [9, -2]], [[-3, -6], [-3, 6]], [[3, -6], [3, 6]]],
  people: [[[-2, -5], [2, -5], [3, -2], [0, 0], [-3, -2]], [[-6, 6], [-4, 2], [0, 1], [4, 2], [6, 6]]],
  prices: [[[-9, 0], [-4, -6], [9, -6], [9, 6], [-4, 6]], [[-4, -1], [-3, 1]]],
  pages: [[[-6, -7], [3, -7], [7, -3], [7, 7], [-6, 7]], [[3, -7], [3, -3], [7, -3]], [[-3, 0], [4, 0]], [[-3, 3], [3, 3]]],
  mail: [[[-9, -5], [9, -5], [9, 5], [-9, 5]], [[-9, -5], [0, 1], [9, -5]]],
  clock: [ellipse(0, 0, 6.5, 6.5, 16), [[0, -4], [0, 0], [3, 2]]],
  keys: [ellipse(-4, 0, 4, 4, 12), [[0, 0], [9, 0], [9, 3]], [[6, 0], [6, 3]]],
  phone: [[[-6, -2], [-3, -4], [3, -4], [6, -2], [6, 2], [3, 2], [3, 0], [-3, 0], [-3, 2], [-6, 2]]],
};
// which drawer holds what; the three that open are listed last so they draw over their neighbours when pulled out
const DRAWERS = [
  { c: 1, r: 0, icon: 'mail' }, { c: 0, r: 0, icon: 'clock' }, { c: 0, r: 2, icon: 'keys' }, { c: 1, r: 3, icon: 'phone' },
  { c: 1, r: 2, icon: 'pages' },
  { c: 0, r: 1, icon: 'slots', id: 'a' }, { c: 1, r: 1, icon: 'people', id: 'b' }, { c: 0, r: 3, icon: 'prices', id: 'c' },
];

function geometry(p) {
  const card = () => Array.from({ length: 3 }, (_, i) => p.script(-22, -4 + p.r() * 22, -6 + i * 7, 0.8));
  return { cards: { a: card(), b: card(), c: card(), d: card() } };
}

const G = geometry(pen(33));
// a drawer comes out towards us: the front drops and grows a little, the inside with its cards shows above it
const open = (id, a, b) => `@keyframes core-front-${id} { 0%, ${a}% { transform: none; animation-timing-function: cubic-bezier(.3,.7,.3,1); } ${a + 5}%, ${b}% { transform: translate(0, 9px) scale(1.05); animation-timing-function: cubic-bezier(.5,0,.3,1); } ${b + 5}%, 100% { transform: none; } }
    @keyframes core-in-${id} { 0%, ${a}% { transform: scaleY(0); animation-timing-function: cubic-bezier(.3,.7,.3,1); } ${a + 5}%, ${b}% { transform: translate(0, 9px) scaleY(1); animation-timing-function: cubic-bezier(.5,0,.3,1); } ${b + 5}%, 100% { transform: scaleY(0); } }`;
const file = (id, a) => `@keyframes core-card-${id} {
      0%, ${a}% { transform: translate(14px, -230px) rotate(-14deg); opacity: 0; animation-timing-function: cubic-bezier(.3,.7,.3,1); }
      ${a + 2}% { opacity: 1; }
      ${a + 6}% { transform: translate(0, -44px) rotate(1deg); animation-timing-function: cubic-bezier(.6,0,.9,.5); }
      ${a + 9}%, 100% { transform: translate(0, 30px); opacity: 1; }
    }`;

export default {
  id: 'core',
  viewBox: `0 0 ${W} ${H}`,
  // 10 s: slots, customers, then the price card in amber are filed; a second slots card is refused
  css: `
    .scene--core [class^='k-front'], .scene--core [class^='k-in'], .scene--core [class^='k-card'] { transform-box: fill-box; }
    .scene--core [class^='k-front'] { transform-origin: 50% 0; }
    .scene--core [class^='k-in'] { transform-origin: 50% 100%; transform: scaleY(0); }
    .scene--core [class^='k-card'] { transform-origin: 50% 50%; opacity: 0; }
    .scene--core .k-front-a { animation: core-front-a 10s infinite; } .scene--core .k-in-a { animation: core-in-a 10s infinite; }
    .scene--core .k-front-b { animation: core-front-b 10s infinite; } .scene--core .k-in-b { animation: core-in-b 10s infinite; }
    .scene--core .k-front-c { animation: core-front-c 10s infinite; } .scene--core .k-in-c { animation: core-in-c 10s infinite; }
    .scene--core .k-card-a { animation: core-card-a 10s infinite; }
    .scene--core .k-card-b { animation: core-card-b 10s infinite; }
    .scene--core .k-card-c { animation: core-card-c 10s infinite; }
    .scene--core .k-card-d { animation: core-card-d 10s infinite; }
    .scene--core .k-label-c { opacity: 0; animation: core-label 10s linear infinite; }
    .scene--core.is-paused * { animation-play-state: paused; }
    .scene--core.is-still * { animation: none; }
    .scene--core.is-still .k-label-c { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { .scene--core * { animation: none !important; } .scene--core .k-label-c { opacity: 1; } }
    @keyframes core-front-a { 0%, 4% { transform: none; animation-timing-function: cubic-bezier(.3,.7,.3,1); } 9%, 20% { transform: translate(0, 9px) scale(1.05); animation-timing-function: cubic-bezier(.5,0,.3,1); } 25%, 64% { transform: none; animation-timing-function: cubic-bezier(.3,.7,.3,1); } 69%, 84% { transform: translate(0, 9px) scale(1.05); animation-timing-function: cubic-bezier(.5,0,.3,1); } 89%, 100% { transform: none; } }
    @keyframes core-in-a { 0%, 4% { transform: scaleY(0); animation-timing-function: cubic-bezier(.3,.7,.3,1); } 9%, 20% { transform: translate(0, 9px) scaleY(1); animation-timing-function: cubic-bezier(.5,0,.3,1); } 25%, 64% { transform: scaleY(0); animation-timing-function: cubic-bezier(.3,.7,.3,1); } 69%, 84% { transform: translate(0, 9px) scaleY(1); animation-timing-function: cubic-bezier(.5,0,.3,1); } 89%, 100% { transform: scaleY(0); } }
    ${open('b', 24, 40)}
    ${open('c', 44, 60)}
    ${file('a', 9)} ${file('b', 29)} ${file('c', 49)}
    @keyframes core-card-d {
      0%, 69% { transform: translate(14px, -230px) rotate(-14deg); opacity: 0; animation-timing-function: cubic-bezier(.3,.7,.3,1); }
      71% { opacity: 1; }
      75% { transform: translate(0, -44px) rotate(1deg); animation-timing-function: cubic-bezier(.6,0,.9,.5); }
      77% { transform: translate(0, -4px); animation-timing-function: cubic-bezier(.2,.6,.4,1); }
      80% { transform: translate(18px, -60px) rotate(16deg); animation-timing-function: cubic-bezier(.6,0,1,1); }
      88%, 100% { transform: translate(120px, 260px) rotate(70deg); opacity: 0; }
    }
    @keyframes core-label { 0%, 57% { opacity: 0; } 60%, 92% { opacity: 1; } 100% { opacity: 0; } }
  `,
  draw() {
    const p = pen(33);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

    const room = [
      // a plain wall and the floorboards it stands on
      s([[0, 420], [400, 420]], { a: 0.35, w: 0.8, step: 30 }),
      ...Array.from({ length: 4 }, (_, i) => s([[0, 428 + i * 9], [400, 428 + i * 9]], { a: 0.07, w: 0.6, step: 40 })),
      `<clipPath id="core-floor-sh"><path d="M40 420 H352 L344 434 H32 Z"/></clipPath><g clip-path="url(#core-floor-sh)">${p.hatch(28, 420, 356, 436, 2.6, 0.9, { a: 0.22 })}</g>`,
    ];

    // the cabinet body, its top and plinth, shaded on the left, away from the light
    const xR = X0 + 2 * DW + GAP, yB = Y0 + 4 * DH + 3 * GAP;
    const cabinet = [
      s(box(X0 - 12, Y0 - 22, xR - X0 + 24, yB - Y0 + 34), { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 16 }),
      s(box(X0 - 18, Y0 - 32, xR - X0 + 36, 12), { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 16 }),
      `<clipPath id="core-side"><path d="M${X0 - 12} ${Y0 - 22} H${X0 - 4} V${yB + 12} H${X0 - 12} Z"/></clipPath><g clip-path="url(#core-side)">${p.hatch(X0 - 14, Y0 - 24, X0, yB + 14, 2.4, 0.9, { a: 0.3 })}</g>`,
      `<clipPath id="core-top"><path d="M${X0 - 18} ${Y0 - 24} H${xR + 18} V${Y0 - 20} H${X0 - 18} Z"/></clipPath><g clip-path="url(#core-top)">${p.hatch(X0 - 18, Y0 - 26, xR + 18, Y0 - 18, 2.2, 0.2, { a: 0.3 })}</g>`,
      s(box(X0 - 6, yB + 12, xR - X0 + 12, 8), { closed: true, fill: PAGE, fa: 1, a: 0.5, w: 0.8, step: 16 }),
      ...[X0 + 2, xR - 10].map((x) => s(box(x, yB + 20, 8, 400 - yB), { closed: true, fill: PAGE, fa: 1, a: 0.5, w: 0.8, step: 8 })),
    ];

    const icon = (name, c, a) => ICONS[name].map((l) => s(l, { c, a, w: 0.8, step: 3, j: 0.15 })).join('');
    const front = ({ x, y }, d) => [
      s(box(x, y, DW, DH), { closed: true, fill: PAGE, fa: 1, a: 0.55, w: 0.9, step: 14 }),
      // a thin shadow along the bottom edge of each front
      s([[x + 3, y + DH - 2], [x + DW - 3, y + DH - 2]], { a: 0.2, w: 0.6, step: 30 }),
      s(box(x + DW / 2 - 22, y + 10, 44, 22), { closed: true, a: 0.5, w: 0.8, step: 6, j: 0.25 }),
      `<g transform="translate(${x + DW / 2} ${y + 21})">${icon(d.icon, FG, 0.5)}</g>`,
      d.id === 'c' ? `<g class="k-label-c">${s(box(x + DW / 2 - 22, y + 10, 44, 22), { closed: true, c: AMBER, a: 0.95, w: 1.1, step: 6, j: 0.25 })}<g transform="translate(${x + DW / 2} ${y + 21})">${icon(d.icon, AMBER, 0.95)}</g></g>` : '',
      // the pull: a little cup handle
      s([[x + DW / 2 - 13, y + 44], [x + DW / 2 - 11, y + 52], [x + DW / 2 + 11, y + 52], [x + DW / 2 + 13, y + 44]], { a: 0.6, w: 0.9, step: 4, j: 0.2 }),
      s([[x + DW / 2 - 13, y + 44], [x + DW / 2 + 13, y + 44]], { a: 0.4, w: 0.8, step: 8 }),
    ].join('');
    // the drawer's inside seen from slightly above: its walls and the tops of the cards standing in it
    const inside = ({ x, y }) => [
      s([[x + 2, y], [x + 10, y - 20], [x + DW - 10, y - 20], [x + DW - 2, y]], { closed: true, fill: PAGE, fa: 1, a: 0.5, w: 0.8, step: 10 }),
      ...Array.from({ length: 6 }, (_, i) => s([[x + 12 + i * 1.6, y - 17 + i * 3], [x + DW - 12 - i * 1.6, y - 17 + i * 3]], { a: 0.32 - i * 0.03, w: 0.7, step: 20 })),
      s([[x + 30, y - 17], [x + 30, y - 21], [x + 46, y - 21], [x + 46, y - 17]], { a: 0.35, w: 0.7, step: 4 }),
    ].join('');
    const card = (lines, amber) => {
      const c = amber ? AMBER : FG;
      return [
        s([[-30, -20], [-14, -20], [-14, -25], [2, -25], [2, -20], [30, -20], [30, 20], [-30, 20]], { closed: true, fill: CARD, fa: 1, c, a: amber ? 0.95 : 0.8, w: amber ? 1.2 : 1, step: 8 }),
        ...lines.flat().map((st) => s(st, { c, a: amber ? 0.9 : 0.55, w: 0.7, j: 0.15, step: 2.2 })),
      ].join('');
    };

    const drawers = DRAWERS.map((d) => {
      const at = drawer(d.c, d.r);
      if (!d.id) return front(at, d);
      // the card goes behind the front: it sits under it in the markup
      const cards = [`<g transform="translate(${at.x + DW / 2} ${at.y})"><g class="k-card-${d.id}">${card(G.cards[d.id], d.id === 'c')}</g></g>`];
      if (d.id === 'a') cards.push(`<g transform="translate(${at.x + DW / 2} ${at.y})"><g class="k-card-d">${card(G.cards.d, false)}</g></g>`);
      return `<g class="k-in-${d.id}">${inside(at)}</g>${cards.join('')}<g class="k-front-${d.id}">${front(at, d)}</g>`;
    });

    return `<g stroke-linecap="round" stroke-linejoin="round">${room.join('')}${cabinet.join('')}${drawers.join('')}</g>`;
  },
};
