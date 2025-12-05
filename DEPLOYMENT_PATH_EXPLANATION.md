# 📁 Why `/var/www`? (And You Don't Have To!)

## 🤔 The Question

You're asking: **"Why am I supposed to put my project in `/var/www`?"**

## ✅ Short Answer

**You DON'T have to!** You can use **any directory** you want. `/var/www` is just a **convention**, not a requirement.

---

## 📚 Why `/var/www` is Commonly Used

### 1. **Linux Convention**
- `/var/www` is the traditional location for web content on Linux servers
- It's where Apache and Nginx expect to find web files by default
- It's a **standard** that many developers follow

### 2. **Organization**
- Keeps web applications separate from system files
- Makes it clear what's a web application vs. system software
- Easier to find and manage

### 3. **Permissions**
- Usually owned by `www-data` (Nginx user)
- Standard permissions are already set up
- Less permission issues

### 4. **Security**
- Separated from user home directories
- Can have restricted access
- Better for production servers

---

## 🎯 Your Current Setup

You're currently using:
```
/root/project/tuma-africa
```

**This is perfectly fine!** ✅

---

## 🔧 How to Use Your Current Location

### Option 1: Keep Using `/root/project/tuma-africa` (Recommended for you)

Just update the paths in configuration files:

1. **Update `ecosystem.config.js`**:
   ```javascript
   cwd: '/root/project/tuma-africa',
   ```

2. **Update `nginx-production.conf`**:
   ```nginx
   root /root/project/tuma-africa/frontend/build;
   ```

3. **Update `setup-nginx.sh`**:
   ```bash
   PROJECT_DIR="/root/project/tuma-africa"
   ```

### Option 2: Move to `/var/www/tuma-africa` (Traditional)

If you want to follow the convention:

```bash
# Move project
sudo mv /root/project/tuma-africa /var/www/tuma-africa

# Set ownership
sudo chown -R $USER:$USER /var/www/tuma-africa

# Update paths in config files (already set to /var/www/tuma-africa)
```

---

## 📋 Comparison

| Location | Pros | Cons |
|----------|------|------|
| `/root/project/tuma-africa` | ✅ Already there<br>✅ Easy access<br>✅ No moving needed | ⚠️ In root's home directory<br>⚠️ Less "standard" |
| `/var/www/tuma-africa` | ✅ Standard convention<br>✅ Better organization<br>✅ Separated from user files | ⚠️ Need to move files<br>⚠️ May need permission setup |

---

## 🎯 Recommendation for You

**Since you're already in `/root/project/tuma-africa`:**

1. **Keep it there** - It works perfectly fine!
2. **Just update the config files** to point to your actual location
3. **No need to move anything**

---

## 🔧 Quick Fix: Update Config Files

I've already updated the config files to use `/root/project/tuma-africa` as the default. You can:

1. **Use your current location** - Just make sure nginx config points to it
2. **Or change to `/var/www`** - If you prefer the standard location

**Both work!** The important thing is that **all paths match**:
- `ecosystem.config.js` → Project directory
- `nginx-production.conf` → Frontend build path
- All scripts → Same project directory

---

## 💡 Bottom Line

- `/var/www` = **Convention** (not required)
- `/root/project/tuma-africa` = **Your current location** (works perfectly!)
- **Any directory** = Works as long as paths are consistent

**Use whatever location you prefer!** Just make sure all your config files point to the same place. 🎯

