const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL connection configuration
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'tuma_africa_cargo',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    console.log(`📊 Database: ${process.env.POSTGRES_DB || 'tuma_africa_cargo'}`);
    console.log(`🌐 Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('💡 Make sure PostgreSQL is running and connection details are correct');
    return false;
  }
};

module.exports = { sequelize, testConnection };

