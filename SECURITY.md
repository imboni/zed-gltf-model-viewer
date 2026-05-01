# Security Policy

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories for this repository when available. If advisories are not available, open an issue with minimal reproduction details and avoid publishing sensitive files.

## Scope

The companion viewer serves files from the configured `--root` directory only and rejects asset paths outside that root. Do not run it against directories containing sensitive files unless you trust users who can access the local server.

