/**
 * /api/companion/me
 * GET - Get current companion info
 * POST - Logout companion
 */

const jwt = require('jsonwebtoken');
const { getSupabase } = require('../_lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'safespace-secret-key-2025';

function getCompanionFromRequest(req) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/companion_token=([^;]+)/);
  if (!tokenMatch) return null;

  try {
    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET);
    if (!decoded.isCompanion) return null;
    return decoded;
  } catch {
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

  // GET - Get current companion
  if (req.method === 'GET') {
    const companion = getCompanionFromRequest(req);
    if (!companion) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.status(200).json({
      success: true,
      companion: {
        companionId: companion.companionId,
        name: companion.name,
        specialty: companion.specialty,
      },
    });
  }

  // POST - Logout
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', 'companion_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return res.status(200).json({ success: true, message: 'Logged out' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
