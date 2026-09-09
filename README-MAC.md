# 🍎 دليل تشغيل وتثبيت برنامج MediCab على أجهزة Mac (macOS)

تم تجهيز وتكييف برنامج **MediCab Medical Cabinet** ليعمل بشكل أصلي ومتوافق 100% مع بيئة نظام الماك (**macOS**)، بما في ذلك أجهزة **Apple Silicon (M1 / M2 / M3 / M4 / M5)** وكذلك أجهزة **Intel**.

---

## ⚡ الطريقة الأولى: التشغيل السريع بنقرة واحدة (Quick Start)

1. تأكد من وجود **Node.js** على جهاز الماك (إذا لم يكن مثبتاً، قم بتحميله من [nodejs.org](https://nodejs.org) - الإصدار LTS).
2. انقر نقراً مزدوجاً (Double Click) على الملف:
   ```bash
   install-mac.command
   ```
   أو
   ```bash
   start-mac.command
   ```
3. سيقوم السكربت تلقائياً بتثبيت الحزم اللازمة وبناء المشروع وفتح التطبيق مباشرة على جهازك!

---

## 📦 الطريقة الثانية: إنشاء تطبيق ماك مدمج (.dmg / .app)

### البناء والنشر عبر GitHub Actions (الموصى به)

بعد رفع المشروع إلى GitHub، أنشئ وسم إصدار ثم ادفعه:

```bash
git tag v1.0.1
git push origin v1.0.1
```

سيقوم GitHub Actions تلقائياً ببناء نسخة **Universal** واحدة تعمل على أجهزة Apple Silicon، بما فيها M5، وأجهزة Intel، ثم يرفق ملفي `.dmg` و`.zip` في صفحة **Releases**. يمكن أيضاً تشغيل workflow يدوياً من تبويب **Actions** باختيار **Build macOS installer** ثم **Run workflow**.

> إذا لم تتم إضافة أسرار Apple إلى GitHub، فستكون النسخة غير موقعة. عندها قد يمنع Chrome التنزيل أو يمنع macOS التشغيل.

### التوقيع والتوثيق عبر GitHub

أضف الأسرار التالية إلى إعدادات المستودع في GitHub: `MACOS_CERTIFICATE_BASE64`، و`MACOS_CERTIFICATE_PASSWORD`، و`APPLE_ID`، و`APPLE_APP_SPECIFIC_PASSWORD`، و`APPLE_TEAM_ID`. يجب أن تكون الشهادة من Apple Developer بصيغة `.p12` مشفّرة Base64. بعد ذلك أعد إنشاء الإصدار من خلال GitHub Actions.

التوقيع والتوثيق هما الطريقة الصحيحة لتقليل تحذير الملف الخطير. لا ترفع شهادة Apple أو كلمة مرورها إلى المستودع.

إذا أردت إنشاء ملف تثبيت ماك احترافي بصيغة **DMG** (سحب وإفلات في مجلد Applications):

افتح تطبيق **Terminal** في مجلد المشروع ونفّذ أحد الأوامر التالية:

### لأجهزة Apple Silicon (M1 / M2 / M3 / M4 / M5):
```bash
npm run electron:build:mac:arm64
```

### لأجهزة الماك بمعالجات Intel:
```bash
npm run electron:build:mac:x64
```

### إنشاء حزمة موحدة وشاملة (Universal / Apple Silicon + Intel):
```bash
npm run electron:build:mac
```

> 📁 ستجد ملفات التثبيت الناتجة (.dmg و .zip) جاهزة داخل مجلد `release/`.

---

## 🛡️ ملاحظة أمان نظام الماك (Gatekeeper):
عند فتح تطبيق مجمع ذاتياً لأول مرة على نظام الماك، قد تظهر رسالة تفيد بأن التطبيق من مطور غير معروف:
1. انقر بزر الفأرة الأيمن (Right-Click) على التطبيق واضغط على **Open (فتح)** ثم اضغط **Open**.
2. أو من خلال Terminal نفّذ الأمر التالي لفك الحظر:
   ```bash
   xattr -cr /Applications/MediCab\ Medical\ Cabinet.app
   ```

---

## ✨ ميزات بيئة الماك المضافة:
- **اختصارات لوحة المفاتيح الأصلية**: دعم كامل لـ `Cmd+C` (نسخ)، `Cmd+V` (لصق)، `Cmd+Z` (تراجع)، `Cmd+A` (تحديد الكل)، و `Cmd+Q` (خروج).
- **قائمة النظام المدمجة (Native macOS Menu Bar)**.
- **تصدير وطباعة تقارير A4 & PDF** مع معاينة الطباعة الأصلية لنظام macOS.
- **تكامل مع مجلد المستندات (Documents)** لحفظ ملفات Excel والنسخ الاحتياطية.
