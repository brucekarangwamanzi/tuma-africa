# 🔧 Fix Database Permissions

## Problem
The database user `kmbruce` doesn't have permissions to access the tables owned by `postgres`. This causes 500 errors on login and registration.

## Quick Fix

Run this command in your terminal:

```bash
sudo -u postgres psql -d tuma_africa_cargo -f grant-permissions.sql
```

Or run the commands directly:

```bash
sudo -u postgres psql -d tuma_africa_cargo <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kmbruce;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO kmbruce;
\q
EOF
```

## Alternative: Use Postgres User

If you prefer to use the `postgres` user instead, update your `.env` files:

1. Edit `.env` in the root directory:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=<your-postgres-password>
   ```

2. Edit `backend/.env`:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=<your-postgres-password>
   ```

3. Restart the backend server.

## Verify Fix

After running the permissions fix, test the connection:

```bash
psql -d tuma_africa_cargo -c "SELECT COUNT(*) FROM users;"
```

If this works without errors, the permissions are fixed!


