# 📱 Mobile Access Guide

## How to Access the App from Your Phone

### Prerequisites
1. ✅ Your phone must be on the **same WiFi network** as your computer
2. ✅ Both backend and frontend servers must be running

### Steps

1. **Find Your Computer's IP Address**
   - The app will automatically detect and display it when you start the backend server
   - Look for: `📱 Network access: http://192.168.x.x:5001`
   - Or run: `ip route get 8.8.8.8 | awk '{print $7}'`

2. **Start the Servers** (if not already running)
   ```bash
   # Terminal 1 - Backend
   npm run backend
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

3. **Access from Your Phone**
   - Open your phone's web browser (Chrome, Safari, etc.)
   - Enter the URL: `http://192.168.0.246:3000`
     - Replace `192.168.0.246` with your actual network IP if different
   - The app will automatically connect to the backend

### Network IP Detection

The app automatically detects:
- ✅ When accessed from `localhost` → uses `localhost:5001` for API
- ✅ When accessed from network IP → uses same IP with port `5001` for API
- ✅ WebSocket connections work automatically on the same network

### Troubleshooting

**Can't access from phone?**
1. Check both devices are on the same WiFi network
2. Check firewall isn't blocking ports 3000 and 5001
3. Verify the IP address shown in backend logs
4. Try accessing `http://YOUR_IP:5001/api/health` from phone to test backend

**Connection errors?**
- Make sure backend is listening on `0.0.0.0` (not just `localhost`)
- Check CORS settings allow your network IP
- Verify no firewall is blocking the connection

### Current Configuration

- **Backend**: Listens on `0.0.0.0:5001` (accessible from network)
- **Frontend**: Listens on `0.0.0.0:3000` (accessible from network)
- **CORS**: Configured to allow network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- **API Base URL**: Automatically detects and uses correct IP

### Quick Test

From your phone's browser, try:
- Frontend: `http://192.168.0.246:3000`
- Backend Health: `http://192.168.0.246:5001/api/health`

Both should work if everything is configured correctly!

