# 🚢 Tuma-Africa Link Cargo

A comprehensive cargo and product ordering platform connecting African customers with Asian suppliers. Features real-time order tracking, live chat support, and a complete admin management system.

## 🌟 Features

### For Customers
- 🛍️ **Product Ordering** - Order products from Asian suppliers
- 📦 **Order Tracking** - Real-time tracking from Asia to Africa
- 💬 **Live Chat Support** - Real-time communication with support team
- 📍 **Location Tracking** - Visual timeline showing product journey
- 📱 **Responsive Design** - Works on all devices
- 🔔 **Notifications** - Stay updated on order status

### For Admins
- 👥 **User Management** - Approve, manage, and monitor users
- 📦 **Order Management** - Process and track all orders
- 🛍️ **Product Management** - Add and manage product catalog
- 💬 **Chat Management** - Handle customer support messages
- 📊 **Analytics Dashboard** - View business metrics and insights
- 🎨 **CMS System** - Customize website appearance and content
- ⚙️ **Settings Management** - Configure system features

## 🚀 Tech Stack

### Frontend
- **React** 18 with TypeScript
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time features
- **Axios** for API calls
- **React Hook Form** for form handling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Express Rate Limit** for API protection

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/tuma-africa-cargo.git
cd tuma-africa-cargo
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Environment Setup

Create `.env` file in the backend directory:
```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/tuma-africa-cargo

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

Create `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_WS_URL=http://localhost:5001
```

### 5. Create Super Admin

Run the script to create the super admin account:
```bash
cd backend
node scripts/createSuperAdmin.js
```

Default credentials:
- Email: `admin@tumaafricacargo.com`
- Password: `admin123`

**⚠️ Change these credentials after first login!**

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- WebSocket: ws://localhost:5001


## 📱 Application Structure

```
tuma-africa-cargo/
├── backend/
│   ├── middleware/        # Auth, validation, error handling
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── scripts/          # Utility scripts
│   ├── server.js         # Main server file
│   └── package.json
├── frontend/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Zustand stores
│   │   ├── utils/        # Utility functions
│   │   ├── App.tsx       # Main app component
│   │   └── index.tsx     # Entry point
│   └── package.json
├── uploads/              # File uploads directory
├── .gitignore
├── README.md
└── package.json
```

## 🔐 Authentication

The application uses JWT-based authentication with access and refresh tokens:

- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 7 days
- **Password Hashing**: Bcrypt with 12 rounds

### User Roles
- **User**: Regular customers
- **Admin**: Can manage orders and users
- **Super Admin**: Full system access including CMS

## 📡 Real-Time Features

### WebSocket Events

**Client → Server:**
- `message:send` - Send chat message
- `user:typing:start` - User started typing
- `user:typing:stop` - User stopped typing
- `message:read` - Mark message as read

**Server → Client:**
- `message:new` - New message received
- `user:typing` - Typing indicator
- `message:read` - Message read confirmation
- `notification` - System notification

## 🎨 CMS Features

Super admins can customize:
- Hero section (title, subtitle, background)
- Advertisements and banners
- Product section display
- Theme colors and fonts
- Company information
- Social media links
- Feature toggles

Access CMS at: `/admin/cms`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/approve` - Approve user
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/settings` - Get CMS settings
- `POST /api/admin/settings` - Update CMS settings

### Chat
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/read-all` - Mark all as read

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```


## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- XSS protection
- CSRF protection

## 🐛 Troubleshooting

### WebSocket Connection Issues
1. Clear browser storage
2. Log out and log back in
3. Check if backend is running
4. Verify CORS settings

### Database Connection Failed
1. Ensure MongoDB is running
2. Check MONGODB_URI in .env
3. Verify database permissions

### Build Errors
1. Delete node_modules and package-lock.json
2. Run `npm install` again
3. Clear npm cache: `npm cache clean --force`

## 📚 Documentation

- [CMS Features Guide](./CMS_FEATURES.md)
- [Product Location Tracking](./PRODUCT_LOCATION_FEATURE.md)
- [Admin Credentials](./ADMIN_CREDENTIALS.md)
- [API Documentation](./API_DOCS.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB team for the database
- Socket.IO for real-time capabilities
- All contributors and supporters

## 📞 Support

For support, email support@tumaafricacargo.com or join our Slack channel.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] SMS notifications
- [ ] GPS tracking integration
- [ ] Customs clearance tracking
- [ ] Multi-currency support
- [ ] Invoice generation

---

**Made with ❤️ for connecting Africa and Asia**
