# Corrix Dashboard - Deployment Guide

This guide covers deploying the Corrix Dashboard to production using:
- **Vercel** - Dashboard frontend
- **Railway** - API backend
- **Supabase** - PostgreSQL database

## Prerequisites

- GitHub repository with the monorepo
- Accounts on Vercel, Railway, and Supabase
- Node.js 20+ locally for testing

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vercel         │────▶│  Railway        │────▶│  Supabase       │
│  (Dashboard)    │     │  (API)          │     │  (PostgreSQL)   │
│  React + Vite   │     │  Express.js     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Chrome Extension (hapii)                                       │
│  - Syncs to Supabase directly                                  │
│  - Fetches targeting config from API                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Save the database password securely

### 1.2 Run Migration

Option A: Using Supabase Dashboard
1. Go to SQL Editor in your Supabase project
2. Copy contents of `supabase/migrations/20241222000000_initial_schema.sql`
3. Run the migration

Option B: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### 1.3 Get Connection Details

From Project Settings > Database, copy:
- **Connection string** (for Railway API)
- **Project URL** (for extension)
- **Anon Key** (for extension)

From Project Settings > API:
- **API URL**: `https://YOUR_PROJECT.supabase.co`
- **anon public key**: For client-side access

---

## Step 2: Railway API Deployment

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2.2 Configure Build Settings

Railway should auto-detect the Dockerfile or use nixpacks. The `railway.toml` in `packages/api/` configures:
- Build command: `npm run build`
- Start command: `npm start`
- Health check: `/health`
- Port: `3001`

### 2.3 Set Environment Variables

In Railway, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `3001` | Internal port |
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | `postgresql://...` | From Supabase (use pooler for Railway) |
| `JWT_SECRET` | `<generate-secure-key>` | Use `openssl rand -base64 32` |
| `CORS_ORIGINS` | `https://corrix.vercel.app` | Your Vercel domain |
| `SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase |
| `SUPABASE_ANON_KEY` | `eyJ...` | From Supabase |

### 2.4 Configure Root Directory

In Railway settings:
- Set **Root Directory** to `packages/api`
- Or use the Dockerfile which handles the monorepo structure

### 2.5 Get API URL

After deployment, Railway provides a URL like:
`https://corrix-api-production.up.railway.app`

---

## Step 3: Vercel Dashboard Deployment

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository

### 3.2 Configure Project

Vercel should detect the `vercel.json` in `packages/dashboard/`. Configure:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `packages/dashboard` |
| Build Command | (from vercel.json) |
| Output Directory | `dist` |
| Install Command | `cd ../.. && npm install` |

### 3.3 Set Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://corrix-api.up.railway.app/api` | Your Railway URL + /api |

### 3.4 Deploy

Click "Deploy" and wait for the build to complete.

---

## Step 4: Chrome Extension Configuration

### 4.1 Update Extension Environment

Create/update `/Users/geoffgibbins/hapi/hapii/.env`:

```env
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_CLERK_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...YOUR_ANON_KEY
```

### 4.2 Build for Production

```bash
cd /Users/geoffgibbins/hapi/hapii
npm run build
```

### 4.3 Chrome Web Store (optional)

1. Zip the `dist` folder
2. Upload to Chrome Web Store Developer Dashboard
3. Submit for review

---

## Step 5: Verification Checklist

### API Health Check
```bash
curl https://YOUR_RAILWAY_URL/health
# Expected: {"status":"ok"}
```

### API Auth Test
```bash
# Get a JWT token from your auth flow, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_RAILWAY_URL/api/targeting/config
```

### Dashboard Access
1. Visit your Vercel URL
2. Sign in
3. Check that data loads from the API

### Extension Sync
1. Install extension in Chrome
2. Sign in via Clerk
3. Verify Supabase connection in DevTools console

---

## Troubleshooting

### CORS Issues
- Ensure `CORS_ORIGINS` in Railway includes your Vercel domain
- Check for trailing slashes in URLs

### Database Connection Failed
- Use Supabase **pooler** connection string for Railway (port 6543)
- Direct connections may fail due to connection limits

### Build Failures
- Check that `@corrix/shared` builds before dashboard/API
- Verify all workspace dependencies are installed

### Extension Not Syncing
- Check Supabase URL and anon key in extension `.env`
- Verify RLS policies allow extension writes

---

## Environment Variables Reference

### API (Railway)
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
JWT_SECRET=your-secure-jwt-secret-here
CORS_ORIGINS=https://your-dashboard.vercel.app
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
REDIS_URL=  # Optional: for caching
```

### Dashboard (Vercel)
```env
VITE_API_URL=https://your-api.up.railway.app/api
```

### Extension (hapii)
```env
CLERK_PUBLISHABLE_KEY=pk_live_...
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
```

---

## Updating Deployments

### API Updates
```bash
git push origin main
# Railway auto-deploys from main branch
```

### Dashboard Updates
```bash
git push origin main
# Vercel auto-deploys from main branch
```

### Database Migrations
```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: SQL Editor
# Paste new migration SQL in Supabase dashboard
```

---

## Rollback

### Railway
1. Go to Railway Deployments
2. Click on a previous deployment
3. Click "Rollback"

### Vercel
1. Go to Vercel Deployments
2. Click on a previous deployment
3. Click "Promote to Production"

### Database
- Use Supabase Point-in-Time Recovery (if enabled)
- Or restore from backup
