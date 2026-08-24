# Codebase Auditor

![Codebase Auditor](https://img.shields.io/badge/Status-In_Development-blue)

The **Codebase Auditor** is a self-hosted RAG (Retrieval-Augmented Generation) application designed to showcase advanced AI engineering skills. It autonomously audits codebases against project-specific rules and guidelines via an event-driven GitHub webhook pipeline. 

By cloning a target repository and vectorizing its contents, the system understands code structure and implicit rules (e.g., in a README). It integrates seamlessly into GitHub workflows to catch rule violations *before* code merges, focusing on fast execution and optimized LLM token usage.

## Features

- **Autonomous Auditing**: Triggers LLM-powered audits automatically on GitHub PR events without manual intervention.
- **RAG-Powered Rule Enforcement**: Clones and embeds your repository's code and documentation using Qdrant to retrieve relevant context against incoming pull requests.
- **Optimized Execution**: Carefully engineered prompts and architecture ensure minimal token usage and fast response times without accuracy loss.
- **Compliance Analytics Dashboard**: Provides a dynamic 7-day compliance trend chart, top violations tracker, and an overall compliance score.
- **Detailed Audit Reports**: Delivers LLM-suggested fixes and flags specific violations to help contributors learn project patterns safely.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Vector Database**: Qdrant (Docker)
- **Frontend**: React, Vite, Recharts, Lucide Icons
- **LLM Integration**: LiteLLM / OpenRouter / AWS Bedrock
- **Deployment**: AWS (Backend), Cloudflare Pages (Frontend)

## Testing with `avatrify-python`
This project is currently tested against a forked repository, `avatrify-python`, to demonstrate real-world compliance testing and end-to-end RAG capabilities.

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

## Deployment

- The frontend is deployed and hosted on **Cloudflare Pages**.
- The backend is deployed on **AWS** (Free Tier).

For further architecture details, please see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
