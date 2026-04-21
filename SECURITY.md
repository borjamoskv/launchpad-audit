# Security Policy

## Supported Versions

Security fixes are handled on `main` until the project starts publishing versioned releases.

## Reporting a Vulnerability

Please do not open public issues for security-sensitive reports.

Send a private report through GitHub Security Advisories when available, or contact the maintainer through the GitHub profile associated with this repository.

## Token Handling

Launchpad Audit supports GitHub tokens for authenticated repository reads. Tokens must be sent only over HTTPS in production and should use the minimum permissions required for the repositories being audited.

Public badge and share endpoints (`/api/badge`, `/r/owner/repo`, and `/r/owner/repo/opengraph-image`) deliberately avoid `GITHUB_TOKEN` and only read public GitHub data. Authenticated tokens are reserved for explicit user-initiated audit and PR flows.
