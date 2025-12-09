#!/bin/bash
# Fix database permissions - Run this script

echo "🔧 Fixing database permissions..."
echo ""
echo "Please enter your sudo password when prompted:"
echo ""

# Try to run the permissions fix
sudo -u postgres psql -d tuma_africa_cargo <<'SQL'
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kmbruce;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO kmbruce;
\q
SQL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Permissions granted successfully!"
    echo ""
    echo "Verifying permissions..."
    psql -d tuma_africa_cargo -c "SELECT has_table_privilege('kmbruce', 'users', 'SELECT') as can_select, has_table_privilege('kmbruce', 'users', 'INSERT') as can_insert, has_table_privilege('kmbruce', 'users', 'UPDATE') as can_update;"
    echo ""
    echo "✨ Registration should now work! Try registering again."
else
    echo ""
    echo "❌ Failed to grant permissions."
    echo ""
    echo "Alternative: Update .env to use postgres user"
    echo "Edit .env and backend/.env files:"
    echo "  POSTGRES_USER=postgres"
    echo "  POSTGRES_PASSWORD=<your-postgres-password>"
fi


