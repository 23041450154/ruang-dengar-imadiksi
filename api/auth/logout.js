/**
 * POST /api/auth/logout
 * Clear session cookie
 */

const { clearSessionCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookieHeaders = clearSessionCookie();
    res.setHeader('Set-Cookie', cookieHeaders['Set-Cookie']);
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
