# 🚀 دليل النشر على Render (مجاني — بدون كارت ائتمان)

Render بيوفر سيرفر مجاني **24/7** مع **HTTPS آمن** بدون أي بيانات دفع.
البيانات بتتحفظ في **شيت جوجل** (تاب `CRM-Live`) — ولو السيرفر اتعمل restart النظام بيرجّع كل الشكاوي من الشيت لوحده.

> ✅ الكود مرفوع بالفعل على GitHub: `https://github.com/mehap5314-cloud/crm-app`
> ✅ كل الإعدادات السرية موجودة في الملف **`.env.render`** (مش مرفوع على GitHub).

---

## الخطوة 1: حساب Render (بدون كارت)

1. افتح **https://render.com**
2. **Get Started** → سجّل بحساب GitHub (أسهل وأسرع) أو بالإيميل
3. مش مطلوب كارت ولا بيانات دفع

## الخطوة 2: نشر التطبيق

1. من لوحة Render: **New +** → **Blueprint**
2. اربط حساب GitHub → اختار الـ repo **`mehap5314-cloud/crm-app`**
3. Render هيقرأ ملف `render.yaml` ويجهّز الخدمة لوحده → اضغط **Apply / Create**
4. استنى البناء (3-6 دقايق)

> لو ظهرت رسالة إن الـ repo مش ظاهر: من GitHub → **Settings → Applications → Render** ادّي صلاحية الوصول للـ repo.

## الخطوة 3: المتغيّرات السرية (نسخة ولصق واحدة)

1. في Render افتح الخدمة → **Environment**
2. اضغط **Add from .env**
3. افتح الملف ده على جهازك:
```
C:\Users\Hammer\Desktop\CRM\CRM\crm-app\.env.render
```
4. **انسخ محتواه كله** والصقه في الخانة → **Save changes**
5. Render هيعمل deploy تاني لوحده

## الخطوة 4: الدخول 🎉

افتح الرابط اللي فوق في Render (شكله `https://crm-hammer-xxxx.onrender.com`):

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **غيّر كلمة السر فوراً** من صفحة الموظفين.

> مش محتاج تضبط `NEXTAUTH_URL` — النظام بياخد رابط Render تلقائياً.

---

## إبقاء السيرفر صاحي (مهم للخطة المجانية)

الخطة المجانية بتنام بعد **15 دقيقة** بدون زيارات (أول زيارة بعدها بتاخد ~50 ثانية). الحل المجاني:

1. افتح **https://uptimerobot.com** → سجّل مجاناً (بدون كارت)
2. **Add New Monitor** → نوع **HTTP(s)**
3. الـ URL: `https://crm-hammer-xxxx.onrender.com/api/health`
4. Interval: **كل 5 دقايق** → Save

---

## أمان البيانات

| الحالة | إيه اللي بيحصل |
|---|---|
| أي إضافة/تعديل/حذف | بتتحفظ في قاعدة البيانات **و** في شيت جوجل فوراً |
| السيرفر عمل restart / deploy | قاعدة البيانات المؤقتة بتتمسح → **كل الشكاوي بترجع من الشيت تلقائياً** عند أول فتح |
| عايز نسخة إضافية | زر **"تصدير Excel"** في صفحة الشكاوي بينزّل كل البيانات `.xlsx` |

> ⚠️ شيت جوجل هو نسخة الأمان الدائمة — متمسحش تاب `CRM-Live` أبداً.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| البناء فشل (Out of memory) | Environment → `NODE_OPTIONS` = `--max-old-space-size=460` ثم **Manual Deploy** |
| فشل تثبيت better-sqlite3 | تأكد إن Build Command = `npm ci --ignore-scripts && npm run build` و `NODE_VERSION` = `22` |
| الدخول بيرجع للصفحة الرئيسية | امسح الكوكيز، وتأكد إن الموقع بيفتح بـ `https` |
| المزامنة مش شغالة | الشيت لازم يكون متشارك مع `crm-sa@groovy-producer-499411-n1.iam.gserviceaccount.com` بصلاحية **Editor** |
| بيانات اختفت بعد deploy | افتح الموقع، استنى 10 ثواني، واعمل Refresh — الاسترجاع من الشيت بيشتغل تلقائي |

---

## أوامر مفيدة

- إعادة النشر: **Manual Deploy → Deploy latest commit**
- اللوجز: **Logs** — دور على `[sheetSync] restoreFromSheet: N row(s) restored`
- بعد أي تعديل في الكود: `git push` → Render ينشر لوحده (autoDeploy)
