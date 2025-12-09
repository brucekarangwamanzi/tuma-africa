const express = require('express');
const { AdminSettings } = require('../models');

const router = express.Router();

/**
 * @swagger
 * /public/settings:
 *   get:
 *     summary: Get public admin settings (no authentication required)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Public settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     heroSection:
 *                       type: object
 *                     productSection:
 *                       type: object
 *                     companyInfo:
 *                       type: object
 *                     theme:
 *                       type: object
 */
// @route   GET /api/public/settings
// @desc    Get public admin settings (no auth required)
// @access  Public
router.get('/settings', async (req, res) => {
  // Default settings to return if database is not ready or no settings exist
  const defaultSettings = {
    heroSection: {
      title: 'Connect Africa to Asia',
      subtitle: 'Your trusted partner for cargo and product ordering from Asian suppliers',
      backgroundType: 'color',
      backgroundColor: '#3b82f6'
    },
    productSection: {
      title: 'Featured Products',
      subtitle: 'Discover our most popular items from trusted Asian suppliers',
      displayCount: 8,
      layout: 'grid'
    },
    companyInfo: {
      name: 'Tuma-Africa Link Cargo',
      tagline: 'Connecting Africa to Asia'
    },
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b'
    }
  };

  try {
    // Try to get settings from database
    const settingsDoc = await AdminSettings.getSettings();
    
    if (settingsDoc && settingsDoc.settings && Object.keys(settingsDoc.settings).length > 0) {
      // Return settings from database
      return res.json({ settings: settingsDoc.settings });
    }

    // Return default settings if none exist in database
    return res.json({ settings: defaultSettings });

  } catch (error) {
    // If there's any error (table doesn't exist, connection issue, etc.), return defaults
    console.error('Get public settings error (returning defaults):', error.message);
    return res.json({ settings: defaultSettings });
  }
});

module.exports = router;