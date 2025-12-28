# Update: Unified Login Page & Bug Fixes

## 🎯 Perubahan yang Dilakukan

### 1. ✅ Fix Logout Function
**File: `public/app.js`**

**Masalah:**
- Logout tidak berfungsi karena menggunakan `window.location.href = '/api/auth/logout'`
- API logout hanya menerima POST method, bukan GET

**Solusi:**
```javascript
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  // Redirect regardless of result
  window.location.href = '/landing.html';
}
```

### 2. ✅ Auto-Open Existing Chat dengan Companion
**File: `public/app.js` - Fungsi `openCompanionChatModal()`**

**Masalah:**
- Ketika klik companion yang sama berkali-kali, selalu buat chat baru
- Harusnya langsung buka chat existing jika sudah ada

**Solusi:**
```javascript
function openCompanionChatModal(companionId, companionName) {
  // Check if there's already an existing chat with this companion
  const existingSession = state.sessions.find(
    session => session.companionId === companionId
  );

  if (existingSession) {
    // If chat exists, switch to chat tab and open that session
    switchTab('chat');
    selectSession(existingSession.sessionId);
    showToast('Membuka chat dengan ' + companionName, 'success');
  } else {
    // If no existing chat, open modal to create new chat
    state.selectedCompanionId = companionId;
    document.getElementById('selectedCompanionName').textContent = companionName;
    document.getElementById('companionChatModal').hidden = false;
    document.getElementById('companionChatTopic').focus();
  }
}
```

**Logika:**
1. Cek apakah sudah ada session dengan `companionId` yang sama
2. Jika ada → switch ke tab chat dan buka session tersebut
3. Jika tidak ada → tampilkan modal untuk buat chat baru

### 3. ✅ Unified Login Page (User + Companion)
**File: `public/landing.html` & `public/styles.css`**

**Perubahan:**
- Menggabungkan login user dan companion di satu halaman `landing.html`
- Menambahkan tab switching untuk memilih mode login
- Tidak perlu lagi halaman terpisah `companion-login.html`

**UI Structure:**
```
┌─────────────────────────────────────┐
│  [Pengguna] [Teman Ngobrol]        │  ← Tabs
├─────────────────────────────────────┤
│  Form Login (bergantian)            │
│  - User: Kode Undangan + Nama      │
│  - Companion: Username + Password  │
└─────────────────────────────────────┘
```

## 📸 Visual Preview

### Landing Page dengan Tabs
```
╔═══════════════════════════════════════╗
║        SafeSpace                      ║
║   Ruang Aman untuk Bercerita         ║
╠═══════════════════════════════════════╣
║  [👤 Pengguna] [👥 Teman Ngobrol]   ║
║  ‾‾‾‾‾‾‾‾‾‾‾                         ║
║                                       ║
║  Kode Undangan                        ║
║  [___________________]                ║
║                                       ║
║  Nama Panggilan                       ║
║  [___________________]                ║
║                                       ║
║  [   Masuk ke SafeSpace   ]          ║
╚═══════════════════════════════════════╝
```

**Klik "Teman Ngobrol":**
```
╔═══════════════════════════════════════╗
║        SafeSpace                      ║
║   Ruang Aman untuk Bercerita         ║
╠═══════════════════════════════════════╣
║  [👤 Pengguna] [👥 Teman Ngobrol]   ║
║                 ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾      ║
║                                       ║
║  Username                             ║
║  [___________________]                ║
║                                       ║
║  Password                             ║
║  [___________________]                ║
║                                       ║
║  [ Masuk sebagai Teman Ngobrol ]     ║
╚═══════════════════════════════════════╝
```

## 🎨 CSS Classes Added

### `.login-tabs`
```css
display: flex;
gap: var(--space-2);
margin-bottom: var(--space-6);
border-bottom: 2px solid var(--border);
```
- Container untuk tab buttons

### `.login-tab`
```css
flex: 1;
display: flex;
align-items: center;
justify-content: center;
padding: var(--space-3) var(--space-4);
font-weight: 600;
border-bottom: 3px solid transparent;
cursor: pointer;
```
- Tab button dengan icon SVG
- Hover effect dan active state

### `.login-tab.active`
```css
color: var(--primary);
border-bottom-color: var(--primary);
```
- Tab yang sedang aktif

### `.login-form`
```css
display: none;
```
- Default: form hidden

### `.login-form.active`
```css
display: block;
```
- Form yang aktif ditampilkan

## 🔧 JavaScript Logic

