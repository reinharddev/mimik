// mimik — a small animated SVG face. No dependencies. MIT.
const NS = 'http://www.w3.org/2000/svg'
let uid = 0

// top/bot: upper / lower lid closure 0..1, tilt: lid angle (+ inner end down),
// sx/sy: eye scale, sp: eye spacing, ey: eye y, gx/gy: gaze offset,
// m: [half width, curve (+ smile), open], ms: mouth skew, l/r: per-eye overrides
export const expressions = {
  idle: { m: [8, 2, 0] },
  content: { top: 0.35, m: [9, 5, 0] },
  relieved: { top: 0.5, tilt: -6, ey: 5, m: [9, 4, 0] },
  happy: { bot: 0.45, m: [11, 8, 0] },
  joy: { bot: 0.6, top: 0.1, sy: 0.9, m: [13, 10, 5] },
  excited: { sx: 1.15, sy: 1.15, sp: 20, ey: 3, m: [12, 8, 8] },
  love: { deco: 'heart', m: [10, 8, 0] },
  pleading: { sx: 1.2, sy: 1.25, top: 0.3, tilt: -10, ey: 3, m: [6, -3, 0] },
  shy: { top: 0.25, gx: -4, gy: 5, ey: 5, m: [5, 2, 0] },
  surprised: { sx: 1.2, sy: 1.2, ey: 2, m: [4, 0, 9] },
  scared: { sx: 1.2, sy: 1.2, top: 0.3, tilt: -14, sp: 21, trem: 1, m: [9, -4, 5] },
  curious: { l: { sy: 0.85 }, r: { sy: 1.25, top: 0.25, tilt: -8, ey: 2 }, gx: 3, m: [6, 1, 0], ms: 1.5 },
  confused: { l: { top: 0.3, tilt: -10 }, r: { tilt: 6, sy: 1.15 }, deco: 'q', m: [7, -2, 0], ms: 2 },
  dizzy: { deco: 'spiral', m: [8, 0, 3] },
  thinking: { gx: 8, gy: -8, top: 0.2, r: { top: 0.35, tilt: -8, sy: 1.1 }, m: [5, 0, 0], ms: 1 },
  focus: { top: 0.3, bot: 0.15, tilt: 8, m: [6, 0, 0] },
  suspicious: { top: 0.45, bot: 0.3, gx: 6, m: [7, -1, 0] },
  unimpressed: { top: 0.5, m: [9, -1, 0] },
  smug: { top: 0.35, tilt: -4, m: [10, 3, 0], ms: 2.5 },
  sly: { top: 0.3, bot: 0.2, tilt: 10, m: [10, 5, 0], ms: 1.5 },
  bored: { top: 0.55, gy: 3, m: [8, -1, 0] },
  exasperated: { top: 0.85, m: [9, -3, 3] },
  worried: { top: 0.35, tilt: -14, ey: 5, m: [8, -4, 0] },
  guilty: { top: 0.4, tilt: -10, gx: -4, gy: 5, m: [7, -3, 0] },
  sad: { top: 0.4, tilt: -18, ey: 6, m: [9, -6, 0] },
  disgusted: { l: { top: 0.45, tilt: 12 }, r: { top: 0.45, tilt: -4, sy: 0.8 }, m: [10, -5, 2], ms: -2 },
  annoyed: { top: 0.5, tilt: 10, m: [8, -2, 0] },
  angry: { top: 0.45, tilt: 22, m: [10, -6, 3] },
  sleepy: { top: 0.75, m: [6, 0, 2] },
  sleep: { top: 1, deco: 'z', m: [5, 2, 0] },
}

export const reactions = ['blink', 'wink', 'nod', 'shake', 'bounce', 'pop', 'boing', 'spin', 'jitter']
const RX_DUR = { blink: 0.3, wink: 0.5, nod: 0.7, shake: 0.7, bounce: 0.8, pop: 0.45, boing: 0.8, spin: 0.8, jitter: 0.5 }

