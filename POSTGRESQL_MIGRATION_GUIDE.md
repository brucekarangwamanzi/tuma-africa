# 🐘 MongoDB to PostgreSQL Migration Guide

This guide will help you migrate from MongoDB to PostgreSQL using Sequelize ORM.

## 📋 Prerequisites

1. **PostgreSQL installed and running**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create PostgreSQL database**
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE tuma_africa_cargo;
   CREATE USER tuma_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE tuma_africa_cargo TO tuma_user;
   \q
   ```

## 🔧 Configuration

### 1. Update Environment Variables

Add to `backend/.env`:

```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tuma_africa_cargo
POSTGRES_USER=tuma_user
POSTGRES_PASSWORD=your_secure_password

# Keep MongoDB URI for data migration (optional)
# MONGODB_URI=mongodb://localhost:27017/tuma-africa-cargo
```

### 2. Install Dependencies

Dependencies are already installed:
- `sequelize` - PostgreSQL ORM
- `pg` - PostgreSQL client
- `pg-hstore` - PostgreSQL hstore support

## 📦 What Has Been Changed

### Models Converted

✅ **User** - Converted from Mongoose to Sequelize
✅ **Product** - Converted from Mongoose to Sequelize  
✅ **Order** - Converted from Mongoose to Sequelize
✅ **Chat** - Converted from Mongoose to Sequelize
✅ **Message** - New model (was nested in Chat)
✅ **Notification** - Converted from Mongoose to Sequelize
✅ **AdminSettings** - Converted from Mongoose to Sequelize
✅ **ChatParticipants** - New junction table for Chat-User many-to-many

### Key Changes

1. **ID Fields**: Changed from MongoDB `ObjectId` to PostgreSQL `UUID`
2. **Nested Objects**: Converted to JSONB columns (PostgreSQL native JSON support)
3. **Arrays**: Using PostgreSQL ARRAY type
4. **Associations**: Updated to Sequelize associations
5. **Hooks**: Converted Mongoose pre-save hooks to Sequelize hooks

## 🚀 Setup Steps

### Step 1: Start PostgreSQL

```bash
# Linux
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew services start postgresql

# Windows
# Start PostgreSQL service from Services
```

### Step 2: Create Database

```bash
psql -U postgres
CREATE DATABASE tuma_africa_cargo;
\q
```

### Step 3: Update .env File

Edit `backend/.env` and add PostgreSQL configuration (see above).

### Step 4: Run Database Sync

The server will automatically sync tables on startup in development mode.

Or manually:
```bash
cd backend
node -e "require('./config/database').sequelize.sync({ alter: true })"
```

### Step 5: Start Backend

```bash
npm run backend
```

The server will:
1. Connect to PostgreSQL
2. Create/sync all tables
3. Set up relationships

## 📊 Data Migration (Optional)

If you have existing MongoDB data, you'll need to migrate it:

### Option 1: Manual Migration Script

Create `backend/scripts/migrate-mongo-to-postgres.js`:

```javascript
const mongoose = require('mongoose');
const { sequelize } = require('../config/database');
const { User, Product, Order, Chat, Notification } = require('../models');

async function migrate() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Migrate Users
  const mongoUsers = await mongoose.connection.db.collection('users').find({}).toArray();
  for (const user of mongoUsers) {
    await User.create({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      // ... map all fields
    });
  }
  
  // Repeat for other collections...
  
  await mongoose.disconnect();
  await sequelize.close();
}

migrate();
```

### Option 2: Export/Import

1. Export MongoDB data to JSON
2. Transform JSON to match Sequelize models
3. Import into PostgreSQL

## 🔄 Route Updates Required

All route files need to be updated to use Sequelize instead of Mongoose:

### Before (Mongoose):
```javascript
const User = require('../models/User');
const user = await User.findById(req.params.id);
```

### After (Sequelize):
```javascript
const { User } = require('../models');
const user = await User.findByPk(req.params.id);
```

### Common Query Changes:

| Mongoose | Sequelize |
|----------|-----------|
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.findOne({ email })` | `Model.findOne({ where: { email } })` |
| `Model.find({ role: 'admin' })` | `Model.findAll({ where: { role: 'admin' } })` |
| `Model.create(data)` | `Model.create(data)` (same) |
| `Model.findByIdAndUpdate(id, data)` | `Model.update(data, { where: { id } })` |
| `Model.findByIdAndDelete(id)` | `Model.destroy({ where: { id } })` |
| `doc.save()` | `instance.save()` (same) |
| `doc.populate('user')` | `Model.findAll({ include: [User] })` |

## ⚠️ Important Notes

1. **UUID vs ObjectId**: All IDs are now UUIDs. Update frontend if it expects ObjectId format.

2. **JSONB Fields**: Fields like `specifications`, `supplier`, `stock` are stored as JSONB. Access them directly:
   ```javascript
   product.specifications.brand // Works directly
   ```

3. **Arrays**: PostgreSQL arrays work similarly:
   ```javascript
   product.tags // Array of strings
   ```

4. **Timestamps**: Sequelize automatically adds `createdAt` and `updatedAt` (camelCase, not snake_case).

5. **Associations**: Use `include` for eager loading:
   ```javascript
   const order = await Order.findByPk(id, {
     include: [{ model: User, as: 'user' }]
   });
   ```

## 🧪 Testing

1. **Test Connection**:
   ```bash
   node -e "require('./backend/config/database').testConnection()"
   ```

2. **Test Models**:
   ```bash
   node -e "const { User } = require('./backend/models'); User.findAll().then(console.log)"
   ```

## 📝 Next Steps

1. ✅ Models converted
2. ✅ Database connection configured
3. ⏳ Update all route files (auth.js, products.js, orders.js, etc.)
4. ⏳ Update Socket.IO handlers
5. ⏳ Test all endpoints
6. ⏳ Migrate existing data (if needed)

## 🆘 Troubleshooting

### Connection Error
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Check firewall settings

### Table Not Found
- Run sync: `sequelize.sync({ alter: true })`
- Check database name matches `.env`

### Migration Errors
- Check data types match
- Verify foreign key constraints
- Check for null values in required fields

## 📚 Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB to PostgreSQL Migration](https://www.postgresql.org/docs/current/datatype-json.html)

