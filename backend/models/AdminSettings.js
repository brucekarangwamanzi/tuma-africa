module.exports = (sequelize, DataTypes) => {
  const AdminSettings = sequelize.define('AdminSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Store all settings as JSONB for flexibility
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    lastUpdatedById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_updated_by_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'admin_settings',
    timestamps: true,
    underscored: false
  });

  // Static method to get or create settings
  AdminSettings.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
      settings = await this.create({
        settings: {
          heroSection: {
            title: 'Connect Africa to Asia - Your Cargo Partner',
            subtitle: 'Seamless product ordering and cargo services from top Asian suppliers to African markets',
            backgroundType: 'image',
            backgroundColor: '#1f2937'
          },
          productSection: {
            title: 'Shop Popular Products',
            subtitle: 'Discover trending products from top Asian suppliers',
            displayCount: 8,
            layout: 'grid'
          },
          theme: {
            primaryColor: '#3b82f6',
            secondaryColor: '#64748b',
            accentColor: '#f59e0b'
          },
          companyInfo: {
            name: 'Tuma-Africa Link Cargo',
            tagline: 'Bridging Africa and Asia through seamless cargo solutions'
          },
          system: {
            currency: 'USD',
            timezone: 'Africa/Nairobi',
            language: 'en'
          }
        }
      });
    }
    return settings;
  };

  return AdminSettings;
};