const BASE = { top: 0, bot: 0, tilt: 0, sx: 1, sy: 1, sp: 19, ey: 4, gx: 0, gy: 0, m: [8, 2, 0], my: 24, ms: 0, deco: null, trem: 0 }

function resolve(name) {
  const e = { ...BASE, ...(expressions[name] || expressions.idle) }
  const s = {}
  for (const k of ['L', 'R']) {
    const o = { ...e, ...(e[k.toLowerCase()] || {}) }
    s[k + 'top'] = o.top; s[k + 'bot'] = o.bot; s[k + 'tilt'] = o.tilt
    s[k + 'sx'] = o.sx; s[k + 'sy'] = o.sy
    s[k + 'x'] = (k === 'L' ? -1 : 1) * o.sp; s[k + 'y'] = o.ey
    s[k + 'gx'] = o.gx; s[k + 'gy'] = o.gy
  }
  s.mw = e.m[0]; s.mc = e.m[1]; s.mo = e.m[2]; s.my = e.my; s.ms = e.ms
  s.dH = e.deco === 'heart' ? 1 : 0
  s.dS = e.deco === 'spiral' ? 1 : 0
  s.dZ = e.deco === 'z' ? 1 : 0
  s.dQ = e.deco === 'q' ? 1 : 0
  s.trem = e.trem
  return s
}

const CSS = `
.mm{width:100%;height:100%;display:block;overflow:visible}
.mm .mm-fx{opacity:0;transition:opacity .3s}
.mm.mm-gloss .mm-gloss-l,.mm.mm-rim .mm-rim-l,.mm.mm-scan .mm-scan-l{opacity:1}
.mm.mm-glow{filter:drop-shadow(0 0 5px var(--face-ink,#fff))}
.mm.mm-hue{animation:mm-hue 8s linear infinite}
.mm.mm-hue.mm-glow{animation-name:mm-hue-glow}
@keyframes mm-hue{to{filter:hue-rotate(360deg)}}
@keyframes mm-hue-glow{from{filter:drop-shadow(0 0 5px var(--face-ink,#fff)) hue-rotate(0)}to{filter:drop-shadow(0 0 5px var(--face-ink,#fff)) hue-rotate(360deg)}}
`

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag)
  for (const k in attrs) n.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(n)
  return n
}

const reduceMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false }
const faces = new Set()
const ptr = { x: 0, y: 0, t: -1e9 }
let raf = 0, last = 0, listening = false

function ensureLoop() {
  if (!listening) {
    addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now() / 1000 }, { passive: true })
    listening = true
  }
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  for (const f of faces) if (f.vis) f.step(now / 1000, dt)
  raf = faces.size ? requestAnimationFrame(tick) : 0
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const spiral = (() => {
  let d = 'M0 0'
  for (let a = 0.3; a < Math.PI * 4; a += 0.3) d += `L${(Math.cos(a) * a * 0.9).toFixed(2)} ${(Math.sin(a) * a * 0.9).toFixed(2)}`
  return d
})()

class Face {
  constructor(host, opts) {
    this.host = host
    this.o = { expression: 'idle', mouth: false, pupils: false, follow: true, blink: true, wander: true, ...opts }
    this.id = ++uid
    this.vis = true
    this.talkE = 0
    this.rx = null
    this.g = { x: 0, y: 0 }
    this.tw = { x: 0, y: 0 }
    this.nextBlink = 1 + Math.random() * 2
    this.nextWander = 0
    this.blinkStart = -9
    this.mop = 0
    this.build()
    this.update({})
    this.tgt = resolve(this.o.expression)
    this.cur = { ...this.tgt }
    faces.add(this)
    if (typeof IntersectionObserver === 'function') {
      this.io = new IntersectionObserver((en) => { this.vis = en[en.length - 1].isIntersecting })
      this.io.observe(host)
    }
    ensureLoop()
    this.step(performance.now() / 1000, 0)
  }

