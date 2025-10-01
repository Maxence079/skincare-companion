# 🚀 Setting Up Automated Migrations for the Whole Project

## Why Manual Setup Currently?

Supabase blocks direct SQL execution via REST API for security. Here's how to enable **true automated migrations**:

---

## Option 1: Use Supabase CLI (Recommended for Development)

### Setup Steps:

#### 1. Get Supabase Access Token
```bash
# Login to Supabase CLI (opens browser)
npx supabase login
```

This will:
- Open browser for authentication
- Store token in: `~/.supabase/access-token`

#### 2. Link Project
```bash
npx supabase link --project-ref gmhrjszytqslojujpvws
```

#### 3. Run Migrations Automatically
```bash
# Push all migrations to remote
npx supabase db push

# Or run specific migration
npx supabase migration up
```

#### 4. Add to package.json
```json
{
  "scripts": {
    "db:push": "npx supabase db push",
    "db:reset": "npx supabase db reset",
    "migrate": "npx supabase migration up"
  }
}
```

---

## Option 2: Use Management API Token (For CI/CD)

### For Automated Deployments:

#### 1. Get Management API Token
- Go to: https://supabase.com/dashboard/account/tokens
- Create new token
- Copy token

#### 2. Add to .env.local
```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx...
```

#### 3. Use in Scripts
```javascript
// scripts/migrate-auto.mjs
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

// Use Supabase Management API
const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/migrations`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

---

## Option 3: Database Direct Connection (Most Powerful)

### For Advanced Automation:

#### 1. Get Database Credentials
- Dashboard → Settings → Database
- Copy: Host, Database, User, Password

#### 2. Use pg (PostgreSQL client)
```bash
npm install pg
```

```javascript
// scripts/migrate-direct.mjs
import pg from 'pg';
import { readFileSync } from 'fs';

const client = new pg.Client({
  host: 'db.gmhrjszytqslojujpvws.supabase.co',
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
const sql = readFileSync('migration.sql', 'utf8');
await client.query(sql);
await client.end();
```

#### 3. Add DB Password to .env.local
```bash
SUPABASE_DB_PASSWORD=your_db_password
```

---

## Recommended Setup for Your Project

### Hybrid Approach (Best of Both Worlds):

1. **Development**: Use Supabase CLI
   ```bash
   npx supabase migration up
   ```

2. **CI/CD**: Use Management API
   - Store `SUPABASE_ACCESS_TOKEN` in GitHub Secrets
   - Auto-run migrations on deploy

3. **Emergency**: Manual SQL Editor
   - Always works as fallback

---

## Let's Implement This Now

Which option do you prefer?

### Option 1: Supabase CLI Setup (Easiest for Dev)
- ✅ Run `npx supabase login` now
- ✅ I'll configure the rest
- ✅ One command migrations forever

### Option 2: Direct Database Connection (Most Reliable)
- ✅ Get DB password from Supabase
- ✅ I'll write the script
- ✅ Works everywhere, no CLI needed

### Option 3: Keep Manual (Current)
- ✅ Copy/paste SQL (works but slow)
- ✅ No setup needed
- ✅ Good for one-time migrations

Which would you like?
