const express = require('express');
const AdminSettings = require('../models/AdminSettings');

const router = express.Router();

// @route   GET /api/public/settings
// @desc    Get public admin settings (no auth required)
// @access  Public
router.get('/settings', async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().select('-_id -__v -lastUpdatedBy -version -createdAt -updatedAt');
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        settings: {
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
        }
      });
    }

    res.json({ settings });

  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

module.exports = router;