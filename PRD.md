# Enterprise Codebase Auditor: Product Requirements Document

**Project:** Antigravity Coding Assistant - Enterprise Codebase Auditor  
**Version:** 1.0  
**Last Updated:** August 2026  
**Status:** In Development

---

## 1. Executive Summary

**Enterprise Codebase Auditor** is a production-grade web application that autonomously audits enterprise codebases against Architecture Decision Records (ADRs) via an event-driven GitHub webhook pipeline. The system enforces role-based access control (RBAC), provides real-time compliance analytics, and integrates seamlessly into GitHub workflows to catch architectural violations before code merges.

**Key Value Proposition:**
- **Preventative, not reactive:** Audit PRs before they merge, not after
- **Autonomous:** Runs automatically on GitHub events (no manual intervention)
- **Governance-focused:** Enforces architectural decisions with zero business logic overhead
- **Enterprise-ready:** Self-hostable, secure (HMAC verification, RBAC), persistent storage

**Target Users:** Engineering leads, architects, compliance officers at mid-to-large enterprises (50+ engineers)

---

## 2. Problem Statement

### Current State
- Developers push code to GitHub without checking against architectural decisions
- Code reviews are manual and inconsistent—violations slip through
- No systematic way to track compliance drift over time
- Leadership has no visibility into ADR violations (architectural health)
- Compliance checks require manual effort from senior engineers (expensive)

### Pain Points
1. **Reactive violations:** By the time violations are caught, code is merged and fix costs spike
2. **Inconsistent enforcement:** Different teams enforce ADRs differently
3. **No metrics:** Can't answer "How compliant is our codebase?" or "Is compliance improving?"
4. **Onboarding friction:** New engineers don't know the ADRs; violations happen by accident
5. **Manual audits:** Senior engineers waste time doing manual code reviews instead of building

### Target Customers
- **Engineering leads** at enterprises with 50+ engineers
- **Architecture teams** managing microservices or large monoliths
- **Compliance officers** in regulated industries
- **DevOps/Platform teams** enforcing standards across teams

---

## 3. Product Goals

### Primary Goals (MVP)
1. **Autonomous auditing:** Trigger LLM-powered audits automatically on GitHub PR events
2. **ADR enforcement:** Retrieve ADRs from codebase, compare against PR diff, flag violations
3. **Role-based access:** Different roles see different compliance details
4. **Compliance analytics:** Show 7-day compliance trend, top violations, compliance score
5. **Zero-cost infrastructure:** Use free-tier LLM APIs (OpenRouter), free hosting (Fly.io, Cloudflare Pages)

### Secondary Goals (Post-MVP)
1. **GitHub PR integration:** Post audit results as comments on PRs
2. **Slack notifications:** Alert teams when violations are detected
3. **Cost tracking:** Track LLM API usage and "cost saved" vs. ChatGPT
4. **Semantic caching:** Reduce API calls by caching audit results for similar code
5. **Custom rules:** Allow admins to define custom auditing rules beyond ADRs

### Non-Goals
- Real-time streaming code analysis (too resource-intensive)
- IDE plugin (out of scope for MVP)
- Code generation/fixing (only detection and suggestions)
- Support for non-GitHub repositories (GitHub-only for MVP)

---

## 4. User Stories

### Persona 1: Engineering Lead (Marcus)
**Role:** Director of Engineering, 80-person team  
**Pain:** Can't track architectural compliance across teams

**User Story:**
```
As an engineering lead,
I want to see a 7-day compliance trend chart,
So that I can track whether our codebase is becoming more or less compliant.
```

**Acceptance Criteria:**
- Dashboard shows line chart: X-axis (dates), Y-axis (compliance score %)
- Compliance score calculated as: (Compliant PRs / Total PRs) × 100
- Trends visible across 7 days
- Exportable as CSV for leadership reports

---

### Persona 2: Senior Developer (Amara)
**Role:** Senior Engineer, enforces ADRs  
**Pain:** Spends 2 hours/day reviewing PRs for ADR violations

**User Story:**
```
As a senior developer,
I want PRs to be automatically audited against ADRs before I review them,
So that I can focus on business logic instead of architectural enforcement.
```

**Acceptance Criteria:**
- Webhook triggers automatically on PR open
- Audit results available within 30 seconds
- Results shown on dashboard with violations clearly flagged
- Suggested fixes provided for violations

---

### Persona 3: Junior Developer (Kai)
**Role:** Junior Engineer, new to codebase  
**Pain:** Doesn't know the ADRs; violates them accidentally

**User Story:**
```
As a junior developer,
I want to understand why my PR was flagged as non-compliant,
So that I can learn the architectural rules and fix it.
```

