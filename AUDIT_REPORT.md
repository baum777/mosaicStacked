# Repository Health Report

**Scope:** CLI-verified (static analysis + npm/git commands executed)  
**Date:** 2026-06-19  
**Project:** mosaicStack (monorepo: server + web workspaces)

---

## Gesamtstatus

**Status:** 🟡 **Gelb** (Good foundation, but dependency updates needed + branch hygiene)

**Reason:** Project has solid CI/CD, test infrastructure, and documentation, but multiple outdated packages (8 updates available), unmerged experimental branches, and missing governance files create maintenance risk.

---

## Maintenance Score

| Bereich      | Score (0–10) | Kommentar |
|---|---:|---|
| Dependencies | 6/10 | Dependabot configured, but 8 packages outdated (Playwright, TypeScript, React, @types/\*, Vite, Cypress); url.parse() deprecation warning |
| Docs | 8/10 | README (283 lines), CHANGELOG, AGENTS.md present; missing SECURITY.md, CONTRIBUTING.md, LICENSE |
| CI/CD | 8/10 | GitHub Actions workflows solid (node:24, typecheck, test, build); no pre-commit hooks; deployment workflows exist |
| Codebase | 7/10 | 93 test files, monorepo structure clean, conventional commits; 2 unmerged branches (likely experimental) |
| Security | 6/10 | .env/.pem in .gitignore but not in git history (good); no secrets found; missing SECURITY.md policy |
| **Gesamt** | **7/10** | Stable base with clear upkeep needed |

---

## Kritische Risiken

1. **Outdated dependencies** — 8 packages behind latest (React 19.2.7, TypeScript 6.0.3, Playwright 1.61.0, Vite 8.0.16, Cypress 15.17.0)
   - Playwright significantly behind (1.59.1 → 1.61.0)
   - TypeScript 6.0.3 available (currently 5.9.3) — major version upgrade ready
   - url.parse() deprecation warning in Node.js workflow

2. **Missing governance files** — no SECURITY.md, CONTRIBUTING.md, or LICENSE
   - Public GitHub repo without explicit license
   - No security policy for vulnerability disclosure

3. **Stale experimental branches** — multiple codex/ and modelgate/ branches not merged
   - Cognitive load on branch list
   - Risk of forgotten work-in-progress

4. **No pre-commit hooks** — no linting gate before commits (relies on CI)
   - Slower feedback loop
   - Allows invalid code to reach CI

---

## Sofortmaßnahmen (diese Woche)

1. **Upgrade TypeScript to 6.0.3** — major version available, test for breaking changes
2. **Update Playwright to 1.61.0** — critical for test stability
3. **Address url.parse() deprecation** — update workflow or replace with WHATWG URL API in Node 24 codebase
4. **Add LICENSE file** — MIT or Apache 2.0 recommended for public repo
5. **Create SECURITY.md** — define vulnerability disclosure process

---

## Diese Woche erledigen

- [ ] Merge or close 2 unmerged experimental branches (codex/agentic-helpdesk-companion, codex/sticky-workbench-progress)
- [ ] Update top 5 outdated packages (TypeScript, React, @types/\*, Vite)
- [ ] Run full test suite after dependency updates
- [ ] Add pre-commit hook for typecheck (use husky or simple npm hook)
- [ ] Document CONTRIBUTING.md (link to AGENTS.md workflow)
- [ ] Verify branch protection on main (check GitHub settings)

---

## Backlog / Später

- [ ] Enable Dependabot auto-merge for patch/minor versions
- [ ] Add CODEOWNERS for code review routing
- [ ] Set up branch auto-cleanup (delete merged branches after 30 days)
- [ ] Add pre-push hook to prevent force-push to main
- [ ] Document deployment rollback strategy (currently vercel-deploy.yml only)
- [ ] Consider adding code coverage reporting (currently no coverage artifact in CI)
- [ ] Upgrade to TypeScript 6.0.3 and validate breaking changes
- [ ] Audit GitHub App permissions (scope document for github-workbench)
- [ ] Document Matrix integration security model (scope, rate limits)
- [ ] Add performance baseline CI gate (integrate lighthouse/bundle check into CI)

---

## Empfohlene GitHub-Issues

