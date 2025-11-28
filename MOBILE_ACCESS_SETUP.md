# 📱 Mobile Access Setup Guide

## Quick Start

### 1. Find Your Computer's IP Address
Your computer's IP address is: **192.168.0.246**

### 2. Start the Servers

#### Backend Server
```bash
cd /home/kmbruce/inn
npm run server
```
The backend will run on: `http://192.168.0.246:5001`

#### Frontend Server
Open a new terminal:
```bash
cd /home/kmbruce/inn/frontend
npm start
```
The frontend will run on: `http://192.168.0.246:3000`

### 3. Access from Your Phone

1. **Make sure your phone is on the same Wi-Fi network** as your computer

2. **Open your phone's browser** (Chrome, Safari, etc.)

3. **Enter the following URL:**
   ```
   http://192.168.0.246:3000
   ```

### 4. If It Doesn't Work

#### Check Firewall
You may need to allow connections on ports 3000 and 5001:

```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 5001

# Or check if ports are open
sudo netstat -tulpn | grep -E ':(3000|5001)'
```

#### Find Your Actual IP
If 192.168.0.246 doesn't work, find your actual IP:

```bash
# Linux
hostname -I

# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

#### Update CORS (if needed)
If you get CORS errors, the IP might be different. Update `backend/server.js` with your phone's network IP.

### 5. WebSocket Connection

The WebSocket will automatically connect to: `http://192.168.0.246:5001`

Make sure both servers are running and accessible from your phone's network.

### 6. Testing Checklist

- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 3000
- [ ] Phone connected to same Wi-Fi
- [ ] Can access `http://192.168.0.246:3000` from phone
- [ ] Can login/register
- [ ] Notifications work
- [ ] Messages work
- [ ] WebSocket connection established

### Troubleshooting

**Can't connect?**
- Check both devices are on same network
- Try disabling firewall temporarily
- Check router settings (some routers block device-to-device communication)

**CORS errors?**
- Make sure your phone's IP is in the allowed origins
- Check browser console for specific error

**WebSocket not connecting?**
- Check backend is listening on 0.0.0.0 (all interfaces)
- Verify port 5001 is accessible
- Check browser console for WebSocket errors

### Alternative: Use ngrok (for external access)

If you want to test from anywhere (not just same network):

```bash
# Install ngrok
# Then run:
ngrok http 3000

# This will give you a public URL like:
# https://abc123.ngrok.io
```

Note: You'll also need to tunnel the backend:
```bash
ngrok http 5001
```

And update the WebSocket URL in the frontend to use the ngrok URL.

