# Spec Delta

## MODIFIED Requirements

### Requirement: Administrador inicial com hash bcrypt real
O usuário administrador inicial SHALL existir no banco com hash bcrypt válido (cost 12) da senha provisória documentada (`Public@2026`), permitindo login real. O provisionamento automático SHALL ocorrer **somente quando o ambiente não for de produção** (`NODE_ENV !== 'production'`), SHALL marcar a senha como provisória (`senha_provisoria = 1`) para exigir a troca no primeiro acesso e SHALL ser idempotente: um admin já existente não é sobrescrito.

#### Scenario: Bootstrap cria o admin na primeira execução
- **WHEN** o provisionamento roda em ambiente não-produção sem o usuário `admin@empresa.com.br`
- **THEN** o usuário é criado com perfil Administrador, situação Ativo, hash bcrypt verificável e marcado com senha provisória

#### Scenario: Admin existente não é modificado
- **WHEN** o provisionamento roda com o admin já existente (mesmo com hash trocado)
- **THEN** nenhum dado do usuário é alterado

#### Scenario: Produção não cria administrador padrão
- **WHEN** o provisionamento roda com `NODE_ENV=production` e sem o administrador
- **THEN** nenhum usuário administrador é criado automaticamente e o log informa que o provisionamento foi ignorado
