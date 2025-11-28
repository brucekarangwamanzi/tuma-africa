# Vercel Deployment Guide

## ⚠️ Important Considerations

Your application uses **Socket.IO** for real-time messaging, which requires persistent WebSocket connections. Vercel's serverless functions have limitations for this:

1. **Socket.IO Limitation**: Vercel serverless functions are stateless and have execution time limits, making Socket.IO challenging
2. **Alternative Solutions**: Consider using a separate service for WebSocket connections (e.g., Railway, Render, or a dedicated Socket.IO service)

## Deployment Options

### Option 1: Frontend Only on Vercel (Recommended for now)

Deploy only the React frontend to Vercel and host the backend separately:

1. **Frontend on Vercel**: Deploy the React app
2. **Backend on Railway/Render**: Host the Express server with Socket.IO there
3. **MongoDB**: Use MongoDB Atlas (cloud database)

### Option 2: Hybrid Approach

1. Deploy frontend to Vercel
2. Convert API routes to Vercel serverless functions (except Socket.IO)
3. Host Socket.IO server separately

## Step-by-Step Deployment

### Prerequisites

1. **MongoDB Atlas Account**: 
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a cluster
   - Get your connection string (MONGODB_URI)

2. **Vercel Account**:
   - Sign up at https://vercel.com
   - Install Vercel CLI: `npm i -g vercel`

### Frontend Deployment

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   # From project root
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - `REACT_APP_API_URL`: Your backend API URL (e.g., `https://your-backend.railway.app/api`)
   - `REACT_APP_WS_URL`: Your WebSocket server URL (e.g., `https://your-backend.railway.app`)

### Backend Deployment (Separate Service)

Since Socket.IO needs persistent connections, deploy backend to:
- **Railway**: https://railway.app (recommended)
- **Render**: https://render.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### Environment Variables Needed

**Frontend (Vercel)**:
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket server URL

**Backend (Railway/Render)**:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `EMAIL_USER` - Gmail address for emails
- `EMAIL_APP_PASSWORD` - Gmail app password
- `NODE_ENV` - Set to `production`
- `PORT` - Server port (usually auto-assigned)

## File Structure for Vercel

```
/
├── frontend/          # React app (deployed to Vercel)
│   ├── build/        # Build output
│   └── package.json
├── api/              # Serverless functions (optional)
│   └── [route].js
└── vercel.json       # Vercel configuration
```

## Quick Start

1. **Deploy Frontend**:
   ```bash
   cd frontend
   npm run build
   vercel --prod
   ```

2. **Deploy Backend** (to Railway/Render):
   - Connect your GitHub repo
   - Set root directory to project root
   - Set build command: (none needed, just run server)
   - Set start command: `node backend/server.js`
   - Add environment variables

## Notes

- Socket.IO will need to run on a service that supports persistent connections
- File uploads should use external storage (Cloudinary, AWS S3) instead of local filesystem
- MongoDB Atlas is recommended for production database
- Consider using Vercel Edge Functions for simple API routes if needed

