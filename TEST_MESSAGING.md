# 🧪 Test Messaging System - Quick Guide

## 🎯 Quick Test (5 Minutes)

### Step 1: Test as User (2 minutes)

1. **Open Browser 1 (User)**
   ```
   http://localhost:3000/login
   ```

2. **Register/Login as User**
   - Click "Sign Up" if new user
   - Or login with existing account

3. **Go to Messages**
   - Click chat icon (bottom right)
   - Or go to: http://localhost:3000/messages

4. **Send Test Message**
   - Type: "Hello, I need help with my order #TMA-12345"
   - Click Send button
   - ✅ Message should appear on right side (blue)

5. **Upload File (Optional)**
   - Click attachment icon
   - Select an image
   - Click Send
   - ✅ File should upload and display

---

### Step 2: Test as Admin (3 minutes)

1. **Open Browser 2 (Admin) - Incognito/Private Window**
   ```
   http://localhost:3000/login
   ```

2. **Login as Super Admin**
   - Email: `admin@tumaafricacargo.com`
   - Password: `admin123`

3. **Go to Chat Management**
   - Click "Chat Management" in admin menu
   - Or go to: http://localhost:3000/admin/chats

4. **View User Message**
   - ✅ You should see the user's message in the list
   - ✅ Unread count should show "1"
   - Click on the conversation

5. **Reply to User**
   - Type: "Hello! I can help you with that. What's the issue?"
   - Click Send
   - ✅ Message should appear on left side (white)

---

### Step 3: Verify Real-Time (1 minute)

1. **Switch to Browser 1 (User)**
   - ✅ Admin's reply should appear instantly
   - ✅ Toast notification should show
   - ✅ Message status should update

2. **Send Another Message (User)**
   - Type: "The order hasn't arrived yet"
   - Click Send

3. **Switch to Browser 2 (Admin)**
   - ✅ User's message should appear instantly
   - ✅ Toast notification should show
   - ✅ Unread count should update

---

## 📱 Test on Mobile

### Quick Mobile Test:

1. **Open Phone Browser**
   ```
   http://192.168.43.98:3000/messages
   ```

2. **Login and Send Message**
   - Login with user account
   - Send a test message
   - ✅ Should work smoothly on mobile

3. **Check on Desktop Admin**
   - ✅ Message should appear in admin panel

---

## ✅ What to Verify

### User Side:
- [ ] Can send text messages
- [ ] Can upload files
- [ ] Messages appear on right (blue)
- [ ] Admin replies appear on left (white)
- [ ] Toast notifications work
- [ ] Message status updates (sent/read)
- [ ] Unread count shows correctly
- [ ] Chat button works
- [ ] Mobile responsive

### Admin Side:
- [ ] Can see all user conversations
- [ ] Can reply to messages
- [ ] Messages appear on left (white)
- [ ] User messages appear on right (blue)
- [ ] Toast notifications work
- [ ] Unread count updates
- [ ] Can mark as resolved
- [ ] Can change priority
- [ ] Real-time updates work

---

## 🎨 Expected Behavior

### Message Flow:
```
User sends → Appears in user chat (right, blue)
           → Appears in admin chat (right, blue)
           → Admin gets notification

Admin replies → Appears in admin chat (left, white)
              → Appears in user chat (left, white)
              → User gets notification
```

### Visual Indicators:
- **User messages:** Blue gradient, right-aligned
- **Admin messages:** White background, left-aligned, admin badge
- **Sending:** Gray checkmark
- **Sent:** Single checkmark
- **Read:** Double blue checkmarks
- **Online:** Green dot
- **Offline:** Gray dot

---

## 🔧 Troubleshooting

### Issue: Messages not appearing

**Solution:**
1. Refresh both browsers
2. Check WebSocket connection (green dot)
3. Check browser console for errors
4. Verify both users are logged in

### Issue: No notifications

**Solution:**
1. Check browser notification permissions
2. Verify WebSocket is connected
3. Try refreshing the page

### Issue: File upload fails

**Solution:**
1. Check file size (< 10MB)
2. Verify file type is allowed
3. Check internet connection

---

## 🎯 Advanced Testing

### Test Scenarios:

**Scenario 1: Multiple Messages**
1. User sends 5 messages quickly
2. Admin replies to each
3. ✅ All messages should appear in order
4. ✅ Timestamps should be correct

**Scenario 2: File Attachments**
1. User uploads image
2. Admin views image
3. Admin uploads document
4. User downloads document
5. ✅ All files should work

**Scenario 3: Connection Loss**
1. Disconnect internet
2. Try sending message
3. Reconnect internet
4. ✅ Message should send automatically

**Scenario 4: Multiple Admins**
1. Login as admin in Browser 2
2. Login as super admin in Browser 3
3. Both reply to same user
4. ✅ User sees both replies

---

## 📊 Performance Check

### Load Test:
- Send 50 messages rapidly
- ✅ All should appear
- ✅ No lag or freezing
- ✅ Scroll should work smoothly

### Mobile Performance:
- Test on 3G/4G connection
- ✅ Messages load quickly
- ✅ Images load progressively
- ✅ No crashes

---

## ✅ Success Criteria

All these should work:
- ✅ User can send messages
- ✅ Admin receives messages instantly
- ✅ Admin can reply
- ✅ User receives replies instantly
- ✅ Notifications appear
- ✅ File upload works
- ✅ Message status updates
- ✅ Mobile responsive
- ✅ Real-time updates
- ✅ No errors in console

---

## 🎉 Quick Verification

Run this quick test:

1. **User:** Send "Test 1"
2. **Admin:** Reply "Test 2"
3. **User:** Send "Test 3"
4. **Admin:** Reply "Test 4"

✅ If all 4 messages appear correctly in both chats, the system is working!

---

## 📞 Current Access URLs

**User Messages:**
- Desktop: http://localhost:3000/messages
- Mobile: http://192.168.43.98:3000/messages

**Admin Chat:**
- Desktop: http://localhost:3000/admin/chats
- Mobile: http://192.168.43.98:3000/admin/chats

**Credentials:**
- Admin: admin@tumaafricacargo.com / admin123

---

**The messaging system is ready for testing!** 🚀

Just follow the steps above to verify everything works correctly.
