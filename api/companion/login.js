/**
 * /api/companion/login
 * POST - Login companion with username and password
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

    // Find companion by username
    const { data: companion, error } = await supabase
      .from('companions')
      .select('companion_id, username, password_hash, name, specialty, is_active')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !companion) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    if (!companion.is_active) {
      return res.status(403).json({ error: 'Akun tidak aktif' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, companion.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Create JWT token for companion
    const token = jwt.sign(
      {
        companionId: companion.companion_id,
        name: companion.name,
        specialty: companion.specialty,
        isCompanion: true,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.setHeader('Set-Cookie', `companion_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);

    return res.status(200).json({
      success: true,
      companion: {
        companionId: companion.companion_id,
        name: companion.name,
        specialty: companion.specialty,
      },
    });
  } catch (err) {
    console.error('Companion login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
