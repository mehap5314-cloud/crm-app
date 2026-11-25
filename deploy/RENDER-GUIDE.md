# 🚀 دليل النشر على Render (مجاني — بدون كارت ائتمان)

Render بيوفر سيرفر مجاني **24/7** مع **HTTPS آمن** بدون أي بيانات دفع، والبيانات بتتحفظ تلقائياً في شيت جوجل (تاب `CRM-Live`) — لو السيرفر اتعمل restart، النظام بيرجع البيانات من الشيت لوحده.

---

## المتطلبات (مجانية كلها)

- حساب **GitHub** (مجاني — بدون كارت)
- حساب **Render** (مجاني — بدون كارت)
- (اختياري) حساب **UptimeRobot** لإبقاء السيرفر صاحي

---

## الخطوة 1: إنشاء حساب GitHub (مرة واحدة)

1. افتح: **https://github.com/signup**
2. سجّل بإيميلك (مجاني تماماً)

## الخطوة 2: إنشاء Repository ورفع المشروع

1. من GitHub اضغط **New repository**
2. الاسم: `crm-hammer`
3. ⚠️ اختار **Private** (مهم جداً — الملفات فيها مفاتيح سرية)
4. اضغط **Create repository**
5. في الصفحة اللي هتفتح اضغط **uploading an existing file**
6. افتح فولدر **`C:\Users\Hammer\Desktop\CRM\render-upload`** (اللي جهزتهولك)
7. **حدد كل الملفات والفولدرات جواه** واسحبهم في صفحة GitHub
8. استنى رفع الملفات → اكتب في خانة الـ commit: `CRM app` → اضغط **Commit changes**

> لو ظهرت رسالة إن عدد الملفات كبير، ارفع الفولدرات الرئيسية (`src`, `public`, `deploy`) والملفات اللي جنبها على مرتين.

## الخطوة 3: إنشاء حساب Render

1. افتح: **https://render.com**
2. اضغط **Get Started** → سجّل بإيميلك أو بحساب GitHub (مجاني — **مش بيطلب كارت**)

## الخطوة 4: نشر التطبيق

1. من لوحة Render: **New +** → **Web Service**
2. اختار **Build and deploy from a Git repository** → **Next** → اربط حساب GitHub → اختار الـ repo `crm-hammer`
3. املأ الإعدادات:

| الإعداد | القيمة |
|---|---|
| **Name** | `crm-hammer` |
| **Region** | Frankfurt (EU) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start:cloud` |
| **Instance Type** | **Free** |
| **Health Check Path** | `/api/health` |

4. انزل لتحت لـ **Environment Variables** وضيف:

| Key | Value |
|---|---|
| `NEXTAUTH_URL` | (سيبه فاضي دلوقتي — هنحطه بعد أول نشر) |
| `CRM_DB_PATH` | `/tmp/crm.db` |
| `SHEET_RESTORE_ON_BOOT` | `1` |

> باقي الإعدادات (مفاتيح جوجل + الشيت) موجودة بالفعل في ملف `.env.local` جوه المشروع.

5. اضغط **Create Web Service** واستنى البناء (3-6 دقايق)

## الخطوة 5: ضبط رابط الدخول

1. بعد ما يخلص البناء، هتلاقي رابط فوق زي:
```
https://crm-hammer-xxxx.onrender.com
```
2. روح **Environment** → عدّل `NEXTAUTH_URL` → حط الرابط كامل (زي اللي فوق)
3. Save → السيرفر هيعمل deploy تاني لوحده (دقيقة)

## الخطوة 6: الدخول 🎉

افتح الرابط → سجّل دخول:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **غيّر كلمة السر فوراً** من صفحة الموظفين.

---

## إبقاء السيرفر صاحي (مهم للخطة المجانية)

الخطة المجانية بتنام بعد **15 دقيقة** بدون زيارات (أول زيارة بعدها بتاخد ~50 ثانية). الحل المجاني:

1. افتح: **https://uptimerobot.com** → سجّل مجاناً (بدون كارت)
2. **Add New Monitor** → نوع **HTTP(s)**
3. الـ URL: `https://crm-hammer-xxxx.onrender.com/api/health`
4. Interval: **كل 5 دقايق**
5. Save

كده السيرفر هيفضل صاحي طول اليوم.

---

## أمان البيانات (مهم تفهمه)

| الحالة | إيه اللي بيحصل |
|---|---|
| أي إضافة/تعديل | بتتحفظ في قاعدة البيانات **و** في شيت جوجل فوراً |
| السيرفر عمل restart / deploy | قاعدة البيانات المؤقتة بتتمسح → **النظام بيرجع كل الشكاوي من الشيت تلقائياً** عند أول فتح |
| عايز نسخة إضافية | زر **"تصدير Excel"** في صفحة الشكاوي بينزّل كل البيانات `.xlsx` |

> ⚠️ **ملحوظة:** شيت جوجل هو نسخة الأمان الدائمة — متمسحش تاب `CRM-Live` أبداً.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| البناء فشل (Out of memory) | في Render: Environment → ضيف `NODE_OPTIONS` = `--max-old-space-size=460` وأعد النشر |
| الدخول بيرجع للصفحة الرئيسية | تأكد إن `NEXTAUTH_URL` مطابق للرابط بالظبط (https + بدون / في الآخر) |
| المزامنة مش شغالة | تأكد إن الشيت متشارك مع `crm-sa@groovy-producer-499411-n1.iam.gserviceaccount.com` بصلاحية **Editor** |
| بيانات اختفت بعد deploy | افتح الموقع مرة، استنى 10 ثواني، واعمل Refresh — الاسترجاع من الشيت بيشتغل تلقائي |

---

## أوامر مفيدة

- إعادة النشر: **Manual Deploy → Deploy latest commit**
- عرض اللوجز: **Logs** (شوف `[sheetSync] restoreFromSheet: N row(s) restored`)
