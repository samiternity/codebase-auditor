# Enterprise Codebase Auditor: Product Requirements Document

**Project:** Antigravity Coding Assistant - Enterprise Codebase Auditor  
**Version:** 1.0  
**Last Updated:** August 2026  
**Status:** In Development

---

## 1. Executive Summary

**Codebase Auditor** is a self-hosted RAG (Retrieval-Augmented Generation) application designed to showcase advanced AI engineering skills. It autonomously audits codebases against project-specific rules and guidelines via an event-driven GitHub webhook pipeline. By cloning and vectorizing a target repository, the system builds an understanding of code structure and contribution guidelines, providing fast, real-time PR compliance analytics on a web interface.

**Key Value Proposition:**
- **Preventative, not reactive:** Audit PRs before they merge
- **Autonomous:** Runs automatically on GitHub events
- **AI-Powered:** Understands rules implicitly defined anywhere in the codebase (e.g., README)
- **Highly Optimized:** Fast execution with optimized token usage for cost-effective LLM calls
- **Resume-ready:** Demonstrates practical, end-to-end AI engineering capabilities

**Target Users:** Open-source maintainers, engineering teams, and recruiters/hiring managers reviewing AI portfolios.

---

## 2. Problem Statement

### Current State
- Code reviews are manual and inconsistent—violations slip through
- Project guidelines (like those in a README) are often ignored by contributors
- Compliance checks require manual effort from maintainers

### Pain Points
1. **Reactive violations:** Caught late, fix costs spike
2. **Inconsistent enforcement:** Difficult to enforce implicit rules across a codebase
3. **Manual audits:** Maintainers waste time doing manual code reviews

---

## 3. Product Goals

### Primary Goals (MVP)
1. **Autonomous auditing:** Trigger LLM-powered audits automatically on GitHub PR events
2. **RAG-based enforcement:** Clone, vectorize, and understand the codebase to flag violations against rules listed anywhere in the repo
3. **Compliance reporting:** Generate and display compliance reports on the web interface
4. **Optimization:** Ensure fast app functionality and optimize model token usage without accuracy loss
5. **Portfolio Demonstration:** Successfully test and showcase compliance auditing using the forked `avatrify-python` repository
6. **Cost-effective deployment:** Use AWS (free tier) for backend, Cloudflare Pages for frontend

### Secondary Goals (Post-MVP)
1. **GitHub PR integration:** Post audit results as comments on PRs
2. **Semantic caching:** Reduce API calls by caching audit results for similar code

### Non-Goals
- Real-time streaming code analysis
- IDE plugin
- Complex user management (RBAC/Login system removed for simplicity and speed)

---

## 4. User Stories

### Persona 1: Project Maintainer (or Evaluator)
**Role:** Open-source maintainer or Hiring Manager  
**Pain:** Time-consuming PR reviews and manual enforcement of project rules.

**User Story:**
```
As a maintainer,
I want PRs to be automatically audited against the codebase's inherent rules (e.g., README guidelines),
So that I can focus on logic instead of style and compliance enforcement.
```

**Acceptance Criteria:**
- User configures a GitHub repo in the system
- Backend clones and vectorizes the repository
- Webhook triggers automatically on PR open
- Audit results available quickly (optimized performance)
- Results shown on the frontend with violations clearly flagged
- Suggested fixes provided for violations

---

## 5. Functional Requirements

### 5.1 GitHub Webhook Integration
- **FR-1:** Webhook listens on `POST /api/webhooks/github`
- **FR-2:** Webhook verifies HMAC signature using `X-Hub-Signature-256` header
- **FR-3:** On `pull_request` event: trigger audit pipeline
- **FR-4:** On `push` event: sync modified files to Qdrant (delta update)
- **FR-5:** Webhook payload is logged for debugging

### 5.2 RAG Pipeline
- **FR-6:** Ingest configured GitHub repositories by cloning them
- **FR-7:** Split documents and code using appropriate text splitters
- **FR-8:** Generate dense embeddings via Cloud API (e.g. OpenAI/Cohere via LiteLLM)
- **FR-9:** Store chunks in Qdrant with metadata: `chunk_type`, `file_path`
- **FR-10:** Query Qdrant using semantic dense search for relevant codebase rules (e.g. from README or docs)

