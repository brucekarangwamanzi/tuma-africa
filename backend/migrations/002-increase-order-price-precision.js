'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase precision of price fields in orders table
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN unit_price TYPE DECIMAL(20, 2),
      ALTER COLUMN total_price TYPE DECIMAL(20, 2),
      ALTER COLUMN shipping_cost TYPE DECIMAL(20, 2),
      ALTER COLUMN final_amount TYPE DECIMAL(20, 2);
    `);
    console.log('✅ Increased order price field precision to DECIMAL(20, 2)');
  },

  async down(queryInterface, Sequelize) {
    // Revert to original precision
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN unit_price TYPE DECIMAL(10, 2),
      ALTER COLUMN total_price TYPE DECIMAL(10, 2),
      ALTER COLUMN shipping_cost TYPE DECIMAL(10, 2),
      ALTER COLUMN final_amount TYPE DECIMAL(10, 2);
    `);
    console.log('✅ Reverted order price field precision to DECIMAL(10, 2)');
  }
};

