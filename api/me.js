/**
 * GET /api/me
 * Get current user info
 * 
 * POST /api/me (with action: 'consent')
 * Record user consent
 */

const { getUserFromRequest, createSessionCookie } = require('./_lib/auth');
const { supabase } = require('./_lib/supabase');
const { standardRateLimit } = require('./_lib/rateLimit');

module.exports = async function handler(req, res) {
  // Apply rate limiting
  if (standardRateLimit(req, res)) return;

  // Get user from session
  const sessionUser = getUserFromRequest(req);

  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch fresh user data from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', sessionUser.userId)
        .single();
      
      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        user: {
          userId: user.user_id,
          displayName: user.display_name,
          hasConsented: !!user.consent_at,
          consentAt: user.consent_at || null,
          createdAt: user.created_at,
        },
      });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'consent') {
        const now = new Date().toISOString();

        // Update user consent timestamp
        const { data, error } = await supabase
          .from('users')
          .update({ consent_at: now })
          .eq('user_id', sessionUser.userId)
          .select()
          .single();

        if (error || !data) {
          console.error('Consent update error:', error);
          return res.status(404).json({ error: 'User not found' });
        }

        // Update session cookie with hasConsented = true
        // Only pass the essential user data (without JWT metadata like exp, iat)
        const newSessionData = {
          userId: sessionUser.userId,
          displayName: sessionUser.displayName,
          hasConsented: true,
        };
        const cookieHeaders = createSessionCookie(newSessionData);
        res.setHeader('Set-Cookie', cookieHeaders['Set-Cookie']);

        return res.status(200).json({
          success: true,
          consentAt: now,
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
