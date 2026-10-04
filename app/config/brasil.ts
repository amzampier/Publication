// Dados estáticos de apoio à Gestão de Usuários (fase em memória, sem rede).
// Fora de components/ de propósito: não é auto-importado como componente
// (mesmo padrão de app/config/navigation.ts) — consumidores importam explícito.

export interface OpcaoSelect {
  value: string
  label: string
}

/** As 27 unidades federativas (sigla → nome) para o select de Estado. */
export const UFS: OpcaoSelect[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]

/** As 5 regiões do Brasil para o select de Região. */
export const REGIOES: OpcaoSelect[] = [
  { value: 'Norte', label: 'Norte' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' }
]

/** Provedores do select de Provedor SMTP. */
export const PROVEDORES_SMTP: OpcaoSelect[] = [
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Outlook/365' },
  { value: 'yahoo', label: 'Yahoo' },
  { value: 'personalizado', label: 'Personalizado' }
]

export interface SegurancaSmtp extends OpcaoSelect {
  /** Porta sugerida ao escolher a segurança (editável depois). */
  porta: string
}

/** Segurança do SMTP com a porta sugerida (25 / 587 / 465). */
export const SEGURANCAS_SMTP: SegurancaSmtp[] = [
  { value: 'nenhuma', label: 'Nenhuma', porta: '25' },
  { value: 'starttls', label: 'STARTTLS', porta: '587' },
  { value: 'ssl', label: 'SSL/TLS', porta: '465' }
]

/** Portas consideradas válidas no teste de conexão simulado. */
export const PORTAS_SMTP_VALIDAS = ['25', '465', '587']
