# Enterprise Codebase Auditor: Development Roadmap

**Project:** Antigravity Coding Assistant - Enterprise Codebase Auditor  
**Timeline:** 6-8 weeks (MVP) + Future Releases  
**Status:** In Development

---

## Phase 0: Preparation (1 week)

### 0.1 Project Setup
- [ ] Create GitHub repository
- [ ] Clone and initialize FastAPI backend scaffold
- [ ] Clone and initialize React frontend scaffold
- [ ] Set up `.gitignore`, `requirements.txt`, `package.json`
- [ ] Write initial README (project description, setup instructions)
- [ ] Create `.env.example` with required secrets (OPENROUTER_API_KEY, WEBHOOK_SECRET, etc.)

### 0.2 Local Development Environment
- [ ] Write `docker-compose.yml` for FastAPI + Qdrant + PostgreSQL (future)
- [ ] Test `docker-compose up` works locally
- [ ] Verify FastAPI `/health` endpoint responds
- [ ] Verify React app builds without errors

### 0.3 GitHub Setup
- [ ] Configure GitHub repository settings
- [ ] Set up branch protection rules (require CI to pass)
- [ ] Create GitHub Actions workflow template (ready for Phase 5)
- [ ] Create issue templates (bugs, features, documentation)

**Deliverable:** Bare-minimum FastAPI app + React skeleton running locally via Docker. Git repo ready.

---

## Phase 1: Foundation & Authentication (Week 1)

### 1.1 FastAPI Core Setup
- [ ] Initialize FastAPI app with CORS enabled
- [ ] Add health check endpoint: `GET /health`
- [ ] Set up structured JSON logging middleware
- [ ] Add global error handling middleware (catch 500s, log them)
- [ ] Add request/response logging middleware

**Code Files:**
- `backend/main.py` - FastAPI initialization
- `backend/middleware/logging.py` - Structured logging
- `backend/middleware/error_handling.py` - Error handler

### 1.2 User Model & SQLite Database
- [ ] Design User table schema (id, username, email, password_hash, role, created_at, last_login)
- [ ] Initialize SQLite database via SQLAlchemy ORM
- [ ] Create User model class

**Code Files:**
- `backend/models/user.py` - SQLAlchemy User model
- `backend/database.py` - SQLite initialization

### 1.3 Authentication Endpoints
- [ ] `POST /auth/register` - Create new user (first user = admin, others = junior-dev)
- [ ] `POST /auth/login` - Authenticate user, return JWT token
- [ ] `POST /auth/logout` - Invalidate token (optional for stateless JWT)
- [ ] `GET /auth/me` - Return current user info

**Code Files:**
- `backend/routes/auth.py` - Auth endpoints
- `backend/utils/auth.py` - JWT token generation/validation
- `backend/utils/password.py` - Bcrypt hashing

### 1.4 React Login Page
- [ ] Login form with username, password fields
- [ ] Register link (toggle between login/register forms)
- [ ] JWT storage in localStorage
- [ ] AuthContext provider (share token across app)
- [ ] AuthProtectedRoute component (redirect to login if no token)

**Code Files:**
- `frontend/src/components/LoginPage.jsx`
- `frontend/src/components/RegisterPage.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/components/AuthProtectedRoute.jsx`

### 1.5 Testing
- [ ] Test user registration (first user becomes admin)
- [ ] Test login/logout flow
- [ ] Test JWT expiration (24 hours)

**Test Files:**
- `backend/tests/test_auth.py` (5 tests)

**Deliverable:** Login/register works. JWT persists across page reloads. First user is admin.

---

## Phase 2: RBAC & User Management (Week 2)

### 2.1 RBAC Middleware
- [ ] Create `@require_role()` decorator for endpoint protection
- [ ] Implement permission matrix: admin, senior-dev, junior-dev, viewer
- [ ] Add role check to JWT token validation

