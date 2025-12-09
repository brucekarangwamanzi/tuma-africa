const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name is required' },
        len: { args: [1, 100], msg: 'Full name cannot exceed 100 characters' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please enter a valid email' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Phone number is required' }
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: { args: [6, Infinity], msg: 'Password must be at least 6 characters' }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'super_admin'),
      defaultValue: 'user'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    profileImage: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    addressStreet: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address_street'
    },
    addressCity: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address_city'
    },
    addressState: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address_state'
    },
    addressCountry: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address_country'
    },
    addressZipCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address_zip_code'
    },
    currency: {
      type: DataTypes.ENUM('RWF', 'Yuan', 'USD'),
      defaultValue: 'USD'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    },
    scopes: {
      withPassword: {
        attributes: { exclude: [] } // Override default scope to include passwordHash
      }
    }
  });

  // Instance method to compare password
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  };

  // Instance method to get address as object
  User.prototype.getAddress = function() {
    return {
      street: this.addressStreet,
      city: this.addressCity,
      state: this.addressState,
      country: this.addressCountry,
      zipCode: this.addressZipCode
    };
  };

  // Instance method to set address from object
  User.prototype.setAddress = function(address) {
    if (address) {
      this.addressStreet = address.street;
      this.addressCity = address.city;
      this.addressState = address.state;
      this.addressCountry = address.country;
      this.addressZipCode = address.zipCode;
    }
  };

  return User;
};