**Acceptance Criteria:**
- Violation message clearly states which ADR was violated
- Explanation of why the ADR exists
- Suggested fix provided in plain English
- No access to "restricted" ADRs (RBAC enforced)

---

### Persona 4: Compliance Officer (Priya)
**Role:** Compliance/Security Lead  
**Pain:** No audit trail for architectural compliance

**User Story:**
```
As a compliance officer,
I want a complete audit log of all code audits and their results,
So that I can prove compliance to regulators/auditors.
```

**Acceptance Criteria:**
- Audit log includes: PR URL, timestamp, auditor (system), violations found
- Logs are immutable (appended, never deleted)
- Export to JSON/CSV for auditors
- Retention policy: 1+ year

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization
- **FR-1:** Users must register with username, email, password
- **FR-2:** First registered user is assigned `admin` role
- **FR-3:** Subsequent users default to `junior-dev` role
- **FR-4:** Admins can upgrade users to `senior-dev` or `admin` via `/admin/users/{id}/role`
- **FR-5:** JWT tokens expire after 24 hours
- **FR-6:** Each endpoint enforces role-based access control

### 5.2 GitHub Webhook Integration
- **FR-7:** Webhook listens on `POST /api/webhooks/github`
- **FR-8:** Webhook verifies HMAC signature using `X-Hub-Signature-256` header
- **FR-9:** On `pull_request` event: trigger audit pipeline
- **FR-10:** On `push` event: sync modified files to Qdrant (delta update)
- **FR-11:** Webhook payload is logged for debugging (no credentials logged)

### 5.3 RAG Pipeline
- **FR-12:** Ingest ADRs from `docs/adrs/` folder in repository
- **FR-13:** Split documents using LangChain's `RecursiveCharacterTextSplitter` (semantic chunking)
- **FR-14:** Generate dense embeddings via Cloud API (e.g. OpenAI/Cohere via LiteLLM)
- **FR-15:** Store chunks in Qdrant with metadata: `access_level`, `chunk_type`, `file_path`
- **FR-16:** Query Qdrant using semantic dense search
- **FR-17:** Filter results by user role (RBAC at query time)

### 5.4 LLM Auditing
- **FR-18:** Accept PR diff (added/modified lines)
- **FR-19:** Retrieve top-2 ADRs and top-2 code context chunks from Qdrant
- **FR-20:** Build prompt: code snippet + ADR context
- **FR-21:** Send to OpenRouter with automatic failover (Llama 3 → Gemma)
- **FR-22:** LLM response includes: compliance status, violations, suggested fix
- **FR-23:** Stream response token-by-token to backend (for real-time UI updates)

### 5.5 Dashboard & Analytics
- **FR-24:** Dashboard displays 7-day compliance trend (line chart)
- **FR-25:** Dashboard displays top violations (bar chart or list)
- **FR-26:** Dashboard displays current compliance score as percentage
- **FR-27:** Each audit report shows: PR URL, file path, violation details, suggested fix
- **FR-28:** Reports are filtered by user role (junior-dev sees redacted versions)
- **FR-29:** Click on PR to see full audit report details

### 5.6 Alerting & Logging
- **FR-30:** Structured JSON logging for all key endpoints
- **FR-31:** Track consecutive webhook failures; alert after 5 failures
- **FR-32:** Log all RBAC permission denials (security audit trail)
- **FR-33:** Audit log is immutable (append-only)

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **NFR-1:** Webhook response time < 500ms (return 200 OK, audit runs async)
- **NFR-2:** Dashboard load time < 2 seconds
- **NFR-3:** Qdrant query time < 200ms
- **NFR-4:** LLM response generated within 60 seconds (with streaming)

### 6.2 Reliability
- **NFR-5:** 99% uptime for dashboard (best effort, free tier)
- **NFR-6:** Webhook retries on transient failures (3 retries, exponential backoff)
- **NFR-7:** Graceful degradation if LLM API is rate-limited (show cached results)
- **NFR-8:** Persistent storage: SQLite and Qdrant never wiped on restart

### 6.3 Security
- **NFR-9:** All API requests authenticated via JWT (except `/auth/*`)
- **NFR-10:** HMAC signature verification on GitHub webhooks
- **NFR-11:** RBAC enforced at API layer (no data leakage to unauthorized roles)
- **NFR-12:** No API keys in code; all secrets in `.env`
- **NFR-13:** Passwords hashed with bcrypt (salt rounds = 10)
- **NFR-14:** CORS restricted to frontend domain only

### 6.4 Scalability
- **NFR-15:** Handle 100 concurrent webhook requests without degradation
- **NFR-16:** Database can store 1M+ audit records
- **NFR-17:** Qdrant can handle 10k+ documents efficiently

