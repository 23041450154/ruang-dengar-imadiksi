# Admin Login System - SafeSpace

## 📋 Overview
Sistem login admin untuk mengelola platform SafeSpace. Admin dapat login menggunakan username dan password dengan fitur remember me.

## 🔑 Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **PENTING**: Segera ganti password default setelah login pertama kali!

## 📁 Files Created

### Frontend
1. **`public/admin-login.html`**
   - Halaman login untuk admin
   - Form username & password
   - Checkbox "Remember Me" untuk menyimpan username
   - Tidak auto-load (harus login manual)
   - Design profesional dengan gradient background

2. **`public/admin.html`**
   - Dashboard admin setelah login
   - Menampilkan statistik platform
   - Quick actions untuk navigasi
   - Auto-check authentication (redirect ke login jika belum login)

### Backend API
1. **`api/admin/login.js`**
   - POST endpoint untuk login admin
   - Verifikasi username & password dengan bcrypt
   - Generate JWT token (expires 7 days)
   - Set httpOnly cookie `admin_token`

2. **`api/admin/me.js`**
   - GET: Check authentication status
   - POST: Logout (clear cookie)

### Database
1. **`supabase-admins-migration.sql`**
   - CREATE TABLE admins
   - Insert default admin user
   - Username & password hash storage

## 🚀 Setup Instructions

### 1. Run SQL Migration
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy paste isi file `supabase-admins-migration.sql`
4. Klik **Run**

### 2. Start Server
Server sudah running di `http://localhost:3000`

### 3. Access Admin Panel
1. Buka browser: `http://localhost:3000/admin-login.html`
2. Login dengan credentials:
   - Username: `admin`
   - Password: `admin123`
3. Centang "Ingat saya" jika ingin username tersimpan
4. Klik **Masuk ke Admin Panel**

## ✨ Features

### Remember Me
- Username disimpan di `localStorage` jika checkbox dicentang
- Saat buka halaman login lagi, username otomatis terisi
- Tidak menyimpan password (security best practice)

### No Auto-Load
- Halaman login TIDAK auto-redirect ke dashboard
- User harus input credentials secara manual
- Lebih aman dan sesuai best practice

### Authentication Flow
1. User submit form login
2. API verify credentials dengan bcrypt
3. Generate JWT token (valid 7 hari)
4. Set httpOnly cookie untuk security
5. Redirect ke dashboard

### Dashboard Protection
- Dashboard (`admin.html`) auto-check authentication
- Jika tidak ada valid token, redirect ke login
- Token di-verify setiap kali akses dashboard

## 🔐 Security Features

✅ **Password Hashing**: bcrypt dengan 10 salt rounds
✅ **HttpOnly Cookies**: Token tidak bisa diakses JavaScript
✅ **JWT Expiration**: Token expire setelah 7 hari
✅ **SameSite**: Cookie hanya dikirim ke same-site requests
✅ **Remember Me**: Hanya simpan username, BUKAN password
✅ **Manual Login**: Tidak ada auto-login atau credential storage

## 📊 Database Schema

```sql
CREATE TABLE admins (
  admin_id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🛠️ API Endpoints

### POST /api/admin/login
Login admin

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

**Response (Error):**
```json
{
  "error": "Username atau password salah"
}
```

### GET /api/admin/me
Check authentication status

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "admin": {
    "id": "uuid",
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false,
  "error": "Tidak terautentikasi"
}
```

### POST /api/admin/me
Logout admin

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

## 🔄 Adding New Admin

### Option 1: Via SQL
```sql
-- Generate hash untuk password baru
-- Jalankan di terminal: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('PASSWORD_ANDA', 10).then(h => console.log(h))"

INSERT INTO admins (username, password_hash, name, role, is_active)
VALUES (
  'username_baru',
  'HASH_DARI_TERMINAL',
  'Nama Admin',
  'admin',
  true
);
```

### Option 2: Via Node.js
```javascript
// Jalankan di terminal
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(h => console.log('Hash:', h))"

// Copy hash tersebut dan insert ke database
```

## 🎨 UI Customization

### Colors
- Primary Gradient: `#667eea` to `#764ba2`
- Background: `#f5f7fa`
- Text: `#1f2937`

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly buttons

## 📝 Next Steps

1. ✅ Run SQL migration untuk create admins table
2. ✅ Test login dengan credentials default
3. ⚠️ GANTI password default!
4. 📊 Implement statistik di dashboard (TODO)
5. 🔧 Add admin features (user management, reports, etc)

## 🐛 Troubleshooting

### "Username atau password salah"
- Check credentials spelling
- Ensure SQL migration sudah dijalankan
- Check console untuk error messages

### "Tidak terautentikasi"
- Clear browser cookies
- Login ulang
- Check server running

### Server tidak running
```bash
cd "c:\Users\NAUFAL\OneDrive\Documents\UIN\organisasi\imadiksi\ruang bercerita"
vercel dev
```

## 📞 Support
Jika ada masalah, check:
1. Console browser (F12)
2. Server terminal logs
3. Supabase dashboard untuk table structure
