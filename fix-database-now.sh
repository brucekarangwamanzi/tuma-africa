#!/bin/bash
# Quick fix for the database column error
# This script will fix the imageUrl column to support base64 images

echo "🔧 Fixing database column to support base64 images..."
echo ""
echo "You'll be asked for your sudo password."
echo ""

# Run the SQL command to change column type
sudo -u postgres psql -d tuma_africa_cargo <<EOF
ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;
\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Database column updated."
    echo ""
    echo "Verifying the change..."
    PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
    echo ""
    echo "✅ Done! You can now create products with base64 images."
    echo "   Try creating a product again - it should work now!"
else
    echo ""
    echo "❌ Failed. Please run this command manually:"
    echo ""
    echo "sudo -u postgres psql -d tuma_africa_cargo"
    echo ""
    echo "Then inside psql, type:"
    echo "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
    echo "\\q"
fi

