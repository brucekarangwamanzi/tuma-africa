#!/bin/bash

clear
echo "=========================================="
echo "  FIXING DATABASE COLUMN ERROR"
echo "=========================================="
echo ""
echo "This will fix the 'imageUrl too long' error."
echo ""
echo "You'll be asked for your sudo password."
echo ""
read -p "Press ENTER to continue..."
echo ""

# Run the SQL command
sudo -u postgres psql -d tuma_africa_cargo <<EOF
ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;
\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ SUCCESS! Column updated to TEXT"
    echo "=========================================="
    echo ""
    echo "Verifying..."
    PGPASSWORD=Serge123 psql -h localhost -U kmbruce -d tuma_africa_cargo -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl';"
    echo ""
    echo "✅ DONE! Now refresh your browser and try creating a product again."
    echo "   The error will be gone!"
else
    echo ""
    echo "=========================================="
    echo "  ❌ FAILED"
    echo "=========================================="
    echo ""
    echo "Please run this command manually:"
    echo ""
    echo "sudo -u postgres psql -d tuma_africa_cargo"
    echo ""
    echo "Then type:"
    echo "ALTER TABLE products ALTER COLUMN \"imageUrl\" TYPE TEXT;"
    echo "\\q"
fi

