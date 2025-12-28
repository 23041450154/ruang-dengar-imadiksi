/**
 * /api/companion/users
 * GET - Get list of users who have chosen this companion
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify companion authentication
    const companion = getCompanionFromRequest(req);
    if (!companion) {
      return res.status(401).json({ error: 'Not authenticated as companion' });
    }

    const supabase = getSupabase();

    // Get only users who have sessions with THIS companion
    // This means users who specifically chose to chat with this companion
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select(`
        session_id,
        topic,
        created_at,
        created_by,
        users!inner (
          user_id,
          display_name,
          created_at
        )
      `)
      .eq('companion_id', companion.companionId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      throw sessionsError;
    }

    // Group by user (get unique users)
    const userMap = new Map();
    
    sessions?.forEach(session => {
      const userId = session.created_by;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId: userId,
          displayName: session.users.display_name,
          createdAt: session.users.created_at,
          sessions: []
        });
      }
      userMap.get(userId).sessions.push({
        sessionId: session.session_id,
        topic: session.topic,
        createdAt: session.created_at
      });
    });

    const users = Array.from(userMap.values()).map(user => ({
      userId: user.userId,
      displayName: user.displayName,
      createdAt: user.createdAt,
      hasExistingSession: user.sessions.length > 0,
      lastSession: user.sessions[0], // Most recent session
      totalSessions: user.sessions.length,
    }));

    return res.status(200).json({
      success: true,
      users: users,
    });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
