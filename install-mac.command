#!/bin/bash
# ==============================================================================
# MediCab Medical Cabinet - macOS Setup & Installer Script
# ==============================================================================

cd "$(dirname "$0")"

echo "=========================================================="
echo "    🏥 تثبيت وإعداد MediCab Medical Cabinet لنظام Mac"
echo "=========================================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null
then
    echo "❌ Node.js غير مثبت على جهازك!"
    echo "يرجى تحميل وتثبيت Node.js (الإصدار 18 أو أحدث) من الموقع الرسمي:"
    echo "👉 https://nodejs.org"
    echo ""
    read -p "اضغط Enter للإغلاق..."
    exit 1
fi

echo "✅ تم العثور على Node.js: $(node -v)"
echo "✅ تم العثور على npm: $(npm -v)"
echo ""
echo "📦 جاري تثبيت الحزم والمكتبات اللازمة..."
npm install

echo ""
echo "🔨 جاري بناء النسخة المجهزة..."
npm run build

echo ""
echo "=========================================================="
echo "🎯 اختر ما تريد القيام به:"
echo "1) تشغيل التطبيق مباشرة الآن على الماك (Lancer MediCab)"
echo "2) إنشاء ملف تثبيت ماك كامل (.dmg) لأجهزة Apple Silicon (M1/M2/M3/M4) و Intel"
echo "3) خروج"
echo "=========================================================="
read -p "أدخل رقم الخيار (1 أو 2 أو 3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 جاري تشغيل MediCab..."
        npm run dev
        ;;
    2)
        echo ""
        echo "📦 جاري حزم وتوليد ملف التثبيت (.dmg) في مجلد release/ ..."
        npx electron-builder --mac dmg --arm64 --x64
        echo ""
        echo "🎉 تم إنشاء ملف التثبيت بنجاح في مجلد: release/"
        open release
        ;;
    *)
        echo "تم الإنهاء."
        ;;
esac