  build() {
    if (!document.getElementById('mm-css')) {
      const s = document.createElement('style'); s.id = 'mm-css'; s.textContent = CSS; document.head.appendChild(s)
    }
    const p = 'mm' + this.id
    const svg = this.svg = el('svg', { class: 'mm', viewBox: '-50 -50 100 100', 'aria-hidden': 'true' })
    const defs = el('defs', {}, svg)
    el('circle', { r: 12.6 }, el('clipPath', { id: p + 'e' }, defs))
    el('circle', { r: 46 }, el('clipPath', { id: p + 'h' }, defs))
    const pat = el('pattern', { id: p + 's', width: 4, height: 4, patternUnits: 'userSpaceOnUse' }, defs)
    el('rect', { width: 4, height: 1.6, fill: '#000', opacity: 0.35 }, pat)

    const head = this.head = el('g', {}, svg)
    el('circle', { r: 46, style: 'fill:var(--face-skin,#000)' }, head)
    const fx = el('g', { 'clip-path': `url(#${p}h)` }, head)
    this.eyes = ['L', 'R'].map((k) => {
      const g = el('g', {}, fx)
      const sc = el('g', { 'clip-path': `url(#${p}e)` }, g)
      const eye = el('circle', { r: 12, style: 'fill:var(--face-ink,#fff)' }, sc)
      const pupil = el('circle', { r: 4.2, style: 'fill:var(--face-skin,#000)' }, sc)
      const top = el('rect', { x: -22, y: -44, width: 44, height: 44, style: 'fill:var(--face-skin,#000)' }, sc)
      const bot = el('circle', { r: 16, style: 'fill:var(--face-skin,#000)' }, sc)
      const ov = el('g', {}, g)
      const heart = el('path', { d: 'M0 8C-16 -2 -12 -13 0 -6C12 -13 16 -2 0 8Z', style: 'fill:var(--face-ink,#fff)' }, ov)
      const spin = el('path', { d: spiral, fill: 'none', 'stroke-width': 1.8, 'stroke-linecap': 'round', style: 'stroke:var(--face-skin,#000)' }, ov)
      const spinBg = el('circle', { r: 12, style: 'fill:var(--face-ink,#fff)' }, ov)
      ov.insertBefore(spinBg, spin)
      return { k, g, sc, eye, pupil, top, bot, ov, heart, spin, spinBg }
    })
    this.mouth = el('path', { fill: 'none', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'stroke:var(--face-ink,#fff);fill:var(--face-ink,#fff)' }, fx)
    this.zs = [0, 1, 2].map((i) => {
      const t = el('text', { 'font-size': 9 + i * 3, 'font-weight': 700, 'font-family': 'ui-sans-serif,system-ui,sans-serif', style: 'fill:var(--face-ink,#fff)' }, fx)
      t.textContent = 'z'
      return t
    })
    this.q = el('text', { x: 26, y: -22, 'font-size': 20, 'font-weight': 700, 'font-family': 'ui-sans-serif,system-ui,sans-serif', style: 'fill:var(--face-ink,#fff)' }, fx)
    this.q.textContent = '?'
    // effect layers
    const gl = el('g', { class: 'mm-fx mm-gloss-l' }, fx)
    el('ellipse', { cx: -14, cy: -27, rx: 24, ry: 10, transform: 'rotate(-28 -14 -27)', fill: '#fff', opacity: 0.16 }, gl)
    const rm = el('g', { class: 'mm-fx mm-rim-l' }, fx)
    el('circle', { r: 43.5, fill: 'none', 'stroke-width': 1.2, opacity: 0.45, style: 'stroke:var(--face-ink,#fff)' }, rm)
    const sl = el('g', { class: 'mm-fx mm-scan-l' }, fx)
    el('rect', { x: -46, y: -46, width: 92, height: 92, fill: `url(#${p}s)` }, sl)
    this.ring = el('circle', { r: 46, fill: 'none', 'stroke-width': 2.5, style: 'stroke:var(--face-ring,#34363a)' }, head)
    this.host.appendChild(svg)
  }

