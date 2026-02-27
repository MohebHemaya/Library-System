# Database Setup - بدون JSON Server ✅

## ما تم عمله

تم استبدال JSON Server بـ **نظام تخزين بيانات محلي** يعمل بدون الحاجة لسرفر خارجي:

### 1️⃣ **API Routes على Vercel** (`/api/db.js`)
- API endpoint محلي بدون تبعيات خارجية
- يدعم CRUD operations (POST, GET, PUT, DELETE)
- في الـ Development: تخزين في الذاكرة
- يمكن تطويره لاحقاً للاتصال بقاعدة بيانات حقيقية

### 2️⃣ **Client-Side Database** (`src/context/db.js`)
- تخزين البيانات في `localStorage`
- يعمل حتى بدون قاعدة بيانات
- البيانات تبقى في المتصفح المستخدم

### 3️⃣ **API Configuration** (`src/config/api.js`)
- تكوين مركزي للـ API URLs
- يختار تلقائياً بناءً على البيئة:
  - **Development**: `http://localhost:5173/api`
  - **Production (Vercel)**: `/api`

---

## 🚀 كيفية الاستخدام

### Local Development
```bash
npm install
npm run dev
```
التطبيق سيعمل على `http://localhost:5173` مع API على `/api/db`

### Deployment على Vercel

```bash
# 1. اضغط الكود
git add .
git commit -m "Setup database system for Vercel"
git push origin main

# 2. على Vercel dashboard:
# - ربط GitHub repository
# - اختر "Import"
# - الإعدادات ستتشغل تلقائياً
```

---

## 📊 البيانات المتاحة

```javascript
{
  books: [],      // قائمة الكتب
  members: [],    // قائمة الأعضاء
  transactions: [] // المعاملات
}
```

---

## 🔧 APIs المتاحة

| Method | URL | الوصف |
|--------|-----|-------|
| GET | `/api/db?resource=books` | احصل على كل الكتب |
| GET | `/api/db?resource=books&id=123` | احصل على كتاب محدد |
| POST | `/api/db?resource=books` | أضف كتاب جديد |
| PUT | `/api/db?resource=books&id=123` | حدّث كتاب |
| DELETE | `/api/db?resource=books&id=123` | احذف كتاب |

نفس الـ URLs تعمل مع `members` و `transactions`

---

## ⚠️ ملاحظات مهمة

1. **البيانات مؤقتة**: في الـ Development والـ Production (في متغير في الذاكرة)
   - عند إعادة تشغيل السرفر، تعود البيانات للحالة الأولية
   - للـ Persistence، تحتاج database حقيقية

2. **للـ Production الحقيقي**, ستحتاج إلى:
   - MongoDB أو PostgreSQL أو Firebase
   - تحديث API routes لكي تتصل بـ database

---

## 📝 التحسينات المستقبلية

- [ ] إضافة قاعدة بيانات (MongoDB, PostgreSQL, Firebase)
- [ ] Authentication/Authorization
- [ ] Data persistence بين التشغيلات
- [ ] Caching
- [ ] Error handling أفضل

---

## 🆘 في حالة المشاكل

**إذا واجهت خطأ "API not found":**
1. تأكد أن Vercel تم نسخ المجلد `/api`
2. تحقق من `vercel.json` الإعدادات

**إذا اختفت البيانات:**
- البيانات مخزنة في الذاكرة فقط (temporary)
- استخدم `localStorage` للـ persistence على client-side
