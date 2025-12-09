'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change imageUrl from VARCHAR(255) to TEXT to support base64 images
    await queryInterface.changeColumn('products', 'imageUrl', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    // Also update the images array elements - PostgreSQL arrays of STRING are fine,
    // but we should ensure they can handle long strings
    // Note: PostgreSQL TEXT arrays are already supported, so this should work
  },

  async down(queryInterface, Sequelize) {
    // Revert back to VARCHAR(255) - but this might truncate existing data
    await queryInterface.changeColumn('products', 'imageUrl', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
  }
};

