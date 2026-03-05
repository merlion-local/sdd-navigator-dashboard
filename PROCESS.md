# SDD Navigator Dashboard

## Architecture

The project is built using Next.js 14 with the App Router.

Main layers:

UI
- SummaryPanel
- RequirementsTable
- RequirementDetail
- TasksPanel
- OrphanPanel

Data
- httpProvider (real API)
- mockProvider (local JSON)

Validation
- Zod schemas for all API responses

Testing
- Vitest + Testing Library

## Data Flow

UI -> Provider -> API / JSON -> Zod validation -> typed objects -> UI

## Trade-offs

- Client filtering for multi-select filters
- Zod used instead of manual runtime validation
- Mock provider allows deterministic tests

## Running the project

Install dependencies

npm install

Run dev server

npm run dev

Run tests

npm run test

Run lint

npm run lint

Build

npm run build