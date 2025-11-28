#!/bin/bash

# Quick Public URL Script
# Makes your app accessible to everyone in 30 seconds!

echo "🌍 Making Your App Public..."
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Installing ngrok...${NC}"
    npm install -g ngrok
    echo -e "${GREEN}✓ Ngrok installed${NC}"
fi

# Check if backend is running
if lsof -i:5001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is already running on port 5001${NC}"
else
    echo -e "${YELLOW}Starting backend...${NC}"
    cd backend
    npm start > /dev/null 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 3
    echo -e "${GREEN}✓ Backend started${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Creating public URL...${NC}"
echo ""
echo -e "${GREEN}Your app will be accessible from anywhere!${NC}"
echo -e "${GREEN}Share the HTTPS URL that appears below:${NC}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start ngrok
ngrok http 5001

# Cleanup on exit
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
fi
