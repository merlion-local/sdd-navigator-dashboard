# SDD Navigator Dashboard
## Static Export Strategy

GitHub Pages supports only static hosting.  
Dynamic routes (/requirements/[id]) therefore require pre-generated paths.

generateStaticParams() uses local requirements.json to enumerate ids at build time.

Actual page data is still fetched via the API client at runtime and validated with Zod schemas.

Frontend dashboard for exploring a project's **Specification-Driven Development (SDD)** artifacts.

The application visualizes relationships between:

- Requirements
- Code annotations (`@req`)
- Tasks

and provides navigation across them with coverage insights.

The project demonstrates a **contract-driven frontend architecture** using:

- strict API validation
- OpenAPI specification
- mock API server
- type-safe data flow

---

# Overview

Specification-Driven Development links:

requirements → implementation → tests → tasks

This dashboard allows engineers to:

- inspect requirement coverage
- navigate requirement traceability
- detect orphan artifacts
- view linked tasks and annotations

---

# Architecture

Next.js UI  
↓  
API Client (`lib/api.ts`)  
↓  
HTTP Provider (`fetch + Zod validation`)  
↓  
OpenAPI Contract  
↓  
Mock API (Prism) or real backend

---

# Key Features

## Dashboard

The main dashboard displays:

- project statistics
- requirements list
- annotations list
- tasks list
- coverage status

---

## Requirement Detail Page

Each requirement page shows:

- requirement metadata
- linked code annotations
- related tasks

Example route:

/requirements/FR-SCAN-001

---

## Filtering and Sorting

Requirements support filtering and sorting via query parameters.

Examples:

/?type=FR  
/?status=covered  
/?sort=updatedAt&order=desc

---

## Strict API Validation

All API responses are validated using **Zod schemas**.

The client never trusts backend responses.

All API calls return a unified result type:

ApiResult<T>

Success example:

{
  "ok": true,
  "data": {}
}

Error example:

{
  "ok": false,
  "error": {
    "kind": "bad_response",
    "message": "...",
    "status": 500
  }
}

---

# Tech Stack

Next.js 15  
React  
TypeScript  
Zod  
Vitest  
ESLint  
OpenAPI 3  
Prism (mock server)

---

# Project Structure

app/
 ├ page.tsx
 └ requirements/[id]/page.tsx

components/
 ├ RequirementsTable.tsx
 ├ RequirementDetail.tsx
 ├ SummaryPanel.tsx
 └ TasksPanel.tsx

lib/
 ├ api.ts
 ├ httpProvider.ts
 ├ schemas.ts
 └ types.ts

tests/
 ├ api.test.ts
 ├ summary.test.tsx
 └ table.test.tsx

openapi/
 └ sdd-coverage-api.yaml

---

# Installation

Clone repository

git clone <repo-url>  
cd sdd-navigator-dashboard

Install dependencies

npm install

---

# Running the Application

Start dev server

npm run dev

Open in browser:

http://localhost:3000

---

# Running the Mock API

The project includes an OpenAPI specification:

openapi/sdd-coverage-api.yaml

Run a mock server using Prism:

npx prism mock openapi/sdd-coverage-api.yaml -p 4010

API will be available at:

http://localhost:4010

---

# Connecting UI to Mock API

Create `.env.local` file:

NEXT_PUBLIC_API_URL=http://localhost:4010

Restart dev server.

The UI will now use the mock API.

---

# Example API Endpoints

GET /stats  
GET /requirements  
GET /requirements/{id}  
GET /annotations  
GET /tasks  
POST /scan  
GET /scan  

---

# Testing

Run tests

npm run test

Run type checking

npm run typecheck

Run linter

npm run lint

---

# Production Build

npm run build

---

# Error Handling Strategy

The application uses a unified response model:

ApiResult<T>

Error types:

network — network failure  
not_found — resource not found  
bad_response — invalid API response  
unknown — unexpected error

---

# Zod Schemas

Schemas are defined in:

lib/schemas.ts

Example schemas:

StatsSchema  
RequirementSchema  
AnnotationSchema  
TaskSchema  
ScanStatusSchema  

All API responses are validated at runtime.

---

# Development Notes

## Static Generation

Requirement pages use:

generateStaticParams()

to pre-render requirement routes.

---

## Strict Fetch Layer

`httpProvider.ts` implements a strict HTTP wrapper that:

- safely parses responses
- validates responses using Zod
- returns typed errors

---

## Scan Endpoint

POST /scan triggers a codebase scan.

If the POST response body is invalid, the client falls back to:

GET /scan

to retrieve the current scan status.

---

# Future Improvements

Possible enhancements:

- full-text search across requirements
- requirement dependency graph
- CSV export
- pagination
- authentication
- contract tests between OpenAPI and Zod

---

# Author

Mikhail Smokotnin 
Frontend Developer
