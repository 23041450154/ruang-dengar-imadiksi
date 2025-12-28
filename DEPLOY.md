# 🚀 Panduan Deploy Ruang Dengar ke Vercel

## ✅ Checklist Pre-Deploy

- [x] `vercel.json` dikonfigurasi dengan benar
- [x] `.gitignore` mencegah upload `.env` dan `node_modules`
- [x] `package.json` memiliki dependencies lengkap
- [x] `README.md` untuk dokumentasi
- [x] Environment variables siap

## 📝 Langkah Deploy

### 1. Commit dan Push ke GitHub

```bash
# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit dengan pesan yang jelas
git commit -m "Initial commit: Ruang Dengar application ready for production"

# Add remote repository (ganti USERNAME dengan username GitHub Anda)
git remote add origin https://github.com/USERNAME/ruang-dengar.git

# Push ke GitHub
git push -u origin main
```

### 2. Deploy ke Vercel

#### Via Vercel Dashboard (Cara Termudah):

1. **Login ke Vercel**
   - Buka https://vercel.com
   - Login dengan GitHub account

2. **Import Project**
   - Klik "Add New..." → "Project"
   - Pilih repository `ruang-dengar`
   - Klik "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: (leave empty)
   Output Directory: public
   Install Command: npm install
   ```

4. **Environment Variables** ⚠️ PENTING!
   
   Tambahkan variabel ini di Vercel:
   
   ```
   SUPABASE_URL = https://tlrrqjsmffhtofkjijxb.supabase.co
   SUPABASE_ANON_KEY = [Your Supabase Anon Key]
   JWT_SECRET = ruang-dengar-secret-key-2025
   NODE_ENV = production
   ```
   
   **Cara mendapatkan Supabase Keys:**
   - Login ke https://supabase.com/dashboard
   - Pilih project
   - Settings → API
   - Copy `URL` dan `anon/public` key

5. **Deploy**
   - Klik "Deploy"
   - Tunggu build selesai (~2-3 menit)
   - ✅ App akan live!

#### Via Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET
vercel env add NODE_ENV

# Deploy to production
vercel --prod
```

### 3. Post-Deploy Configuration

#### Update Supabase CORS Settings:

1. Login ke Supabase Dashboard
2. Settings → API → CORS
3. Tambahkan domain Vercel:
   ```
   https://ruang-dengar.vercel.app
   https://ruang-dengar-*.vercel.app
   ```

#### Test Aplikasi:

Buka aplikasi dan test:
- [ ] Landing page load
- [ ] Login user dengan kode undangan
- [ ] Login companion (kaka/teman123)
- [ ] Chat berfungsi
- [ ] Jurnal & Mood berfungsi
- [ ] Database Supabase terkoneksi

### 4. Custom Domain (Opsional)

Jika punya domain sendiri (misal: `ruangdengar.id`):

1. Vercel Dashboard → Settings → Domains
2. Add domain: `ruangdengar.id`
3. Update DNS di domain provider:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 5. Monitoring

- **Logs**: Vercel Dashboard → Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Errors**: Vercel Dashboard → Monitoring

### 6. Update Aplikasi

Setiap update:

```bash
git add .
git commit -m "Update: description"
git push origin main

# Vercel otomatis deploy! 🚀
```

## 🔧 Troubleshooting

### Error: "Environment variables not found"
**Solution:**
```bash
vercel env pull
vercel env add SUPABASE_URL production
vercel --prod
```

### Error: "API routes returning 404"
**Solution:** 
- Check `vercel.json` routing configuration
- Pastikan folder `api/` ada di root project

### Error: "Database connection failed"
**Solution:**
- Verify Supabase URL dan key di environment variables
- Check Supabase project status
- Test connection dengan Supabase client

### Error: "Cannot read property 'text' of undefined"
**Solution:**
- Migration database sudah dijalankan?
- Check schema tabel `messages` punya kolom `text`

## 📊 Production URLs

- **Production**: `https://ruang-dengar.vercel.app`
- **GitHub**: `https://github.com/USERNAME/ruang-dengar`
- **Supabase**: `https://tlrrqjsmffhtofkjijxb.supabase.co`

## 🎉 Selesai!

Aplikasi **Ruang Dengar** sekarang live dan siap digunakan!

---

**Note:** Jangan lupa backup database Supabase secara berkala!
