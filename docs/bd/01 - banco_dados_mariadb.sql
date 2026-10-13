-- =========================================================================
-- PUBLICATION ENTERPRISE PLATFORM - SCHEMA DDL (MARIADB 11.8+ LTS)
-- BANCO DE DADOS: publication
-- Idioma das Tabelas e Campos: Português do Brasil (PT-BR)
-- Engine Padrão: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_520_ci
-- Otimizado para MariaDB 11.8: JSON_VALID constraints, UUID nativo,
-- Precisão de microssegundos (DATETIME(6)) e Integridade Referencial CASCADE.
-- =========================================================================

-- 1. CRIAÇÃO DO BANCO DE DADOS
CREATE DATABASE IF NOT EXISTS publication
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_520_ci;

USE publication;

-- Desativar temporariamente verificação de chaves estrangeiras para setup limpo
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================================
-- 2. PERFIS DE ACESSO PARA CONTROLE RBAC (DINÂMICO)
-- =========================================================================
DROP TABLE IF EXISTS _migrations;
CREATE TABLE _migrations (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `executado_em` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- =========================================================================
-- 3. PERFIS DE ACESSO PARA CONTROLE RBAC (DINÂMICO)
-- =========================================================================
DROP TABLE IF EXISTS perfis_acesso;
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
DROP TABLE IF EXISTS permissoes_perfil;
CREATE TABLE permissoes_perfil (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador do registro de permissão',
    perfil_id UUID NOT NULL COMMENT 'Chave estrangeira apontando para perfis_acesso.id',
    modulo VARCHAR(100) NOT NULL COMMENT 'Identificador do módulo ou funcionalidade do sistema',
    pode_visualizar TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permissão de leitura e consulta',
    pode_incluir TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permissão de incluir',
    pode_editar TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permissão de alteração',
    pode_excluir TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permissão de exclusão de registros',
    pode_exportar TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Permissão de exportação para Excel/PDF',
    extras JSON DEFAULT NULL COMMENT 'Funcionalidades e permissões extras em formato JSON',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_perfil_modulo (perfil_id, modulo),
    KEY idx_permissoes_perfil (perfil_id),
    CONSTRAINT fk_permissoes_perfil FOREIGN KEY (perfil_id)
        REFERENCES perfis_acesso (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Matriz de autorizações por perfil e módulo com extras em JSON';

-- =========================================================================
-- 5. USUÁRIOS E OPERADORES DO SISTEMA (ENDEREÇO E SMTP CORPORATIVO)
-- =========================================================================
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do operador',
    nome_completo VARCHAR(150) NOT NULL COMMENT 'Nome completo do usuário',
    email_corporativo VARCHAR(255) NOT NULL COMMENT 'E-mail corporativo único para autenticação',
    hash_senha VARCHAR(255) NOT NULL COMMENT 'Senha criptografada com algoritmo forte (bcrypt)',
    perfil_id UUID NOT NULL COMMENT 'Perfil de acesso atribuído ao operador',
    departamento_setor VARCHAR(100) NOT NULL DEFAULT 'Geral' COMMENT 'Área ou departamento de trabalho',
    funcao VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Cargo ou função desempenhada pelo usuário',
    telefone VARCHAR(30) NULL COMMENT 'Telefone ou ramal de contato',
    avatar_url VARCHAR(500) NULL COMMENT 'URL pública da foto/avatar do usuário',
    situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'ativo' COMMENT 'Status de acesso do usuário',
    cep VARCHAR(10) NOT NULL DEFAULT '' COMMENT 'Código de Endereçamento Postal',
    endereco VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Logradouro / Rua / Avenida',
    numero VARCHAR(20) NOT NULL DEFAULT 'S/N' COMMENT 'Número residencial ou S/N',
    complemento VARCHAR(100) NULL COMMENT 'Complemento de endereço',
    bairro VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Bairro ou Distrito',
    cidade VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Município de residência',
    estado CHAR(2) NOT NULL DEFAULT '' COMMENT 'Sigla da Unidade Federativa (UF)',
    provedor ENUM('Custom', 'Google') NOT NULL DEFAULT 'Custom' COMMENT 'Provedor de e-mail corporativo (Custom ou Google)',
    smtp VARCHAR(255) NULL COMMENT 'Servidor SMTP para envio de mensagens',
    porta INT NULL COMMENT 'Porta do servidor SMTP (ex: 587, 465)',
    email_smtp VARCHAR(255) NULL COMMENT 'E-mail utilizado para autenticação e envio SMTP / Google',
    senha_smtp VARCHAR(255) NULL COMMENT 'Senha do servidor SMTP para envio corporativo dedicado',
    metodo_seguranca ENUM('Indefinido', 'SSL 2', 'SSL 2.3', 'SSL 3', 'TLS', 'TLS 1.1', 'TLS 1.2') NOT NULL DEFAULT 'TLS 1.2' COMMENT 'Protocolo criptográfico de transporte',
    metodo_certificado ENUM('Indefinido', 'Cliente', 'Servidor', 'Ambos') NOT NULL DEFAULT 'Indefinido' COMMENT 'Método de validação/autenticação de certificados',
    ultimo_login DATETIME(6) NULL COMMENT 'Data e hora do último login realizado',
    
    -- Registro de Convites Enviados
    convite_email_enviado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Registra se o convite por e-mail já foi enviado ao usuário',
    convite_email_enviado_em DATETIME(6) NULL COMMENT 'Data e hora do envio do convite por e-mail',
    convite_whatsapp_enviado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Registra se o convite por WhatsApp já foi enviado ao usuário',
    convite_whatsapp_enviado_em DATETIME(6) NULL COMMENT 'Data e hora do envio do convite por WhatsApp',

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
DROP TABLE IF EXISTS parceiros;
CREATE TABLE parceiros (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do parceiro',
    razao_social VARCHAR(255) NOT NULL COMMENT 'Razão social oficial',
    nome_fantasia VARCHAR(150) NOT NULL COMMENT 'Nome fantasia / marca comercial',
    cidade VARCHAR(120) NOT NULL COMMENT 'Cidade sede',
    estado CHAR(2) NOT NULL COMMENT 'Sigla do Estado (UF)',
    situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_parceiros_nome_fantasia (nome_fantasia),
    KEY idx_parceiros_situacao (situacao),
    KEY idx_parceiros_estado (estado),
    KEY idx_parceiros_cidade (cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Cadastro de parceiros clientes e distribuidores';

-- =========================================================================
-- 7. CADASTRO: SOFTWARES (SISTEMAS E SOLUÇÕES TECNOLÓGICAS)
-- =========================================================================
DROP TABLE IF EXISTS softwares;
CREATE TABLE softwares (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do software',
    descricao VARCHAR(200) NOT NULL COMMENT 'Nome/descrição do sistema',
    categoria ENUM('Delphi', 'Web', 'Delphi e Web') NOT NULL DEFAULT 'Delphi' COMMENT 'Tecnologia do sistema',
    situacao ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação de manutenção',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_softwares_descricao (descricao),
    KEY idx_softwares_categoria (categoria),
    KEY idx_softwares_situacao (situacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Catálogo de softwares corporativos';

-- =========================================================================
-- 8. CONFIGURAÇÕES GLOBAIS DA PLATAFORMA (COM PREFERÊNCIAS DO SIDEBAR)
-- =========================================================================
DROP TABLE IF EXISTS configuracoes_globais;
CREATE TABLE configuracoes_globais (
    id VARCHAR(32) NOT NULL COMMENT 'Chave única da configuração (ex: config_default)',
    nome_empresa VARCHAR(150) NOT NULL DEFAULT 'Publication Enterprise Suite' COMMENT 'Nome corporativo exibido no topo',
    banner_publico_ativo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Exibição do banner no portal público',
    banner_texto TEXT NULL COMMENT 'Texto informativo do banner público',
    banner_tipo ENUM('info', 'alerta', 'novidade') NOT NULL DEFAULT 'novidade' COMMENT 'Tipo visual do banner',
    exigir_revisao_para_publicar TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Workflow: exige aprovação antes de publicar',
    notificar_por_email TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Habilita disparos de notificação por e-mail',
    
    -- Preferências de Menu Lateral (Sidebar Grupos Expandidos/Recolhidos)
    sidebar_grupos JSON NOT NULL DEFAULT '{"publicacoes":true,"lancamentos":true,"cadastros":true,"seguranca":true,"sistema":true}' CHECK (JSON_VALID(sidebar_grupos)) COMMENT 'Objeto JSON com estado inicial (true=expandido, false=recolhido) de cada grupo do sidebar',
    sidebar_publicacoes TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Grupo Publicações inicia expandido (1) ou recolhido (0)',
    sidebar_lancamentos TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Grupo Lançamentos inicia expandido (1) ou recolhido (0)',
    sidebar_cadastros TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Grupo Cadastros inicia expandido (1) ou recolhido (0)',
    sidebar_seguranca TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Grupo Governança & Acesso inicia expandido (1) ou recolhido (0)',
    sidebar_sistema TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Grupo Sistema & Configurações inicia expandido (1) ou recolhido (0)',

    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Configurações e parâmetros globais do sistema com preferências do sidebar';

-- =========================================================================
-- 9. RELEASES SEMANA (CICLOS SEMANAIS DE LANÇAMENTO)
-- =========================================================================
DROP TABLE IF EXISTS releases_week;
CREATE TABLE releases_semana (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único da release week',
	codigo VARCHAR(20) NOT NULL COMMENT 'Código da Release Week (Ex: RW-01/2026)',
    nome VARCHAR(255) NOT NULL COMMENT 'Título da release week (ex: Release Week 39 - 2026)',
    versao VARCHAR(50) NULL COMMENT 'Versão técnica digitada no cabeçalho (ex: 26.06a)',
    release VARCHAR(50) NULL COMMENT 'Código da release digitada no cabeçalho (ex: 26.06a10.05a)',
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
-- 10. PROJETOS ESCOPO (ESCOPOS ANUAIS E CICLOS MACRO DE PROJETOS)
-- =========================================================================
DROP TABLE IF EXISTS projetos_escopo;
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
    softwares_contemplados LONGTEXT NOT NULL CHECK (JSON_VALID(softwares_contemplados)) COMMENT 'Array JSON de softwares contemplados',
    descricao_geral MEDIUMTEXT NOT NULL COMMENT 'Visão geral e objetivos de negócio',
    total_visualizacoes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contador de acessos ao projeto',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_proj_ano (ano),
    KEY idx_proj_versao (versao),
    KEY idx_proj_status (status),
    KEY idx_proj_views (total_visualizacoes DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Cadastro de escopos anuais de projetos corporativos';

-- =========================================================================
-- 11. MANUAIS MENSAL (CATÁLOGO MENSAL DE MANUAIS E PROCEDIMENTOS TÉCNICOS)
-- =========================================================================
DROP TABLE IF EXISTS manuais_mensal;
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
    total_visualizacoes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contador de visualizações do manual',
    autor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (autor/gestor do manual)',
    revisor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (revisor técnico)',
    revisor_feedback TEXT NULL COMMENT 'Parecer técnico e observações do revisor',
    data_criacao DATE NOT NULL COMMENT 'Data de criação do catálogo mensal',
    data_publicacao DATE NULL COMMENT 'Data de publicação pública',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
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
    KEY idx_manuais_views (total_visualizacoes DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Catálogos mensais de manuais e procedimentos técnicos';

-- =========================================================================
-- 12. ENTREGAS ITENS (TABELA ÚNICA DE ITENS: RELEASES WEEK, PROJETOS E MANUAIS)
-- =========================================================================
DROP TABLE IF EXISTS entregas_itens;
CREATE TABLE entregas_itens (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador único do item / chamada',
    origem ENUM('Release', 'Projeto', 'Manual', 'Ambos') NOT NULL DEFAULT 'Release' COMMENT 'Contexto: Release Week, Projeto Anual, Manual Mensal ou Ambos',
    release_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para releases_semana.id (se vinculado a release)',
    projeto_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para projetos_escopo.id (se vinculado a projeto)',
    manual_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para manuais_mensal.id (se possui manual criado)',
    software_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para softwares.id',
    parceiro_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para parceiros.id',
    autor_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (operador que lançou a chamada)',
    autor_nome VARCHAR(150) NULL COMMENT 'Nome do operador autor do lançamento',
    chamada VARCHAR(60) NOT NULL COMMENT 'Número da chamada técnica / chamado / protocolo (ex: 0000578990 ou CH-2026-8941)',
    data_lancamento DATE NULL COMMENT 'Data de lançamento (sempre 2ª feira)',
    data_liberacao DATE NULL COMMENT 'Data de liberação técnica (sempre 2ª feira)',
    release VARCHAR(50) NULL COMMENT 'Código da release vinculado/herdado (ex: 26.06a10.05a)',
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
    imagens LONGTEXT NULL CHECK (imagens IS NULL OR JSON_VALID(imagens)) COMMENT 'Array JSON com URLs de imagens/evidências',
    status ENUM(
        'Revisar',
        'Aprovado',
        'Publicar'
    ) NOT NULL DEFAULT 'Revisar' COMMENT 'Status de workflow na esteira: Revisar, Aprovado ou Publicar',
    tags LONGTEXT NULL CHECK (tags IS NULL OR JSON_VALID(tags)) COMMENT 'Tags/assuntos em JSON para busca rápida por tema',
    ordem_apresentacao INT NOT NULL DEFAULT 0 COMMENT 'Ordem de ordenação na lista',
    criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    PRIMARY KEY (id),
    CONSTRAINT fk_entregas_rel_id 
        FOREIGN KEY (release_id) 
        REFERENCES releases_week(id) 
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
        REFERENCES softwares(id) 
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
    KEY idx_entregas_release (release),
    KEY idx_entregas_software (software),
    KEY idx_entregas_modulo (modulo),
    KEY idx_entregas_parceiro (parceiro),
    KEY idx_entregas_tipo (tipo),
    KEY idx_entregas_impacto (impacto),
    KEY idx_entregas_situacao (situacao),
    KEY idx_entregas_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Tabela única e unificada de itens para Releases Week, Projetos e Manuais';

-- Views especializadas para compatibilidade e consultas diretas
CREATE OR REPLACE VIEW v_release_itens AS 
    SELECT * FROM entregas_itens WHERE release_id IS NOT NULL;

CREATE OR REPLACE VIEW v_projeto_itens AS 
    SELECT * FROM entregas_itens WHERE projeto_id IS NOT NULL;

CREATE OR REPLACE VIEW v_manual_itens AS 
    SELECT * FROM entregas_itens WHERE manual_id IS NOT NULL OR link_manual IS NOT NULL;

CREATE OR REPLACE VIEW manuais AS 
    SELECT * FROM manuais_mensal;

-- =========================================================================
-- 13. ANEXOS E MÍDIAS (COM FK PARA ENTREGAS ITENS E MANUAIS)
-- =========================================================================
DROP TABLE IF EXISTS anexos_midias;
CREATE TABLE anexos_midias (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único da imagem/anexo',
    entrega_item_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para entregas_itens.id',
    manual_id VARCHAR(64) NULL COMMENT 'Chave estrangeira apontando para manuais.id',
    tipo_entidade ENUM('entrega_item', 'manual') NOT NULL COMMENT 'Entidade proprietária (entrega_item ou manual)',
    entidade_id VARCHAR(64) NOT NULL COMMENT 'Chave lógica apontando para entregas_itens.id ou manuais.id',
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
        REFERENCES manuais(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    KEY idx_midias_entrega_item (entrega_item_id),
    KEY idx_midias_manual (manual_id),
    KEY idx_midias_entidade (tipo_entidade, entidade_id),
    KEY idx_midias_ordem (entidade_id, ordem_exibicao),
    KEY idx_midias_criado_em (criado_em DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Tabela relacional de imagens com CASCADE para exclusão limpa';

-- =========================================================================
-- 14. LOGS DE AUDITORIA IMUTÁVEIS (COM FK PARA USUÁRIOS)
-- =========================================================================
DROP TABLE IF EXISTS auditoria;
CREATE TABLE auditoria (
    id VARCHAR(64) NOT NULL COMMENT 'Identificador do evento de auditoria',
    usuario_id UUID NULL COMMENT 'Chave estrangeira apontando para usuarios.id (se cadastrado)',
    data_hora DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Data e hora precisa da ocorrência',
    usuario_nome VARCHAR(150) NOT NULL COMMENT 'Nome do operador que disparou a ação',
    usuario_perfil VARCHAR(80) NOT NULL COMMENT 'Perfil de acesso no momento do evento',
    acao VARCHAR(200) NOT NULL COMMENT 'Descrição da ação executada (ex: Aprovou Release)',
    entidade VARCHAR(80) NOT NULL COMMENT 'Tabela afetada (ex: releases_semana, usuarios)',
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
-- 15. SEGURANÇA: CONFIGURAÇÕES DE LIMITE DE REQUISIÇÃO (RATE LIMIT)
-- =========================================================================
DROP TABLE IF EXISTS configuracoes_limite_requisicao;
CREATE TABLE configuracoes_limite_requisicao (
    id VARCHAR(32) NOT NULL COMMENT 'Chave única de rate limit',
    ativo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica se a proteção de tráfego está ativa',
    limite_requisicoes_minuto INT UNSIGNED NOT NULL DEFAULT 120 COMMENT 'Máximo de requisições por minuto',
    limite_pico INT UNSIGNED NOT NULL DEFAULT 180 COMMENT 'Teto máximo em rajadas momentâneas',
    taxa_atual INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Taxa atual registrada no nó',
    ips_bloqueados LONGTEXT NULL CHECK (ips_bloqueados IS NULL OR JSON_VALID(ips_bloqueados)) COMMENT 'Lista de IPs bloqueados em formato JSON',
    atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Controle de tráfego e rate limit da API';

-- =========================================================================
-- 16. NOTIFICAÇÕES DO SISTEMA (COM FK PARA USUÁRIOS)
-- =========================================================================
DROP TABLE IF EXISTS notificacoes_sistema;
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
-- 17. GOVERNANÇA: HISTÓRICO DA ESTEIRA DE REVISÃO E AUDITORIA DE STATUS
-- =========================================================================
DROP TABLE IF EXISTS historico_esteira_revisao;
CREATE TABLE historico_esteira_revisao (
    id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do evento na esteira',
    entrega_item_id VARCHAR(64) NOT NULL COMMENT 'Chave estrangeira apontando para entregas_itens.id',
    chamada VARCHAR(60) NOT NULL COMMENT 'Número do ticket ou chamado auditado',
    status_anterior VARCHAR(30) NOT NULL COMMENT 'Status imediatamente anterior no pipeline',
    novo_status VARCHAR(30) NOT NULL COMMENT 'Novo status atribuído (Revisar, Aprovado, Publicar)',
    responsavel_id UUID NULL COMMENT 'Operador responsável pela transição na esteira',
    responsavel_nome VARCHAR(150) NOT NULL COMMENT 'Nome do operador ou revisor QA',
    responsavel_perfil VARCHAR(80) NOT NULL COMMENT 'Perfil RBAC do operador no momento da ação',
    parecer_tecnico TEXT NULL COMMENT 'Justificativa técnica ou parecer do QA/Revisor (Obrigatório em reprovações)',
    criterios_aceite_atendidos TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Flag indicando se passou no checklist formal',
    tempo_no_estagio_minutos INT UNSIGNED NULL COMMENT 'Tempo de permanência no estágio anterior em minutos',
    data_transicao DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_hist_entrega_item_id 
        FOREIGN KEY (entrega_item_id) 
        REFERENCES entregas_itens(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_hist_responsavel_id 
        FOREIGN KEY (responsavel_id) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    KEY idx_hist_esteira_item (entrega_item_id),
    KEY idx_hist_esteira_chamada (chamada),
    KEY idx_hist_esteira_data (data_transicao DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Histórico imutável de transições da esteira de revisão';

-- Reativar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- FIM DO SCRIPT DDL (MARIADB 11.8) - ESTRUTURA DAS TABELAS
-- =========================================================================
