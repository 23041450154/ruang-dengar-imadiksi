# 🚀 Migrasi ke Supabase

## Langkah-langkah Migrasi

### 1. Setup Supabase Project
1. Buka [supabase.com](https://supabase.com/) dan buat akun
2. Klik **New Project**
3. Isi:
   - Project Name: `SafeSpace`
   - Database Password: (simpan ini!)
   - Region: Pilih yang terdekat (Singapore/Tokyo untuk Asia)
4. Tunggu project selesai dibuat (~2 menit)

### 2. Jalankan SQL Schema
1. Di dashboard Supabase, buka **SQL Editor** (ikon di sidebar kiri)
2. Klik **+ New Query**
3. Copy seluruh isi file `supabase-schema.sql` dan paste
4. Klik **Run** (atau Ctrl+Enter)
5. Tunggu sampai muncul "Success. No rows returned"

### 3. Dapatkan API Credentials
1. Di dashboard, buka **Project Settings** (ikon gear di kiri bawah)
2. Pilih tab **API**
3. Copy dua nilai ini:
   - **Project URL** (contoh: `https://abc123xyz.supabase.co`)
   - **anon/public key** (string panjang yang dimulai dengan `eyJ...`)

### 4. Update Environment Variables
Buka file `.env` dan tambahkan:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here

# Keep these existing variables
APP_SECRET=your-super-secret-jwt-signing-key-change-this-in-production
INVITE_CODES=IMADIKSI2025,SAFESPACE,RUANGAMAN
```

### 5. Switch ke Supabase Backend
Rename file-file berikut untuk mengaktifkan Supabase:

```powershell
# Backup file lama
mv api/auth/login.js api/auth/login-sheets-backup.js

# Aktifkan Supabase version
mv api/auth/login-supabase.js api/auth/login.js
```

### 6. Restart Server
```powershell
# Stop server yang lama (Ctrl+C)
# Start ulang
vercel dev
```

### 7. Test Login
1. Buka http://localhost:3001/landing.html
2. Masukkan invite code: `IMADIKSI2025`
3. Display name: `TestUser`
4. Klik **Masuk ke SafeSpace**

Seharusnya jauh lebih cepat dari Google Sheets! ⚡

---

## Files yang Sudah Dibuat

✅ `api/_lib/supabase.js` - Supabase client helper
✅ `supabase-schema.sql` - Database schema
✅ `api/auth/login-supabase.js` - Login endpoint dengan Supabase
✅ `.env.example` - Updated dengan Supabase config

## Next Steps (Optional)

Setelah login berhasil, kita bisa migrate endpoint lainnya:
- [ ] `/api/me.js` - User info & consent
- [ ] `/api/chat/sessions.js` - Chat sessions
- [ ] `/api/chat/messages.js` - Messages (dengan real-time!)
- [ ] `/api/journal.js` - Journal entries
- [ ] `/api/mood.js` - Mood tracking
- [ ] `/api/reports.js` - Reports

Mau lanjut migrate endpoint mana dulu? 🎯