**Code Files:**
- `backend/middleware/rbac.py` - RBAC decorator

### 2.2 Admin User Management Endpoints
- [ ] `GET /admin/users` - List all users (admin only)
- [ ] `PUT /admin/users/{user_id}/role` - Upgrade user role (admin only)
- [ ] `DELETE /admin/users/{user_id}` - Remove user (admin only)

**Code Files:**
- `backend/routes/admin.py` - Admin endpoints

### 2.3 React Admin Panel
- [ ] User list component (table with username, email, role)
- [ ] Dropdown to change user role (admin only)
- [ ] Delete user button

**Code Files:**
- `frontend/src/components/AdminPanel.jsx`
- `frontend/src/components/UserManagementTable.jsx`

### 2.4 RBAC Testing
- [ ] Test junior-dev cannot access `/admin/*` endpoints (403)
- [ ] Test senior-dev cannot access `/admin/*` endpoints (403)
- [ ] Test admin can upgrade users
- [ ] Test role persistence across login/logout

**Test Files:**
- `backend/tests/test_rbac.py` (5 tests)

**Deliverable:** RBAC enforced. Admin can manage users. Junior-devs blocked from admin endpoints.

---

## Phase 3: RAG Pipeline & Vector Search (Weeks 3-4)

### 3.1 Qdrant Setup
- [ ] Initialize Qdrant client (local Docker)
- [ ] Create collection schema: dense vectors only (e.g. 1536-dim for OpenAI/OpenRouter)
- [ ] Set up metadata filtering (access_level, chunk_type, file_path)

**Code Files:**
- `backend/services/vector_db.py` - Qdrant client class

### 3.2 Document Ingestion Pipeline
- [ ] Clone GitHub repo into `/tmp`
- [ ] Walk repository, find `docs/adrs/` folder
- [ ] Parse `.md` files from `docs/adrs/`
- [ ] Chunk each file using LangChain's `RecursiveCharacterTextSplitter`
- [ ] Assign metadata: `access_level` (public/restricted), `chunk_type` (adr/code), `file_path`
- [ ] Generate dense embeddings using Cloud Embeddings API (via LiteLLM)
- [ ] Upsert chunks to Qdrant
- [ ] Clean up `/tmp`

**Code Files:**
- `backend/services/ingestion.py` - Ingestion class
- `backend/routes/ingest.py` - `POST /api/ingest` endpoint

### 3.3 Vector Search & Querying
- [ ] Semantic query method: embed query via Cloud API, search dense vectors
- [ ] Role-based filtering: filter results by user access_level
- [ ] Query method signature: `query(text, role, top_k=5) -> List[Dict]`

**Code Files:**
- `backend/services/vector_db.py` - Add query() method

### 3.4 Testing Ingestion & Search
- [ ] Test ingest with sample ADR files (create fixtures)
- [ ] Test hybrid search returns relevant ADRs
- [ ] Test role-based filtering (junior-dev cannot see restricted ADRs)
- [ ] Test empty query handling

**Test Files:**
- `backend/tests/test_ingestion.py` (3 tests)
- `backend/tests/test_vector_search.py` (4 tests)

**Deliverable:** Can ingest a GitHub repo, chunk it, index it in Qdrant. Can query with role-based filtering.

---

## Phase 4: LLM Auditing & Webhook (Week 5)

### 4.1 LLM Client & Routing (OpenRouter)
- [ ] Initialize LiteLLM router with OpenRouter API key
- [ ] Set up model list: [openrouter/meta-llama/llama-3-8b, openrouter/google/gemma-7b]
- [ ] Implement automatic failover on rate limits

**Code Files:**
- `backend/services/llm_client.py` - LiteLLM wrapper

