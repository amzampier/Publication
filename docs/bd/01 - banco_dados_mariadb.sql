-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - SCHEMA DDL (MARIADB 11.8+ LTS)
-- BANCO DE DADOS: publications
-- Idioma das Tabelas e Campos: Português do Brasil (PT-BR)
-- Engine Padrão: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_520_ci
-- Otimizado para MariaDB 11.8: colunas JSON nativas, UUID nativo,
-- Precisão de microssegundos (DATETIME(6)) e Integridade Referencial.
-- DROPs em ordem inversa de dependência (filhas primeiro) — sem
-- SET FOREIGN_KEY_CHECKS, para funcionar com qualquer runner de migration.
-- =========================================================================

-- 1. CRIAÇÃO DO BANCO DE DADOS
CREATE DATABASE IF NOT EXISTS publications
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_520_ci;

USE publications;

-- =========================================================================
-- 2. REMOÇÃO LIMPA (views primeiro, depois tabelas em ordem inversa de FK)
-- =========================================================================
DROP VIEW IF EXISTS v_manual_itens;
DROP VIEW IF EXISTS v_projeto_itens;
DROP VIEW IF EXISTS v_release_itens;
DROP VIEW IF EXISTS manuais;

DROP TABLE IF EXISTS anexos_midias;
DROP TABLE IF EXISTS historico_esteira_revisao;
DROP TABLE IF EXISTS sessoes;
DROP TABLE IF EXISTS tokens_acesso;
DROP TABLE IF EXISTS notificacoes_sistema;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS entregas_itens;
DROP TABLE IF EXISTS manuais_mensal;
DROP TABLE IF EXISTS release_week;
DROP TABLE IF EXISTS projetos_escopo;
DROP TABLE IF EXISTS token_blacklist;
DROP TABLE IF EXISTS permissoes_perfil;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS perfis_acesso;
DROP TABLE IF EXISTS parceiros;
DROP TABLE IF EXISTS softwares;
DROP TABLE IF EXISTS configuracoes_globais;
DROP TABLE IF EXISTS configuracoes_limite_requisicao;

