# Launchpad Audit

[![CI](https://github.com/borjamoskv/launchpad-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/borjamoskv/launchpad-audit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f172a.svg)](LICENSE)

Aplicación web para auditar repositorios de GitHub y convertirlos en proyectos con más tracción.

Demo: https://launchpad-audit.vercel.app

## Qué hace

- Calcula un **Discoverability Score** (0-100) con señales de onboarding y crecimiento.
- Detecta gaps clave del repo: README, licencia, templates, releases, actividad, etc.
- Propone **acciones priorizadas** por impacto.
- Exporta un informe Markdown completo de la auditoría.
- Genera un badge SVG de score para pegarlo en el README del repo.
- Publica páginas compartibles `/r/owner/repo` con score, metadata social y CTA.
- Genera tarjetas Open Graph dinámicas y un sprint de lanzamiento de 7 días por repo.
- Cachea lecturas públicas de GitHub durante 30 minutos sin usar tokens privados.
- Incluye galería pública `/explore` con repos curados y páginas auditables indexadas.
- Expone `robots.txt` y `sitemap.xml` para distribución orgánica.
- Genera copies base para distribución en X, Reddit, Hacker News y dev.to.
- Guarda un historial local de auditorías con tendencia de score por repositorio.
- Genera un **Launch kit** con README, CONTRIBUTING, templates de issues/PR y changelog.
- Puede abrir una Pull Request con el Launch kit en el repo auditado.
- Lista repositorios recientes del usuario cuando GitHub está conectado por OAuth.
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

Para crear Pull Requests desde la app, usa un token u OAuth con permisos de escritura sobre contenidos y pull requests del repositorio objetivo.

### Opción B: OAuth (recomendada)

Configura una GitHub OAuth App con callback:

- Local: `http://localhost:3000/api/auth/github/callback`
- Producción: `https://launchpad-audit.vercel.app/api/auth/github/callback`

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

Para crear una PR con el Launch kit:

- `POST /api/github/launch-kit-pr`
- Requiere OAuth conectado o `githubToken` en el body.
- No usa `GITHUB_TOKEN` de servidor para escrituras; las PRs requieren credencial explícita del usuario.

Para listar repositorios del usuario autenticado:

- `GET /api/github/repos`
- Requiere OAuth conectado.

Para generar un badge SVG público:

- `GET /api/badge?repoUrl=https://github.com/owner/repo`
- Devuelve `image/svg+xml` cacheable para README.
- No acepta tokens por query ni usa `GITHUB_TOKEN`; solo audita repos públicos.

Para compartir una auditoría pública:

- `GET /r/owner/repo`
- Renderiza score, métricas, acciones prioritarias y Markdown del badge.
- Incluye tarjeta Open Graph dinámica en `/r/owner/repo/opengraph-image`.
- Incluye un sprint de lanzamiento de 7 días para ejecutar mejoras.
- Solo usa datos públicos de GitHub; las lecturas se revalidan como máximo cada 30 minutos.

Para explorar auditorías públicas:

- `GET /explore`
- Muestra una galería estática de repos open source curados.
- Cada tarjeta enlaza a su auditoría pública `/r/owner/repo`.
- El sitemap incluye `/explore` y todas las auditorías curadas.

SEO/distribución:

- `GET /robots.txt`
- `GET /sitemap.xml`

## Despliegue rápido (Vercel)

1. Importa el repo en Vercel o usa `npx vercel deploy --prod`.
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
