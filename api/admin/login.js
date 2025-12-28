/**
 * /api/admin/login
 * POST - Login admin with username and password
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabase } = require('../_lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'safespace-secret-key-2025';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password diperlukan' });
    }

    const supabase = getSupabase();

    // Find admin by username
    const { data: admin, error } = await supabase
      .from('admins')
      .select('admin_id, username, password_hash, name, role, is_active')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Akun tidak aktif' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.admin_id,
        username: admin.username,
        role: admin.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.setHeader('Set-Cookie', [
      `admin_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
    ]);

    return res.status(200).json({
      success: true,
      admin: {
        id: admin.admin_id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
