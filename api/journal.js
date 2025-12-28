/**
 * /api/journal
 * GET - List user's journal entries
 * POST - Create new entry
 * PUT - Update entry
 * DELETE - Delete entry
 */

const { v4: uuidv4 } = require('uuid');
const { getUserFromRequest, sanitizeInput, escapeHtml } = require('./_lib/auth');
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
    // GET - List journal entries
    if (req.method === 'GET') {
      const { entryId } = req.query || {};

      // If entryId provided, get single entry
      if (entryId) {
        const { data: entry, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('entry_id', entryId)
          .eq('user_id', user.userId)
          .single();

        if (error || !entry) {
          return res.status(404).json({ error: 'Entry not found' });
        }

        return res.status(200).json({
          entry: {
            entryId: entry.entry_id,
            title: escapeHtml(entry.title),
            body: escapeHtml(entry.body),
            tags: entry.tags || [],
            createdAt: entry.created_at,
          },
        });
      }

      // Get all user's entries
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        entries: entries.map(e => ({
          entryId: e.entry_id,
          title: escapeHtml(e.title),
          body: escapeHtml(e.body).substring(0, 200) + (e.body.length > 200 ? '...' : ''),
          tags: e.tags || [],
          createdAt: e.created_at,
        })),
      });
    }

    // POST - Create new entry
    if (req.method === 'POST') {
      const { title, body, tags } = req.body || {};

      const cleanTitle = sanitizeInput(title, 200);
      const cleanBody = sanitizeInput(body, 10000);
      const cleanTags = Array.isArray(tags) 
        ? tags.map(t => sanitizeInput(t, 50)).filter(t => t)
        : [];

      if (!cleanTitle || cleanTitle.length < 1) {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!cleanBody || cleanBody.length < 1) {
        return res.status(400).json({ error: 'Body is required' });
      }

      const entryId = uuidv4();

      const { data: entry, error } = await supabase
        .from('journal_entries')
        .insert({
          entry_id: entryId,
          user_id: user.userId,
          title: cleanTitle,
          body: cleanBody,
          tags: cleanTags,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        entry: {
          entryId: entry.entry_id,
          title: escapeHtml(cleanTitle),
          body: escapeHtml(cleanBody),
          tags: cleanTags,
          createdAt: entry.created_at,
        },
      });
    }

    // PUT - Update entry
    if (req.method === 'PUT') {
      const { entryId, title, body, tags } = req.body || {};

      if (!entryId) {
        return res.status(400).json({ error: 'Entry ID is required' });
      }

      const updates = {};
      
      if (title !== undefined) {
        const cleanTitle = sanitizeInput(title, 200);
        if (!cleanTitle || cleanTitle.length < 1) {
          return res.status(400).json({ error: 'Title cannot be empty' });
        }
        updates.title = cleanTitle;
      }

      if (body !== undefined) {
        const cleanBody = sanitizeInput(body, 10000);
        if (!cleanBody || cleanBody.length < 1) {
          return res.status(400).json({ error: 'Body cannot be empty' });
        }
        updates.body = cleanBody;
      }

      if (tags !== undefined) {
        updates.tags = Array.isArray(tags) 
          ? tags.map(t => sanitizeInput(t, 50)).filter(t => t)
          : [];
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      const { data: entry, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('entry_id', entryId)
        .eq('user_id', user.userId)
        .select()
        .single();

      if (error || !entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      return res.status(200).json({
        success: true,
        entryId,
        updates: {
          title: updates.title ? escapeHtml(updates.title) : undefined,
          body: updates.body ? escapeHtml(updates.body) : undefined,
          tags: updates.tags,
        },
      });
    }

    // DELETE - Delete entry
    if (req.method === 'DELETE') {
      const { entryId } = req.body || req.query || {};

      if (!entryId) {
        return res.status(400).json({ error: 'Entry ID is required' });
      }

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('entry_id', entryId)
        .eq('user_id', user.userId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Entry deleted',
        entryId,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Journal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
