# Öğrenci Soru Takip Sistemi

Next.js ve Supabase ile oluşturulmuş bir öğrenci soru çözüm takip uygulaması.

## Özellikler

- ✅ Öğrenci ve Admin girişi
- ✅ Günlük soru girişi (Matematik, Fizik, Kimya, Biyoloji, Türkçe)
- ✅ Ders bazlı puan ağırlıkları
- ✅ GitHub-style aktivite haritası (heatmap)
- ✅ Haftalık ve aylık istatistikler
- ✅ Leaderboard sistemi (günlük/haftalık/aylık)
- ✅ Vercel'e deploy edilmeye hazır

## Puan Ağırlıkları

- Matematik: 2 puan
- Fizik: 5 puan
- Kimya: 3 puan
- Biyoloji: 3 puan
- Türkçe: 1 puan

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Supabase Projesi Oluşturun

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'de `supabase-schema.sql` dosyasındaki SQL kodunu çalıştırın

### 3. Environment Variables Ayarlayın

`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase URL ve Anon Key'i şu adımlarla bulabilirsiniz:

1. Supabase Dashboard > Project Settings > API
2. `Project URL` ve `anon public` key'i kopyalayın

### 4. Geliştirme Sunucusunu Başlatın

````bash
npm run dev
```bash
npm run dev
````

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacak.

## Supabase Database Schema

`supabase-schema.sql` dosyası şunları içerir:

- **profiles**: Kullanıcı profilleri (admin/student rolü)
- **subject_weights**: Ders ağırlıkları
- **daily_entries**: Günlük soru girişleri
- Row Level Security (RLS) politikaları
- Otomatik puan hesaplama fonksiyonları

## İlk Admin Kullanıcısı Oluşturma

1. `/signup` sayfasından kayıt olun
2. "Rol" seçiminde "Admin" seçin
3. Kayıt olduktan sonra giriş yapın

## Vercel'e Deploy

### 1. GitHub'a Push Edin

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel'de Deploy Edin

1. [Vercel](https://vercel.com) hesabı oluşturun
2. "Import Project" ile GitHub repo'nuzu seçin
3. Environment Variables ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. "Deploy" butonuna tıklayın

## Kullanım

### Öğrenci Paneli

- Günlük soru sayılarını girin
- Haftalık ve aylık istatistiklerinizi görün
- Aktivite haritanızı takip edin

### Admin Paneli

- Tüm öğrencilerin istatistiklerini görün
- Günlük/haftalık/aylık sıralamalar
- En son girilen sorular
- Toplam istatistikler

## Teknolojiler

- **Framework**: Next.js 15 (App Router)
- **Dil**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Tarih**: date-fns
- **Deployment**: Vercel

## Proje Yapısı

```
src/
├── app/
│   ├── admin/
│   │   └── dashboard/      # Admin paneli
│   ├── student/
│   │   └── dashboard/      # Öğrenci paneli
│   ├── login/              # Giriş sayfası
│   ├── signup/             # Kayıt sayfası
│   └── page.tsx            # Ana sayfa (login'e yönlendirir)
├── lib/
│   └── supabase/
│       ├── client.ts       # Client-side Supabase client
│       ├── server.ts       # Server-side Supabase client
│       └── middleware.ts   # Auth middleware
└── types/
    └── database.types.ts   # TypeScript türleri
```

## Güvenlik

- Row Level Security (RLS) aktif
- Öğrenciler sadece kendi verilerini görebilir ve düzenleyebilir
- Adminler tüm verileri görebilir
- Güvenli authentication flow

## Lisans

MIT
