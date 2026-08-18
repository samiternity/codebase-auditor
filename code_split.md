Code Yourself (70-90% manual):

- FastAPI webhook endpoint (core logic)
- Qdrant hybrid search query logic (RAG foundation)
- SQLite schema + audit report storage (data model)
- Compliance trend calculation (core business logic)

AI Assistance (30-50% manual):

- React dashboard components (Recharts integration, boilerplate)
- Docker setup (config files, not logic)
- GitHub Actions YAML (tedious, not learning)
- Logging + alerting middleware (standard patterns)
- Testing boilerplate (test structure, not test logic)
- RBAC middleware + permission checks (security boundary)
- User Authentication (JWT, login, register, User model)

The Rule: If it's a security boundary or core business logic, write it yourself. If it's boilerplate or UI, use Claude.

Why this split? The stuff you code yourself is what you'll explain in interviews. RBAC logic, RAG retrieval, webhook handling—these are the differentiators. Dashboard styling and GitHub Actions YAML are just noise.