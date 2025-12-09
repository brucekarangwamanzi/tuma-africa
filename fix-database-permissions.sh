#!/bin/bash
# Script to fix database permissions for kmbruce user

echo "🔧 Fixing database permissions..."
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    echo "Running as root/sudo..."
    sudo -u postgres psql -d tuma_africa_cargo <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kmbruce;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kmbruce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO kmbruce;
\q
EOF
    echo "✅ Permissions granted!"
else
    echo "⚠️  This script needs to be run with sudo to grant permissions."
    echo "Please run: sudo bash fix-database-permissions.sh"
    echo ""
    echo "Or manually run these commands:"
    echo "sudo -u postgres psql -d tuma_africa_cargo -f grant-permissions.sql"
fi


