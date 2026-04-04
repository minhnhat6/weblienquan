#!/bin/bash
# Phase 13 Database Setup Script
# Run this after PostgreSQL user/database are created

set -e

echo "🚀 Phase 13 Database Migration - Setup Script"
echo "============================================="
echo ""

# Check if PostgreSQL is accessible
echo "📌 Step 1: Checking PostgreSQL connection..."
if psql -d weblienquan_dev -c "SELECT 'Connection successful!' as status;" 2>/dev/null; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ PostgreSQL connection failed!"
    echo ""
    echo "Please run these commands first:"
    echo "  sudo -u postgres psql -c \"CREATE USER thaihieu WITH PASSWORD 'dev123' SUPERUSER CREATEDB;\""
    echo "  sudo -u postgres psql -c \"CREATE DATABASE weblienquan_dev OWNER thaihieu;\""
    echo ""
    exit 1
fi

echo ""
echo "📌 Step 2: Running Prisma migrations..."
npx prisma migrate dev --name init

echo ""
echo "📌 Step 3: Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 You can now:"
echo "  - View database: npx prisma studio"
echo "  - Run tests: npm test"
echo "  - Start dev server: npm run dev"
echo ""
