# 🚀 دليل نشر CRM على Oracle Cloud (مجاني للأبد)

ده دليل خطوة بخطوة — التزم بيه بالترتيب ومش هتتعب.

---

## الخطوة 1: إنشاء حساب Oracle Cloud (مرة واحدة)

1. افتح: **https://www.oracle.com/cloud/free/** و اضغط **Start for free**
2. سجل بياناتك (البريد + الموبايل + الكارت الائتمان للتحقق فقط — مش بيخصم)
3. ⚠️ **مهم جداً عند اختيار الـ Home Region:** اختار **UAE East (Dubai)** — أقرب منطقة لمصر، ومنطقة البيت لا يمكن تغييرها بعدين!
4. استنى الإيميل بتأكيد تفعيل الحساب (غالباً دقايق، ساعات في أوقات الضغط)

---

## الخطوة 2: إنشاء السيرفر (VM)

1. من القايمة: **Compute → Instances → Create Instance**
2. الاسم: `crm-server`
3. **Image:** اختار **Ubuntu 22.04** (مش Oracle Linux)
4. **Shape:**
   - جرب الأول: **Ampere A1 — Flex** و حط `2 OCPU + 12 GB RAM`
   - لو طلعلك `Out of capacity` (بيحصل كتير في المنطقة دي) → جرب تاني بعدين، أو مؤقتاً اختار **VM.Standard.E2.1.Micro** (شغال دايماً وكفاية للـ CRM)
5. **SSH Keys:** اختار **Generate a key pair** → نزّل الملفين (Private + Public) واحفظهم في مكان آمن — **ده مفتاح دخولك للسيرفر**
6. اضغط **Create** و استنى Status تبقى **RUNNING**
7. انسخ **Public IP Address** من صفحة السيرفر (مثال: `132.145.10.20`)

---

## الخطوة 3: فتح البورت 3000 على جدار Oracle

1. من صفحة الـ Instance: انزل تحت لـ **Primary VNIC → Subnet** و افتح الـ Subnet
2. افتح **Security List** اللي جواه → **Add Ingress Rules**
3. حط rule كده:

| Field | Value |
|---|---|
| Source Type | CIDR |
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | `TCP` |
| Destination Port Range | `3000` |

4. Save

---

## الخطوة 4: تغليف المشروع من جهازك

على جهازك (Windows) افتح PowerShell داخل فولدر `crm-app\deploy` وشغّل:

```powershell
powershell -ExecutionPolicy Bypass -File .\package.ps1
```

هيطلعلك ملف **`crm-deploy.zip`** في نفس الفولدر (المشروع كله من غير node_modules أو الداتا).

---

## الخطوة 5: رفع المشروع على السيرفر

غيّر `YOUR_SERVER_IP` بالـ IP بتاعك، وشغّل من PowerShell في فولدر `deploy`:

```powershell
scp -i .\ssh-key.pem crm-deploy.zip ubuntu@YOUR_SERVER_IP:/home/ubuntu/
scp -i .\ssh-key.pem server-setup.sh ubuntu@YOUR_SERVER_IP:/home/ubuntu/
```

> اسم ملف المفتاح هو اللي نزلته في الخطوة 2 (زي `ssh-key-....key`) — استبدل `.\ssh-key.pem` باسمه.

---

## الخطوة 6: تجهيز السيرفر (أوتوماتيك)

اتصل بالسيرفر:

```powershell
ssh -i .\ssh-key.pem ubuntu@YOUR_SERVER_IP
```

وبعدين شغّل (السطر الأول بيحمل صلاحيات root):

```bash
sudo rm -rf /opt/crm && sudo mkdir -p /opt/crm && sudo chown ubuntu /opt/crm
unzip -o /home/ubuntu/crm-deploy.zip -d /opt/crm > /dev/null
sudo bash /home/ubuntu/server-setup.sh
```

هيخلص في 3-5 دقايق و هيريك ✅ رسالة نجاح.

---

## الخطوة 7: ضبط إعدادات البيئة على السيرفر

```bash
cd /opt/crm
cp .env.example .env   # لو مفيش .env
nano .env
```

عدّل/أضف السطور دي (و لو لقيت سطور جوجل، خليها زي ما هي — الفيدباك و المزامنة بيستخدموها):

```
NEXTAUTH_SECRET=<حط هنا قيمة سرية طويلة عشوائية>
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000
GOOGLE_SHEET_ID=1UEaiN9hsDAIFPKzZHeQmo2dxH5kv_bcwuQYoXDfZ5dg
SYNC_SHEET_TAB=CRM-Live
SHEET_SYNC_ENABLED=1
```

> **مزامنة شيت جوجل:** أول ما تعمل شكوي أو تعدّل شكوي، بيتكتب تلقائياً في التاب `CRM-Live` داخل نفس الشيت المرتبط. لأجل كده لازم `GOOGLE_SERVICE_KEY_B64` و `GOOGLE_SHEET_ID` يكونوا موجودين في السيرفر (مدمجين مع .env.local جاهزين بالفعل في الحزمة).

احفظ بـ `Ctrl+X` → `Y` → `Enter`، وبعدها:

```bash
pm2 restart crm
```

---

## الخطوة 8: نقل قاعدة البيانات (لو فيها شكاوي）

لو استوردت شكاوي على جهازك قبل كده و عايز تنقلها للسيرفر، من جهازك (Windows):

```powershell
scp -i .\ssh-key.pem "C:\Users\Hammer\Desktop\CRM\CRM\crm-app\data\crm.db" ubuntu@YOUR_SERVER_IP:/opt/crm/data/crm.db
```

لو الفولدر مش موجود على السيرفر اعمله الأول: `mkdir -p /opt/crm/data`

وبعدين على السيرفر: `pm2 restart crm`

> مستحيل توصلية أهم من كده: **خد نسخة احتياطية من `crm.db` أسبوعياً** (نزّلها على جهازك أو على Google Drive)

---

## الخطوة 9: تدخل الموظفين 🎉

الموظفين يفتحوا من متصفحهم:

```
http://YOUR_SERVER_IP:3000
```

اليوزر الافتراضي: `admin` / `admin123` — وغيّر الباسورد فوراً.

---

## أوامر مفيدة على السيرفر

| الأمر | وظيفته |
|---|---|
| `pm2 status` | حالة السيرفر شغال/واقف |
| `pm2 logs crm` | عرض آخر الأخطاء |
| `pm2 restart crm` | إعادة تشغيل |
| `pm2 stop crm` / `pm2 start crm` | وقف/تشغيل |

السيرفر بيرجع شغال **لوحده** لو السيرفر اتعمل restart — مش محتاج تفتح حاجة.

---

## ⚠️ ملاحظات أمان مهمة

1. **غيّر باسورد الأدمن فوراً** بعد أول دخول
2. الشغل حالياً على `http` — كويس للشبكة الداخلية/الاختبار، بس الأفضل بعد كده نضيف **HTTPS مجاني** (دومين + Cloudflare) عشان الباسوردات متلفش مشفرة. قولّي لما نبقى جاهزين وأظبطه معاك في 10 دقايق
3. ملف الـ SSH key يعني صاحبه يتحكم في سيرفرك كله — احتفظ بيه في مكان آمن وما ترفعهوش في أي حتة
