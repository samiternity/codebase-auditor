# System Architecture & Self-Hosting Guide

This document outlines the system architecture of the **Enterprise Codebase Auditor** and provides instructions for self-hosting it on a cloud provider like AWS EC2.

## 🏗️ System Design

The application is built on a microservices-style architecture deployed via Docker containers.

### Components
1. **GitHub Webhooks**: Serves as the entry point. GitHub sends `POST` payloads on PR events.
2. **FastAPI Backend (Python)**: The core orchestrator. Verifies HMAC signatures, triggers RAG pipelines, and handles API requests from the frontend.
3. **Qdrant Vector DB**: Stores chunked Architecture Decision Records (ADRs) as semantic vectors. Used during the audit process to inject relevant context into the LLM prompt.
4. **SQLite Relational DB**: Stores immutable audit logs, user credentials (hashed via bcrypt), and RBAC metadata.
5. **React Frontend**: A Vite-powered SPA dashboard for consuming analytics and viewing detailed LLM compliance reports.

### Event Flow
1. Developer opens a Pull Request on GitHub.
2. GitHub fires a Webhook to the FastAPI `/api/webhooks/github` endpoint.
3. FastAPI fetches the PR diff, retrieves the top relevant ADRs from Qdrant via vector similarity search.
4. FastAPI builds a prompt and queries the LLM (via LiteLLM / OpenRouter).
5. The LLM returns a structured JSON payload with violations and suggested fixes.
6. FastAPI stores the result in SQLite.
7. Frontend Dashboard dynamically fetches the updated stats and populates the UI.

---

## 🚀 Self-Hosting on AWS EC2

Deploying the Enterprise Codebase Auditor requires a server capable of running Docker Compose. An AWS `t2.micro` or `t3.micro` EC2 instance is sufficient for small codebases.

### 1. Server Provisioning
- Launch an Ubuntu Server on AWS EC2.
- Configure the Security Group to allow inbound traffic on ports `80` (HTTP), `443` (HTTPS), `8000` (FastAPI), and `3000` (React).
- SSH into the server and install Docker and Docker Compose.

### 2. Environment Configuration
Create a `.env` file in the root of the repository. You must configure the following variables:

```env
# LLM Provider Key (Defaults to OpenRouter)
GEMINI_API_KEY=your_openrouter_or_gemini_api_key

# Webhook Security (Must match the secret set in GitHub Repo Settings)
WEBHOOK_SECRET=my_super_secret_webhook_password_1234

# JWT Signing Key for User Authentication
JWT_SECRET=my_super_secret_jwt_signature_key_9876
```

### 3. Deploying the Containers
Once your `.env` is configured, build and run the services:

```bash
git clone https://github.com/your-org/codebase-auditor.git
cd codebase-auditor
docker-compose up -d --build
```

### 4. Configure GitHub Webhooks
1. Go to your target GitHub Repository.
2. Navigate to **Settings > Webhooks > Add Webhook**.
3. Set Payload URL to: `http://<your-ec2-ip>:8000/api/webhooks/github`
4. Set Content type to: `application/json`
5. Set Secret to match your `WEBHOOK_SECRET` from the `.env` file.
6. Select **"Let me select individual events"** and check **Pull requests**.
7. Click **Add webhook**.

The auditor is now live and will autonomously enforce your ADRs!
