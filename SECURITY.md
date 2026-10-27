# Security Policy

## Supported Versions

| Component | Version | Support |
|-----------|---------|---------|
| server (`server/`) | main branch | ✅ Security fixes land on `main` |
| web (`web/`) | main branch | ✅ Security fixes land on `main` |

mosaicStacked is deployed as a fast-moving single-branch project. Please always run the latest `main`.

## Reporting a Vulnerability

- **Preferred:** open a private GitHub security advisory via *Security → Report a vulnerability* on this repository.
- **Fallback:** contact the maintainers directly (see GitHub profile `baum777`).

Please include: affected endpoint/component, reproduction steps, and impact assessment. Do **not** open public issues for exploitable findings.

We aim to acknowledge reports within **72 hours** and to publish a fix or mitigation for critical findings within **7 days**.

## Security Model (overview)

### Authority boundaries
- The browser never sees provider keys, GitHub tokens, or agent admin keys. All provider calls are backend-owned.
- Chat, GitHub, and Matrix model routing is resolved server-side; the frontend cannot request privileged provider models (`assertNoFrontendProviderModelOverride`).

### Authentication gates
- **GitHub write chain** (`/api/github/actions/:planId/execute`): requires `GITHUB_AGENT_API_KEY` via `X-MosaicStacked-Admin-Key` (timing-safe compare), checked before any credential resolution.
- **Matrix write chain** (`/api/matrix/analyze`, `/api/matrix/actions/:planId/execute`): requires `MATRIX_AGENT_API_KEY` via the same header **or** a completed Matrix SSO integration session; enforced before plan creation/execution, plus a dedicated rate limit scope.
- **GitHub read/propose surfaces**: require an integration session with a connected GitHub credential or a valid agent admin key; anonymous requests never fall back to instance credentials.
- **Integration sessions**: session ids are only honored when previously issued by the server (fixation-resistant) and expire after `INTEGRATION_AUTH_SESSION_TTL_SECONDS` (default 7 days idle).

### Fail-closed posture
- Unconfigured integrations answer with generic 503 responses (`github_not_configured`, `matrix_not_configured`) — no configuration detail leaks.
- Matrix evidence writes that are configured as required fail the execution when they cannot be written.
- Model routing is policy-driven (`config/model-capabilities.yml`); execution paths enforce `require_approval_before_execute` and `allow_fallback_on_execute`.

### Data protection
- GitHub/Matrix credentials are stored as AES-256-GCM encrypted envelopes bound to their session and provider (`server/src/lib/integration-auth-store.ts`).
- Logs redact tokens and secrets; the runtime journal stores only safe metadata.

### Transport & browser hardening
- `vercel.json` sets CSP (`default-src 'self'`, no inline scripts, `frame-ancestors 'none'`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` on every route.
- Integration session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- The service worker serves unhashed assets network-first and keeps one previous cache version for stale tabs.

### Rate limiting
In-memory per-instance windows protect chat, auth, GitHub propose/execute/read/capabilities, and Matrix analyze/execute scopes (see `server/README.md` for the env knobs). Behind serverless platforms these act as per-instance guards; set `TRUST_PROXY=true` behind trusted proxies so buckets key on real client IPs.

## Known Limitations

- The rate limiter is per-instance in memory; a global serverless quota (e.g. Upstash Redis) is tracked in `AUDIT_REPORT.md` as backlog.
- Plan claiming on execute is not atomic; concurrent duplicate executes of the same plan id are tolerated by state checks but not serialized.

## Verification

Run the full security-relevant test suite locally:

```bash
npm ci
npm run typecheck
npm run test
npm audit --audit-level=high
```
