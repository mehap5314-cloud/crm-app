# CRM Hammer — نظام إدارة الشكاوي

نظام CRM داخلي لإدارة شكاوي العملاء: تسجيل الدخول لكل موظف، سجل تعديلات (Audit Trail)، استيراد وتصدير Excel، مزامنة حية مع Google Sheets، وواجهة عربية/إنجليزية.

## النشر على Render (مجاني — بدون كارت)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mehap5314-cloud/crm-app)

1. اضغط الزر فوق → سجّل دخول بحساب GitHub (مجاني، بدون كارت).
2. راجع الخدمة واضغط **Apply / Create**.
3. بعد الإنشاء: **Environment → Add from .env** والصق محتوى ملف `.env.render` الموجود على جهازك.
4. افتح الرابط وسجّل الدخول: `admin` / `admin123` — **وغيّر كلمة السر فوراً**.

الدليل الكامل خطوة بخطوة: [`deploy/RENDER-GUIDE.md`](deploy/RENDER-GUIDE.md)

## المميزات

- تسجيل دخول بالموظفين وأدوار (admin / manager / agent)
- سجل تعديلات كامل لكل شكوى
- استيراد شكاوي قديمة من Excel/CSV
- تصدير Excel بضغطة زر
- مزامنة حية مع تاب `CRM-Live` في Google Sheets + استرجاع تلقائي للبيانات بعد أي restart
- واجهة زجاجية (Glassmorphism) مع وضع ليلي/نهاري وعربي RTL / إنجليزي LTR

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # واملأ القيم
npm run dev
```

## ملاحظات أمنية

- لا ترفع ملف `.env.local` أو `.env.render` على GitHub أبداً (مستبعدين في `.gitignore`).
- شيت جوجل هو النسخة الدائمة للبيانات — لا تحذف تاب `CRM-Live`.
