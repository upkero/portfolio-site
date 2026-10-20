// "Need something like this?" card: a letter going into an envelope, the flap folded down, an amber seal pressed on.
import { AMBER, PAGE, ellipse, pen, poly } from '../sketch.js';

const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// the envelope in its own coords: body -100..100 by -26..74, the flap hinged on its top edge
const TOP = -26;

function geometry(p) {
  const letterLines = [-78, -64, -50, -36, -22, -8].map((y, i) => [[-54, y], [i === 5 ? 0 : 46 - p.r() * 20, y]]);
  const line = p.script(-54, -6, -92, 1.6).flat();
  return { letterLines, line };
}

const G = geometry(pen(12));

export default {
  id: 'cta',
  viewBox: '-130 -150 260 250',
  // 10 s: the letter goes in, the open flap folds away, the closed flap comes down, the seal is pressed on
  css: `
    .scene--cta .c-all { animation: cta-all 10s linear infinite; }
    .scene--cta .c-letter { transform: translate(0, 92px); animation: cta-letter 10s cubic-bezier(.5,0,.3,1) infinite; }
    .scene--cta .c-open, .scene--cta .c-shut { transform-box: view-box; transform-origin: 0 ${TOP}px; }
    .scene--cta .c-open { transform: scaleY(0); animation: cta-open 10s cubic-bezier(.5,0,.9,.6) infinite; }
    .scene--cta .c-shut { animation: cta-shut 10s cubic-bezier(.1,.4,.5,1) infinite; }
    .scene--cta .c-seal { transform-box: fill-box; transform-origin: 50% 50%; animation: cta-seal 10s cubic-bezier(.3,.7,.3,1) infinite; }
    .scene--cta.is-paused * { animation-play-state: paused; }
    .scene--cta.is-still * { animation: none; }
    @media (prefers-reduced-motion: reduce) { .scene--cta * { animation: none !important; } }
    @keyframes cta-all { 0% { opacity: 0; } 3%, 92% { opacity: 1; } 97%, 100% { opacity: 0; } }
    @keyframes cta-letter { 0%, 8% { transform: none; } 30%, 100% { transform: translate(0, 92px); } }
    @keyframes cta-open { 0%, 32% { transform: none; } 38%, 100% { transform: scaleY(0); } }
    @keyframes cta-shut { 0%, 38% { transform: scaleY(0); } 44%, 100% { transform: none; } }
    @keyframes cta-seal { 0%, 46% { transform: scale(1.8); opacity: 0; } 49% { transform: scale(0.92); opacity: 1; } 51%, 100% { transform: none; opacity: 1; } }
  `,
  draw() {
    const p = pen(12);
    geometry(p); // same seed, same order: the strokes below get the same jitter on every load
    const s = p.stroke;
    const flapOpen = [[-100, TOP], [0, TOP - 56], [100, TOP]];
    const flapShut = [[-100, TOP], [0, 30], [100, TOP]];
    // the front pocket: everything but the opening at the top, so the letter shows above it and goes in behind it
    const pocket = [[-100, TOP], [0, 30], [100, TOP], [100, 74], [-100, 74]];
    return `<g stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(-8)"><g class="c-all">
      <clipPath id="cta-sh"><path d="M-100 ${TOP} L-110 ${TOP + 8} L-110 84 L92 84 L100 74 L-100 74 Z"/></clipPath>
      <g clip-path="url(#cta-sh)">${p.hatch(-112, TOP - 2, 102, 86, 3, 0.9, { a: 0.22 })}</g>
      ${s(box(-100, TOP, 200, 100), { closed: true, fill: PAGE, fa: 1, a: 0.5, w: 0.8, step: 12 })}
      <g class="c-open">${s(flapOpen, { closed: true, fill: PAGE, fa: 1, a: 0.55, w: 0.9, step: 10 })}
        <clipPath id="cta-fo"><path d="${poly(flapOpen)}"/></clipPath><g clip-path="url(#cta-fo)">${p.hatch(-100, TOP - 60, 100, TOP, 4, 1.2, { a: 0.1 })}</g></g>
      <clipPath id="cta-in"><path d="M-130 -200 H130 V74 H-130 Z"/></clipPath>
      <g clip-path="url(#cta-in)"><g class="c-letter">
        ${s(box(-70, -110, 140, 116), { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 10 })}
        <path d="${poly(G.line)}" fill="none" stroke="${AMBER}" stroke-width="1.3"/>
        ${G.letterLines.map((l) => s(l, { a: 0.25, w: 0.7, step: 12 })).join('')}
      </g></g>
      ${s(pocket, { closed: true, fill: PAGE, fa: 1, a: 0.62, w: 0.9, step: 12 })}
      ${s([[-100, 74], [-8, 18]], { a: 0.3, w: 0.7, step: 12 })}${s([[100, 74], [8, 18]], { a: 0.3, w: 0.7, step: 12 })}
      <g class="c-shut">${s(flapShut, { closed: true, fill: PAGE, fa: 1, a: 0.6, w: 0.9, step: 10 })}
        <clipPath id="cta-fs"><path d="${poly(flapShut)}"/></clipPath><g clip-path="url(#cta-fs)">${p.hatch(-100, TOP, 100, 30, 3.2, 0.9, { a: 0.14 })}</g></g>
      <g class="c-seal">${s(ellipse(0, 30, 11, 11, 20), { closed: true, fill: AMBER, fa: 0.25, c: AMBER, a: 0.9, w: 1.2, step: 3, j: 0.4 })}
        ${s([[-4, 28], [0, 33], [5, 26]], { c: AMBER, a: 0.9, w: 1, step: 2, j: 0.2 })}</g>
    </g></g></g>`;
  },
};
