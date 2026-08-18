# Enterprise Codebase Auditor

![Enterprise Codebase Auditor](https://img.shields.io/badge/Status-Production_Ready-success)

The **Enterprise Codebase Auditor** is a production-grade web application that autonomously audits enterprise codebases against Architecture Decision Records (ADRs) via an event-driven GitHub webhook pipeline. 

It enforces role-based access control (RBAC), provides real-time compliance analytics, and integrates seamlessly into GitHub workflows to catch architectural violations *before* code merges.

## Features

- **Autonomous Auditing**: Triggers LLM-powered audits automatically on GitHub PR events without manual intervention.
- **RAG-Powered Architecture Enforcement**: Embeds your repository's ADRs using Qdrant and retrieves relevant architectural context to compare against incoming pull requests.
- **Compliance Analytics Dashboard**: Provides a dynamic 7-day compliance trend chart, top violations tracker, and an overall compliance score.
- **Detailed Audit Reports**: Delivers LLM-suggested fixes and flags specific ADR violations to help junior developers learn architecture patterns safely.
- **Security & Governance**: Implements JWT-based RBAC authentication and HMAC signature verification for secure GitHub webhook processing.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Vector Database**: Qdrant (Docker)
- **Frontend**: React, Vite, Recharts, Lucide Icons
- **LLM Integration**: LiteLLM (routing to OpenRouter models like Llama-3/Gemma)
- **Deployment**: Docker Compose, GitHub Actions CI/CD

## Quick Start (Local Development)

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed

### 1. Start the Backend and Database
```bash
docker-compose up -d --build
```
This spins up the FastAPI backend on `http://localhost:8000` and the Qdrant Vector DB on `http://localhost:6333`.

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The React frontend will be available at `http://localhost:3000`.

### 3. Simulate a GitHub Webhook
Because GitHub cannot reach your `localhost`, you can trigger a test audit by forging a webhook payload using the built-in test script (requires Python):
```bash
$env:WEBHOOK_SECRET="my_super_secret_webhook_password_1234"
python scratch/test_webhook.py
```
Refresh the frontend dashboard to see the audit data populate!

## Self-Hosting & Deployment

For production deployment instructions, environment variable configuration, and detailed system architecture, please see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
