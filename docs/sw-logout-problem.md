# مشكلة Logout وحلها (Service Worker + Caching)

## المشكلة
- الضغط على Logout يعيد تحميل الصفحة لكن المستخدم يبقى مسجل دخول
- الحل الوحيد هو Ctrl+F5 (hard refresh) عشان يسجل خروج
- التسجيل من جهاز تاني يشتغل عادي

## التشخيص
الـ Service Worker (SW) كان يعترض كل طلبات الشبكة (بما فيها API):
```

await fetch('/api/logout', { method: 'POST' })   ← يمسح الكوكيز في السيرفر
window.location.href = '/'                        ← يعيد تحميل الصفحة

SW يتدخل:
  GET /api/auth/session → يرجع رد مخبّى (user logged in)
```
فالعميل يقرأ session قديم من cache الـ SW ويعتقد المستخدم لسه مسجل.

## الحل

### 1. تخطي API في الـ SW
`public/sw.js` - السطر 35:
```js
if (e.request.mode === 'navigate') return;
if (url.pathname.startsWith('/api/')) return;
```
الـ SW الآن لا يتعامل مع:
- طلبات التنقل (الصفحات)
- طلبات API

### 2. مسح أي SW قديم عند تحميل الصفحة
`src/app/layout.js` - السطر 33:
```js
if('serviceWorker'in navigator){
  navigator.serviceWorker.getRegistrations().then(function(r){
    r.forEach(function(s){ s.unregister() })
  });
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/sw.js')
  })
}
```
أول ما الصفحة تفتح، يمسح أي SW قديم ويسجل الجديد.

### 3. Endpoint خاص للـ Logout
`src/app/api/logout/route.js` (جديد):
- يمسح كل كوكيز NextAuth (session, CSRF, callback-url)
- يستخدم `NextResponse.cookies.set()` عشان يضمن Separate Set-Cookie headers
- يتعامل مع HTTP و HTTPS تلقائياً

### 4. مسح الكوكيز من جهة العميل
`src/components/Navbar.js` - بعد طلب `/api/logout`:
```js
document.cookie.split(';').forEach(c => {
  const eq = c.indexOf('=');
  const name = eq > -1 ? c.substr(0, eq).trim() : c.trim();
  if (name.includes('next-auth'))
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970`;
})
```
خطة احتياط لو السيرفر ما مسح الكوكيز لأي سبب.

## العلاقة بين الملفات
```
public/sw.js                         ← يتجاوز API و navigation requests
src/app/layout.js                    ← يمسح الـ SW القديم ويسجل الجديد
src/app/api/logout/route.js          ← endpoint يمسح الكوكيز
src/components/Navbar.js             ← يستخدم الـ endpoint + مسح يدوي
```

## لو المشكلة رجعت
1. افتح `chrome://serviceworker-internals/`
2. unregister أي SW لـ `vercel.app`
3. F5
