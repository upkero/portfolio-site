// Fullscreen fragment shader: domain-warped "liquid silk" field + a refracting glass sphere.
// Raw WebGL, one triangle, no three.js.

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uSphere; // center px (gl coords), radius px
uniform float uFade;

// Ashima simplex noise 3D
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// sampled from the reference: black troughs, an amber seam, olive body, pale sage crests
vec3 ramp(float v){
  vec3 c = vec3(0.016, 0.018, 0.014);
  c = mix(c, vec3(0.07, 0.072, 0.048), smoothstep(0.3, 0.48, v));
  c = mix(c, vec3(0.62, 0.45, 0.25), smoothstep(0.43, 0.57, v));
  c = mix(c, vec3(0.26, 0.30, 0.21), smoothstep(0.53, 0.66, v));
  c = mix(c, vec3(0.36, 0.42, 0.32), smoothstep(0.62, 0.78, v));
  c = mix(c, vec3(0.49, 0.54, 0.45), smoothstep(0.76, 0.92, v));
  return c;
}

float field(vec2 p, float t){
  vec2 q = p * 1.3 + uMouse * 0.08;
  q += 0.75 * vec2(snoise(vec3(q * 0.65, t * 0.11)), snoise(vec3(q * 0.65 + 5.2, t * 0.11)));
  return snoise(vec3(q * 0.95, t * 0.17)) * 0.44 + 0.5;
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 fc = gl_FragCoord.xy;
  float s = 1.0 / uRes.y;
  vec2 p = fc * s;
  float t = uTime;

  vec3 col = ramp(field(p, t));

  // glass sphere
  vec2 d = (fc - uSphere.xy) / uSphere.z;
  float r = length(d);
  float aa = 1.6 / uSphere.z;
  float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);
  if (inside > 0.0) {
    float z = sqrt(max(0.0, 1.0 - r * r));
    float edge = pow(1.0 - z, 2.0);
    vec2 c = uSphere.xy * s;
    float R = uSphere.z * s;
    // ball lens: inverted, magnified in the middle, compressed at the rim
    float k = mix(0.95, 0.42, z);
    vec2 base = c - d * R * k;
    float tt = t + 1.7;
    float ca = 0.01 * edge;
    vec3 inner = ramp(field(base, tt));
    // chromatic split only near the rim, where it is visible
    if (ca > 0.004) {
      inner.r = ramp(field(base * (1.0 + ca), tt)).r;
      inner.b = ramp(field(base * (1.0 - ca), tt)).b;
    }
    inner *= mix(1.08, 0.7, smoothstep(0.78, 1.0, r));
    // bright reflected band along the lower-left rim
    float rim = smoothstep(0.88, 0.975, r) * (1.0 - smoothstep(0.975, 0.998, r));
    float side = smoothstep(-0.2, 0.9, dot(normalize(d + 1e-4), normalize(vec2(-0.55, -0.85))));
    if (rim > 0.0) {
      vec3 refl = ramp(field(c + d * R * 1.6, t + 4.0));
      inner += rim * (0.35 + 0.9 * side) * (refl * 1.4 + vec3(0.05, 0.04, 0.02));
    }
    // dark rim line
    inner *= 1.0 - 0.75 * smoothstep(0.975, 1.0, r);
    col = mix(col, inner, inside);
  }

  // vignette + grain
  vec2 uv = fc / uRes;
  col *= mix(0.55, 1.0, smoothstep(1.15, 0.35, length((uv - vec2(0.5, 0.55)) * vec2(1.1, 1.0))));
  col += (hash(fc + fract(t * 7.13) * 91.7) - 0.5) * 0.05;
  col *= uFade;
  gl_FragColor = vec4(col, 1.0);
}`;

export function initHero(canvas, { reduced }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
  } catch (e) {
    console.warn(e);
    return null;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uSphere = u('uSphere'), uFade = u('uFade');

  // the field is soft, so sub-native resolution is invisible; steps down further while frames run late
  let scale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.65;
  let acc = 0, count = 0;
  let w = 0, h = 0;
  const resize = () => {
    w = Math.round(canvas.clientWidth * scale);
    h = Math.round(canvas.clientHeight * scale);
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  };
  resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  // sphere layout as fractions of the viewport; `target` switches for the contact section
  const layouts = {
    hero: () => (w > h
      ? { x: 0.69, y: 0.72, r: 0.53 * h }
      : { x: 0.82, y: 0.74, r: 0.6 * w }),
    contact: () => (w > h
      ? { x: 0.8, y: 0.58, r: 0.46 * h }
      : { x: 0.88, y: 0.8, r: 0.55 * w }),
  };
  let mode = 'hero';
  const sphere = { x: 0, y: 0, r: 0 };
  const snap = () => {
    const l = layouts[mode]();
    sphere.x = l.x * w; sphere.y = l.y * h; sphere.r = l.r;
  };
  snap();

  let raf = 0, running = false, last = performance.now(), time = 12.0, scrollY = 0, fade = 1;

  const draw = () => {
    const l = layouts[mode]();
    const k = 0.045;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    sphere.x += (l.x * w + mouse.x * 0.03 * w - sphere.x) * k;
    sphere.y += (l.y * h + mouse.y * 0.03 * h + (mode === 'hero' ? scrollY * scale * 0.35 : 0) - sphere.y) * k;
    sphere.r += (l.r - sphere.r) * k;
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform3f(uSphere, sphere.x, sphere.y, sphere.r);
    gl.uniform1f(uFade, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const ms = now - last;
    if (ms < 14) return; // ~60fps cap on 120/144Hz screens
    last = now;
    if (ms < 100) { acc += ms; count++; }
    if (count === 60) {
      if (acc / count > 20 && scale > 0.36) {
        scale *= 0.8;
        resize();
        snap();
      }
      acc = count = 0;
    }
    time += Math.min(ms, 50) / 1000 * 0.9;
    draw();
  };

  const api = {
    start() {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setMode(m) {
      if (m === mode) return;
      mode = m;
      if (reduced) { snap(); draw(); }
    },
    setScroll(y) { scrollY = y; },
    setFade(f) { fade = f; if (!running) draw(); },
    pointer(x, y) { mouse.tx = x; mouse.ty = y; },
    resize() { resize(); snap(); draw(); },
  };
  draw();
  return api;
}
