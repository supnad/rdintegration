import { createClient } from '@supabase/supabase-js';
import 'dotenv/config.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - THIRTY_DAYS_MS).toISOString();

  const from = (pageNumber - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .gte('date', cutoffDate)
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar logs do Supabase:', error.message);
      return res.status(500).json({ message: 'Erro ao buscar logs.' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ message: 'Erro inesperado.' });
  }
}
