<script setup lang="ts">
interface Ring {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  rotSpeed: number
  dotCount: number
  color: string
  sprite: HTMLCanvasElement
  alpha: number
  pulse: number
  rippleIn: number
}

/* Onda sonar emitida pelo anel conforme ele percorre o fundo. */
interface Ripple {
  x: number
  y: number
  r: number
  speed: number
  age: number
  life: number
  color: string
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Paleta brand (docs/01 §2.1): azuis structure/claro e verdes accent/focus —
// substitui a paleta teal/ciano original (spec `login`).
const palette = ['#0364f7', '#50a1ff', '#4ed813', '#1a9e07', '#0364f7']

/* Espessura e amplitude da frente de onda sobre o campo de pontos. */
const ONDA_LARGURA = 48
const ONDA_FORCA = 10
const MAX_RIPPLES = 14

let ctx: CanvasRenderingContext2D | null = null
let sprites: HTMLCanvasElement[] = []
let bgLayer: HTMLCanvasElement | null = null
let rings: Ring[] = []
let ripples: Ripple[] = []
let width = 0
let height = 0
let dpr = 1
let spacing = 32
let raf = 0
let start = 0
let last = 0
let visible = true

const prefersReducedMotion = () => {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* Ruído estável por célula, para dar individualidade a cada ponto. */
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453

  return n - Math.floor(n)
}

const makeSprite = (color: string) => {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const g = canvas.getContext('2d')
  if (!g) return canvas

  const grad = g.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  grad.addColorStop(0, color)
  grad.addColorStop(0.16, color)
  grad.addColorStop(0.42, hexToRgba(color, 0.28))
  grad.addColorStop(1, hexToRgba(color, 0))

  g.fillStyle = grad
  g.fillRect(0, 0, size, size)

  return canvas
}

const buildSprites = () => {
  sprites = palette.map(makeSprite)
}

/* Camada de fundo estática: apenas o gradiente (o campo de pontos passou a ser
   redesenhado por quadro em drawField para reagir às ondas dos anéis). */
const buildBackground = () => {
  bgLayer = document.createElement('canvas')
  bgLayer.width = Math.floor(width * dpr)
  bgLayer.height = Math.floor(height * dpr)

  const g = bgLayer.getContext('2d')
  if (!g) return

  g.setTransform(dpr, 0, 0, dpr, 0, 0)

  const bg = g.createLinearGradient(0, 0, width, height)
  // Escala navy derivada de brand.primary (#112051), escurecida para o card
  // branco destacar (spec `login`).
  bg.addColorStop(0, '#0b1330')
  bg.addColorStop(0.5, '#070d22')
  bg.addColorStop(1, '#040814')

  g.fillStyle = bg
  g.fillRect(0, 0, width, height)
}

/*
 * Campo de pontos redesenhado a cada quadro: os pontos são empurrados e
 * acendem quando a frente de onda de uma ripple os alcança — a onda
 * percorre o fundo exatamente pelo caminho dos anéis.
 */
const drawField = () => {
  if (!ctx) return

  if (bgLayer) {
    ctx.drawImage(bgLayer, 0, 0, width, height)
  }

  const cols = Math.ceil(width / spacing) + 1
  const rows = Math.ceil(height / spacing) + 1

  ctx.globalCompositeOperation = 'lighter'

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const noise = hash(gx, gy)
      const jitterX = (hash(gx + 11.3, gy + 7.1) - 0.5) * spacing * 0.55
      const jitterY = (hash(gx + 3.7, gy + 19.2) - 0.5) * spacing * 0.55

      let x = gx * spacing + jitterX
      let y = gy * spacing + jitterY
      let glow = 0

      for (const ripple of ripples) {
        const rx = x - ripple.x
        const ry = y - ripple.y
        const dist = Math.sqrt(rx * rx + ry * ry) || 0.001
        const delta = Math.abs(dist - ripple.r)

        if (delta > ONDA_LARGURA) continue

        const frente = 1 - delta / ONDA_LARGURA
        const empurrao = frente * frente * ONDA_FORCA

        x += (rx / dist) * empurrao
        y += (ry / dist) * empurrao
        glow += frente
      }

      const bright = 0.06 + noise * 0.22 + glow * 0.28
      const index = Math.min(sprites.length - 1, Math.floor(noise * sprites.length))
      const sprite = sprites[index]
      if (!sprite) continue

      const size = 2.5 + bright * 8

      ctx.globalAlpha = Math.min(0.85, bright)
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size)
    }
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

const buildRings = () => {
  const count = 5
  const minSide = Math.min(width, height)

  /* Distribui os centros em uma grade embaralhada para evitar sobreposição. */
  const cols = 3
  const rows = 2
  const cells: Array<[number, number]> = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push([c, r])
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = cells[i]!
    cells[i] = cells[j]!
    cells[j] = tmp
  }

  const cellW = width / cols
  const cellH = height / rows

  rings = Array.from({ length: count }, (_, i) => {
    const radius = rand(minSide * 0.08, minSide * 0.18)
    const speed = rand(14, 42) * (width < 640 ? 0.7 : 1)
    const index = i % palette.length
    const cell = cells[i % cells.length]!

    const baseX = cell[0] * cellW + cellW / 2
    const baseY = cell[1] * cellH + cellH / 2

    const x = Math.min(
      width - radius,
      Math.max(radius, baseX + (Math.random() - 0.5) * cellW * 0.5)
    )
    const y = Math.min(
      height - radius,
      Math.max(radius, baseY + (Math.random() - 0.5) * cellH * 0.5)
    )

    return {
      x,
      y,
      vx: speed * (Math.random() < 0.5 ? -1 : 1),
      vy: speed * (Math.random() < 0.5 ? -1 : 1),
      radius,
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(0.12, 0.4) * (Math.random() < 0.5 ? -1 : 1),
      dotCount: Math.max(10, Math.round((2 * Math.PI * radius) / 13)),
      color: palette[index]!,
      sprite: sprites[index]!,
      alpha: rand(0.5, 0.9),
      pulse: rand(0, Math.PI * 2),
      rippleIn: rand(0.2, 1.8)
    }
  })
}