-- =========================================================================
-- 3. PERFIS DE ACESSO PARA CONTROLE RBAC (DINÂMICO)
-- =========================================================================
CREATE TABLE perfis_acesso (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do perfil',
    nome_perfil VARCHAR(100) NOT NULL COMMENT 'Nome amigável exibido nas telas de governança',
    descricao TEXT NULL COMMENT 'Detalhamento das responsabilidades do perfil',
    situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral do perfil de acesso',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_perfis_situacao (situacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Perfis de acesso para controle RBAC';

-- =========================================================================
-- 4. MATRIZ GRANULAR DE PERMISSÕES POR MÓDULO COM EXTRAS JSON
-- =========================================================================
CREATE TABLE permissoes_perfil (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador do registro de permissão',
    perfil_id UUID NOT NULL COMMENT 'Chave estrangeira apontando para perfis_acesso.id',
    modulo VARCHAR(100) NOT NULL COMMENT 'Identificador do módulo (ex: manuais, release-week, auditoria)',
    pode_visualizar TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ação fixa: visualizar',
    pode_incluir TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ação fixa: criar/incluir',
    pode_editar TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ação fixa: alterar/editar',
    pode_excluir TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Ação fixa: excluir',
    extras JSON DEFAULT NULL COMMENT 'Ações extras (publicar, arquivar, download, exportar, importar) em JSON',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_perfil_modulo (perfil_id, modulo),
    CONSTRAINT fk_permissoes_perfil FOREIGN KEY (perfil_id)
        REFERENCES perfis_acesso (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Matriz de autorizações por perfil e módulo com extras em JSON';

-- =========================================================================
-- 5. USUÁRIOS E OPERADORES DO SISTEMA (ENDEREÇO E SMTP CORPORATIVO)
-- =========================================================================
CREATE TABLE usuarios (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do operador',
    nome_completo VARCHAR(150) NOT NULL COMMENT 'Nome completo do usuário',
    email_corporativo VARCHAR(255) NOT NULL COMMENT 'E-mail corporativo único para autenticação',
    hash_senha VARCHAR(255) NOT NULL COMMENT 'Senha criptografada com algoritmo forte (bcrypt)',
    perfil_id UUID NOT NULL COMMENT 'Perfil de acesso atribuído ao operador',
    departamento_setor VARCHAR(100) NOT NULL DEFAULT 'Geral' COMMENT 'Área ou departamento de trabalho',
    funcao VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Cargo ou função desempenhada pelo usuário',
    telefone VARCHAR(30) NULL COMMENT 'Telefone ou ramal de contato',
    avatar_url VARCHAR(500) NULL COMMENT 'URL/caminho da foto/avatar do usuário (arquivo, não dataURL)',
    situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'Ativo' COMMENT 'Status de acesso do usuário',
    cep VARCHAR(10) NOT NULL DEFAULT '' COMMENT 'Código de Endereçamento Postal',
    endereco VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Logradouro / Rua / Avenida',
    numero VARCHAR(20) NOT NULL DEFAULT '' COMMENT 'Número residencial ou S/N (vazio quando o endereço não é informado — migration 04)',
    complemento VARCHAR(100) NULL COMMENT 'Complemento de endereço',
    bairro VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Bairro ou Distrito',
    cidade VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Município de residência',
    estado CHAR(2) NOT NULL DEFAULT '' COMMENT 'Sigla da Unidade Federativa (UF)',
    regiao VARCHAR(20) NOT NULL DEFAULT '' COMMENT 'Região do Brasil (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)',
    provedor ENUM('gmail', 'outlook', 'yahoo', 'personalizado') NULL DEFAULT NULL COMMENT 'Provedor SMTP escolhido — NULL = SMTP não configurado',
    smtp VARCHAR(255) NULL COMMENT 'Servidor SMTP para envio de mensagens',
    porta INT NULL COMMENT 'Porta do servidor SMTP (25, 465 ou 587)',
    email_smtp VARCHAR(255) NULL COMMENT 'E-mail utilizado para autenticação e envio SMTP',
    senha_smtp VARCHAR(255) NULL COMMENT 'Senha do servidor SMTP para envio corporativo dedicado',
    metodo_seguranca ENUM('nenhuma', 'starttls', 'ssl') NULL DEFAULT NULL COMMENT 'Segurança do SMTP (nenhuma, starttls, ssl) — NULL = não configurado',
    metodo_certificado ENUM('Indefinido', 'Cliente', 'Servidor', 'Ambos') NOT NULL DEFAULT 'Indefinido' COMMENT 'Método de validação/autenticação de certificados',
    ultimo_login DATETIME(6) NULL COMMENT 'Data e hora do último login realizado',

    -- Registro de Convites Enviados
    convite_email_enviado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Registra se o convite por e-mail já foi enviado ao usuário',
    convite_email_enviado_em DATETIME(6) NULL COMMENT 'Data e hora do envio do convite por e-mail',
    convite_whatsapp_enviado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Registra se o convite por WhatsApp já foi enviado ao usuário',
    convite_whatsapp_enviado_em DATETIME(6) NULL COMMENT 'Data e hora do envio do convite por WhatsApp',
    senha_provisoria TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica senha provisória a ser trocada no primeiro acesso',

    -- Proteção contra brute-force (lockout)
    tentativas_falhas TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contador de tentativas de login falhas consecutivas',
    bloqueado_ate DATETIME(6) NULL COMMENT 'Momento do desbloqueio (NULL = não bloqueado)',

    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuarios_email (email_corporativo),
    KEY idx_usuarios_perfil (perfil_id),
    KEY idx_usuarios_situacao (situacao),
    KEY idx_usuarios_cep (cep),
    CONSTRAINT fk_usuarios_perfil FOREIGN KEY (perfil_id)
        REFERENCES perfis_acesso (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Cadastro dos operadores e administradores com endereço e SMTP';

-- =========================================================================
-- 6. CADASTRO: PARCEIROS (CLIENTES, REDES E DISTRIBUIDORAS)
-- =========================================================================
CREATE TABLE parceiros (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do parceiro',
    codigo VARCHAR(20) NOT NULL COMMENT 'Codigo unico do parceiro (PAR-XXX), identificador secundario',
    razao_social VARCHAR(255) NOT NULL COMMENT 'Razão social oficial',
    nome_fantasia VARCHAR(150) NOT NULL COMMENT 'Nome fantasia / marca comercial',
    cidade VARCHAR(120) NOT NULL COMMENT 'Cidade sede',
    estado CHAR(2) NOT NULL COMMENT 'Sigla do Estado (UF)',
    regiao VARCHAR(20) NOT NULL DEFAULT '' COMMENT 'Regiao do Brasil (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)',
    logo_url VARCHAR(500) NULL COMMENT 'Caminho/URL da logo do parceiro (/uploads/logos/...)',
    situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_parceiros_codigo (codigo),
    KEY idx_parceiros_nome_fantasia (nome_fantasia),
    KEY idx_parceiros_situacao (situacao),
    KEY idx_parceiros_estado (estado),
    KEY idx_parceiros_cidade (cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Cadastro de parceiros clientes e distribuidores';

-- =========================================================================
-- 7. CADASTRO: SOFTWARES (SISTEMAS E SOLUÇÕES TECNOLÓGICAS)
-- =========================================================================
CREATE TABLE softwares (
    codigo VARCHAR(20) NOT NULL COMMENT 'Código único do software (SFT-XXX)',
    descricao VARCHAR(200) NOT NULL COMMENT 'Nome/descrição do sistema',
    categoria ENUM('Delphi', 'Web', 'Delphi e Web') NOT NULL DEFAULT 'Delphi' COMMENT 'Tecnologia do sistema',
    situacao ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação de manutenção',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (codigo),
    KEY idx_softwares_descricao (descricao),
    KEY idx_softwares_categoria (categoria),
    KEY idx_softwares_situacao (situacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Catálogo de softwares corporativos';

-- =========================================================================
-- 8. CONFIGURAÇÕES GLOBAIS DA PLATAFORMA (SIDEBAR, LOGOMARCAS E RETENÇÃO)
-- =========================================================================
CREATE TABLE configuracoes_globais (
    id VARCHAR(32) NOT NULL COMMENT 'Chave única da configuração (ex: config_default)',
    nome_empresa VARCHAR(150) NOT NULL DEFAULT 'Publication Enterprise Suite' COMMENT 'Nome corporativo exibido no topo',
    banner_publico_ativo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Exibição do banner no portal público',
    banner_texto TEXT NULL COMMENT 'Texto informativo do banner público',
    banner_tipo ENUM('info', 'alerta', 'novidade') NOT NULL DEFAULT 'novidade' COMMENT 'Tipo visual do banner',
    exigir_revisao_para_publicar TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Workflow: exige aprovação antes de publicar',
    notificar_por_email TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Habilita disparos de notificação por e-mail',

    -- Preferências de Menu Lateral (grupos do sidebar: publicacoes, movimentos,
    -- cadastros, administracao — mesmos grupos de app/config/navigation.ts)
    sidebar_grupos JSON NOT NULL DEFAULT '{"publicacoes":true,"movimentos":true,"cadastros":true,"administracao":true}' COMMENT 'Estado inicial de cada grupo do sidebar (true=expandido, false=recolhido)',

    -- Logomarcas e identidade (aba padrão de Configurações Globais)
    logo_header_url VARCHAR(500) NULL COMMENT 'Caminho/URL da logomarca do header (/uploads/logomarcas/...)',
    logo_login_url VARCHAR(500) NULL COMMENT 'Caminho/URL da logomarca da tela de login',

    -- Retenção da trilha de auditoria (slider de Dias)
    dias_retencao_auditoria INT UNSIGNED NOT NULL DEFAULT 180 COMMENT 'Dias de retenção da auditoria antes da expurgo',

    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Configurações e parâmetros globais do sistema';

-- =========================================================================
-- 9. SEGURANÇA: CONFIGURAÇÕES DE LIMITE DE REQUISIÇÃO (RATE LIMIT)
-- =========================================================================
CREATE TABLE configuracoes_limite_requisicao (
    id VARCHAR(32) NOT NULL COMMENT 'Chave única de rate limit',
    ativo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica se a proteção de tráfego está ativa',
    limite_requisicoes_minuto INT UNSIGNED NOT NULL DEFAULT 120 COMMENT 'Máximo de requisições por minuto',
    limite_pico INT UNSIGNED NOT NULL DEFAULT 180 COMMENT 'Teto máximo em rajadas momentâneas',
    taxa_atual INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Taxa atual registrada no nó',
    ips_bloqueados JSON NULL COMMENT 'Lista de IPs bloqueados em formato JSON',
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Controle de tráfego e rate limit da API';

-- =========================================================================
-- 10. SESSÕES (REFRESH TOKEN ROTATIVO)
-- =========================================================================
CREATE TABLE sessoes (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único da sessão',
    usuario_id UUID NOT NULL COMMENT 'Chave estrangeira apontando para usuarios.id',
    refresh_token_hash VARCHAR(255) NOT NULL COMMENT 'Hash do refresh token vigente (renovação invalida o anterior)',
    user_agent VARCHAR(255) NULL COMMENT 'User-Agent do cliente autenticado',
    ip VARCHAR(45) NOT NULL COMMENT 'Endereço IPv4 ou IPv6 da sessão',
    expira_em DATETIME(6) NOT NULL COMMENT 'Momento de expiração do refresh token',
    revogado_em DATETIME(6) NULL COMMENT 'Momento do logout/revogação (NULL = sessão ativa)',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_sessoes_refresh (refresh_token_hash),
    KEY idx_sessoes_usuario (usuario_id),
    KEY idx_sessoes_expira (expira_em),
    CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Sessões autenticadas com refresh token rotativo';

-- =========================================================================
-- 11. BLACKLIST DE TOKENS (LOGOUT COM REVOGAÇÃO)
-- =========================================================================
CREATE TABLE token_blacklist (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador do registro de blacklist',
    token_hash VARCHAR(255) NOT NULL COMMENT 'Hash do token revogado (jti) — nunca o token em claro',
    expira_em DATETIME(6) NOT NULL COMMENT 'Expiração natural do token (limpeza automática dos registros vencidos)',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_token_blacklist_hash (token_hash),
    KEY idx_token_blacklist_expira (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Tokens revogados no logout, retidos até a expiração';

-- =========================================================================
-- 12. TOKENS DE ACESSO (CONVITE E RECUPERAÇÃO DE SENHA)
-- =========================================================================
CREATE TABLE tokens_acesso (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador do token emitido',
    usuario_id UUID NOT NULL COMMENT 'Chave estrangeira apontando para usuarios.id',
    tipo ENUM('convite', 'recuperacao') NOT NULL COMMENT 'Fluxo que originou o token',
    token_hash VARCHAR(255) NOT NULL COMMENT 'Hash do token enviado ao usuário',
    expira_em DATETIME(6) NOT NULL COMMENT 'Prazo de validade do token',
    usado_em DATETIME(6) NULL COMMENT 'Momento do consumo do token (NULL = não utilizado)',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_tokens_acesso_hash (token_hash),
    KEY idx_tokens_acesso_usuario (usuario_id),
    KEY idx_tokens_acesso_tipo (tipo),
    CONSTRAINT fk_tokens_acesso_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Tokens de convite e recuperação de senha, com expiração';

-- =========================================================================
-- 13. RELEASE WEEK (CICLOS SEMANAIS DE LANÇAMENTO)
-- =========================================================================
CREATE TABLE release_week (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único da release week',
    codigo VARCHAR(20) NOT NULL COMMENT 'Código da Release Week (Ex: RW-01/2026)',
    nome VARCHAR(255) NOT NULL COMMENT 'Título da release week (ex: Release Week 39 - 2026)',
    versao VARCHAR(50) NULL COMMENT 'Versão técnica digitada no cabeçalho (ex: 26.06a)',
    `release` VARCHAR(50) NULL COMMENT 'Código da release digitada no cabeçalho (ex: 26.06a10.05a)',
    semana INT UNSIGNED NOT NULL COMMENT 'Número da semana no ano (1 a 52)',
    ano INT UNSIGNED NOT NULL COMMENT 'Ano de referência (ex: 2026)',
    mes VARCHAR(30) NOT NULL COMMENT 'Mês por extenso (ex: Janeiro)',
    data_inicio DATE NOT NULL COMMENT 'Segunda-feira de início do ciclo',
    data_finaliza DATE NOT NULL COMMENT 'Data de fechamento técnico',
    data_publicacao DATE NOT NULL COMMENT 'Segunda-feira oficial de publicação',
    status ENUM(
        'Aberta',
        'Em Revisão',
        'Aprovado',
        'Publicado'
    ) NOT NULL DEFAULT 'Aberta' COMMENT 'Status de workflow da semana',
    descricao MEDIUMTEXT NULL COMMENT 'Texto descritivo consolidado das novidades',
    total_visualizacoes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contador de acessos públicos',
    destaque_semana TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Exibir em destaque no topo da home pública',
    arquivada TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Release arquivada (soft): some da listagem sem apagar dados/itens',

    -- Metadados de Workflow e Auditoria com Foreign Keys
    autor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (criador da release)',
    autor_nome VARCHAR(150) NULL COMMENT 'Nome do usuário criador da release week',
    revisor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (revisor responsável)',
    revisor_nome VARCHAR(150) NULL COMMENT 'Nome do revisor responsável',
    revisor_feedback TEXT NULL COMMENT 'Parecer do revisor ou alterações solicitadas',
    data_aprovacao DATETIME(6) NULL COMMENT 'Data/hora exata em que foi aprovada',

    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_release_codigo (codigo),
    UNIQUE KEY uk_release_ano_semana (ano, semana),
    CONSTRAINT fk_rel_autor_id
        FOREIGN KEY (autor_id)
        REFERENCES usuarios (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_rel_revisor_id
        FOREIGN KEY (revisor_id)
        REFERENCES usuarios (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    KEY idx_rel_autor (autor_id),
    KEY idx_rel_revisor (revisor_id),
    KEY idx_rel_ano_mes (ano, mes),
    KEY idx_rel_semana_ano (semana, ano),
    KEY idx_rel_status (status),
    KEY idx_rel_views (total_visualizacoes DESC),
    KEY idx_rel_destaque (destaque_semana),
    KEY idx_rel_publicacao (data_publicacao DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Semanas de entrega de releases com vínculo a usuários autores e revisores';

-- =========================================================================
-- 14. PROJETOS ESCOPO (ESCOPOS ANUAIS E CICLOS MACRO DE PROJETOS)
-- =========================================================================
CREATE TABLE projetos_escopo (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do projeto/escopo',
    codigo VARCHAR(20) NOT NULL COMMENT 'Código identificador do Projeto (Ex: PE-D26.06a)',
    nome VARCHAR(255) NOT NULL COMMENT 'Nome oficial do escopo de projeto (ex: Escopo Anual 2026)',
    versao VARCHAR(50) NOT NULL COMMENT 'Versão anual macro (ex: v2026.1)',
    ano INT UNSIGNED NOT NULL COMMENT 'Ano civil do projeto',
    data_inicio DATE NOT NULL COMMENT 'Data de início dos desenvolvimentos',
    data_final DATE NOT NULL COMMENT 'Data final de conclusão prevista',
    data_previsao DATE NOT NULL COMMENT 'Data estimada de entrega geral',
    data_publicacao DATE NOT NULL COMMENT 'Data em que o escopo foi tornado público',
    status ENUM(
        'Em Andamento',
        'Homologação',
        'Concluído',
        'Publicado'
    ) NOT NULL DEFAULT 'Em Andamento' COMMENT 'Status do projeto',
    softwares_contemplados JSON NOT NULL COMMENT 'Array JSON de softwares contemplados',
    descricao_geral MEDIUMTEXT NOT NULL COMMENT 'Visão geral e objetivos de negócio',
    total_visualizacoes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contador de acessos ao projeto',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_projeto_codigo (codigo),
    KEY idx_proj_ano (ano),
    KEY idx_proj_versao (versao),
    KEY idx_proj_status (status),
    KEY idx_proj_views (total_visualizacoes DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Cadastro de escopos anuais de projetos corporativos';

-- =========================================================================
-- 15. MANUAIS MENSAL (CATÁLOGO MENSAL DE MANUAIS E PROCEDIMENTOS TÉCNICOS)
-- =========================================================================
CREATE TABLE manuais_mensal (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do catálogo mensal',
    codigo VARCHAR(20) NOT NULL COMMENT 'Código unico do Manual (Ex: MAN-01/2026)',
    ano INT UNSIGNED NOT NULL COMMENT 'Ano de referência (ex: 2026)',
    mes VARCHAR(30) NOT NULL COMMENT 'Mês de referência por extenso (ex: Outubro)',
    mes_numero TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Mês numeral (1 a 12)',
    titulo VARCHAR(255) NOT NULL COMMENT 'Título do catálogo mensal de manuais',
    descricao MEDIUMTEXT NULL COMMENT 'Visão geral e escopo dos manuais publicados no mês',
    status ENUM('Rascunho', 'Em Revisão', 'Alterações Solicitadas', 'Aprovado', 'Publicado') NOT NULL DEFAULT 'Rascunho' COMMENT 'Status de workflow do catálogo mensal',
    destaque_mes TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Destaque principal do mês',
    destaque_semana TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Fixar em destaque semanal',
    arquivada TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Catálogo arquivado (soft): some da listagem sem apagar dados/itens',
    total_visualizacoes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contador de visualizações do manual',
    autor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (autor/gestor do manual)',
    revisor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (revisor técnico)',
    revisor_feedback TEXT NULL COMMENT 'Parecer técnico e observações do revisor',
    data_criacao DATE NOT NULL COMMENT 'Data de criação do catálogo mensal',
    data_publicacao DATE NULL COMMENT 'Data de publicação pública',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_manual_codigo (codigo),
    UNIQUE KEY uk_manual_ano_mes (ano, mes_numero),
    CONSTRAINT fk_manuais_autor_id
        FOREIGN KEY (autor_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_manuais_revisor_id
        FOREIGN KEY (revisor_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    KEY idx_manuais_ano_mes (ano, mes_numero),
    KEY idx_manuais_status (status),
    KEY idx_manuais_destaque (destaque_mes, destaque_semana),
    KEY idx_manuais_arquivada (arquivada),
    KEY idx_manuais_views (total_visualizacoes DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Catálogos mensais de manuais e procedimentos técnicos';

-- =========================================================================
-- 16. ENTREGAS ITENS (TABELA ÚNICA DE ITENS: RELEASE WEEK, PROJETOS E MANUAIS)
-- =========================================================================
CREATE TABLE entregas_itens (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do item / chamada',
    origem ENUM('Release', 'Projeto', 'Manual', 'Ambos') NOT NULL DEFAULT 'Release' COMMENT 'Contexto: Release Week, Projeto Anual, Manual Mensal ou Ambos',
    release_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para release_week.id (se vinculado a release)',
    projeto_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para projetos_escopo.id (se vinculado a projeto)',
    manual_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para manuais_mensal.id (se possui manual criado)',
    software_id VARCHAR(20) NULL COMMENT 'Chave estrangeira apontando para softwares.codigo',
    parceiro_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para parceiros.id',
    autor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (operador que lançou a chamada)',
    autor_nome VARCHAR(150) NULL COMMENT 'Nome do operador autor do lançamento',
    chamada VARCHAR(60) NOT NULL COMMENT 'Número da chamada técnica / chamado / protocolo (ex: 0000578990 ou CH-2026-8941)',
    data_lancamento DATE NULL COMMENT 'Data de lançamento (sempre 2ª feira)',
    data_liberacao DATE NULL COMMENT 'Data de liberação técnica (sempre 2ª feira)',
    `release` VARCHAR(50) NULL COMMENT 'Código da release vinculado/herdado (ex: 26.06a10.05a)',
    titulo VARCHAR(255) NOT NULL COMMENT 'Título resumido da melhoria, correção ou procedimento',
    parceiro VARCHAR(150) NOT NULL COMMENT 'Parceiro solicitante ou homologador',
    software VARCHAR(100) NOT NULL COMMENT 'Software atendido',
    modulo VARCHAR(100) NOT NULL COMMENT 'Módulo funcional adicionado na tabela de lançamento das chamadas (ex: Fiscal, Financeiro, Frente de Caixa, WMS, Estoque, etc.)',
    menu_funcionalidade VARCHAR(100) NULL COMMENT 'Menu dos Módulos funcionais dos Sistemas',
    tipo ENUM(
        'Correção',
        'Melhoria',
        'Nova Funcionalidade'
    ) NOT NULL DEFAULT 'Correção' COMMENT 'Classificação técnica da alteração',
    impacto ENUM(
        'Baixo',
        'Médio',
        'Alto',
        'Crítico'
    ) NOT NULL DEFAULT 'Médio' COMMENT 'Nível de impacto da alteração técnica (Baixo, Médio, Alto, Crítico)',
    situacao ENUM(
        'Desenvolvimento',
        'Homologação',
        'Implantado'
    ) NOT NULL DEFAULT 'Desenvolvimento' COMMENT 'Fase de execução do escopo',
    descricao_completa MEDIUMTEXT NOT NULL COMMENT 'Detalhamento do impacto, causas, manual e validação',
    link_manual TEXT NULL COMMENT 'URL do manual de apoio ou documento passo a passo',
    link_video TEXT NULL COMMENT 'URL do vídeo explicativo/demonstrativo',
    imagens JSON NULL COMMENT 'Array JSON com URLs de imagens/evidências',
    status ENUM(
        'Revisar',
        'Aprovado',
        'Publicar'
    ) NOT NULL DEFAULT 'Revisar' COMMENT 'Status de workflow na esteira: Revisar, Aprovado ou Publicar',
    tags JSON NULL COMMENT 'Tags/assuntos em JSON para busca rápida por tema',
    ordem_apresentacao INT NOT NULL DEFAULT 0 COMMENT 'Ordem de ordenação na lista',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    CONSTRAINT fk_entregas_rel_id
        FOREIGN KEY (release_id)
        REFERENCES release_week(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_proj_id
        FOREIGN KEY (projeto_id)
        REFERENCES projetos_escopo(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_man_id
        FOREIGN KEY (manual_id)
        REFERENCES manuais_mensal(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_soft_id
        FOREIGN KEY (software_id)
        REFERENCES softwares(codigo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_parc_id
        FOREIGN KEY (parceiro_id)
        REFERENCES parceiros(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_autor_id
        FOREIGN KEY (autor_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    KEY idx_entregas_rel (release_id),
    KEY idx_entregas_proj (projeto_id),
    KEY idx_entregas_man (manual_id),
    KEY idx_entregas_origem (origem),
    KEY idx_entregas_soft (software_id),
    KEY idx_entregas_parc (parceiro_id),
    KEY idx_entregas_autor (autor_id),
    KEY idx_entregas_chamada (chamada),
    KEY idx_entregas_release (`release`),
    KEY idx_entregas_software (software),
    KEY idx_entregas_modulo (modulo),
    KEY idx_entregas_parceiro (parceiro),
    KEY idx_entregas_tipo (tipo),
    KEY idx_entregas_impacto (impacto),
    KEY idx_entregas_situacao (situacao),
    KEY idx_entregas_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Tabela única e unificada de itens para Releases Week, Projetos e Manuais';

-- =========================================================================
-- 17. ANEXOS E MÍDIAS (FKs TIPADAS PARA ENTREGAS ITENS E MANUAIS)
-- =========================================================================
CREATE TABLE anexos_midias (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do imagem/anexo',
    entrega_item_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para entregas_itens.id',
    manual_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para manuais_mensal.id',
    url_arquivo VARCHAR(500) NOT NULL COMMENT 'URL pública (CDN/S3/GCS) ou caminho físico (/storage/uploads/...)',
    nome_arquivo VARCHAR(255) NULL COMMENT 'Nome original do arquivo enviado',
    tipo_mime VARCHAR(100) NOT NULL DEFAULT 'image/png' COMMENT 'Tipo MIME do anexo (image/png, image/webp, image/jpeg, etc)',
    tamanho_bytes INT UNSIGNED NULL COMMENT 'Tamanho do arquivo em bytes',
    largura_px INT UNSIGNED NULL COMMENT 'Largura da imagem em pixels',
    altura_px INT UNSIGNED NULL COMMENT 'Altura da imagem em pixels',
    legenda_alt VARCHAR(255) NULL COMMENT 'Legenda e texto alternativo para acessibilidade e lightbox',
    ordem_exibicao INT NOT NULL DEFAULT 0 COMMENT 'Posição na galeria de imagens do item',
    destaque_capa TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica se é a imagem de capa/miniatura principal',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_midias_entrega_item
        FOREIGN KEY (entrega_item_id)
        REFERENCES entregas_itens(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_midias_manual
        FOREIGN KEY (manual_id)
        REFERENCES manuais_mensal(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    KEY idx_midias_entrega_item (entrega_item_id),
    KEY idx_midias_manual (manual_id),
    KEY idx_midias_ordem_item (entrega_item_id, ordem_exibicao),
    KEY idx_midias_ordem_manual (manual_id, ordem_exibicao),
    KEY idx_midias_criado_em (criado_em DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Tabela relacional de imagens com CASCADE para exclusão limpa';

-- =========================================================================
-- 18. LOGS DE AUDITORIA IMUTÁVEIS (COM FK PARA USUÁRIOS)
-- =========================================================================
CREATE TABLE auditoria (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador do evento de auditoria',
    usuario_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (se cadastrado)',
    data_hora DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Data e hora precisa da ocorrência',
    usuario_nome VARCHAR(150) NOT NULL COMMENT 'Nome do operador que disparou a ação',
    usuario_perfil VARCHAR(100) NOT NULL COMMENT 'Perfil de acesso no momento do evento',
    acao VARCHAR(200) NOT NULL COMMENT 'Descrição da ação executada (ex: Aprovou Release)',
    entidade VARCHAR(80) NOT NULL COMMENT 'Tabela afetada (ex: release_week, usuarios)',
    entidade_id VARCHAR(64) NOT NULL COMMENT 'ID do registro modificado',
    endereco_ip VARCHAR(45) NOT NULL COMMENT 'Endereço IPv4 ou IPv6 do cliente',
    detalhes MEDIUMTEXT NOT NULL COMMENT 'Payload de alterações em texto/JSON',
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_usuario_id
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    KEY idx_audit_usuario_id (usuario_id),
    KEY idx_audit_data_hora (data_hora DESC),
    KEY idx_audit_entidade (entidade, entidade_id),
    KEY idx_audit_usuario (usuario_nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Trilha imutável de auditoria corporativa com vínculo a usuários';

-- =========================================================================
-- 19. NOTIFICAÇÕES DO SISTEMA (COM FK PARA USUÁRIOS)
-- =========================================================================
CREATE TABLE notificacoes_sistema (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador da notificação',
    usuario_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (NULL = broadcast geral)',
    titulo VARCHAR(255) NOT NULL COMMENT 'Assunto da notificação',
    mensagem TEXT NOT NULL COMMENT 'Corpo descritivo do aviso',
    tipo ENUM('info', 'aviso', 'sucesso', 'erro') NOT NULL DEFAULT 'info',
    lida TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica se já foi visualizada',
    link_destino VARCHAR(150) NULL COMMENT 'Rota interna para redirecionamento',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_notif_usuario_id
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    KEY idx_notif_usuario_id (usuario_id),
    KEY idx_notif_lida (lida),
    KEY idx_notif_criado_em (criado_em DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Avisos e notificações internas com vínculo ao usuário destinatário';

-- =========================================================================
-- 20. GOVERNANÇA: HISTÓRICO DA ESTEIRA DE REVISÃO E AUDITORIA DE STATUS
-- =========================================================================
CREATE TABLE historico_esteira_revisao (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do evento na esteira',
    entrega_item_id VARCHAR(64) NOT NULL COMMENT 'Chave estrangeira apontando para entregas_itens.id',
    chamada VARCHAR(60) NOT NULL COMMENT 'Número do ticket ou chamado auditado',
    status_anterior VARCHAR(30) NOT NULL COMMENT 'Status imediatamente anterior no pipeline',
    novo_status VARCHAR(30) NOT NULL COMMENT 'Novo status atribuído (Revisar, Aprovado, Publicar)',
    responsavel_id UUID NULL COMMENT 'Operador responsável pela transição na esteira',
    responsavel_nome VARCHAR(150) NOT NULL COMMENT 'Nome do operador ou revisor QA',
    responsavel_perfil VARCHAR(100) NOT NULL COMMENT 'Perfil RBAC do operador no momento da ação',
    parecer_tecnico TEXT NULL COMMENT 'Justificativa técnica ou parecer do QA/Revisor (Obrigatório em reprovações)',
    criterios_aceite_atendidos TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Flag indicando se passou no checklist formal',
    tempo_no_estagio_minutos INT UNSIGNED NULL COMMENT 'Tempo de permanência no estágio anterior em minutos',
    data_transicao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_hist_entrega_item_id
        FOREIGN KEY (entrega_item_id)
        REFERENCES entregas_itens(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_hist_responsavel_id
        FOREIGN KEY (responsavel_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    KEY idx_hist_esteira_item (entrega_item_id),
    KEY idx_hist_esteira_responsavel (responsavel_id),
    KEY idx_hist_esteira_chamada (chamada),
    KEY idx_hist_esteira_data (data_transicao DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Histórico imutável de transições da esteira de revisão';

-- =========================================================================
-- 21. VIEWS ESPECIALIZADAS PARA COMPATIBILIDADE E CONSULTAS DIRETAS
-- =========================================================================
CREATE OR REPLACE VIEW v_release_itens AS
    SELECT * FROM entregas_itens WHERE release_id IS NOT NULL;

CREATE OR REPLACE VIEW v_projeto_itens AS
    SELECT * FROM entregas_itens WHERE projeto_id IS NOT NULL;

CREATE OR REPLACE VIEW v_manual_itens AS
    SELECT * FROM entregas_itens WHERE manual_id IS NOT NULL OR link_manual IS NOT NULL;

-- Alias de compatibilidade: catálogo mensal de manuais
CREATE OR REPLACE VIEW manuais AS
    SELECT * FROM manuais_mensal;

-- =========================================================================
-- FIM DO SCRIPT DDL (MARIADB 11.8) - ESTRUTURA DAS TABELAS
-- Seeds iniciais (perfis, admin, config): ver 02_seed.sql
-- =========================================================================

-- =========================================================================
-- COMPLEMENTO — OBJETOS ADICIONADOS POR MIGRATIONS POSTERIORES
-- Este arquivo (referência humana) nasceu como a migration 01. As migrations
-- seguintes alteram o schema e NÃO estão refletidas no DDL acima; os objetos
-- reais aplicados incluem:
--   - 03: `configuracoes_globais.sidebar_expandida TINYINT(1) NOT NULL DEFAULT 1`
--   - 04: `usuarios.numero` passa a default '' (limpeza dos 'S/N')
--   - 05/06: tabela `seguranca_eventos_login` (log append-only de tentativas,
--     ENUM de tipo ampliado pela 06) — ver `server/migration/05_*.sql`
--   - 08: `UNIQUE uk_perfis_nome (perfis_acesso.nome_perfil)`; índices
--     `auditoria(acao)` e `seguranca_eventos_login(email_alvo, tipo, ocorrido_em)`
--   - 09: `usuarios.token_version INT NOT NULL DEFAULT 0`
--   - 10: EVENT `ev_expurgo_auditoria` (expurgo diário da trilha às 03:00)
--   - 11: índices `auditoria(data_hora, id)`, `seguranca_eventos_login(ocorrido_em, id)` e
--     `usuarios(nome_completo)` + EVENTs `ev_expurgo_sessoes`/`ev_expurgo_token_blacklist`/`ev_expurgo_seguranca_login`
--   - 12: índices `usuarios(bloqueado_ate)` e `auditoria(usuario_nome)`
-- A fonte da verdade do schema é `server/migration/*.sql` (aplicado no boot).
-- =========================================================================
