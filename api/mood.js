/**
 * /api/mood
 * GET - Get user's mood history
 * POST - Record mood (once per day)
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
    // GET - Get mood history
    if (req.method === 'GET') {
      const { limit, startDate, endDate } = req.query || {};

      let query = supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.userId)
        .order('created_at', { ascending: false });

      // Filter by date range if provided (using created_at)
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Apply limit if provided
      if (limit && !isNaN(parseInt(limit))) {
        query = query.limit(parseInt(limit));
      }

      const { data: moods, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        moods: moods.map(m => ({
          moodId: m.mood_id,
          date: m.created_at.split('T')[0], // Extract date from timestamp
          score: m.rating, // Schema uses 'rating' not 'score'
          emotion: `Rating ${m.rating}`, // No emotion field in schema
          note: m.note ? escapeHtml(m.note) : null,
          createdAt: m.created_at,
        })),
      });
    }

    // POST - Record mood
    if (req.method === 'POST') {
      const { score, note } = req.body || {};

      // Validate score/rating (1-5 based on schema)
      const ratingNum = parseInt(score);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ 
          error: 'Rating must be between 1 and 5' 
        });
      }

      // Optional note
      const cleanNote = note ? sanitizeInput(note, 500) : '';

      // Get today's date (YYYY-MM-DD format)
      const today = new Date().toISOString().split('T')[0];

      // Check if user already recorded mood today
      const { data: existingMoods, error: checkError } = await supabase
        .from('mood_logs')
        .select('mood_id, rating, created_at')
        .eq('user_id', user.userId)
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      if (existingMoods && existingMoods.length > 0) {
        const existingMood = existingMoods[0];
        return res.status(400).json({ 
          error: 'Kamu sudah mencatat mood hari ini. Coba lagi besok ya!',
          existingMood: {
            moodId: existingMood.mood_id,
            date: existingMood.created_at.split('T')[0],
            score: existingMood.rating,
            emotion: `Rating ${existingMood.rating}`,
          },
        });
      }

      const moodId = uuidv4();

      const { data: mood, error } = await supabase
        .from('mood_logs')
        .insert({
          mood_id: moodId,
          user_id: user.userId,
          rating: ratingNum,
          note: cleanNote || null,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        mood: {
          moodId: mood.mood_id,
          date: mood.created_at.split('T')[0],
          score: mood.rating,
          emotion: `Rating ${mood.rating}`,
          note: mood.note ? escapeHtml(mood.note) : null,
          createdAt: mood.created_at,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Mood error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
