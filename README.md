# Launchpad Audit

Aplicación web para auditar repositorios de GitHub y convertirlos en proyectos con más tracción.

## Qué hace

- Calcula un **Discoverability Score** (0-100) con señales de onboarding y crecimiento.
- Detecta gaps clave del repo: README, licencia, templates, releases, actividad, etc.
- Propone **acciones priorizadas** por impacto.
- Genera copies base para distribución en X, Reddit, Hacker News y dev.to.
- Genera un **Launch kit** con README, CONTRIBUTING, templates de issues/PR y changelog.
- Permite usar token de GitHub opcional para evitar rate limit y auditar repos privados.
- Incluye conexión OAuth de GitHub (opcional) para no introducir token manual en cada auditoría.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Vitest

## Ejecutar en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

App en `http://localhost:3000`.

## Configuración de GitHub

### Opción A: token manual (rápida)

- Campo "Token GitHub (opcional)" en la UI (se usa solo en esa petición).
- Variable de entorno en servidor:

```bash
GITHUB_TOKEN=tu_token
```

### Opción B: OAuth (recomendada)

Configura una GitHub OAuth App con callback:

- Local: `http://localhost:3000/api/auth/github/callback`
- Producción: `https://tu-dominio/api/auth/github/callback`

Variables:

```bash
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_REDIRECT_URI=    # opcional, si no se deriva automáticamente
```

Nunca subas `.env.local` al repositorio.

## Scripts

```bash
npm run dev      # desarrollo
npm run test     # tests unitarios
npm run lint     # lint
npm run build    # build de producción
```

## API interna

`POST /api/audit`

Body JSON:

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "objective": "Conseguir 100 stars en 30 días",
  "githubToken": "opcional"
}
```

También se exponen endpoints de conexión OAuth:

- `GET /api/auth/github/start`
- `GET /api/auth/github/callback`
- `GET /api/auth/github/status`
- `POST /api/auth/github/disconnect`

## Despliegue rápido (Vercel)

1. Importa el repo en Vercel.
2. Añade variables (`GITHUB_TOKEN` o bloque OAuth) en Variables de Entorno.
3. Deploy.

## CI

Incluye workflow de GitHub Actions en `.github/workflows/ci.yml` que ejecuta:

- `npm ci`
- `npm run test`
- `npm run lint`
- `npm run build`

## Notas

- Consume API oficial de GitHub.
- Si no usas token, puedes alcanzar límite de peticiones anónimas.
