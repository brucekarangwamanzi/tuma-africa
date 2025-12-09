const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

async function createAdminSettingsTable() {
  try {
    console.log('Creating admin_settings table...');
    
    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_settings'
      );
    `);
    
    if (results[0].exists) {
      console.log('✅ admin_settings table already exists');
      return;
    }
    
    // Create the table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "admin_settings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "settings" JSONB DEFAULT '{}',
        "last_updated_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "version" INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ admin_settings table created successfully');
    
    // Create initial settings record
    const [insertResults] = await sequelize.query(`
      INSERT INTO "admin_settings" ("settings", "version")
      VALUES (
        '{
          "heroSection": {
            "title": "Connect Africa to Asia - Your Cargo Partner",
            "subtitle": "Seamless product ordering and cargo services from top Asian suppliers to African markets",
            "backgroundType": "image",
            "backgroundColor": "#1f2937"
          },
          "productSection": {
            "title": "Shop Popular Products",
            "subtitle": "Discover trending products from top Asian suppliers",
            "displayCount": 8,
            "layout": "grid"
          },
          "theme": {
            "primaryColor": "#3b82f6",
            "secondaryColor": "#64748b",
            "accentColor": "#f59e0b"
          },
          "companyInfo": {
            "name": "Tuma-Africa Link Cargo",
            "tagline": "Bridging Africa and Asia through seamless cargo solutions"
          },
          "system": {
            "currency": "USD",
            "timezone": "Africa/Nairobi",
            "language": "en"
          }
        }'::jsonb,
        1
      )
      ON CONFLICT DO NOTHING
      RETURNING "id";
    `);
    
    if (insertResults.length > 0) {
      console.log('✅ Default admin settings created');
    } else {
      console.log('ℹ️  Default settings already exist');
    }
    
  } catch (error) {
    console.error('❌ Error creating admin_settings table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminSettingsTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = createAdminSettingsTable;