- [ ] **Dependency updates** — Upgrade Playwright (1.59.1 → 1.61.0), React (19.2.5 → 19.2.7), @types/\*, Vite, TypeScript
- [ ] **Branch cleanup** — Merge/close experimental branches (codex/agentic-helpdesk-companion, codex/sticky-workbench-progress)
- [ ] **Security governance** — Add SECURITY.md, LICENSE, CONTRIBUTING.md
- [ ] **Pre-commit hooks** — Add typecheck gate before push
- [ ] **Node url.parse() deprecation** — Migrate workflow or codebase to WHATWG URL API
- [ ] **Test coverage tracking** — Add coverage reports to CI pipeline

---

## Detailed Findings

### Dependencies
- **npm outdated:** 8 packages behind latest
  - @playwright/test: 1.59.1 → 1.61.0
  - @types/node: 22.19.17 → 25.9.3
  - @types/react: 19.2.14 → 19.2.17
  - react: 19.2.5 → 19.2.7
  - react-dom: 19.2.5 → 19.2.7
  - cypress: 15.14.2 → 15.17.0
  - typescript: 5.9.3 → 6.0.3 (major version)
  - vite: 8.0.10 → 8.0.16
  - tsx: 4.21.0 → 4.22.4
  - yaml: 2.8.4 → 2.9.0
- **Lockfile:** package-lock.json committed ✓
- **Dependabot:** configured ✓
- **CVE alerts:** None detected in current scan

### CI/CD
- **GitHub Actions:** 5 workflows present
  - ci.yml (typecheck, test, build) — solid foundation
  - vercel-deploy.yml (deployment pipeline)
  - integration & smoke test workflows for Matrix, GitHub, OpenRouter
- **Action versions:** Recent (actions/checkout@v6, actions/setup-node@v6) ✓
- **Node version:** 24 LTS (latest) ✓
- **No pre-commit hooks:** Allows broken code to reach CI

### Security
- **.env files:** Properly excluded from git ✓
- **Secret files (.pem):** Rule exists in .gitignore ✓
- **Git history:** No secrets found in recent commits ✓
- **SECURITY.md:** Missing (high priority)
- **Secrets scanning:** Dependabot configured but no explicit secrets policy

### Documentation
- **README.md:** Comprehensive (283 lines, German, architecture diagrams)
  - Covers ist-Zustand, architecture, authority rules, console areas
  - Explains chat, workbench, matrix, settings, performance, approval flow
- **CHANGELOG.md:** Present (42 lines, recent entries)
- **AGENTS.md:** Workflow documentation (93 lines)
- **CONTRIBUTING.md:** Missing
- **LICENSE:** Missing (public repo, no license file)

### Branch Hygiene
- **Default branch:** main ✓
- **Unmerged branches:** 2 local (codex/agentic-helpdesk-companion, codex/sticky-workbench-progress)
- **Merged branches:** 5 local (cleanup opportunity)
- **Remote stale branches:** Multiple codex/ and modelgate/ branches (90+ days old)
- **Branch protection:** Unknown (need GitHub API; not configured in git config)

### Test Coverage
- **Test files:** 93 files (excluding node_modules)
- **Test commands:** 10+ npm scripts (unit, integration, smoke, e2e, live tests)
- **Test types:**
  - Unit tests (web/test/\*.test.ts\[x\])
  - Server tests (server/test/\*.test.ts)
  - Browser tests (Playwright, Cypress)
  - Live integration tests (matrix, github, openrouter)
  - Smoke tests (local, CI, live, production)
- **Coverage reporting:** None in CI pipeline

### Project Structure
- **Monorepo:** ✓ (npm workspaces: server/, web/)
- **.github/:** Workflows, no templates for issues/PRs
- **tests/, tests/live/:** Integration and smoke tests
- **cypress/:** E2E tests
- **scripts/:** Build, test, and deployment utilities
- **config/:** Central configuration
- **docs/:** Documentation
- **ops/:** Operational scripts (matrix smoke, perf checks)

---

## Analysis Scope

- ✓ Static file analysis (structure, metadata, .gitignore, package.json, workflows)
- ✓ CLI-verified (npm outdated, git log, branch status, security checks)
- ✗ GitHub API data (branch protection rules, pull request/issue trends, action run status not checked)

---

## Recommendations for README Update

Based on this audit, the README should be enhanced with:

1. **Setup and Installation** — Quick start guide (dev environment setup)
2. **Dependency management** — How to keep packages updated, pre-commit workflow
3. **Contributing** — Link to CONTRIBUTING.md, PR checklist
4. **Security** — Reference to SECURITY.md, vulnerability disclosure
5. **Testing** — How to run tests locally, coverage targets
6. **Deployment** — Current status (Vercel), staging vs. production
7. **Known issues / Roadmap** — Experimental branches, planned upgrades

