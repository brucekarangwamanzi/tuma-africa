# 🔥 Firewall Setup for Mobile Access

## Check Firewall Status

Run this command to check if UFW (firewall) is active:

```bash
sudo ufw status
```

## Allow Ports for Mobile Access

If the firewall is active, you need to allow ports 3000 (frontend) and 5001 (backend):

```bash
# Allow frontend port (React app)
sudo ufw allow 3000/tcp

# Allow backend port (Node.js API)
sudo ufw allow 5001/tcp

# Verify the rules were added
sudo ufw status numbered
```

## Alternative: Check if Firewall is Blocking

If you're not sure if UFW is the issue, you can:

1. **Temporarily disable firewall** (for testing only):
   ```bash
   sudo ufw disable
   ```

2. **Or check if ports are listening**:
   ```bash
   sudo netstat -tuln | grep -E ':(3000|5001)'
   # Or
   sudo ss -tuln | grep -E ':(3000|5001)'
   ```

## If Firewall is Not the Issue

If ports are still not accessible after allowing them:

1. **Check your router settings** - Some routers block device-to-device communication
2. **Check if both devices are on the same network** - They must be on the same Wi-Fi
3. **Try disabling firewall temporarily** to test if that's the issue
4. **Check if your computer's firewall (iptables) is blocking**:
   ```bash
   sudo iptables -L -n | grep -E '(3000|5001)'
   ```

## Quick Test

After allowing the ports, test from your phone:
- Frontend: `http://192.168.0.246:3000`
- Backend API: `http://192.168.0.246:5001/api/health`

If you can access these URLs from your phone's browser, the firewall is configured correctly!

