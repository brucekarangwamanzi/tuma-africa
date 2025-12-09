# 🔧 Fix: "value too long for type character varying(255)" Error

## Problem
When creating a product with a base64-encoded image (data URI), you get this error:
```
value too long for type character varying(255)
```

This happens because:
- Base64 images can be 10,000+ characters long
- The `imageUrl` column is currently `VARCHAR(255)` (max 255 characters)
- Base64 data URIs exceed this limit

## Solution

### Step 1: Update Database Column Type

You need to change the `imageUrl` column from `VARCHAR(255)` to `TEXT` (unlimited length).

**Option A: Run the SQL script (requires sudo password)**
```bash
sudo -u postgres psql -d tuma_africa_cargo -c "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
```

**Option B: Run the provided script**
```bash
./fix-imageurl.sh
```

**Option C: Manual SQL (if you have postgres access)**
```sql
ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;
```

### Step 2: Verify the Change

After running the command, verify it worked:
```bash
PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
```

You should see `data_type = text` (instead of `character varying`).

### Step 3: Restart Backend

The backend model has already been updated to use `TEXT` type. After changing the database column, restart the backend:

```bash
# Kill existing backend
kill $(lsof -ti:5001) 2>/dev/null

# Start backend
npm run backend
```

## ✅ What's Already Fixed

1. ✅ **Model Updated**: `backend/models/Product.js` - Changed `imageUrl` from `STRING` to `TEXT`
2. ✅ **Migration Created**: `backend/migrations/002-fix-imageurl-length.js` - Ready to run
3. ✅ **Backend Code**: Already handles long image URLs

## 🎯 After Fix

Once you run the SQL command, you'll be able to:
- ✅ Create products with base64-encoded images
- ✅ Store images as data URIs (data:image/jpeg;base64,...)
- ✅ No more "value too long" errors

## 📝 Note

If you can't run the SQL command yourself, you can:
1. Ask your database administrator to run it
2. Use a database GUI tool (pgAdmin, DBeaver, etc.) to alter the column
3. The command is safe - it only changes the column type, doesn't delete data

---

**Status**: Model updated ✅ | Database column needs manual update ⚠️

