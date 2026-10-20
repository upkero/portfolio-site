// Ops core card: the ticket rail on the kitchen wall, the one place every booking ends up.
// Tickets from the phone, the chat and the staff are clipped on in time order; a second ticket for a taken slot is crumpled
// and lands on the pass below, next to the service bell.
import { AMBER, FG, PAGE, pen, poly } from '../sketch.js';

const RAIL = 150;
const SHELF = 392;
const TW = 28, TH = 124; // half width, height of a ticket
// where each ticket came from, drawn small in its header
const GLYPH = {
  phone: [[-6, -2], [-3, -4], [3, -4], [6, -2], [6, 2], [3, 2], [3, 0], [-3, 0], [-3, 2], [-6, 2]],
  chat: [[-6, -5], [6, -5], [6, 2], [0, 2], [-3, 5], [-3, 2], [-6, 2]],
  staff: [[-5, 5], [4, -4], [6, -2], [-3, 7], [-6, 7]],
};
const HUNG = [
  { x: 52, a: -2, from: 'phone' },
  { x: 114, a: 1.5, from: 'staff' },
  { x: 176, a: -1, from: 'chat' },
];
const NEW = [
  { x: 238, a: 1, from: 'phone', cls: 'c-t1' },
  { x: 300, a: -1.5, from: 'chat', cls: 'c-t2', amber: true },
];
const DUP = { x: 300, a: -1.5, from: 'staff', cls: 'c-dup' };

function geometry(p) {
  const ticket = () => ({
    time: p.script(-6, 20, 18, 1.4),
    lines: Array.from({ length: 6 }, (_, i) => p.script(-20, -2 + p.r() * 20, 40 + i * 11, 0.9)),
    total: p.script(4, 20, TH - 18, 1.1),
  });
  const tickets = [...HUNG, ...NEW, DUP].map(ticket);
  // a crumpled ticket: an uneven ball with a few creases
  const ball = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2, rr = 13 + p.r() * 5;
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  const creases = Array.from({ length: 4 }, () => [[(p.r() - 0.5) * 18, (p.r() - 0.5) * 18], [(p.r() - 0.5) * 22, (p.r() - 0.5) * 22], [(p.r() - 0.5) * 18, (p.r() - 0.5) * 18]]);
  return { tickets, ball, creases };
}

const G = geometry(pen(33));
const arrive = (name, from, a, b) => `@keyframes core-${name} {
      0%, ${a}% { transform: ${from}; opacity: 0; animation-timing-function: cubic-bezier(.3,.7,.3,1); }
      ${a + 2}% { opacity: 1; }
      ${b}% { transform: translate(0, -5px) rotate(-1.5deg); animation-timing-function: ease-out; }
      ${b + 3}%, 92% { transform: none; opacity: 1; }
      100% { transform: none; opacity: 0; }
    }`;

