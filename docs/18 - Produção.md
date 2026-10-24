# Produção - checklist de entrega

## Pré-requisitos

- [ ] Node compatível com `package.json` e build gerado por `npm ci && npm run build`.
- [ ] HTTPS terminando no proxy; `APP_URL` com a origem pública correta.
- [ ] `TRUSTED_PROXIES` contém apenas os IPs/CIDRs do proxy (nunca `*`).
- [ ] `AUTH_JWT_SECRET` e `SMTP_ENC_KEY` fortes e exclusivos do ambiente.
- [ ] MariaDB com usuário de menor privilégio (`scripts/db-least-privilege.sql`).
- [ ] Backup/restore testado antes do go-live.

## Banco e migrations

- [ ] `_migrations` contém as migrations 1–35 após o boot.
- [ ] Views de itens consultáveis e `publicado_em` backfillado.
- [ ] Rate limit e auditoria com grants/triggers esperados.
- [ ] Rollback documentado para a última migration aplicada.

## Segurança e sessão

- [ ] Headers globais presentes em `/admin` e `/api` (nosniff, Referrer-Policy, Permissions-Policy, CSP, X-Frame-Options).
- [ ] HSTS presente apenas com HTTPS em produção.
- [ ] CSRF ativo em escritas por cookie; login/refresh/recuperação isentos.
- [ ] Cookies `Secure`/`__Host-` em produção.
- [ ] Rate limit respondendo 429 e contador em `rate_limit_contadores`.

## Assets e entrega

- [ ] `/_nuxt/**` com `Cache-Control: public, max-age=31536000, immutable` e `Vary: Accept-Encoding`.
- [ ] Brotli/gzip habilitado no proxy/Nitro, sem dupla compressão; imagens não recomprimidas.
- [ ] HTML/`/admin` sem cache público.
- [ ] `/uploads/**` com cache curto/revalidável e mídia de chamadas pela rota autorizada.

## Funcional

- [ ] Login/logout/refresh e troca de senha.
- [ ] Busca FULLTEXT em Chamadas/Auditoria/Usuários e códigos/e-mails por prefixo.
- [ ] Exportação CSV em fluxo com filtros e RBAC.
- [ ] Painel Executivo e esteira com dados reais.
- [ ] E-mail real (convite/recuperação) e links com `APP_URL`.
- [ ] Teste de carga em N=20 com pool e `/api` sob o proxy.
- [ ] Monitoramento de erros, latência, pool e rate limit.

## Critério de saída

- [ ] Nenhum item acima pendente; falha de qualquer verificação bloqueia o go-live.
