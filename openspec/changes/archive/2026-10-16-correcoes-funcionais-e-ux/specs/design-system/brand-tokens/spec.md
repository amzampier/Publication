# Spec Delta

## ADDED Requirements

### Requirement: As superfícies usam tokens de cor, sem hex fora da paleta
As superfícies e detalhes da interface SHALL derivar as cores dos tokens do design system
(`brand.*`), sem hex fixado **fora da paleta** — em particular, os links/realces das telas de
autenticação não podem usar `#2161ef` (cor fora da paleta). A escala navy do fundo das telas de
autenticação é a paleta documentada do `AuthBackground` (`docs/08` §7) e permanece permitida.

#### Scenario: Nenhum hex fora da paleta em telas administrativas
- **WHEN** as telas administrativas (incluindo as telas de autenticação) são inspecionadas
- **THEN** as cores provêm dos tokens do design system, sem valores hex fora da paleta (como `#2161ef`)

### Requirement: O accent usa o token, sem resíduos de lime
Os indicadores e realces de accent SHALL usar `brand-accent` (`#4ed813`), sem resíduos de
`lime-500`/`lime-400` em componentes do kit (ex.: filete/realce da `DataTable`, `Checkbox`,
`CheckCard`, `ChoiceCard`, `UploadFiles`).

#### Scenario: Accent sem lime-500
- **WHEN** os componentes do kit que usam accent são inspecionados
- **THEN** não há classes `lime-500`/`lime-400`; o accent usa o token `brand-accent`
