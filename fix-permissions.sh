#!/bin/bash
# Quick fix for database permissions

echo "🔧 Fixing database permissions for kmbruce user..."
echo ""

# Run the SQL commands as postgres user
sudo -u postgres psql -d tuma_africa_cargo <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kmbruce;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO kmbruce;
\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Permissions granted successfully!"
    echo "🔄 The backend will automatically use the new permissions."
    echo "✨ Try registering or logging in again!"
else
    echo ""
    echo "❌ Failed to grant permissions. Please run manually:"
    echo "   sudo -u postgres psql -d tuma_africa_cargo -f grant-permissions.sql"
fi