### Login Mode Switching
```javascript
loginTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode; // 'user' or 'companion'
    
    // Update active tab
    loginTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding form
    loginForms.forEach(form => {
      if ((mode === 'user' && form.id === 'loginForm') ||
          (mode === 'companion' && form.id === 'companionLoginForm')) {
        form.classList.add('active');
      } else {
        form.classList.remove('active');
      }
    });
  });
});
```

### Authentication Check (Startup)
```javascript
// Check user login
const res = await fetch('/api/me');
if (res.ok && data.user) {
  // Redirect to app or onboarding
}

// Check companion login
const companionRes = await fetch('/api/companion/me');
if (companionRes.ok && companionData.authenticated) {
  window.location.href = '/companion.html';
}
```

### Companion Login Submit
```javascript
const res = await fetch('/api/companion/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
  credentials: 'include'
});

// Redirect to companion dashboard
window.location.href = '/companion.html';
```

## ✨ Benefits

### 1. **Logout Fix**
- ✅ Logout sekarang bekerja dengan benar
- ✅ Menggunakan POST method sesuai API
- ✅ Redirect ke landing page

### 2. **Smart Companion Chat**
- ✅ Tidak ada duplikasi chat dengan companion yang sama
- ✅ Auto-navigate ke chat existing
- ✅ User experience lebih baik
- ✅ Mengurangi clutter di daftar chat

### 3. **Unified Login**
- ✅ Satu halaman untuk semua login
- ✅ User tidak perlu tahu URL berbeda
- ✅ Consistent design language
- ✅ Lebih mudah maintain
- ✅ Tab switching smooth

## 🚀 Testing

### Test Logout
1. Login sebagai user
2. Klik tombol "Keluar" di header
3. Konfirmasi dialog
4. ✅ Harus redirect ke landing page
5. ✅ Session harus cleared

### Test Auto-Open Existing Chat
1. Login sebagai user
2. Buka tab "Teman Ngobrol"
3. Klik "Chat Sekarang" pada Naufal
4. Buat chat baru dengan topik
5. Kembali ke tab "Teman Ngobrol"
6. Klik "Chat Sekarang" pada Naufal lagi
7. ✅ Harus langsung buka chat existing, tidak buat baru
8. ✅ Toast notification muncul

### Test Unified Login

**Test User Login:**
1. Buka `http://localhost:3000/landing.html`
2. Tab "Pengguna" aktif by default
3. Masukkan kode: `IMADIKSI2025`
4. Masukkan nama: Test User
5. Klik "Masuk ke SafeSpace"
6. ✅ Redirect ke onboarding/app

**Test Companion Login:**
1. Buka `http://localhost:3000/landing.html`
2. Klik tab "Teman Ngobrol"
3. Form berubah ke username/password
4. Masukkan username: `naufal`
5. Masukkan password: `teman123`
6. Klik "Masuk sebagai Teman Ngobrol"
7. ✅ Redirect ke companion dashboard

**Test Tab Switching:**
1. Klik "Pengguna" → form user muncul
2. Klik "Teman Ngobrol" → form companion muncul
3. ✅ Transition smooth
4. ✅ Active tab highlighted

## 📁 Files Modified

1. ✅ `public/app.js`
   - Fixed logout function (POST method)
   - Added auto-open existing chat logic

2. ✅ `public/landing.html`
   - Added login tabs
   - Added companion login form
   - Updated JavaScript untuk dual mode

3. ✅ `public/styles.css`
   - Added `.login-tabs` styles
   - Added `.login-tab` and `.login-tab.active` styles
   - Added `.login-form` visibility toggle

## 🎯 Migration Notes

### Old System
- User login: `/landing.html`
- Companion login: `/companion-login.html` (separate page)

### New System
- User login: `/landing.html` (tab "Pengguna")
- Companion login: `/landing.html` (tab "Teman Ngobrol")
- **`companion-login.html` tidak digunakan lagi**

### Backward Compatibility
- `/companion-login.html` masih ada di file system
- Jika ada link langsung, masih bisa diakses
- Tapi recommended pakai landing page unified

## ✅ Status

**COMPLETED** - Server running di `http://localhost:3000`

**Fixes Applied:**
- ✅ Logout function fixed
- ✅ Auto-open existing companion chat
- ✅ Unified login page dengan tab switching

**Ready to Test:**
- ✅ User login flow
- ✅ Companion login flow
- ✅ Logout functionality
- ✅ Companion chat deduplication

Refresh browser dan test semua fitur! 🎉
