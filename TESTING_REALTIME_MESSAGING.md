# 🧪 Testing Real-Time Messaging

## ✅ Quick Test Guide

Your Socket.IO messaging system is now running! Follow these steps to test it.

---

## 🚀 Access URLs

### On Your Computer
```
Frontend: http://localhost:3000
Backend:  http://localhost:5001
```

### On Your Phone (Same WiFi)
```
Frontend: http://192.168.43.98:3000
Backend:  http://192.168.43.98:5001
```

---

## 📱 Test Scenario 1: User → Admin Messaging

### Step 1: Login as User (Phone)
1. Open `http://192.168.43.98:3000` on your phone
2. Login with a regular user account
3. Navigate to Messages page

### Step 2: Login as Admin (Computer)
1. Open `http://localhost:3000` in a new browser tab
2. Login with admin account
3. Navigate to Messages page

### Step 3: Send Message from User
1. On phone, type a message: "Hello, I need help!"
2. Click Send
3. **Expected**: Message appears instantly on admin's screen (computer)

### Step 4: Reply from Admin
1. On computer, type reply: "Hi! How can I help you?"
2. Click Send
3. **Expected**: Message appears instantly on user's phone

---

## 🔄 Test Scenario 2: Typing Indicators

### Step 1: Start Typing (User)
1. On phone, click in message input
2. Start typing (don't send yet)
3. **Expected**: Admin sees "typing..." indicator

### Step 2: Stop Typing
1. Stop typing for 3 seconds
2. **Expected**: Typing indicator disappears

---

## ✓ Test Scenario 3: Read Receipts

### Step 1: Send Message
1. User sends message
2. **Expected**: Single gray checkmark (sent)

### Step 2: Admin Opens Chat
1. Admin opens the conversation
2. **Expected**: Double blue checkmark (read)

---

## 🌐 Test Scenario 4: Multiple Devices

### Setup
- Device 1: Phone (User)
- Device 2: Computer Tab 1 (Admin 1)
- Device 3: Computer Tab 2 (Admin 2)

### Test
1. User sends message from phone
2. **Expected**: Both admin tabs receive message instantly
3. Admin 1 replies
4. **Expected**: User and Admin 2 see reply instantly

---

## 🔍 Debugging Tools

### 1. Browser Console (Frontend)

#### Check Connection Status
```javascript
// Open browser console (F12)
console.log(websocketService.isConnected());
// Should return: true
```

#### Check Socket ID
```javascript
console.log(websocketService.socket?.id);
// Should return: socket ID like "abc123xyz"
```

#### Monitor Events
```javascript
// Already logging in console:
// ✅ WebSocket connected successfully
// Socket ID: abc123xyz
// 📨 Message from User: Hello!
```

### 2. Backend Logs

#### Terminal Output
```bash
# You should see:
✅ Socket.IO initialized successfully
Server running on port 5001
MongoDB connected successfully
✅ User connected: John Doe (user) - Socket ID: abc123
📨 Message from John Doe: Hello admin
📢 Notified admins about message from John Doe
```

#### Check Active Users
```bash
# In browser or curl:
curl http://localhost:5001/api/socket/active-users

# Response:
{
  "activeUsers": [
    {
      "userId": "123",
      "userName": "John Doe",
      "userRole": "user",
      "socketId": "abc123",
      "connectedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Network Tab

#### Check WebSocket Connection
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for connection to `localhost:5001` or `192.168.43.98:5001`
5. Status should be "101 Switching Protocols"

---

## 🎯 Expected Behaviors

### ✅ Connection
- [x] Socket connects automatically on login
- [x] Green "Active now" indicator appears
- [x] Console shows "✅ WebSocket connected successfully"

### ✅ Messaging
- [x] Messages appear instantly (< 1 second)
- [x] No page refresh needed
- [x] Messages persist in database
- [x] Sender sees confirmation immediately

### ✅ Typing Indicators
- [x] "typing..." appears when other person types
- [x] Disappears after 3 seconds of inactivity
- [x] Shows in conversation list

### ✅ Read Receipts
- [x] Gray checkmark when sent
- [x] Blue double checkmark when read
- [x] Updates in real-time

### ✅ Online Status
- [x] Green dot when user online
- [x] Gray dot when user offline
- [x] Updates when user connects/disconnects

---

## 🐛 Common Issues & Solutions

### Issue 1: "WebSocket connection failed"

**Symptoms:**
- Red error in console
- Messages don't send
- No "Active now" indicator

**Solutions:**
```bash
# 1. Check backend is running
lsof -i :5001

# 2. Check firewall
sudo ufw allow 5001

# 3. Restart backend
# Stop process and start again
```

### Issue 2: "Authentication error"

**Symptoms:**
- "Authentication error: Invalid token"
- Socket disconnects immediately

**Solutions:**
1. Logout and login again (refresh token)
2. Check JWT_SECRET matches in backend .env
3. Clear localStorage and login again

### Issue 3: Messages not appearing

**Symptoms:**
- Message sent but not received
- One-way communication only

**Solutions:**
```javascript
// 1. Check socket connection
console.log(websocketService.isConnected());

// 2. Check event listeners attached
// Should see in MessagesPage.tsx useEffect

// 3. Check backend logs for errors
// Look for "Socket message error"
```

### Issue 4: Can't connect from phone

**Symptoms:**
- Works on computer but not phone
- Connection timeout on mobile

**Solutions:**
1. Ensure phone on same WiFi network
2. Check computer's IP address:
   ```bash
   hostname -I
   ```
3. Update REACT_APP_WS_URL if needed
4. Allow port 5001 in firewall:
   ```bash
   sudo ufw allow 5001
   ```

---

## 📊 Performance Metrics

### Expected Performance
- **Connection Time**: < 500ms
- **Message Delivery**: < 100ms (local network)
- **Typing Indicator**: < 50ms
- **Read Receipt**: < 100ms

### Monitor Performance
```javascript
// Measure message delivery time
const startTime = Date.now();
websocketService.sendMessage(chatId, { content: 'Test' });

websocketService.onNewMessage((data) => {
  const endTime = Date.now();
  console.log(`Message delivered in ${endTime - startTime}ms`);
});
```

---

## ✅ Test Checklist

### Basic Functionality
- [ ] User can login
- [ ] Socket connects automatically
- [ ] User can send text message
- [ ] Admin receives message instantly
- [ ] Admin can reply
- [ ] User receives reply instantly
- [ ] Messages persist after refresh

### Advanced Features
- [ ] Typing indicator works
- [ ] Read receipts update
- [ ] Online status shows correctly
- [ ] File attachments work
- [ ] Multiple admins receive messages
- [ ] Works on mobile device
- [ ] Auto-reconnects on disconnect

### Edge Cases
- [ ] Works with slow network
- [ ] Handles connection loss gracefully
- [ ] Reconnects automatically
- [ ] Messages queue when offline
- [ ] No duplicate messages
- [ ] Handles large messages
- [ ] Handles rapid message sending

---

## 🎉 Success Criteria

Your messaging system is working correctly if:

1. ✅ Messages appear instantly (< 1 second)
2. ✅ No page refresh needed
3. ✅ Works on both computer and phone
4. ✅ Typing indicators show in real-time
5. ✅ Read receipts update automatically
6. ✅ Online status is accurate
7. ✅ Auto-reconnects on disconnect
8. ✅ Multiple users can chat simultaneously
9. ✅ Messages persist in database
10. ✅ No console errors

---

## 📞 Support

If you encounter issues:

1. **Check Backend Logs**: Look for errors in terminal
2. **Check Browser Console**: Look for WebSocket errors
3. **Check Network Tab**: Verify WebSocket connection
4. **Check Database**: Verify messages are saved
5. **Restart Servers**: Stop and start both servers

---

## 🚀 Next Steps

Once basic messaging works:

1. Test with multiple users
2. Test file attachments
3. Test on different networks
4. Test with poor connection
5. Monitor performance
6. Gather user feedback

**Happy Testing!** 🎉💬
