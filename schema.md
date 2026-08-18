# Enterprise Codebase Auditor: Database & API Schema

**Project:** Antigravity Coding Assistant - Enterprise Codebase Auditor  
**Version:** 1.0  
**Date:** August 2026

---

## 1. SQLite Database Schema

### 1.1 Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'junior-dev',
    -- role: 'admin' | 'senior-dev' | 'junior-dev' | 'viewer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Indexes:**
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**SQLAlchemy Model:**
```python
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default='junior-dev', nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
```

---

### 1.2 Audit Reports Table

```sql
CREATE TABLE audit_reports (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    pr_id INTEGER NOT NULL,
    pr_number INTEGER,
    pr_url VARCHAR(500) NOT NULL,
    pr_title VARCHAR(500),
    repo_name VARCHAR(255) NOT NULL,
    repo_url VARCHAR(500),
    file_path VARCHAR(500),
    status VARCHAR(20) NOT NULL, -- 'pass' | 'fail'
    compliance_score FLOAT,
    -- 1.0 = 100% compliant, 0.0 = 0% compliant
    violations TEXT, -- JSON array of violations
    -- Format: [
    --   {
    --     "adr_id": "ADR-004",
    --     "adr_title": "Use JWTs for Auth",
    --     "violation_description": "Code uses raw session cookies instead of JWT",
    --     "severity": "high" | "medium" | "low"
    --   }
    -- ]
    suggested_fix TEXT,
    -- LLM-generated suggestion
    audit_duration_ms INTEGER,
    -- Time taken to audit (for metrics)
    llm_model_used VARCHAR(100),
    -- e.g., "llama-3-8b-instruct" | "gemma-7b-it"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered_by_user_id TEXT FOREIGN KEY REFERENCES users(id),
    -- User who triggered the audit (could be webhook/system)
    github_commit_hash VARCHAR(40)
);
```

**Indexes:**
```sql
CREATE INDEX idx_audit_reports_pr_id ON audit_reports(pr_id);
CREATE INDEX idx_audit_reports_status ON audit_reports(status);
CREATE INDEX idx_audit_reports_created_at ON audit_reports(created_at);
CREATE INDEX idx_audit_reports_repo_name ON audit_reports(repo_name);
```

**SQLAlchemy Model:**
```python
class AuditReport(Base):
    __tablename__ = "audit_reports"
    
    id = Column(String, primary_key=True)
    pr_id = Column(Integer, nullable=False, index=True)
    pr_number = Column(Integer)
    pr_url = Column(String(500), nullable=False)
    pr_title = Column(String(500))
    repo_name = Column(String(255), nullable=False, index=True)
    repo_url = Column(String(500))
    file_path = Column(String(500))
    status = Column(String(20), nullable=False, index=True)
    compliance_score = Column(Float)
    violations = Column(Text)  # JSON
    suggested_fix = Column(Text)
    audit_duration_ms = Column(Integer)
    llm_model_used = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    triggered_by_user_id = Column(String, ForeignKey('users.id'))
    github_commit_hash = Column(String(40))
```

---

### 1.3 Analytics Cache Table

```sql
CREATE TABLE analytics_cache (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    date DATE UNIQUE NOT NULL,
    compliance_score FLOAT NOT NULL,
    -- 0.0 to 1.0
    total_audits INTEGER,
    passed_audits INTEGER,
    failed_audits INTEGER,
    -- Breakdown by severity
    violations_high INTEGER,
    violations_medium INTEGER,
    violations_low INTEGER,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_analytics_cache_date ON analytics_cache(date);
```

**SQLAlchemy Model:**
```python
class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"
    
    id = Column(String, primary_key=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    compliance_score = Column(Float, nullable=False)
    total_audits = Column(Integer)
    passed_audits = Column(Integer)
    failed_audits = Column(Integer)
    violations_high = Column(Integer)
    violations_medium = Column(Integer)
    violations_low = Column(Integer)
    cached_at = Column(DateTime, default=datetime.utcnow)
```

---

## 2. Qdrant Vector Database Schema

### 2.1 Collection: `codebase_chunks`

**Purpose:** Store code snippets, ADRs, and documentation chunks with dense + sparse embeddings

**Vector Configuration:**

```python
from qdrant_client.models import VectorParams, Distance

# Dense vectors (semantic search)
vectors_config = VectorParams(
    size=1536,  # OpenAI standard dimensions
    distance=Distance.COSINE
)
```

**Document Structure:**

