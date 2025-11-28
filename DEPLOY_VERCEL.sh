#!/bin/bash

# Vercel Deployment Script
# This script helps deploy the frontend to Vercel

echo "🚀 Starting Vercel Deployment..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel..."
    echo "This will open a browser for authentication."
    vercel login
fi

echo ""
echo "✅ Building frontend..."
cd frontend
npm run build

echo ""
echo "🚀 Deploying to Vercel..."
cd ..
vercel

echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Vercel Dashboard:"
echo "   - REACT_APP_API_URL=https://your-backend.railway.app/api"
echo "   - REACT_APP_WS_URL=https://your-backend.railway.app"
echo ""
echo "2. Deploy backend to Railway (for Socket.IO support)"
echo ""
echo "3. Update environment variables with Railway URL"
echo ""
echo "4. Redeploy: vercel --prod"

