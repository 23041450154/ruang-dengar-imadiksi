/**
 * /api/companion/sessions
 * GET - List all sessions assigned to this companion
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

  // Check companion authentication
  const companion = getCompanionFromRequest(req);
  if (!companion) {
    return res.status(401).json({ error: 'Not authenticated as companion' });
  }

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      // Get all sessions assigned to this companion
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(`
          session_id,
          topic,
          created_by,
          created_at,
          companion_id,
          users!inner (
            user_id,
            display_name
          )
        `)
        .eq('companion_id', companion.companionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get message counts, last message, and unread count for each session
      const sessionsWithStats = await Promise.all(
        sessions.map(async (session) => {
          // Total message count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.session_id);

          // Last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('text, created_at, is_companion')
            .eq('session_id', session.session_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Unread count (messages from user that companion hasn't read yet)
          // For now, we'll consider all user messages as unread if companion hasn't replied after them
          const { data: lastCompanionMsg } = await supabase
            .from('messages')
            .select('created_at')
            .eq('session_id', session.session_id)
            .eq('is_companion', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let unreadCount = 0;
          if (lastCompanionMsg) {
            // Count user messages after last companion message
            const { count: unread } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.session_id)
              .eq('is_companion', false)
              .gt('created_at', lastCompanionMsg.created_at);
            unreadCount = unread || 0;
          } else {
            // No companion message yet, count all user messages
            const { count: unread } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.session_id)
              .eq('is_companion', false);
            unreadCount = unread || 0;
          }

          return {
            sessionId: session.session_id,
            topic: session.topic,
            userName: session.users.display_name,
            createdAt: session.created_at,
            messageCount: count || 0,
            lastMessage: lastMsg?.text || null,
            lastMessageTime: lastMsg?.created_at || session.created_at,
            unreadCount: unreadCount,
          };
        })
      );

      // Sort by last message time (most recent first)
      sessionsWithStats.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      return res.status(200).json({
        success: true,
        sessions: sessionsWithStats,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Companion sessions error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
