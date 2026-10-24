import { randomUUID } from 'node:crypto'
import { setCookie } from 'h3'
import { CSRF_COOKIE } from '../../utils/csrf'

export default defineEventHandler((event) => {
  const token = randomUUID()
  setCookie(event, CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  })
  return { csrfToken: token }
})