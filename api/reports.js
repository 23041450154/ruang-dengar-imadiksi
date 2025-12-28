/**
 * /api/reports
 * POST - Report a chat session
 */

const { v4: uuidv4 } = require('uuid');
const { getUserFromRequest, sanitizeInput } = require('./_lib/auth');
const { getSupabase } = require('./_lib/supabase');
const { standardRateLimit } = require('./_lib/rateLimit');

module.exports = async function handler(req, res) {
  // Apply rate limiting
  if (standardRateLimit(req, res)) return;

  // Check authentication
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!user.hasConsented) {
    return res.status(403).json({ error: 'Consent required' });
  }

  const supabase = getSupabase();

  try {
    // POST - Create report
    if (req.method === 'POST') {
      const { targetSessionId, reason } = req.body || {};

      if (!targetSessionId) {
        return res.status(400).json({ error: 'Target session ID is required' });
      }

      const cleanReason = sanitizeInput(reason, 1000);
      if (!cleanReason || cleanReason.length < 10) {
        return res.status(400).json({ 
          error: 'Reason is required (minimum 10 characters)' 
        });
      }

      // Verify the session exists
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('session_id')
        .eq('session_id', targetSessionId)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if user already reported this session
      const { data: existingReport, error: checkError } = await supabase
        .from('reports')
        .select('report_id')
        .eq('reporter_user_id', user.userId)
        .eq('target_session_id', targetSessionId)
        .single();

      if (existingReport) {
        return res.status(400).json({ 
          error: 'Kamu sudah melaporkan sesi ini sebelumnya' 
        });
      }

      const reportId = uuidv4();

      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          report_id: reportId,
          reporter_user_id: user.userId,
          target_session_id: targetSessionId,
          reason: cleanReason,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Laporan berhasil dikirim. Terima kasih atas kepedulianmu.',
        report: {
          reportId: report.report_id,
          targetSessionId: report.target_session_id,
          createdAt: report.created_at,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = async function handler(req, res) {
  // Apply rate limiting
  if (standardRateLimit(req, res)) return;

  // Check authentication
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!user.hasConsented) {
    return res.status(403).json({ error: 'Consent required' });
  }

  try {
    // POST - Create report
    if (req.method === 'POST') {
      const { targetSessionId, reason } = req.body || {};

      if (!targetSessionId) {
        return res.status(400).json({ error: 'Target session ID is required' });
      }

      const cleanReason = sanitizeInput(reason, 1000);
      if (!cleanReason || cleanReason.length < 10) {
        return res.status(400).json({ 
          error: 'Reason is required (minimum 10 characters)' 
        });
      }

      // Verify the session exists
      const sessions = await findRows('chat_sessions', { sessionId: targetSessionId });
      if (sessions.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if user already reported this session
      const existingReports = await findRows('reports', { 
        reporterUserId: user.userId,
        targetSessionId 
      });

      if (existingReports.length > 0) {
        return res.status(400).json({ 
          error: 'Kamu sudah melaporkan sesi ini sebelumnya' 
        });
      }

      const reportId = uuidv4();
      const now = new Date().toISOString();

      await appendRow('reports', {
        reportId,
        reporterUserId: user.userId,
        targetSessionId,
        reason: cleanReason,
        createdAt: now,
      });

      return res.status(201).json({
        success: true,
        message: 'Laporan berhasil dikirim. Terima kasih atas kepedulianmu.',
        report: {
          reportId,
          targetSessionId,
          createdAt: now,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