### 4.2 RAG Auditing Engine
- [ ] Accept PR diff (code snippet) as input
- [ ] Retrieve top-2 ADR chunks + top-2 code context chunks from Qdrant
- [ ] Build audit prompt: "Review this code against these ADRs. Are there violations?"
- [ ] Send to OpenRouter LLM with streaming enabled
- [ ] Parse LLM response: compliance status (pass/fail), violations (list), suggested fix (string)
- [ ] Return structured audit result

**Code Files:**
- `backend/services/rag_engine.py` - RAGEngine class with audit_code() method

### 4.3 GitHub Webhook Endpoint
- [ ] Create `POST /api/webhooks/github` endpoint
- [ ] Verify HMAC signature using `X-Hub-Signature-256` header and WEBHOOK_SECRET
- [ ] Listen for `pull_request` events (action: opened, synchronize)
- [ ] On PR event: fetch PR diff via GitHub API
- [ ] Trigger audit pipeline (async via background task)
- [ ] Save audit result to SQLite audit_reports table
- [ ] Return 200 OK immediately (webhook doesn't wait for audit to finish)

**Code Files:**
- `backend/routes/webhooks.py` - Webhook endpoint
- `backend/models/audit_report.py` - AuditReport model

### 4.4 Audit Report Model & Storage
- [ ] Design AuditReport table: id, pr_url, pr_id, file_path, status (pass/fail), violations, suggested_fix, created_at, user_id (who triggered it)
- [ ] Create SQLAlchemy model

**Code Files:**
- `backend/models/audit_report.py` - AuditReport model

### 4.5 Testing Webhook & RAG
- [ ] Test webhook HMAC verification (reject unsigned payloads)
- [ ] Test webhook parsing of GitHub payload
- [ ] Test RAG engine with sample code snippet
- [ ] Test audit result is saved to database
- [ ] Mock OpenRouter API calls (don't hit real API in tests)

**Test Files:**
- `backend/tests/test_webhooks.py` (3 tests)
- `backend/tests/test_rag_engine.py` (3 tests)

**Deliverable:** Webhook receives GitHub PR events. Audit pipeline runs. Results stored in SQLite. HMAC verified.

---

## Phase 5: Dashboard API & Analytics (Week 5, second half)

### 5.1 Dashboard Endpoints
- [ ] `GET /api/audits` - Get recent audit reports (paginated, 10 per page)
  - Filter by date range, status (pass/fail), compliance score
  - Apply RBAC: junior-dev sees redacted violation details
- [ ] `GET /api/audits/{audit_id}` - Get full audit report details
- [ ] `GET /api/analytics/compliance-trend` - Get 7-day trend data
  - Returns: [{ date: "2026-08-01", compliance_score: 85 }, ...]
- [ ] `GET /api/analytics/top-violations` - Get most common violations (grouped by ADR)
  - Returns: [{ adr_id: "ADR-004", violation_count: 12 }, ...]
- [ ] `GET /api/analytics/compliance-score` - Get current compliance score

**Code Files:**
- `backend/routes/dashboard.py` - Dashboard endpoints

### 5.2 Compliance Score Calculation
- [ ] Logic: (Passing PRs / Total PRs) × 100 over last 7 days
- [ ] Store daily score in analytics table (for trend charting)
- [ ] Update daily score at midnight (cron job or on-demand calculation)

**Code Files:**
- `backend/services/analytics.py` - Analytics calculation service

### 5.3 React Dashboard UI
- [ ] Import Recharts for charting
- [ ] Display 7-day compliance trend line chart
- [ ] Display top violations as bar chart or list
- [ ] Display current compliance score as large metric
- [ ] Display audit report list with pagination
- [ ] Click on audit report to see full details

**Code Files:**
- `frontend/src/components/Dashboard.jsx`
- `frontend/src/components/ComplianceTrendChart.jsx`
- `frontend/src/components/TopViolationsChart.jsx`
- `frontend/src/components/AuditReportList.jsx`
- `frontend/src/components/AuditReportDetail.jsx`

### 5.4 RBAC Enforcement in Dashboard
- [ ] Senior-dev sees all violation details
- [ ] Junior-dev sees redacted: "🔴 Violation: [Redacted due to restricted access level]"
- [ ] Viewer sees read-only dashboard (no delete/update buttons)

### 5.5 Testing Dashboard
- [ ] Test compliance score calculation
- [ ] Test trend data generation
- [ ] Test RBAC filtering on dashboard endpoint
- [ ] Test pagination

**Test Files:**
- `backend/tests/test_dashboard.py` (4 tests)
- `backend/tests/test_analytics.py` (3 tests)

**Deliverable:** Dashboard API returns compliance trends, top violations, audit reports. React dashboard displays data with charts.

---

## Phase 6: Testing, CI/CD & Deployment (Week 6)

### 6.1 Unit Tests Coverage
- [ ] Run `pytest backend/tests/` locally
- [ ] Target: 70%+ code coverage
- [ ] All critical paths tested (auth, RBAC, webhook, RAG, analytics)

### 6.2 GitHub Actions CI/CD
- [ ] Create `.github/workflows/ci.yml`
- [ ] On push to main: run `pytest`, `pylint`, `black --check`
- [ ] On push to main: run frontend linting (`eslint`, `prettier --check`)
- [ ] Prevent merge if tests fail

**Files:**
- `.github/workflows/ci.yml`

### 6.3 Deployment Setup (Fly.io)
- [ ] Create `backend/Dockerfile` for FastAPI app
- [ ] Configure persistent volumes for SQLite + Qdrant
- [ ] Set environment variables in Fly.io dashboard
- [ ] Deploy backend to Fly.io: `fly deploy`
- [ ] Test backend health endpoint: `curl https://your-backend.fly.dev/health`

### 6.4 Deployment Setup (Cloudflare Pages)
- [ ] Create `frontend/.github/workflows/deploy.yml`
- [ ] On push to main: build React app (`npm run build`)
- [ ] Deploy to Cloudflare Pages: `npm run deploy`
- [ ] Test frontend loads: `https://your-frontend.pages.dev`

### 6.5 Integration Testing
- [ ] Create test GitHub repo with sample ADRs
- [ ] Configure real webhook on test repo
- [ ] Push test PR → verify webhook triggers → verify audit appears on dashboard
- [ ] Test end-to-end flow

**Test Files:**
- `backend/tests/test_integration.py` (1 integration test)

**Deliverable:** GitHub Actions passes. Backend deployed to Fly.io. Frontend deployed to Cloudflare Pages. Live demo accessible.

---

## Phase 7: Polish & Launch (Weeks 7-8)

### 7.1 Logging & Monitoring
- [ ] Add structured JSON logging to all key endpoints
- [ ] Log webhook events (received, verified, triggered audit)
- [ ] Log RBAC denials (security audit trail)
- [ ] Add consecutive failure alert (5 consecutive webhook failures → alert)

**Code Files:**
- `backend/utils/logger.py` - Logging utilities

### 7.2 Error Handling & Edge Cases
- [ ] Handle GitHub API rate limits gracefully
- [ ] Handle OpenRouter rate limits (automatic failover to second model)
- [ ] Handle missing ADR files in repo
- [ ] Handle malformed PR diffs
- [ ] Graceful degradation (show cached results if LLM is down)

### 7.3 Documentation
- [ ] Write `README.md` with: project description, features, tech stack, quick start
- [ ] Write `ARCHITECTURE.md` with: system architecture diagram (ASCII or Mermaid), data flow
- [ ] Write `DEPLOYMENT.md` with: step-by-step self-hosting guide for Fly.io + Cloudflare Pages
- [ ] Write `API.md` with: all endpoints, request/response examples, auth flow
- [ ] Add code comments to complex functions

**Files:**
- `README.md`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`
- `API.md`

### 7.4 Demo & Presentation
- [ ] Record 60-second demo video:
  - Developer pushes PR to GitHub
  - Webhook fires (log output shown)
  - Login to dashboard
  - New audit report appears
  - View compliance trend chart
  - See suggested fix
- [ ] Create `/docs/screenshots/` folder with dashboard screenshots
- [ ] Update README with demo video link + screenshots

### 7.5 Final Checklist
- [ ] All tests pass locally (`pytest backend/tests/`)
- [ ] GitHub Actions passes on every push
- [ ] Docker-compose runs without errors locally
- [ ] Backend deployed to Fly.io + accessible
- [ ] Frontend deployed to Cloudflare Pages + accessible
- [ ] Webhook tested with real GitHub PR (not mocked)
- [ ] RBAC tested (junior-dev cannot see restricted data)
- [ ] HMAC verification working (unsigned webhooks rejected)
- [ ] No API keys in codebase (all in `.env`)
- [ ] README + ARCHITECTURE.md + DEPLOYMENT.md complete
- [ ] Demo video recorded and linked
- [ ] Repo is public (GitHub ready for recruiting)

**Deliverable:** Production-ready application. Deployed live. GitHub Actions passing. Comprehensive documentation. Demo video.

---

## Post-MVP: Future Releases

### Release 2.0 (Weeks 9-12)
- [ ] GitHub PR comment integration (post audit results as bot comment)
- [ ] Slack webhook integration (notify #engineering-compliance of violations)
- [ ] Semantic caching with Redis (reduce API calls for similar code)
- [ ] Custom audit rules (allow admins to define rules beyond ADRs)
- [ ] Email alerts for violations
- [ ] Compliance report export (PDF/CSV for leadership)

### Release 3.0 (Weeks 13-16)
- [ ] Support for GitLab, Bitbucket
- [ ] Cost tracking dashboard (LLM API usage + "cost saved" vs. ChatGPT)
- [ ] Advanced analytics (anomaly detection, team-level compliance)
- [ ] AI-generated ADRs (suggest new ADRs based on violations)
- [ ] Audit rule versioning (track ADR changes over time)

### Release 4.0 (Beyond)
- [ ] IDE plugin (VS Code, JetBrains) for local audits
- [ ] Custom LLM model fine-tuning on internal ADRs
- [ ] Mobile app (read-only dashboard)
- [ ] Enterprise SaaS offering (hosted version)

---

## Success Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Phase 1: Auth complete | Week 1 | ⏳ |
| Phase 2: RBAC complete | Week 2 | ⏳ |
| Phase 3: RAG pipeline complete | Week 4 | ⏳ |
| Phase 4: Webhook + audit complete | Week 5 | ⏳ |
| Phase 5: Dashboard complete | Week 5 | ⏳ |
| Phase 6: Deployed + CI/CD passing | Week 6 | ⏳ |
| Phase 7: Polish + launch | Week 8 | ⏳ |
| **MVP Ready for Recruiting** | **End of Week 8** | ⏳ |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenRouter free tier rate limit exceeded | High | LiteLLM automatic failover to Gemma; semantic caching |
| Qdrant OOM with large codebases | Medium | Sequential file parsing (O(1) memory); chunk size tuning |
| GitHub webhook timeout | Medium | Return 200 OK immediately; audit runs async in background |
| SQLite concurrent write contention | Low | Webhook writes to DB infrequently; dashboard reads only |
| Fly.io/Cloudflare cold starts | Low | Acceptable for demo purposes; upgrade to paid tier post-MVP |

---

## Notes for Success

1. **Stick to the timeline.** Each week has a clear deliverable. Don't add features mid-week.
2. **Test as you go.** Don't wait until Phase 6 to test. Write tests for each component as you build it.
3. **Deploy early.** Get the app live by Week 6. Demo it live, don't show slides.
4. **Focus on core logic.** UI can be basic. RAG engine, webhook, RBAC are the differentiators.
5. **Document as you build.** Don't leave documentation for the end. Update README weekly.

