#!/bin/bash
# Run this script to fix the imageUrl column type
# You'll need to enter your sudo password when prompted

echo "🔧 Fixing imageUrl column to support base64 images..."
echo ""
echo "This will change the imageUrl column from VARCHAR(255) to TEXT"
echo "so it can store long base64-encoded images."
echo ""

# Method 1: Try with sudo (requires password)
echo "Attempting to run as postgres user..."
sudo -u postgres psql -d tuma_africa_cargo <<EOF
ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;
\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Column type changed to TEXT"
    echo ""
    echo "Verifying..."
    PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
    echo ""
    echo "✅ Done! You can now create products with base64 images."
else
    echo ""
    echo "❌ Failed. Please run this command manually:"
    echo ""
    echo "sudo -u postgres psql -d tuma_africa_cargo"
    echo ""
    echo "Then inside psql, run:"
    echo "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
    echo "\\q"
fi

