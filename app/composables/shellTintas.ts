const corTinta: Record<string, string> = {
  '#f45f71': '#f89faa',
  '#1a9e07': '#76c56a',
  '#50a1ff': '#96c7ff',
  '#047857': '#68ae9a',
  '#0364f7': '#68a2fa',
  '#b070ef': '#d0a9f5',
  '#f5b302': '#f9d167',
  '#2dd4bf': '#81e5d9',
  '#f59e0b': '#f9c56d',
  '#8b5cf6': '#b99dfa'
}

export const tinta = (hex: string): string => corTinta[hex] ?? hex
