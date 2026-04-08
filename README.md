# 💸 Casho — منصتك عشان تبيع صح مش في الشات

> بدل ما تغرق في شبر رسايل… خليك البرنس اللي بيديرها صح 👑

**Casho** هو SaaS بيخليك تعمل متجر إلكتروني في دقايق، تشاركه لينك بسيط، وتبدأ تستقبل أوردرات وتدير شغلك بشكل احترافي — من غير تعقيد.

---

## 🚀 Features

- 🛍️ إنشاء متجر في ثواني  
- 🔗 لينك متجر جاهز للمشاركة  
- 📦 إدارة المنتجات والتصنيفات  
- 🧾 نظام أوردر كامل  
- 💳 طرق دفع محلية (كاش / فودافون كاش / إنستا باي)  
- 📊 Dashboard بإحصائيات بسيطة وواضحة  
- 🎨 تخصيص شكل المتجر (Navbar - ألوان - بانرز)  
- 🔔 إشعارات (Telegram قريبًا)  
- 🔐 نظام Auth مخصص بدون NextAuth  
- ⚡ Server Actions بدل API Routes  

---

## 🧠 الفكرة

Casho معمول مخصوص لـ:

- الناس اللي بتبيع على فيسبوك / إنستجرام  
- اللي تعبان من الرسايل الكتير  
- اللي عايز يبقى عنده سيستم محترم بسرعة  

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router + Server Actions)  
- **UI:** shadcn/ui + Tailwind CSS  
- **Database:** PostgreSQL (Neon)  
- **ORM:** Prisma  
- **Auth:** Custom (Cookies + Server Actions)  
- **Animations:** Framer Motion  
- **State/UI:** React + useTransition + Sonner  

---

## ⚙️ Getting Started

### 1. Clone المشروع

```bash
git clone https://github.com/your-username/casho.git
cd casho
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

اعمل ملف `.env`:

```env
DATABASE_URL=your_database_url
```

---

### 4. Run Prisma

```bash
npx prisma generate
npx prisma db push
```

---

### 5. Run المشروع

```bash
npm run dev
```

افتح:
```
http://localhost:3000
```

---

## 📁 Project Structure

```
app/
  (merchant)/dashboard/
  store/[slug]/
actions/
components/
lib/
  prisma/
  auth/
constants/
```

---

## 🔐 Authentication Flow

- المستخدم بيعمل Register  
- بيتخزن `user.id` في Cookie (sessionToken)  
- كل request بيتحقق منه بـ helper  
- مفيش NextAuth — كله custom  

---

## 🛒 Store System

- كل تاجر عنده:
  - Store خاص بيه  
  - Products  
  - Orders  

- المتجر بيظهر على:
```
/store/[slug]
```

---

## 💳 Payment Methods

- Cash on Delivery  
- Vodafone Cash  
- InstaPay  
- Bank Transfer  

---

## 📊 Dashboard

- عدد الطلبات  
- الأرباح  
- المنتجات  
- حالة الأوردرات  

---

## 💡 Roadmap

- [ ] Subdomain support (`store.casho.store`)  
- [ ] Online Payments (Paymob)  
- [ ] Telegram Integration  
- [ ] Advanced Analytics  
- [ ] Coupons System  
- [ ] Mobile App  

---

## 💰 Pricing Idea

- أول 50 تاجر: 300 جنيه / شهر  
- بعد كده: 499 جنيه / شهر  

---

## 🧑‍💻 Author

**Maro Asam**  
Full Stack Developer — Builder of Casho  

---

## 🤝 Contributing

1. Fork المشروع  
2. اعمل Feature Branch  
3. اعمل Pull Request  

---

## ⭐ Support

لو المشروع عاجبك:
- اعمله ⭐ على GitHub  
- أو شاركه مع حد محتاجه  

---

## 🧠 Philosophy

> Casho مش مجرد متجر…  
> ده انتقال من العشوائية للنظام 💥
