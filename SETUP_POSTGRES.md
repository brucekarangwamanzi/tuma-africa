# 🐘 PostgreSQL Database Setup

## Quick Setup

The database needs to be created manually. Run these commands:

```bash
# Option 1: Using psql (if you have postgres user access)
sudo -u postgres psql
CREATE DATABASE tuma_africa_cargo;
CREATE USER tuma_user WITH PASSWORD 'tuma_password';
GRANT ALL PRIVILEGES ON DATABASE tuma_africa_cargo TO tuma_user;
\q

# Option 2: Using createdb (if configured)
createdb -U postgres tuma_africa_cargo
```

## Update .env File

The `.env` file has been updated with PostgreSQL configuration. You may need to adjust the password:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tuma_africa_cargo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres  # Change this to your actual password
```

## Important Notes

⚠️ **The route files still use Mongoose queries** - they need to be updated to Sequelize before the app will work properly.

The backend will start but API endpoints will fail because:
- Route files still use `Model.findById()` (Mongoose)
- Need to change to `Model.findByPk()` (Sequelize)
- Socket.IO handlers also need updates

See `MIGRATION_STATUS.md` for details on what needs to be updated.