```python
{
    "id": "chunk_001_adr_004",
    
    # Text content
    "text": "ADR-004: Authentication Strategy\n\n"
            "Decision: All authentication must use JWT tokens, not raw cookies.\n"
            "Rationale: JWTs are stateless, scalable, and more secure...",
    
    # Dense vector (e.g. 1536-dim from OpenAI)
    "vector": [0.123, 0.456, ..., 0.789],
    
    # Metadata for filtering
    "payload": {
        "access_level": "public",  # 'public' | 'restricted'
        "chunk_type": "adr",  # 'adr' | 'code' | 'documentation'
        "file_path": "docs/adrs/adr-004-jwt-auth.md",
        "adr_id": "ADR-004",
        "adr_title": "Authentication Strategy",
        "repo_name": "my-monorepo",
        "repo_url": "https://github.com/myorg/my-monorepo",
        "created_at": "2026-08-01T10:30:00Z",
        "updated_at": "2026-08-01T10:30:00Z"
    }
}
```

**Role-Based Access Levels:**

| Role | Can Access |
|------|-----------|
| admin | All (public + restricted) |
| senior-dev | public + restricted |
| junior-dev | public only |
| viewer | public only |

**Query Filter Examples:**

```python
# Query for junior-dev (only public ADRs)
where_filter = {
    "access_level": {"$eq": "public"}
}

# Query for senior-dev (public + restricted)
where_filter = {
    "access_level": {"$in": ["public", "restricted"]}
}

# Query for specific chunk type
where_filter = {
    "chunk_type": {"$eq": "adr"}
}

# Combined filter
where_filter = {
    "$and": [
        {"access_level": {"$in": ["public", "restricted"]}},
        {"chunk_type": {"$eq": "adr"}}
    ]
}
```

---

## 3. REST API Specification

### 3.1 Authentication Endpoints

#### 3.1.1 User Registration

```http
POST /auth/register
Content-Type: application/json

{
    "username": "alice",
    "email": "alice@company.com",
    "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
    "id": "user_001",
    "username": "alice",
    "email": "alice@company.com",
    "role": "admin",  // First user is always admin
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
}
```

**Errors:**
- `400 Bad Request` - Invalid email/username format
- `409 Conflict` - Username or email already exists

---

#### 3.1.2 User Login

```http
POST /auth/login
Content-Type: application/json

{
    "username": "alice",
    "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
    "id": "user_001",
    "username": "alice",
    "email": "alice@company.com",
    "role": "admin",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
}
```

**Errors:**
- `401 Unauthorized` - Invalid username or password

---

#### 3.1.3 Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "id": "user_001",
    "username": "alice",
    "email": "alice@company.com",
    "role": "admin",
    "created_at": "2026-08-01T10:00:00Z",
    "last_login": "2026-08-01T15:30:00Z"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token

---

### 3.2 Admin Endpoints

#### 3.2.1 List All Users

```http
GET /admin/users?page=1&limit=10
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "total": 45,
    "page": 1,
    "limit": 10,
    "users": [
        {
            "id": "user_001",
            "username": "alice",
            "email": "alice@company.com",
            "role": "admin",
            "created_at": "2026-08-01T10:00:00Z",
            "last_login": "2026-08-01T15:30:00Z"
        },
        ...
    ]
}
```

**Errors:**
- `403 Forbidden` - User is not admin

---

#### 3.2.2 Update User Role

```http
PUT /admin/users/{user_id}/role
Authorization: Bearer <token>
Content-Type: application/json

{
    "new_role": "senior-dev"  // 'admin' | 'senior-dev' | 'junior-dev' | 'viewer'
}
```

**Response (200 OK):**
```json
{
    "id": "user_002",
    "username": "bob",
    "role": "senior-dev"
}
```

**Errors:**
- `403 Forbidden` - User is not admin
- `404 Not Found` - User does not exist
- `400 Bad Request` - Invalid role

---

#### 3.2.3 Delete User

```http
DELETE /admin/users/{user_id}
Authorization: Bearer <token>
```

**Response (204 No Content)**

**Errors:**
- `403 Forbidden` - User is not admin
- `404 Not Found` - User does not exist

---

### 3.3 Audit & Dashboard Endpoints

#### 3.3.1 Get Audit Reports