const updateRings = (dt: number) => {
  for (const ring of rings) {
    ring.x += ring.vx * dt
    ring.y += ring.vy * dt

    if (ring.x - ring.radius < 0) {
      ring.x = ring.radius
      ring.vx = Math.abs(ring.vx)
    } else if (ring.x + ring.radius > width) {
      ring.x = width - ring.radius
      ring.vx = -Math.abs(ring.vx)
    }

    if (ring.y - ring.radius < 0) {
      ring.y = ring.radius
      ring.vy = Math.abs(ring.vy)
    } else if (ring.y + ring.radius > height) {
      ring.y = height - ring.radius
      ring.vy = -Math.abs(ring.vy)
    }

    ring.rotation += ring.rotSpeed * dt
  }
}

/*
 * Cada anel emite uma onda a cada poucos segundos na posição corrente; a onda
 * se expande, some com a idade e é o que empurra/acesa os pontos em drawField.
 */
const updateRipples = (dt: number) => {
  for (const ring of rings) {
    ring.rippleIn -= dt

    if (ring.rippleIn <= 0 && ripples.length < MAX_RIPPLES) {
      ripples.push({
        x: ring.x,
        y: ring.y,
        r: 0,
        speed: rand(110, 150) * (width < 640 ? 0.7 : 1),
        age: 0,
        life: rand(2.2, 3),
        color: ring.color
      })

      ring.rippleIn = rand(1.4, 2.2)
    }
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const ripple = ripples[i]!
    ripple.age += dt
    ripple.r += ripple.speed * dt

    if (ripple.age >= ripple.life) ripples.splice(i, 1)
  }
}

/* Frente das ondas: anel expansivo suave, desenhado por baixo dos anéis. */
const drawRipples = () => {
  if (!ctx) return

  ctx.globalCompositeOperation = 'lighter'

  for (const ripple of ripples) {
    const p = ripple.age / ripple.life
    const alpha = (1 - p) * (1 - p) * 0.3

    ctx.beginPath()
    ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2)
    ctx.strokeStyle = hexToRgba(ripple.color, alpha)
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2)
    ctx.strokeStyle = hexToRgba(ripple.color, alpha * 0.35)
    ctx.lineWidth = 8
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'source-over'
}

const drawRings = (t: number) => {
  if (!ctx) return

  ctx.globalCompositeOperation = 'lighter'

  for (const ring of rings) {
    /* Contorno suave do anel */
    ctx.beginPath()
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
    ctx.strokeStyle = hexToRgba(ring.color, 0.1)
    ctx.lineWidth = 1
    ctx.stroke()

    /* Pontos que formam o anel */
    for (let i = 0; i < ring.dotCount; i++) {
      const angle = ring.rotation + (i / ring.dotCount) * Math.PI * 2
      const x = ring.x + Math.cos(angle) * ring.radius
      const y = ring.y + Math.sin(angle) * ring.radius

      const pulse = 0.6 + 0.4 * Math.sin(t * 2 + ring.pulse + i * 0.6)
      const bright = ring.alpha * pulse
      const size = 3 + bright * 9

      ctx.globalAlpha = 0.25 + bright * 0.7
      ctx.drawImage(ring.sprite, x - size / 2, y - size / 2, size, size)
    }
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

const render = (time: number) => {
  if (!ctx) return

  if (!start) {
    start = time
    last = time
  }

  const t = (time - start) / 1000
  const dt = Math.min((time - last) / 1000, 0.05)
  last = time

  updateRings(dt)
  updateRipples(dt)

  drawField()
  drawRipples()
  drawRings(t)
}

const loop = (time: number) => {
  if (!visible) {
    raf = 0
    return
  }

  render(time)
  raf = requestAnimationFrame(loop)
}

const startAnimation = () => {
  if (raf) return

  if (prefersReducedMotion()) {
    render(0)
    return
  }

  raf = requestAnimationFrame(loop)
}

const stopAnimation = () => {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

const resize = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = canvas.clientWidth
  height = canvas.clientHeight

  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)

  ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  spacing = width < 640 ? 26 : 32

  buildBackground()
  buildRings()
  ripples = []

  if (prefersReducedMotion()) {
    render(0)
  }
}

const handleVisibility = () => {
  visible = document.visibilityState === 'visible'

  if (visible) {
    startAnimation()
  } else {
    stopAnimation()
  }
}

onMounted(() => {
  buildSprites()
  resize()
  startAnimation()

  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', handleVisibility)
})

onBeforeUnmount(() => {
  stopAnimation()

  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none absolute inset-0 h-full w-full"
    aria-hidden="true"
  />
</template>
