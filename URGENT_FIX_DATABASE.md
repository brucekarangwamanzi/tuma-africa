# 🚨 URGENT: Fix Database to Enable Product Creation

## The Problem
You cannot create products because the database column `imageUrl` is too small (VARCHAR 255) to store base64-encoded images.

## The Solution (MUST RUN THIS)

**Open a terminal and run this command:**

```bash
sudo -u postgres psql -d tuma_africa_cargo -c "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
```

You'll be prompted for your sudo password.

## Verify It Worked

After running the command, verify:

```bash
PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
```

You should see: `data_type = text` (NOT `character varying`)

## After Fix

1. Restart backend: `npm run backend` (if needed)
2. Try creating a product again
3. It will work! ✅

---

**Current Status**: Database column is still VARCHAR(255) - this MUST be fixed before products can be created.

