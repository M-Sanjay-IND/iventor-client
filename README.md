# Inventor Client

Enterprise-grade cloud inventory management platform.

## Overview

Inventor Client manages **any** type of physical inventory — libraries, warehouses, hospitals, schools, laboratories, IT assets, and more. It is a domain-agnostic platform, not a book management system.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (Auth, PostgreSQL, Storage, Edge Functions, Realtime) |
| **Hosting** | Vercel (frontend), Supabase (backend) |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- Supabase project (see `.env.example`)

### Setup

```bash
# Clone the repository
git clone https://github.com/M-Sanjay-IND/iventor-client.git
cd iventor-client

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env

# Start development server
npm run dev
```

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint (zero warnings allowed) |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests with Vitest |
| `npm run validate` | Run all checks (typecheck + lint + format + test) |

## Architecture

This project uses **feature-based architecture**. Each domain (inventory, QR, borrow, etc.) is self-contained under `src/features/`.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Git Workflow

This project follows **enterprise GitHub Flow** with conventional commits.

- `main` — Production-ready code only
- `develop` — Integration branch
- `feature/*` — Feature branches from `develop`
- `release/*` — Release candidates
- `hotfix/*` — Emergency production fixes

## Documentation

| Document | Description |
|---|---|
| [SPEC.md](SPEC.md) | Master Engineering Specification |
| [STANDARDS.md](STANDARDS.md) | Software Engineering Standards |
| [CONSTITUTION.md](CONSTITUTION.md) | Immutable Engineering Constitution |

## License

Private — All rights reserved.
