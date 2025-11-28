# 🌐 DNS Configuration Guide for tuma.com

## Step-by-Step DNS Setup

This guide will help you configure DNS for `tuma.com` to point to your Contabo server.

---

## 📋 Prerequisites

- [ ] Domain `tuma.com` registered
- [ ] Access to your domain registrar's DNS management panel
- [ ] Your Contabo server IP address

---

## 🎯 Step 1: Get Your Contabo Server IP

### From Contabo Dashboard

1. Log in to your Contabo account
2. Go to **VPS** → **Your Server**
3. Find your **IPv4 Address** (e.g., `123.45.67.89`)
4. **Copy this IP address** - you'll need it for DNS configuration

### From SSH (if already connected)

```bash
# Get your server's public IP
curl ifconfig.me
# or
hostname -I
```

---

## 🔧 Step 2: Configure DNS Records

### Where to Configure

Go to your domain registrar's DNS management panel:
- **Namecheap**: Domain List → Manage → Advanced DNS
- **GoDaddy**: My Products → DNS
- **Cloudflare**: Select domain → DNS → Records
- **Google Domains**: DNS → Custom records
- **Other registrars**: Look for "DNS Management" or "DNS Settings"

### DNS Records to Add

You need to add **2 A records**:

#### Record 1: Root Domain
```
Type: A
Name: @ (or tuma.com or leave blank)
Value: YOUR_CONTABO_SERVER_IP
TTL: 3600 (or Auto)
```

#### Record 2: WWW Subdomain
```
Type: A
Name: www
Value: YOUR_CONTABO_SERVER_IP
TTL: 3600 (or Auto)
```

### Example Configuration

If your Contabo server IP is `185.123.45.67`:

**Record 1:**
- Type: `A`
- Host/Name: `@` or `tuma.com`
- Points to/Value: `185.123.45.67`
- TTL: `3600`

**Record 2:**
- Type: `A`
- Host/Name: `www`
- Points to/Value: `185.123.45.67`
- TTL: `3600`

---

## ⏱️ Step 3: Wait for DNS Propagation

DNS changes can take:
- **Minimum:** 5-15 minutes
- **Average:** 30 minutes to 2 hours
- **Maximum:** Up to 48 hours (rare)

**Most changes propagate within 1 hour.**

---

## ✅ Step 4: Verify DNS Configuration

### Method 1: Using `dig` (Linux/Mac)

```bash
# Check root domain
dig tuma.com +short

# Check www subdomain
dig www.tuma.com +short

# Both should return your Contabo server IP
```

**Expected output:**
```
185.123.45.67
```

### Method 2: Using `nslookup` (All Platforms)

```bash
# Check root domain
nslookup tuma.com

# Check www subdomain
nslookup www.tuma.com
```

**Expected output:**
```
Server:     8.8.8.8
Address:    8.8.8.8#53

Non-authoritative answer:
Name:   tuma.com
Address: 185.123.45.67
```

### Method 3: Using `host` (Linux/Mac)

```bash
host tuma.com
host www.tuma.com
```

### Method 4: Online Tools

Use these websites to check DNS propagation:

1. **DNS Checker**: https://dnschecker.org/
   - Enter: `tuma.com`
   - Select: `A` record
   - Check globally

2. **What's My DNS**: https://www.whatsmydns.net/
   - Enter: `tuma.com`
   - Check: `A` record

3. **MXToolbox**: https://mxtoolbox.com/DNSLookup.aspx
   - Enter: `tuma.com`
   - Check DNS records

### Method 5: Using `curl` or Browser

```bash
# Test if domain resolves
curl -I http://tuma.com

# Or just visit in browser
# http://tuma.com (should show your server or Nginx default page)
```

---

## 🔍 Step 5: Verify DNS is Working

### Quick Test Commands

```bash
# Test DNS resolution
dig tuma.com +short
dig www.tuma.com +short

# Both should return your Contabo server IP
# If they do, DNS is configured correctly!
```

### Expected Results

✅ **Success:**
```
185.123.45.67
```
Both `tuma.com` and `www.tuma.com` return your server IP.

❌ **Not Ready:**
```
(no response)
or
NXDOMAIN
or
Different IP address
```

If you see these, DNS is not configured or not propagated yet.

---

## 🆘 Troubleshooting

### DNS Not Resolving?

1. **Check DNS Records**
   - Verify A records are added correctly
   - Ensure IP address is correct
   - Check for typos

2. **Wait Longer**
   - DNS can take up to 48 hours
   - Usually works within 1 hour
   - Check again after 30 minutes

3. **Clear DNS Cache**

**Windows:**
```cmd
ipconfig /flushdns
```

**Mac:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
# or
sudo service network-manager restart
```

4. **Check Different DNS Servers**
   - Try: `dig @8.8.8.8 tuma.com`
   - Try: `dig @1.1.1.1 tuma.com`

5. **Verify IP Address**
   - Double-check your Contabo server IP
   - Make sure server is running
   - Test: `ping YOUR_SERVER_IP`

### Common Issues

**Issue: DNS returns wrong IP**
- Solution: Wait for propagation or check if you entered the correct IP

**Issue: DNS returns nothing**
- Solution: Verify DNS records are saved in your registrar's panel

**Issue: Only www works, root doesn't (or vice versa)**
- Solution: Make sure you added BOTH A records (@ and www)

**Issue: DNS works but website doesn't load**
- Solution: This is normal - you haven't deployed the app yet. DNS is working correctly.

---

## ✅ DNS Configuration Checklist

- [ ] Got Contabo server IP address
- [ ] Logged into domain registrar
- [ ] Added A record for `@` (root domain) → Server IP
- [ ] Added A record for `www` → Server IP
- [ ] Saved DNS changes
- [ ] Waited at least 15 minutes
- [ ] Verified with `dig tuma.com` - returns server IP
- [ ] Verified with `dig www.tuma.com` - returns server IP
- [ ] DNS propagation confirmed

---

## 🚀 Next Steps

Once DNS is configured and verified:

1. **Proceed with Deployment**
   - Follow `DEPLOY_TUMA_COM.md`
   - DNS must be working before SSL setup

2. **Test After Deployment**
   - Visit: `https://tuma.com`
   - Test API: `https://tuma.com/api/health`

---

## 📝 Quick Reference

### Verify DNS Commands

```bash
# Quick check
dig tuma.com +short

# Detailed check
dig tuma.com

# Check www
dig www.tuma.com +short

# Using nslookup
nslookup tuma.com
nslookup www.tuma.com
```

### Your Configuration

- **Domain:** `tuma.com`
- **Server IP:** `YOUR_CONTABO_SERVER_IP`
- **A Records Needed:** 2 (@ and www)
- **TTL:** 3600 seconds (1 hour)

---

## ✅ Ready for Deployment

Once DNS is verified and both `tuma.com` and `www.tuma.com` resolve to your server IP, you're ready to deploy!

**Next:** Follow `DEPLOY_TUMA_COM.md` for deployment instructions.

---

**Need help?** Check your domain registrar's DNS documentation or contact their support.

