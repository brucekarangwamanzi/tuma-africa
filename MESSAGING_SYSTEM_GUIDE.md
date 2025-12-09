# 💬 Messaging System Guide

## Overview

The Tuma-Africa Cargo platform has a real-time messaging system that allows users to communicate with admins and super admins for support.

---

## 🎯 How It Works

### For Users:
1. **Access Messages:** Click the chat icon or go to `/messages`
2. **Send Message:** Type your message and click send
3. **Receive Replies:** Get instant notifications when admin responds
4. **Attach Files:** Upload images, documents, or files
5. **Track Status:** See message delivery and read status

### For Admins/Super Admins:
1. **Access Chat Management:** Go to `/admin/chats`
2. **View All Conversations:** See all user messages
3. **Reply to Users:** Send responses instantly
4. **Manage Chats:** Mark as resolved, assign priority
5. **Real-time Updates:** Get notified of new messages

---

## 📱 User Message Flow

### Step 1: User Sends Message
```
User → Types message → Clicks Send → Message saved to database
```

### Step 2: Admin Gets Notified
```
Database → WebSocket → Admin Dashboard → Notification appears
```

### Step 3: Admin Replies
```
Admin → Types reply → Clicks Send → Message saved to database
```

### Step 4: User Gets Notified
```
Database → WebSocket → User Chat → Notification appears
```

---

## 🔔 Notification System

### User Notifications:
- ✅ Toast notification when admin replies
- ✅ Unread message count badge
- ✅ Sound notification (optional)
- ✅ Browser notification (if enabled)

### Admin Notifications:
- ✅ Toast notification for new user messages
- ✅ Unread count in admin panel
- ✅ Real-time chat list updates
- ✅ Priority indicators

---

## 💻 Access Points

### For Users:

**Messages Page:**
- URL: `http://localhost:3000/messages`
- Features:
  - View all messages
  - Send new messages
  - Upload files
  - See message status
  - Real-time updates

**Chat Button:**
- Floating chat button on all pages
- Quick access to support
- Unread count badge
- Minimizable interface

### For Admins:

**Chat Management:**
- URL: `http://localhost:3000/admin/chats`
- Features:
  - View all user conversations
  - Reply to messages
  - Mark as resolved
  - Assign priority
  - Filter by status
  - Search conversations

**Admin Dashboard:**
- Quick access to recent messages
- Unread message count
- Priority indicators
- Direct links to conversations

---

## 🎨 Message Features

### Text Messages:
- ✅ Plain text
- ✅ Emoji support
- ✅ Line breaks
- ✅ URLs auto-linked
- ✅ Markdown support (optional)

### File Attachments:
- ✅ Images (JPEG, PNG, GIF)
- ✅ Documents (PDF, DOC, DOCX)
- ✅ Text files (TXT)
- ✅ Archives (ZIP, RAR)
- ✅ Max size: 10MB

### Message Status:
- 🕐 **Sending** - Message being sent
- ✓ **Sent** - Message delivered to server
- ✓✓ **Delivered** - Message received by recipient
- ✓✓ **Read** - Message read by recipient (blue checkmarks)

---

## 🚀 Real-Time Features

### WebSocket Connection:
- Instant message delivery
- No page refresh needed
- Connection status indicator
- Automatic reconnection
- Typing indicators (coming soon)

### Live Updates:
- New messages appear instantly
- Read receipts update in real-time
- Online/offline status
- Typing indicators
- Message delivery confirmation

---

## 📊 Current Implementation

### Frontend Components:

**ChatInterface.tsx**
- Main chat interface
- Message list
- Input field
- File upload
- Emoji picker

**ChatButton.tsx**
- Floating chat button
- Unread count badge
- Quick access

**ChatContainer.tsx**
- Chat window wrapper
- Minimize/maximize
- Close functionality

### Backend Routes:

**POST /api/chat/messages**
- Send new message
- Upload file attachment
- Create chat if doesn't exist

**GET /api/chat/messages**
- Fetch all messages
- Get chat history
- Return unread count

**PUT /api/chat/messages/read-all**
- Mark all messages as read
- Update read status

### WebSocket Events:

**Client → Server:**
- `message:send` - Send message
- `message:read` - Mark as read
- `user:typing:start` - Start typing
- `user:typing:stop` - Stop typing

**Server → Client:**
- `message:new` - New message received
- `message:read` - Message read confirmation
- `user:typing` - Typing indicator
- `notification` - System notification

