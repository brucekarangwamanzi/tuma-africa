# 🔧 Fix Git Pull Error on Server

## Problem
```
error: The following untracked working tree files would be overwritten by merge:
        frontend/.env
Please move or remove them before you merge.
```

## Solution

On your server (`root@vmi2949124`), run these commands:

```bash
# 1. Backup your current frontend/.env file
cp frontend/.env frontend/.env.backup

# 2. Remove the file temporarily
rm frontend/.env

# 3. Pull the changes
git pull

# 4. Restore your .env file (if you had custom settings)
cp frontend/.env.backup frontend/.env

# 5. Clean up backup (optional)
rm frontend/.env.backup
```

## Alternative: Stash the file

If you want to keep it but not commit it:

```bash
# 1. Stash the untracked file
git stash push -u -m "Save frontend/.env"

# 2. Pull changes
git pull

# 3. Restore your .env (if needed)
# The file will remain in your working directory
```

## Why This Happened

- `frontend/.env` exists on your server but wasn't in git
- Git tried to merge changes that would affect this file
- Git protects untracked files from being overwritten

## Prevention

I've updated `.gitignore` to ignore `frontend/.env` so this won't happen again. After pulling, your local `.env` file will be safe.

