// Carga reproduzível do Painel Executivo e da Esteira (RL06-A-04).
// Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/load-painel-esteira.mjs
// Opcional: BASE_URL, N (default: 10,20)
const base = process.env.BASE_URL || 'http://localhost:3000'
const email = process.env.ADMIN_EMAIL
const senha = process.env.ADMIN_PASSWORD
if (!email || !senha) {
  console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente.')
  process.exit(1)
}

const login = await fetch(base + '/api/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, senha })
})
if (login.status !== 200) {
  console.error('Falha no login:', login.status)
  process.exit(1)
}
const cookies = (login.headers.getSetCookie?.() ?? [login.headers.get('set-cookie')])
  .filter(Boolean)
  .map((cookie) => cookie.split(';')[0])
  .join('; ')

const cargas = (process.env.N ? process.env.N.split(',').map(Number) : [10, 20])
const alvos = [
  ['painel', '/api/painel-executivo'],
  ['esteira', '/api/esteira-revisao']
]

for (const n of cargas) {
  for (const [rotulo, rota] of alvos) {
    const inicio = Date.now()
    const status = await Promise.all(
      Array.from({ length: n }, () =>
        fetch(base + rota, { headers: { cookie: cookies } })
          .then((resposta) => resposta.status)
          .catch(() => 0)
      )
    )
    const ok = status.filter((codigo) => codigo === 200).length
    const indisponivel = status.filter((codigo) => codigo === 503).length
    const erro = status.filter((codigo) => codigo === 500).length
    console.log(
      `${rotulo} N=${n} ok=${ok} 503=${indisponivel} 500=${erro} outros=${n - ok - indisponivel - erro} ms=${Date.now() - inicio}`
    )
    if (erro > 0) process.exitCode = 1
  }
}