---

## 🎯 Testing the Messaging System

### Test as User:

1. **Login as User:**
   - Go to http://localhost:3000/login
   - Register or login with user account

2. **Send Message:**
   - Click chat icon or go to `/messages`
   - Type: "Hello, I need help with my order"
   - Click Send

3. **Upload File:**
   - Click attachment icon
   - Select image or document
   - Send message with file

4. **Check Status:**
   - See message status (sent/delivered/read)
   - Wait for admin reply

### Test as Admin:

1. **Login as Admin:**
   - Email: `admin@tumaafricacargo.com`
   - Password: `admin123`

2. **View Messages:**
   - Go to `/admin/chats`
   - See list of conversations
   - Click on user conversation

3. **Reply to User:**
   - Type: "Hello! How can I help you?"
   - Click Send
   - Message appears in user's chat instantly

4. **Manage Chat:**
   - Mark as resolved
   - Change priority
   - Add notes

---

## 🔧 Configuration

### WebSocket Settings:

**Frontend (.env):**
```env
REACT_APP_WS_URL=http://localhost:5001
```

**Backend (.env):**
```env
PORT=5001
```

### File Upload Settings:

**Max File Size:** 10MB
**Allowed Types:** Images, Documents, Archives
**Storage:** `uploads/chat/` directory

---

## 📱 Mobile Experience

### User Chat (Mobile):
- Full-screen interface
- Touch-friendly buttons
- Mobile keyboard support
- Image preview
- File download

### Admin Chat (Mobile):
- Responsive layout
- Touch gestures
- Quick replies
- Swipe actions
- Mobile notifications

---

## 🎨 UI/UX Features

### User Messages:
- Blue gradient background
- Right-aligned
- Rounded corners
- Timestamp below
- Status indicators

### Admin Messages:
- White background
- Left-aligned
- Admin badge
- Timestamp below
- Profile icon

### Visual Indicators:
- 🟢 Online status
- 🟡 Connecting
- 🔴 Offline
- ✓ Sent
- ✓✓ Read (blue)

---

## 🔒 Security Features

### Authentication:
- JWT token required
- User verification
- Role-based access
- Session management

### Data Protection:
- Encrypted connections
- Secure file upload
- Input sanitization
- XSS protection

### Privacy:
- Users only see their own messages
- Admins see all conversations
- Message history preserved
- GDPR compliant

---

## 🐛 Troubleshooting

### Messages Not Sending:
1. Check internet connection
2. Verify you're logged in
3. Check file size (< 10MB)
4. Refresh the page
5. Clear browser cache

### Not Receiving Messages:
1. Check WebSocket connection
2. Verify notification permissions
3. Refresh the page
4. Check browser console for errors

### File Upload Failed:
1. Check file size (< 10MB)
2. Verify file type is allowed
3. Check internet connection
4. Try different file

---

## 📈 Future Enhancements

### Planned Features:
- [ ] Typing indicators
- [ ] Voice messages
- [ ] Video calls
- [ ] Screen sharing
- [ ] Message search
- [ ] Message reactions
- [ ] Thread replies
- [ ] Message forwarding
- [ ] Auto-responses
- [ ] Chatbot integration

---

## 🎯 Best Practices

### For Users:
- Be clear and specific
- Include order ID if relevant
- Attach screenshots if needed
- Be patient for response
- Check message status

### For Admins:
- Respond promptly
- Be professional and friendly
- Provide clear solutions
- Mark resolved chats
- Follow up if needed

---

## 📞 Support

### For Users:
- Use the chat system for support
- Email: support@tumaafricacargo.com
- Response time: Usually within 24 hours

### For Admins:
- Check chat management regularly
- Prioritize urgent messages
- Use templates for common responses
- Escalate complex issues

---

## ✅ Current Status

- **Messaging System:** ✅ Fully Functional
- **Real-time Updates:** ✅ WebSocket Enabled
- **File Upload:** ✅ Working
- **Notifications:** ✅ Implemented
- **Mobile Support:** ✅ Responsive
- **Admin Panel:** ✅ Complete

---

**The messaging system is fully operational and ready for use!**

Access it at:
- Users: http://localhost:3000/messages
- Admins: http://localhost:3000/admin/chats
- Mobile: http://192.168.43.98:3000/messages

---

**Last Updated:** November 7, 2025