export default {
  id: 'core',
  // cropped in a little on the rail and the pass, same 4:4.6 shape as the card
  viewBox: '16 66 368 423',
  // 10 s: a phone booking and a chat booking go up on the rail; a staff ticket for the chat's slot bumps it and is crumpled
  css: `
    .scene--core .c-t1, .scene--core .c-t2, .scene--core .c-dup, .scene--core .c-ball { transform-box: fill-box; transform-origin: 50% 0; }
    .scene--core .c-t1 { animation: core-t1 10s infinite; }
    .scene--core .c-t2 { animation: core-t2 10s infinite; }
    .scene--core .c-t2 > g { transform-box: fill-box; transform-origin: 50% 0; animation: core-nudge 10s ease-in-out infinite; }
    .scene--core .c-dup { opacity: 0; animation: core-dup 10s infinite; }
    .scene--core .c-ball { opacity: 0; transform-origin: 50% 50%; animation: core-ball 10s infinite; }
    .scene--core.is-paused * { animation-play-state: paused; }
    .scene--core.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--core * { animation: none !important; } }
    ${arrive('t1', 'translate(-190px, 340px) rotate(-24deg)', 6, 18)}
    ${arrive('t2', 'translate(70px, 350px) rotate(22deg)', 24, 36)}
    @keyframes core-dup {
      0%, 46% { transform: translate(120px, 340px) rotate(26deg); opacity: 0; animation-timing-function: cubic-bezier(.3,.7,.3,1); }
      48% { opacity: 1; }
      56% { transform: translate(10px, 26px) rotate(5deg); animation-timing-function: ease-in; }
      58% { transform: translate(16px, 30px) rotate(9deg); opacity: 1; }
      60%, 100% { transform: translate(16px, 60px) rotate(9deg) scale(0.4, 0.2); opacity: 0; }
    }
    @keyframes core-nudge { 0%, 55.5% { transform: none; } 57% { transform: rotate(-3deg); } 59% { transform: rotate(1.5deg); } 61%, 100% { transform: none; } }
    @keyframes core-ball {
      0%, 59% { transform: translate(18px, 0); opacity: 0; }
      60% { transform: translate(18px, 0) rotate(0deg); opacity: 1; animation-timing-function: cubic-bezier(.5,0,1,1); }
      69% { transform: translate(18px, ${SHELF - RAIL - 74}px) rotate(140deg); animation-timing-function: ease-out; }
      72% { transform: translate(30px, ${SHELF - RAIL - 84}px) rotate(190deg); animation-timing-function: ease-in; }
      75% { transform: translate(40px, ${SHELF - RAIL - 74}px) rotate(220deg); animation-timing-function: ease-out; }
      80%, 92% { transform: translate(52px, ${SHELF - RAIL - 74}px) rotate(250deg); opacity: 1; }
      100% { transform: translate(52px, ${SHELF - RAIL - 74}px) rotate(250deg); opacity: 0; }
    }
  `,
  draw() {
    const p = pen(33);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const zig = Array.from({ length: 8 }, (_, i) => [TW - i * (TW * 2 / 7), TH + (i % 2 ? 0 : 5)]);
    const outline = [[-TW, 0], [TW, 0], ...zig];

    const ticket = (t, g, { amber = false, dashed = false } = {}) => {
      const c = amber ? AMBER : FG;
      const ink = { c, a: amber ? 0.85 : 0.34, w: 0.7, j: 0.15, step: 2.2 };
      return `<clipPath id="core-sh-${t.x}${t.cls || ''}"><path d="M${-TW - 7} 6 L${-TW} 0 L${-TW} ${TH} L${TW} ${TH} L${TW - 5} ${TH + 8} L${-TW - 7} ${TH + 8} Z"/></clipPath>
        <g clip-path="url(#core-sh-${t.x}${t.cls || ''})">${p.hatch(-TW - 8, 0, TW, TH + 10, 3, 0.9, { a: 0.2 })}</g>
        ${s(outline, { closed: true, fill: PAGE, fa: 1, c, a: amber ? 0.95 : 0.6, w: amber ? 1.2 : 0.9, step: 12, attrs: dashed ? 'stroke-dasharray="5 3"' : '' })}
        <g transform="translate(-16 18)">${s(GLYPH[t.from], { closed: t.from !== 'staff', c, a: amber ? 0.95 : 0.55, w: 0.9, step: 3, j: 0.2 })}</g>
        ${g.time.map((st) => s(st, { ...ink, a: amber ? 0.95 : 0.55, w: 1.1 })).join('')}
        ${s([[-TW + 6, 28], [TW - 6, 28]], { c, a: amber ? 0.5 : 0.2, w: 0.7, step: 20 })}
        ${g.lines.flat().map((st) => s(st, ink)).join('')}
        ${s([[-TW + 6, TH - 28], [TW - 6, TH - 28]], { c, a: amber ? 0.4 : 0.16, w: 0.6, step: 20, attrs: 'stroke-dasharray="2 3"' })}
        ${g.total.map((st) => s(st, { ...ink, a: amber ? 0.95 : 0.5, w: 1 })).join('')}`;
    };
    const hang = (t, body) => `<g transform="translate(${t.x} ${RAIL - 12}) rotate(${t.a})">${body}</g>`;

    // the wall: faint subway tiles
    const wall = [];
    for (let r = 0; r < 24; r++) {
      wall.push(s([[0, r * 20], [400, r * 20]], { a: 0.045, w: 0.6, step: 40 }));
      for (let x = (r % 2) * 20; x < 400; x += 40) wall.push(s([[x, r * 20], [x, r * 20 + 20]], { a: 0.045, w: 0.6, step: 20 }));
    }

    const rail = [
      `<clipPath id="core-rail"><path d="M14 ${RAIL - 7} H386 V${RAIL + 7} H14 Z"/></clipPath>`,
      s([[14, RAIL - 7], [386, RAIL - 7], [386, RAIL + 7], [14, RAIL + 7]], { closed: true, fill: PAGE, fa: 1, a: 0.65, w: 0.9, step: 20 }),
      // a steel bar, round: dark underside, one bright line where the light catches it
      `<g clip-path="url(#core-rail)">${p.hatch(14, RAIL, 386, RAIL + 7, 2, 0.12, { a: 0.3 })}</g>`,
      s([[18, RAIL - 4], [382, RAIL - 4]], { a: 0.5, w: 0.6, step: 30 }),
      ...[30, 370].map((x) => s([[x - 7, RAIL - 16], [x + 7, RAIL - 16], [x + 7, RAIL + 12], [x - 7, RAIL + 12]], { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 8 }) +
        s([[x - 2, RAIL - 10], [x + 2, RAIL - 10], [x + 2, RAIL - 6], [x - 2, RAIL - 6]], { closed: true, a: 0.5, w: 0.7, step: 2, j: 0.1 })),
    ];

    // the pass below the rail, and its service bell
    const pass = [
      s([[0, SHELF], [400, SHELF], [400, SHELF + 12], [0, SHELF + 12]], { closed: true, fill: PAGE, fa: 1, a: 0.55, w: 0.9, step: 20 }),
      `<clipPath id="core-pass"><path d="M0 ${SHELF} H400 V${SHELF + 12} H0 Z"/></clipPath><g clip-path="url(#core-pass)">${p.hatch(0, SHELF, 400, SHELF + 12, 2.6, 1.2, { a: 0.22 })}</g>`,
      s([[40, SHELF - 6], [104, SHELF - 6], [106, SHELF], [38, SHELF]], { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 8 }),
      s([[46, SHELF - 6], [48, SHELF - 20], [58, SHELF - 30], [72, SHELF - 33], [86, SHELF - 30], [96, SHELF - 20], [98, SHELF - 6]], { closed: true, fill: PAGE, fa: 1, a: 0.65, w: 0.9, step: 4, j: 0.3 }),
      `<clipPath id="core-bell"><path d="M46 ${SHELF - 6} L48 ${SHELF - 20} L58 ${SHELF - 30} L72 ${SHELF - 33} L72 ${SHELF - 6} Z"/></clipPath><g clip-path="url(#core-bell)">${p.hatch(40, SHELF - 36, 74, SHELF - 4, 2.2, 0.9, { a: 0.26 })}</g>`,
      s([[82, SHELF - 27], [90, SHELF - 21], [93, SHELF - 14]], { a: 0.6, w: 0.8, step: 3, j: 0.1 }),
      s([[69, SHELF - 33], [69, SHELF - 39], [75, SHELF - 39], [75, SHELF - 33]], { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.8, step: 3, j: 0.1 }),
    ];
    const n = HUNG.length;
    const hung = HUNG.map((t, i) => hang(t, ticket(t, G.tickets[i])));
    const fresh = NEW.map((t, i) => hang(t, `<g class="${t.cls}"><g>${ticket(t, G.tickets[n + i], { amber: t.amber })}</g></g>`));
    const dup = hang(DUP, `<g class="c-dup">${ticket(DUP, G.tickets[n + NEW.length], { dashed: true })}</g>
      <g transform="translate(0 70)"><g class="c-ball">
        ${s(G.ball, { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 4, j: 0.6 })}
        <clipPath id="core-ball"><path d="${poly(G.ball)}"/></clipPath><g clip-path="url(#core-ball)">${p.hatch(-20, 0, 20, 20, 2.4, 0.9, { a: 0.25 })}</g>
        ${G.creases.map((c) => s(c, { a: 0.4, w: 0.7, step: 4, j: 0.5 })).join('')}</g></g>`);

    return `<g stroke-linecap="round" stroke-linejoin="round">${wall.join('')}${pass.join('')}${hung.join('')}${fresh.join('')}${dup}${rail.join('')}</g>`;
  },
};
