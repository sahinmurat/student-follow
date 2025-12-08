# Supabase Email Doğrulama Ayarları

Supabase'de email doğrulamayı kapatmak için:

## Adımlar:

1. Supabase Dashboard'a git: https://app.supabase.com
2. Projenizi seçin
3. **Authentication** → **Settings** → **Email Auth**
4. **"Enable email confirmations"** seçeneğini **KAPATIN** (disable)
5. **"Enable email change confirmations"** seçeneğini de **KAPATIN**
6. Save butonuna tıklayın

Bu ayardan sonra kullanıcılar email doğrulama yapmadan direkt giriş yapabilirler.

## Not:

Uygulama artık username + password ile çalışıyor. Arka planda username'i `username@local.app` formatına çevirerek Supabase'e kaydediyor.