### 6.5 Data Privacy
- **NFR-18:** PR diffs are not stored in plain text (only audit results)
- **NFR-19:** User passwords stored with bcrypt (never reversible)
- **NFR-20:** Audit logs retained for 1+ year (configurable retention)
- **NFR-21:** Self-hostable (no data sent to third-party servers except OpenRouter)

---

## 7. Success Metrics

### Product Metrics
- **Adoption:** 10+ teams using the system within 3 months
- **Engagement:** 100+ PRs audited per week
- **Compliance trend:** Track if compliance score is stable/increasing over 8 weeks

### Technical Metrics
- **Webhook success rate:** > 95% (audit triggers successfully)
- **LLM accuracy:** > 85% (violations correctly identified; false positive rate < 15%)
- **Dashboard load time:** < 2 seconds (p99)
- **Uptime:** > 99% (best effort on free tier)

### Business Metrics
- **Cost savings:** Estimated 5 hours/week of senior engineer time saved per 100-person org
- **Time to audit:** < 30 seconds per PR
- **User satisfaction:** NPS > 8/10 (if surveyed)

---

## 8. Constraints & Assumptions

### Constraints
- **Budget:** $0 (free-tier APIs only)
- **Team:** 1 person (solo developer)
- **Timeline:** 6-8 weeks to MVP
- **Hosting:** Must be self-hostable (no SaaS in this context)

### Assumptions
- OpenRouter free tier remains available (or fallback LLM exists)
- Qdrant performs well with < 50k documents
- GitHub webhooks are stable (no major outages)
- SQLite is sufficient for < 1M records
- Developers have access to GitHub organization settings (to configure webhooks)

---

## 9. Out of Scope (Future Versions)

- [ ] Support for GitLab, Bitbucket
- [ ] Custom LLM model fine-tuning
- [ ] Real-time code diff streaming (too expensive)
- [ ] IDE plugins (VS Code, JetBrains)
- [ ] Mobile app
- [ ] On-premise enterprise support (beyond self-hosting docs)
- [ ] Advanced analytics (ML-based anomaly detection)

---

## 10. Success Criteria (MVP Launch)

- [ ] Webhook receives GitHub PR events and triggers audit
- [ ] Audit results stored in SQLite and visible on dashboard
- [ ] RBAC enforced (different roles see different data)
- [ ] 7-day compliance trend chart works
- [ ] Deployed to Fly.io (backend) + Cloudflare Pages (frontend)
- [ ] GitHub Actions CI/CD passes on every push
- [ ] README + demo video included
- [ ] Zero API keys in codebase
- [ ] HMAC verification working (webhook is secure)
- [ ] Documented self-hosting instructions

---

## Appendix A: User Flows

### Flow 1: Developer Opens a PR
```
1. Developer opens PR on GitHub
2. GitHub webhook fires → POST /api/webhooks/github
3. Backend verifies HMAC signature
4. Backend fetches PR diff via GitHub API
5. Backend queries Qdrant for relevant ADRs
6. Backend sends diff + ADRs to OpenRouter LLM
7. LLM returns audit result (compliance + violations)
8. Backend saves audit report to SQLite
9. Webhook returns 200 OK (audit runs async in background)
10. Engineering lead views dashboard → sees new audit report
```

### Flow 2: Engineering Lead Views Compliance Dashboard
```
1. Lead logs in with credentials
2. Dashboard shows 7-day trend line (compliance %)
3. Lead clicks "Top Violations" to see ADRs most frequently violated
4. Lead clicks a specific PR to see full audit details
5. Lead can see suggested fixes (generated by LLM)
6. Lead exports compliance report for leadership meeting
```

### Flow 3: Junior Dev Learns Why PR Was Flagged
```
1. Junior pushes PR
2. Webhook audits PR (behind scenes)
3. Junior gets notified via GitHub comment or email
4. Junior logs into dashboard to see full audit details
5. Dashboard shows: "Violation of ADR-004 (Use JWTs for Auth)"
6. Dashboard shows explanation: "This ADR requires all auth to use JWTs, not raw cookies"
7. Junior sees suggested fix (LLM-generated patch)
8. Junior implements fix, re-pushes
9. Webhook re-audits, PR passes compliance check
```

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **ADR** | Architecture Decision Record—a document describing an architectural decision and its rationale |
| **Compliance Score** | Percentage of audited PRs that passed all ADR checks |
| **Hybrid Search** | Combining dense (semantic) + sparse (keyword) vector search for better relevance |
| **HMAC** | Hash-based Message Authentication Code—used to verify webhook authenticity |
| **RBAC** | Role-Based Access Control—restricting API access based on user roles |
| **Webhook** | HTTP callback that GitHub triggers when certain events occur (PR open, push, etc.) |
| **Token** | JWT token issued on login; sent in `Authorization: Bearer <token>` header |

