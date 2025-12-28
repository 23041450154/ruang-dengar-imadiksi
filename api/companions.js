const { getSupabase } = require('./_lib/supabase');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = getSupabase();

    // GET - List all active companions
    if (req.method === 'GET') {
      const { data: companions, error } = await supabase
        .from('companions')
        .select('companion_id, name, description, specialty, avatar_url')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return res.status(200).json({
        success: true,
        companions: companions || [],
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Companions API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