### 5.3 LLM Auditing
- **FR-11:** Accept PR diff (added/modified lines)
- **FR-12:** Retrieve relevant code context and rules from Qdrant
- **FR-13:** Build prompt: code snippet + retrieved rules context, optimized to save tokens
- **FR-14:** Send to LLM provider (e.g. OpenRouter/AWS Bedrock)
- **FR-15:** LLM response includes: compliance status, violations, suggested fix
- **FR-16:** Stream response token-by-token to backend (for fast real-time UI updates)

### 5.4 Dashboard & Analytics
- **FR-17:** Dashboard displays 7-day compliance trend
- **FR-18:** Dashboard displays top violations
- **FR-19:** Dashboard displays current compliance score as percentage
- **FR-20:** Each audit report shows: PR URL, file path, violation details, suggested fix

### 5.5 Alerting & Logging
- **FR-21:** Structured JSON logging for all key endpoints
- **FR-22:** Audit log is immutable (append-only)

---

## 6. Non-Functional Requirements

### 6.1 Performance & Optimization
- **NFR-1:** Webhook response time < 500ms (return 200 OK, audit runs async)
- **NFR-2:** Dashboard load time < 2 seconds
- **NFR-3:** Qdrant query time < 200ms
- **NFR-4:** Prompt engineering designed to minimize token usage without accuracy loss
- **NFR-5:** LLM response generated within 60 seconds (with streaming)

### 6.2 Reliability
- **NFR-6:** 99% uptime for dashboard
- **NFR-7:** Persistent storage: SQLite and Qdrant never wiped on restart

### 6.3 Security
- **NFR-8:** HMAC signature verification on GitHub webhooks
- **NFR-9:** No API keys in code; all secrets in `.env`
- **NFR-10:** CORS restricted to frontend domain only

### 6.4 Scalability
- **NFR-11:** Handle concurrent webhook requests without degradation
- **NFR-12:** Qdrant can handle vector search efficiently across target codebase

---

## 7. Success Metrics

### Product Metrics
- **Portfolio Demonstration:** Successfully showcase app functioning with `avatrify-python`
- **Engagement:** Successfully process and audit PRs automatically

### Technical Metrics
- **Webhook success rate:** > 95% (audit triggers successfully)
- **LLM accuracy:** > 85% (violations correctly identified)
- **Speed:** Fast app functionality with minimal token usage

---

## 8. Constraints & Assumptions

### Constraints
- **Budget:** $0 (AWS free tier, Cloudflare Pages, open-source models)
- **Team:** 1 person (AI Engineer)

### Assumptions
- Target repositories (like `avatrify-python`) are accessible
- GitHub webhooks are stable
- SQLite is sufficient for the scale of this project

---

## 9. Out of Scope (Future Versions)

- [ ] Support for GitLab, Bitbucket
- [ ] Custom LLM model fine-tuning
- [ ] IDE plugins (VS Code, JetBrains)

---

## 10. Success Criteria (MVP Launch)

- [x] Deployed frontend to Cloudflare Pages
- [x] Deployed backend to AWS (free tier)
- [x] Webhook receives GitHub PR events and triggers audit
- [ ] Backend clones and vectorizes configured repository
- [x] Token-optimized LLM prompt accurately identifies compliance violations
- [ ] Audit results stored in SQLite and visible on dashboard
- [ ] Test end-to-end functionality using `avatrify-python` fork
- [ ] README + demo video included

---

## Appendix A: User Flows

### Flow 1: Repository Configuration
```
1. User enters GitHub repository URL in the frontend
2. Backend clones the repository
3. Backend parses, chunks, and vectorizes code and rule files (e.g. README)
4. Vectors are stored in Qdrant
```

### Flow 2: PR is Audited
```
1. Contributor opens PR on GitHub
2. GitHub webhook fires → POST /api/webhooks/github
3. Backend verifies HMAC signature
4. Backend fetches PR diff via GitHub API
5. Backend queries Qdrant for relevant codebase rules
6. Backend sends diff + rules to LLM (optimized for tokens)
7. LLM returns audit result
8. Backend saves audit report to SQLite
9. Maintainer views dashboard → sees new fast audit report
```

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **RAG** | Retrieval-Augmented Generation |
| **Compliance Score** | Percentage of audited PRs that passed all rules checks |
| **HMAC** | Hash-based Message Authentication Code—used to verify webhook authenticity |
| **Webhook** | HTTP callback that GitHub triggers when certain events occur (PR open, push, etc.) |

