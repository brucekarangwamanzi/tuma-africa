#!/bin/bash
# Script to fix imageUrl column type to support base64 images

echo "🔧 Fixing imageUrl column type to TEXT..."
echo "This requires postgres superuser privileges."
echo ""

sudo -u postgres psql -d tuma_africa_cargo -c "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"

if [ $? -eq 0 ]; then
    echo "✅ Successfully changed imageUrl column to TEXT"
    echo ""
    echo "Verifying change..."
    PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
else
    echo "❌ Failed to change column type. Please run manually:"
    echo "   sudo -u postgres psql -d tuma_africa_cargo -c \"ALTER TABLE products ALTER COLUMN \\\"imageUrl\\\" TYPE TEXT;\""
fi