  update(opts) {
    Object.assign(this.o, opts)
    const o = this.o
    for (const [k, v] of [['skin', 'skin'], ['ink', 'ink'], ['ring', 'ring']]) {
      if (o[k]) this.host.style.setProperty('--face-' + v, o[k])
    }
    const c = this.svg.classList
    for (const k of ['gloss', 'rim', 'glow', 'scan', 'hue']) c.toggle('mm-' + k, !!o[k])
    if (opts.expression) this.tgt = resolve(o.expression)
  }

  set(name) { this.update({ expression: name }) }
  react(name) {
    if (!(name in RX_DUR)) throw new Error(`Unknown reaction "${name}". Try: ${reactions.join(', ')}`)
    this.rx = { name, t0: performance.now() / 1000, d: RX_DUR[name] }
  }
  talk(e) { this.talkE = clamp(e, 0, 1) }

  step(t, dt) {
    const o = this.o, c = this.cur, tg = this.tgt
    const still = reduceMotion.matches
    const k = dt ? 1 - Math.exp(-dt * 10) : 1
    for (const key in tg) c[key] += (tg[key] - c[key]) * k

    let blink = 0, rBlink = 0, wink = 0
    if (o.blink && !still && t >= this.nextBlink) { this.blinkStart = t; this.nextBlink = t + 2 + Math.random() * 3.5 }
    const bp = (t - this.blinkStart) / 0.16
    if (bp >= 0 && bp <= 1) blink = 1 - Math.abs(bp * 2 - 1)

    let tx = 0, ty = Math.sin(t * 1.3) * (still ? 0 : 0.5), rot = 0, hx = 1, hy = 1
    if (this.rx) {
      const p = (t - this.rx.t0) / this.rx.d
      if (p >= 1) this.rx = null
      else if (p >= 0) {
        const tri = 1 - Math.abs(p * 2 - 1), fade = 1 - p
        switch (this.rx.name) {
          case 'blink': rBlink = tri; break
          case 'wink': wink = tri; break
          case 'nod': if (!still) ty += 6 * Math.sin(p * Math.PI * 4) * fade; break
          case 'shake': if (!still) tx += 5 * Math.sin(p * Math.PI * 6) * fade; break
          case 'bounce': if (!still) ty -= 14 * Math.abs(Math.sin(p * Math.PI * 2)) * fade; break
          case 'pop': hx = hy = 1 + 0.25 * Math.sin(p * Math.PI); break
          case 'boing': hx = 1 + 0.3 * Math.sin(p * Math.PI * 3) * fade; hy = 1 / hx; break
          case 'spin': if (!still) rot = (1 - Math.pow(1 - p, 3)) * 360; break
          case 'jitter': if (!still) { tx += (Math.random() - 0.5) * 4; ty += (Math.random() - 0.5) * 4 } break
        }
      }
    }
    if (c.trem > 0.01 && !still) { tx += Math.sin(t * 70) * 0.5 * c.trem; ty += Math.cos(t * 83) * 0.4 * c.trem }
    this.head.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${hx.toFixed(3)} ${hy.toFixed(3)})`)

    // gaze: pointer if it moved recently, otherwise wander
    let gx = 0, gy = 0
    if (o.follow && ptr.t > 0 && t - ptr.t < 4 && !still) {
      const r = this.host.getBoundingClientRect()
      const dx = ptr.x - (r.left + r.width / 2), dy = ptr.y - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / 200)
      gx = (dx / d) * f * 5; gy = (dy / d) * f * 5
    } else if (o.wander && !still) {
      if (t >= this.nextWander) { this.tw = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 6 }; this.nextWander = t + 1.2 + Math.random() * 2.5 }
      gx = this.tw.x; gy = this.tw.y
    }
    this.g.x += (gx - this.g.x) * (dt ? 1 - Math.exp(-dt * 8) : 1)
    this.g.y += (gy - this.g.y) * (dt ? 1 - Math.exp(-dt * 8) : 1)

    for (const e of this.eyes) {
      const K = e.k, a = K === 'L' ? c.Ltilt : -c.Rtilt
      const top = clamp(Math.max(c[K + 'top'], blink, rBlink, K === 'R' ? wink : 0), 0, 1)
      const bot = clamp(c[K + 'bot'], 0, 1)
      const x = c[K + 'x'] + c[K + 'gx'] + this.g.x, y = c[K + 'y'] + c[K + 'gy'] + this.g.y
      const sc = `scale(${c[K + 'sx'].toFixed(3)} ${c[K + 'sy'].toFixed(3)})`
      e.g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
      e.sc.setAttribute('transform', sc)
      e.ov.setAttribute('transform', sc)
      e.top.setAttribute('transform', `rotate(${a.toFixed(1)}) translate(0 ${(-12 + 25 * top).toFixed(2)})`)
      e.bot.setAttribute('transform', `rotate(${a.toFixed(1)}) translate(0 ${(28 - 24 * bot).toFixed(2)})`)
      e.pupil.setAttribute('transform', `translate(${(this.g.x * 0.6).toFixed(2)} ${(this.g.y * 0.6).toFixed(2)})`)
      e.pupil.style.opacity = o.pupils ? 1 : 0
      e.eye.style.opacity = 1 - Math.max(c.dH, c.dS)
      e.heart.style.opacity = c.dH
      e.spin.style.opacity = c.dS
      e.spinBg.style.opacity = c.dS
      e.spin.setAttribute('transform', `rotate(${(t * 220) % 360})`)
      e.sc.style.opacity = 1 - c.dH
    }

    const tk = this.talkE
    const want = o.mouth || tk > 0.02 ? 1 : 0
    this.mop += (want - this.mop) * (dt ? 1 - Math.exp(-dt * 12) : 1)
    const mo = Math.max(c.mo, tk * 9), mw = tk > 0.02 ? c.mw + (9 - c.mw) * Math.min(1, tk * 3) : c.mw
    const cy = c.my, mc = c.mc, ms = c.ms
    const lY = cy - mc * 0.3 + ms, rY = cy - mc * 0.3 - ms, ctl = cy + mc * 0.7
    const d = `M${-mw.toFixed(2)} ${lY.toFixed(2)}Q0 ${ctl.toFixed(2)} ${mw.toFixed(2)} ${rY.toFixed(2)}` +
      (mo > 0.4 ? `Q0 ${(ctl + mo * 2).toFixed(2)} ${-mw.toFixed(2)} ${lY.toFixed(2)}Z` : '')
    this.mouth.setAttribute('d', d)
    this.mouth.style.opacity = this.mop
    this.mouth.style.fillOpacity = clamp(mo / 2, 0, 1)

    const z = still ? 0 : t
    this.zs.forEach((n, i) => {
      const ph = ((z * 0.5 + i * 0.33) % 1)
      n.setAttribute('x', 22 + i * 7 + ph * 4)
      n.setAttribute('y', -18 - i * 9 - ph * 8)
      n.style.opacity = c.dZ * Math.sin(ph * Math.PI)
    })
    this.q.style.opacity = c.dQ
  }

  destroy() {
    faces.delete(this)
    if (this.io) this.io.disconnect()
    this.svg.remove()
  }
}

export function createFace(host, opts = {}) {
  if (opts.expression && !expressions[opts.expression]) {
    throw new Error(`Unknown expression "${opts.expression}". Try: ${Object.keys(expressions).join(', ')}`)
  }
  const f = new Face(host, opts)
  return {
    el: f.svg,
    set: (n) => {
      if (!expressions[n]) throw new Error(`Unknown expression "${n}". Try: ${Object.keys(expressions).join(', ')}`)
      f.set(n)
    },
    update: (o) => f.update(o),
    react: (n) => f.react(n),
    talk: (e) => f.talk(e),
    destroy: () => f.destroy(),
  }
}
