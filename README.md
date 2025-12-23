# Corrix Dashboard

Enterprise analytics dashboard for monitoring AI collaboration metrics across your organization.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the database:
```bash
docker-compose up -d
```

3. Run migrations:
```bash
npm run migrate
```

4. Seed demo data (optional):
```bash
npm run seed
```

5. Start development servers:
```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Dashboard
npm run dev:dashboard
```

The dashboard will be available at http://localhost:3000

## Project Structure

```
corrix-dashboard/
├── packages/
│   ├── api/          # Express API server
│   ├── dashboard/    # React frontend
│   └── shared/       # Shared types
├── docker-compose.yml
└── package.json
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/corrix_dashboard
PORT=3001
JWT_SECRET=your-secret-here
```

## Features

- **Overview**: Organization-wide metrics and trends
- **Teams**: Team comparison and ranking
- **Behaviors**: Prompt quality and action analysis
- **Adoption**: User growth and team adoption tracking
