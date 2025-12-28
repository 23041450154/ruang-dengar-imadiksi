/**
 * /api/admin/me
 * GET - Check admin authentication status
 * POST - Logout admin
 */

const jwt = require('jsonwebtoken');
const { getSupabase } = require('../_lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'safespace-secret-key-2025';

// Helper to get admin from request
function getAdminFromRequest(req) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/admin_token=([^;]+)/);
  
  if (!tokenMatch) {
    return null;
  }

  try {
    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET);
    if (decoded.type === 'admin') {
      return decoded;
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Check authentication
  if (req.method === 'GET') {
    const admin = getAdminFromRequest(req);
    
    if (!admin) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'Tidak terautentikasi' 
      });
    }

    try {
      const supabase = getSupabase();
      
      // Get fresh admin data
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('admin_id, username, name, role, is_active')
        .eq('admin_id', admin.adminId)
        .single();

      if (error || !adminData || !adminData.is_active) {
        return res.status(401).json({ 
          authenticated: false,
          error: 'Admin tidak valid' 
        });
      }

      return res.status(200).json({
        authenticated: true,
        admin: {
          id: adminData.admin_id,
          username: adminData.username,
          name: adminData.name,
          role: adminData.role
        }
      });

    } catch (err) {
      console.error('Admin auth check error:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }

  // POST - Logout
  if (req.method === 'POST') {
    // Clear admin token cookie
    res.setHeader('Set-Cookie', [
      'admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    ]);

    return res.status(200).json({ 
      success: true,
      message: 'Logout berhasil' 
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
