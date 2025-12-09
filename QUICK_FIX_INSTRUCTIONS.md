# 🚨 QUICK FIX: Base64 Image Error

## The Problem
You're getting: `value too long for type character varying(255)`

This is because base64 images are too long for the current database column.

## The Solution (Choose One Method)

### Method 1: Run the Script (Easiest)
```bash
./run-this-to-fix.sh
```
You'll be prompted for your sudo password.

### Method 2: Manual SQL Command
Open a terminal and run:
```bash
sudo -u postgres psql -d tuma_africa_cargo
```

Then inside psql, type:
```sql
ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;
\q
```

### Method 3: Single Command
```bash
sudo -u postgres psql -d tuma_africa_cargo -c "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
```

### Method 4: Using Database GUI
If you have pgAdmin, DBeaver, or another database tool:
1. Connect to `tuma_africa_cargo` database
2. Find the `products` table
3. Right-click → Modify/Edit
4. Find `imageUrl` column
5. Change type from `VARCHAR(255)` to `TEXT`
6. Save

## Verify It Worked
After running any method above, verify:
```bash
PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
```

You should see `data_type = text` (not `character varying`).

## After Fix
1. Restart backend: `npm run backend` (if not already running)
2. Try creating the product again
3. It should work! ✅

---

**Note**: The backend code is already updated. You just need to update the database column type.

