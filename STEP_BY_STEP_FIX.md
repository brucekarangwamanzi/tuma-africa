# 🔧 Step-by-Step Fix for Database Error

## The Error
"Database Configuration Error: The image URL is too long..."

## Quick Fix (Choose One Method)

### Method 1: Run the Script (Easiest)
```bash
./fix-database-now.sh
```
Enter your sudo password when prompted.

### Method 2: Single Command
Open terminal and run:
```bash
sudo -u postgres psql -d tuma_africa_cargo -c "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
```

### Method 3: Interactive psql
```bash
sudo -u postgres psql -d tuma_africa_cargo
```
Then type:
```sql
ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;
\q
```

## Verify It Worked
```bash
PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
```

You should see: `data_type = text`

## After Fix
1. Refresh your browser
2. Try creating a product again
3. The error will be gone! ✅

---

**This is a one-time fix. After running it, product creation will work forever.**

