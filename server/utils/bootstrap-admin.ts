// server/utils/bootstrap-admin.ts — bootstrap idempotente do administrador
// Design decisão 3 (change criar-migration-nitro): MariaDB não gera bcrypt;
// o hash é criado aqui em TS (cost 12, docs/qa/02) após as migrations.
// Admin existente (mesmo com hash trocado) NUNCA é sobrescrito.
// Change endurecer-banco-e-bootstrap (RL02 C-03): o provisionamento automático
// só roda FORA de produção (ambiente de demonstração/desenvolvimento) e o admin
// nasce com senha PROVISÓRIA — o primeiro login exige a troca (capability
// `primeiro-acesso`).
import { hash } from 'bcrypt'
import { query } from './db'

const ADMIN_EMAIL = 'ana.carolina@empresa.com.br'
const ADMIN_SENHA_DEMO = 'Public@2026' // senha demo documentada (docs/08/qa)
const BCRYPT_COST = 12

export async function ensureAdminUser(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('[bootstrap-admin] Ambiente de produção — provisionamento do administrador demo ignorado.')
    return
  }

  const existing = await query<Array<{ id: string }>>(
    'SELECT id FROM usuarios WHERE email_corporativo = ?',
    [ADMIN_EMAIL]
  )
  if (existing.length > 0) {
    return // idempotente: admin já provisionado — não tocar
  }

  const perfis = await query<Array<{ id: string }>>(
    "SELECT id FROM perfis_acesso WHERE nome_perfil = 'Administrador'"
  )
  if (perfis.length === 0) {
    throw new Error(
      "[bootstrap-admin] Perfil 'Administrador' não encontrado — as seeds (02_seed.sql) não foram aplicadas."
    )
  }

  const senhaHash = await hash(ADMIN_SENHA_DEMO, BCRYPT_COST)
  await query(
    `INSERT INTO usuarios (
       nome_completo, email_corporativo, hash_senha, perfil_id,
       departamento_setor, funcao, telefone, situacao,
       senha_provisoria, tentativas_falhas
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Ativo', 1, 0)`,
    [
      'Ana Carolina Ribeiro',
      ADMIN_EMAIL,
      senhaHash,
      String(perfis[0]?.id ?? ''),
      'Tecnologia',
      'Administradora de Sistemas',
      '(11) 98888-1001'
    ]
  )
  console.log(`[bootstrap-admin] Administrador provisionado com senha provisória: ${ADMIN_EMAIL}`)
}
