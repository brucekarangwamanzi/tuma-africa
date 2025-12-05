// Health check endpoint
const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// Cache database connection status
let dbStatus = 'checking';
let lastCheck = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

// Async function to check database connection
async function checkDatabase() {
  const now = Date.now();
  
  // Use cached status if checked recently
  if (now - lastCheck < CHECK_INTERVAL && dbStatus !== 'checking') {
    return dbStatus;
  }
  
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
    lastCheck = now;
    return 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
    lastCheck = now;
    return 'disconnected';
  }
}

router.get('/health', async (req, res) => {
  const databaseStatus = await checkDatabase();
  
  const health = {
    status: databaseStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
