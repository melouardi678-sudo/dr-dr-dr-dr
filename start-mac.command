#!/bin/bash
# ==============================================================================
# MediCab Medical Cabinet - macOS Quick Launch Script
# ==============================================================================

cd "$(dirname "$0")"

echo "=========================================================="
echo "    🚀 تشغيل MediCab Medical Cabinet"
echo "=========================================================="

if ! command -v node &> /dev/null
then
    echo "❌ Node.js غير مثبت. يرجى تثبيته أولاً من https://nodejs.org"
    read -p "اضغط Enter للإغلاق..."
    exit 1
fi

# If dist folder doesn't exist, build first
if [ ! -d "dist" ]; then
    echo "🔨 جاري البناء الأولي للتطبيق..."
    npm run build
fi

echo "🟢 جاري تشغيل الخادم والواجهة على الماك..."
# Open default browser after a brief delay or launch electron if available
(sleep 2 && open "http://localhost:3000") &
npm run dev