```http
GET /api/audits?page=1&limit=10&status=fail&repo=my-monorepo&start_date=2026-07-25&end_date=2026-08-01
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Results per page (default: 10, max: 100)
- `status` (string, optional) - 'pass' or 'fail'
- `repo` (string, optional) - Filter by repository name
- `start_date` (string, optional) - ISO 8601 format
- `end_date` (string, optional) - ISO 8601 format

**Response (200 OK):**
```json
{
    "total": 245,
    "page": 1,
    "limit": 10,
    "reports": [
        {
            "id": "audit_001",
            "pr_id": 1234,
            "pr_number": 1234,
            "pr_url": "https://github.com/myorg/repo/pull/1234",
            "pr_title": "Add JWT authentication",
            "repo_name": "my-monorepo",
            "file_path": "src/auth/session.py",
            "status": "fail",
            "compliance_score": 0.5,
            "violations": [
                {
                    "adr_id": "ADR-004",
                    "adr_title": "Use JWTs for Auth",
                    "violation_description": "Uses raw session cookies instead of JWT",
                    "severity": "high"
                }
            ],
            "suggested_fix": "Replace session.cookies with JWT token generation",
            "audit_duration_ms": 2500,
            "llm_model_used": "llama-3-8b-instruct",
            "created_at": "2026-08-01T14:30:00Z"
        },
        ...
    ]
}
```

**RBAC Filtering:**
- **junior-dev/viewer:** violations are redacted: "🔴 Violation: [Redacted]"
- **senior-dev/admin:** full violation details shown

**Errors:**
- `401 Unauthorized` - Invalid or missing token

---

#### 3.3.2 Get Audit Report Detail

```http
GET /api/audits/{audit_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "id": "audit_001",
    "pr_id": 1234,
    "pr_url": "https://github.com/myorg/repo/pull/1234",
    "pr_title": "Add JWT authentication",
    "repo_name": "my-monorepo",
    "repo_url": "https://github.com/myorg/my-monorepo",
    "file_path": "src/auth/session.py",
    "status": "fail",
    "compliance_score": 0.5,
    "violations": [
        {
            "adr_id": "ADR-004",
            "adr_title": "Use JWTs for Auth",
            "violation_description": "Code uses session.cookies instead of JWT tokens",
            "severity": "high",
            "adr_url": "https://github.com/myorg/my-monorepo/blob/main/docs/adrs/adr-004.md"
        }
    ],
    "suggested_fix": "Replace session.cookies with JWT token generation. See ADR-004 for implementation details.",
    "audit_duration_ms": 2500,
    "llm_model_used": "llama-3-8b-instruct",
    "created_at": "2026-08-01T14:30:00Z",
    "triggered_by": "webhook",
    "triggered_by_user": null
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User does not have access to this audit
- `404 Not Found` - Audit does not exist

---

#### 3.3.3 Get Compliance Trend (7-Day)

```http
GET /api/analytics/compliance-trend?days=7
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (int, optional) - Number of days to include (default: 7, max: 30)

**Response (200 OK):**
```json
{
    "dates": [
        "2026-07-26",
        "2026-07-27",
        "2026-07-28",
        "2026-07-29",
        "2026-07-30",
        "2026-07-31",
        "2026-08-01"
    ],
    "compliance_scores": [0.78, 0.80, 0.78, 0.75, 0.82, 0.80, 0.85],
    "total_audits": [10, 12, 8, 15, 11, 14, 9],
    "passed_audits": [8, 10, 6, 11, 9, 11, 8],
    "failed_audits": [2, 2, 2, 4, 2, 3, 1]
}
```

**Response Format:** Array of objects for Recharts compatibility

**Response (Recharts-compatible):**
```json
{
    "data": [
        {"date": "2026-07-26", "compliance_score": 78},
        {"date": "2026-07-27", "compliance_score": 80},
        ...
    ]
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token

---

#### 3.3.4 Get Top Violations

```http
GET /api/analytics/top-violations?limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (int, optional) - Number of top violations (default: 10, max: 50)

**Response (200 OK):**
```json
{
    "violations": [
        {
            "adr_id": "ADR-004",
            "adr_title": "Use JWTs for Auth",
            "violation_count": 34,
            "severity": "high"
        },
        {
            "adr_id": "ADR-001",
            "adr_title": "Microservices Architecture",
            "violation_count": 12,
            "severity": "medium"
        },
        ...
    ]
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token

---

#### 3.3.5 Get Current Compliance Score

```http
GET /api/analytics/compliance-score
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "compliance_score": 0.85,  // 85%
    "total_audits_today": 15,
    "passed_audits_today": 13,
    "failed_audits_today": 2,
    "as_of": "2026-08-01T15:45:00Z"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or missing token

---

### 3.4 Webhook Endpoints

#### 3.4.1 GitHub Webhook Listener

```http
POST /api/webhooks/github
X-Hub-Signature-256: sha256=abcdef1234567890...
X-GitHub-Event: pull_request
Content-Type: application/json

{
    "action": "opened",
    "pull_request": {
        "id": 1234,
        "number": 456,
        "title": "Add JWT authentication",
        "state": "open",
        "user": {
            "login": "alice"
        },
        "head": {
            "sha": "abc123def456...",
            "ref": "feature/auth"
        },
        "base": {
            "sha": "xyz789...",
            "ref": "main"
        }
    },
    "repository": {
        "name": "my-monorepo",
        "full_name": "myorg/my-monorepo",
        "url": "https://github.com/myorg/my-monorepo"
    }
}
```

**Response (200 OK):**
```json
{
    "status": "received",
    "message": "Webhook received. Audit will run asynchronously."
}
```

**Verification:**
- HMAC-SHA256 signature verified against `WEBHOOK_SECRET`
- Unsigned webhooks rejected with `401 Unauthorized`

**Errors:**
- `401 Unauthorized` - Invalid HMAC signature
- `400 Bad Request` - Invalid payload format
- `500 Internal Server Error` - Audit pipeline failed (webhook still returns 200)

---

### 3.5 Ingestion Endpoints

#### 3.5.1 Trigger Full Codebase Ingest

```http
POST /api/ingest
Authorization: Bearer <token>
Content-Type: application/json

{
    "repo_url": "https://github.com/myorg/my-monorepo",
    "branch": "main"
}
```

**Response (202 Accepted):**
```json
{
    "status": "ingestion_started",
    "repo_url": "https://github.com/myorg/my-monorepo",
    "branch": "main",
    "message": "Ingestion running asynchronously. Check back later for status."
}
```

**Permissions:** Requires `senior-dev` or `admin` role

**Errors:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User is not senior-dev or admin
- `400 Bad Request` - Invalid repo URL
- `409 Conflict` - Ingestion already in progress

---

## 4. JWT Token Structure

**Header:**
```json
{
    "alg": "HS256",
    "typ": "JWT"
}
```

**Payload:**
```json
{
    "sub": "user_001",  // User ID
    "username": "alice",
    "role": "admin",
    "iat": 1690808400,  // Issued at
    "exp": 1690894800   // Expires in 24 hours
}
```

**Signature:**
```
HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret
)
```

---

## 5. Error Response Format

**Standard Error Response:**
```json
{
    "status": "error",
    "error_code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "details": null,
    "timestamp": "2026-08-01T15:45:00Z"
}
```

**Validation Error Response:**
```json
{
    "status": "error",
    "error_code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
        "email": ["Invalid email format"],
        "password": ["Password must be at least 8 characters"]
    },
    "timestamp": "2026-08-01T15:45:00Z"
}
```

**HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `202 Accepted` - Async task accepted
- `204 No Content` - Success (no body)
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Conflict (e.g., duplicate user)
- `500 Internal Server Error` - Server error

---

## 6. Pydantic Request/Response Models

### 6.1 Authentication Models

```python
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 86400  # 24 hours in seconds

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime
    last_login: Optional[datetime]

class UserListResponse(BaseModel):
    total: int
    page: int
    limit: int
    users: List[UserResponse]
```

### 6.2 Audit Models

```python
class Violation(BaseModel):
    adr_id: str
    adr_title: str
    violation_description: str
    severity: Literal["high", "medium", "low"]

class AuditReportResponse(BaseModel):
    id: str
    pr_id: int
    pr_number: int
    pr_url: str
    pr_title: str
    repo_name: str
    file_path: str
    status: Literal["pass", "fail"]
    compliance_score: float
    violations: List[Violation]
    suggested_fix: str
    audit_duration_ms: int
    llm_model_used: str
    created_at: datetime

class AuditListResponse(BaseModel):
    total: int
    page: int
    limit: int
    reports: List[AuditReportResponse]
```

### 6.3 Analytics Models

```python
class ComplianceTrendResponse(BaseModel):
    data: List[Dict[str, Union[str, float]]]
    # Example: [{"date": "2026-07-26", "compliance_score": 78}, ...]

class TopViolationResponse(BaseModel):
    adr_id: str
    adr_title: str
    violation_count: int
    severity: Literal["high", "medium", "low"]

class TopViolationsListResponse(BaseModel):
    violations: List[TopViolationResponse]

class ComplianceScoreResponse(BaseModel):
    compliance_score: float
    total_audits_today: int
    passed_audits_today: int
    failed_audits_today: int
    as_of: datetime
```

---

## 7. Rate Limiting

**No rate limiting in MVP** (free tier APIs handle this)

**Future:**
- User endpoint: 100 requests/hour
- Webhook endpoint: No limit (GitHub handles)
- LLM API calls: Handled by OpenRouter free tier

---

## 8. Pagination

**Standard Pagination:**
- `page` (default: 1, min: 1)
- `limit` (default: 10, min: 1, max: 100)

**Response includes:**
- `total` - Total number of results
- `page` - Current page number
- `limit` - Results per page
- `results` - Array of items

---

## 9. Timestamps

**Format:** ISO 8601 UTC (e.g., `2026-08-01T15:45:00Z`)

**Timezone:** Always UTC in responses

---

## 10. Sorting & Filtering

**Audit Reports Sorting:**
```
GET /api/audits?sort_by=created_at&sort_order=desc
```

**Sort Options:**
- `created_at` (default)
- `compliance_score`
- `status`
- `pr_number`

**Sort Order:**
- `asc` (ascending)
- `desc` (descending, default)

